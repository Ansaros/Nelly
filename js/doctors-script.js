// ===== КОНФИГУРАЦИЯ GOOGLE SHEETS ДЛЯ ВРАЧЕЙ =====
const DOCTORS_GOOGLE_SHEETS_CONFIG = {
  API_KEY: "AIzaSyAPNoe4hXwejLxnUr04bqEeWZRE7VqJYP4",
  SPREADSHEET_ID: "1TuQfnrDrBySjOJWSeksdL8WbrCNfytIypw-u-eRaJzs",
  RANGE: "Врачи!A:N", // ФИО, Стаж, Специализация, Ссылка на фото, Описание, Сертификат1-7, фото до и после1-4
  CACHE_DURATION: 5 * 60 * 1000, // 5 минут кеширования
}

// ===== УТИЛИТЫ ДЛЯ КОНВЕРТАЦИИ GOOGLE DRIVE ССЫЛОК =====
class GoogleDriveConverter {
  // Извлечение ID файла из ссылки Google Drive
  static extractFileId(url) {
    if (!url || typeof url !== 'string') return null;
    
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,  // Основной паттерн
      /id=([a-zA-Z0-9-_]+)/,         // Альтернативный
      /\/d\/([a-zA-Z0-9-_]+)/        // Короткий формат
    ];

    for (let pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // Создание thumbnail URL
  static createThumbnailUrl(fileId, size = 'w1000') {
    if (!fileId) return null;
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }

  // Создание direct URL
  static createDirectUrl(fileId) {
    if (!fileId) return null;
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Проверка, является ли URL ссылкой Google Drive
  static isGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('drive.google.com') && 
           (url.includes('/file/d/') || url.includes('id=') || url.includes('/d/'));
  }

  // Конвертация ссылки Google Drive в thumbnail
  static convertToThumbnail(url, size = 'w1000') {
    if (!this.isGoogleDriveUrl(url)) {
      return url; // Возвращаем оригинальную ссылку, если это не Google Drive
    }

    const fileId = this.extractFileId(url);
    if (!fileId) {
      console.warn('Не удалось извлечь ID из ссылки Google Drive:', url);
      return url;
    }

    const thumbnailUrl = this.createThumbnailUrl(fileId, size);
    console.log(`Конвертирована ссылка: ${url} -> ${thumbnailUrl}`);
    return thumbnailUrl;
  }

  // Конвертация массива ссылок
  static convertUrlsArray(urls, size = 'w1000') {
    if (!Array.isArray(urls)) return urls;
    
    return urls.map(url => this.convertToThumbnail(url, size));
  }
}

// ===== ОСНОВНОЙ КЛАСС ДЛЯ УПРАВЛЕНИЯ СТРАНИЦЕЙ ВРАЧЕЙ =====
class DoctorsPageManager {
  constructor() {
    this.doctorsData = []
    this.specializations = new Set()
    this.lastUpdateTime = null
    this.isLoading = false
    this.retryCount = 0
    this.maxRetries = 3
    this.currentFilter = "all"
    this.imageSize = "w1500" // Размер изображений по умолчанию

    this.init()
  }

  async init() {
    try {
      console.log("Инициализация страницы врачей...")

      // Инициализация компонентов
      this.initMobileMenu()
      this.initFilters()
      this.initModal()

      // Загрузка данных из Google Sheets
      await this.loadDoctorsData()

      // Отображение врачей
      this.renderDoctors()

      console.log("Инициализация страницы врачей завершена успешно")
    } catch (error) {
      console.error("Ошибка инициализации страницы врачей:", error)
      this.showError("Ошибка загрузки данных о врачах: " + error.message)
    }
  }

  // ===== ЗАГРУЗКА ДАННЫХ ИЗ GOOGLE SHEETS =====
  async loadDoctorsData() {
    if (this.isLoading) return

    this.isLoading = true
    this.updateLoadingStatus("loading")

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${DOCTORS_GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${DOCTORS_GOOGLE_SHEETS_CONFIG.RANGE}?key=${DOCTORS_GOOGLE_SHEETS_CONFIG.API_KEY}`

      console.log("Загрузка данных врачей из URL:", url)

      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Ошибка HTTP:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Получены данные врачей:", data)

      if (data.values && data.values.length > 0) {
        this.processDoctorsData(data.values)
        this.lastUpdateTime = new Date()
        this.retryCount = 0
        this.updateLoadingStatus("success")
        this.renderDoctors()
        this.updateFilters()
        this.updateStats()
      } else {
        throw new Error("Нет данных о врачах в таблице")
      }
    } catch (error) {
      console.error("Ошибка загрузки данных врачей:", error)
      this.handleLoadError(error)
    } finally {
      this.isLoading = false
    }
  }

  // ===== ОБРАБОТКА ДАННЫХ ИЗ GOOGLE SHEETS =====
  processDoctorsData(values) {
    this.doctorsData = []
    this.specializations.clear()

    console.log("Обработка данных врачей, всего строк:", values.length)

    // Пропускаем заголовок (первая строка)
    for (let i = 1; i < values.length; i++) {
      const row = values[i]

      // Проверяем, есть ли хотя бы одно заполненное поле
      if (row && row.some((cell) => cell && cell.toString().trim())) {
        const doctor = this.createDoctorObject(row, i + 1)
        if (doctor && doctor.name) {
          this.doctorsData.push(doctor)
          if (doctor.specialization) {
            this.specializations.add(doctor.specialization.toLowerCase())
          }
          console.log(`Добавлен врач: ${doctor.name}`)
        }
      }
    }

    console.log("Загружено врачей:", this.doctorsData.length)
    console.log("Специализации:", Array.from(this.specializations))
  }

  // ===== СОЗДАНИЕ ОБЪЕКТА ВРАЧА =====
  createDoctorObject(row, rowNumber) {
    const name = this.cleanText(row[0])
    
    // Если нет имени, игнорируем эту строку
    if (!name) {
      return null
    }

    // Получаем и конвертируем URL фото
    const originalPhotoUrl = this.cleanText(row[3]) || "img/placeholder.svg"
    const convertedPhotoUrl = GoogleDriveConverter.convertToThumbnail(originalPhotoUrl, this.imageSize)

    // Получаем и конвертируем URLs сертификатов и фото работ
    const originalCertificates = this.extractUrls(row.slice(5, 12))
    const originalBeforeAfterPhotos = this.extractUrls(row.slice(12, 16))

    const convertedCertificates = GoogleDriveConverter.convertUrlsArray(originalCertificates, this.imageSize)
    const convertedBeforeAfterPhotos = GoogleDriveConverter.convertUrlsArray(originalBeforeAfterPhotos, this.imageSize)

    return {
      id: `doctor_${rowNumber}`,
      name: name,
      experience: this.cleanText(row[1]) || "",
      specialization: this.cleanText(row[2]) || "Стоматолог",
      photoUrl: convertedPhotoUrl,
      originalPhotoUrl: originalPhotoUrl, // Сохраняем оригинальную ссылку
      description: this.cleanText(row[4]) || "",
      certificates: convertedCertificates,
      originalCertificates: originalCertificates, // Сохраняем оригинальные ссылки
      beforeAfterPhotos: convertedBeforeAfterPhotos,
      originalBeforeAfterPhotos: originalBeforeAfterPhotos, // Сохраняем оригинальные ссылки
      rating: this.generateRating(),
      slug: this.generateSlug(name),
    }
  }

  // ===== ОЧИСТКА ТЕКСТА =====
  cleanText(text) {
    if (!text) return ""
    return text.toString().trim()
  }

  // ===== ИЗВЛЕЧЕНИЕ URL-ов =====
  extractUrls(cells) {
    return cells
      .filter((cell) => cell && cell.toString().trim())
      .map((cell) => cell.toString().trim())
      .filter((url) => url.startsWith("http"))
  }

  // ===== ГЕНЕРАЦИЯ РЕЙТИНГА =====
  generateRating() {
    return (4.7 + Math.random() * 0.3).toFixed(1)
  }

  // ===== ГЕНЕРАЦИЯ SLUG =====
  generateSlug(name) {
    if (!name) return "doctor"
    return name
      .toString()
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 20)
  }

  // ===== ОТОБРАЖЕНИЕ ВРАЧЕЙ =====
  renderDoctors() {
    const doctorsList = document.getElementById("doctorsList")
    if (!doctorsList) return

    if (this.doctorsData.length === 0) {
      doctorsList.innerHTML = `
        <div class="no-doctors">
          <div class="no-doctors-icon">
            <i class="fa-solid fa-user-doctor"></i>
          </div>
          <h3>Врачи не найдены</h3>
          <p>В данный момент информация о врачах недоступна</p>
        </div>
      `
      return
    }

    const filteredDoctors = this.filterDoctors()

    doctorsList.innerHTML = filteredDoctors.map((doctor) => this.createDoctorCard(doctor)).join("")

    // Инициализируем обработчики событий для карточек
    this.initDoctorCards()
  }

  // ===== ФИЛЬТРАЦИЯ ВРАЧЕЙ =====
  filterDoctors() {
    if (this.currentFilter === "all") {
      return this.doctorsData
    }

    return this.doctorsData.filter((doctor) => doctor.specialization.toLowerCase().includes(this.currentFilter))
  }

  // ===== СОЗДАНИЕ КАРТОЧКИ ВРАЧА =====
  createDoctorCard(doctor) {
    const isMainDoctor = doctor.name.toLowerCase().includes("нелли") || doctor.name.toLowerCase().includes("курмаева")

    return `
      <div class="doctor-card-beautiful ${isMainDoctor ? "featured" : ""}" data-specialization="${doctor.specialization.toLowerCase()}" data-doctor-id="${doctor.id}">
        <div class="doctor-image-beautiful">
          <img src="${doctor.photoUrl}" alt="${doctor.name}" loading="lazy" onerror="this.src='img/placeholder.svg'" data-original-url="${doctor.originalPhotoUrl || ''}">
          <div class="doctor-overlay-beautiful">
            <div class="overlay-content-doctors">
              <button class="view-doctor-btn" data-doctor-id="${doctor.id}">
                <i class="fa-solid fa-info-circle"></i>
                <span>Подробнее</span>
              </button>
              <button class="book-doctor-btn" data-doctor-name="${doctor.name}">
                <i class="fa-solid fa-calendar-plus"></i>
                <span>Записаться</span>
              </button>
            </div>
          </div>
          ${doctor.experience ? `<div class="experience-badge">${doctor.experience}</div>` : ""}
        </div>
        
        <div class="doctor-content-beautiful">
          <div class="doctor-header-beautiful">
            <h3>${doctor.name}</h3>
            <div class="doctor-rating">
            </div>
          </div>
          
          <p class="doctor-position-beautiful">${doctor.specialization}</p>
          
          <div class="doctor-specialties">
            <span class="specialty-tag primary">${this.getMainSpecialty(doctor.specialization)}</span>
            ${this.getAdditionalSpecialties(doctor.specialization)
              .map((spec) => `<span class="specialty-tag">${spec}</span>`)
              .join("")}
          </div>
          
          <p class="doctor-description-beautiful">
            ${doctor.description || "Опытный специалист с индивидуальным подходом к каждому пациенту."}
          </p>
          
          <div class="doctor-stats-beautiful">
            ${
              doctor.experience
                ? `
              <div class="stat-item">
                <i class="fa-solid fa-calendar-check"></i>
                <span>${doctor.experience} стажа</span>
              </div>
            `
                : ""
            }
            <div class="stat-item">
              <i class="fa-solid fa-users"></i>
              <span>Довольные пациенты</span>
            </div>
          </div>
          
          <div class="doctor-actions-beautiful">
            <button class="secondary-btn-doctors view-details-btn" data-doctor-id="${doctor.id}">
              <i class="fa-solid fa-info-circle"></i>
              <span>Подробнее</span>
            </button>
            <button class="primary-btn-doctors" data-doctor-name="${doctor.name}">
              <i class="fa-solid fa-calendar-plus"></i>
              <span>Записаться</span>
            </button>
          </div>
        </div>
      </div>
    `
  }

  // ===== ПОЛУЧЕНИЕ ОСНОВНОЙ СПЕЦИАЛИЗАЦИИ =====
  getMainSpecialty(specialization) {
    if (!specialization) return "Стоматолог"

    const spec = specialization.toLowerCase()
    if (spec.includes("терапевт")) return "Терапия"
    if (spec.includes("ортодонт")) return "Ортодонтия"
    if (spec.includes("эндодонт")) return "Эндодонтия"
    if (spec.includes("хирург")) return "Хирургия"
    if (spec.includes("ортопед")) return "Ортопедия"

    return specialization.split(" ")[0] || "Стоматолог"
  }

  // ===== ПОЛУЧЕНИЕ ДОПОЛНИТЕЛЬНЫХ СПЕЦИАЛИЗАЦИЙ =====
  getAdditionalSpecialties(specialization) {
    const additional = []
    if (!specialization) return additional

    const spec = specialization.toLowerCase()
    if (spec.includes("эстетик") || spec.includes("реставрац")) additional.push("Эстетика")
    if (spec.includes("эндодонт") || spec.includes("канал")) additional.push("Эндодонтия")
    if (spec.includes("микроскоп")) additional.push("Микроскоп")
    if (spec.includes("брекет") || spec.includes("элайнер")) additional.push("Брекеты")
    if (spec.includes("диагност")) additional.push("Диагностика")
    if (spec.includes("профилакт")) additional.push("Профилактика")

    return additional.slice(0, 2)
  }

  // ===== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ КАРТОЧЕК =====
  initDoctorCards() {
    // Кнопки "Записаться"
    document.querySelectorAll(".book-doctor-btn, .primary-btn-doctors").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const doctorName = btn.getAttribute("data-doctor-name")
        if (doctorName) {
          this.handleBookingClick(doctorName)
        }
      })
    })

    // Кнопки "Подробнее"
    document.querySelectorAll(".view-doctor-btn, .view-details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const doctorId = btn.getAttribute("data-doctor-id")
        if (doctorId) {
          this.showDoctorDetails(doctorId)
        }
      })
    })
  }

  // ===== ПОКАЗ ДЕТАЛЬНОЙ ИНФОРМАЦИИ О ВРАЧЕ =====
  showDoctorDetails(doctorId) {
    const doctor = this.doctorsData.find(d => d.id === doctorId)
    if (!doctor) return

    // Заполняем модальное окно данными врача
    document.getElementById("modalDoctorPhoto").src = doctor.photoUrl
    document.getElementById("modalDoctorPhoto").alt = doctor.name
    document.getElementById("modalDoctorName").textContent = doctor.name
    document.getElementById("modalDoctorSpecialization").textContent = doctor.specialization
    document.getElementById("modalDoctorExperience").textContent = doctor.experience ? `Стаж: ${doctor.experience}` : ""
    document.getElementById("modalDoctorRating").textContent = doctor.rating
    document.getElementById("modalDoctorDescription").textContent = doctor.description || "Опытный специалист с индивидуальным подходом к каждому пациенту."

    // Устанавливаем обработчик для кнопки записи в модальном окне
    const modalBookBtn = document.getElementById("modalBookBtn")
    modalBookBtn.onclick = () => this.handleBookingClick(doctor.name)

    // Заполняем сертификаты
    this.renderCertificates(doctor.certificates)

    // Заполняем фото работ
    this.renderBeforeAfterPhotos(doctor.beforeAfterPhotos)

    // Показываем модальное окно
    document.getElementById("doctorModalOverlay").classList.add("active")
    document.body.style.overflow = "hidden"
  }

  // ===== ОТОБРАЖЕНИЕ СЕРТИФИКАТОВ =====
  renderCertificates(certificates) {
    const certificatesGrid = document.getElementById("certificatesGrid")
    const certificatesSection = document.getElementById("certificatesSection")

    if (!certificates || certificates.length === 0) {
      certificatesSection.style.display = "none"
      return
    }

    certificatesSection.style.display = "block"
    certificatesGrid.innerHTML = certificates.map((cert, index) => `
      <div class="certificate-item" onclick="window.doctorsManager.showImageViewer('${cert}', 'Сертификат ${index + 1}')">
        <img src="${cert}" alt="Сертификат ${index + 1}" loading="lazy" onerror="this.parentElement.style.display='none'">
        <div class="certificate-overlay">
          Сертификат ${index + 1}
        </div>
      </div>
    `).join("")
  }

  // ===== ОТОБРАЖЕНИЕ ФОТО ДО И ПОСЛЕ =====
  renderBeforeAfterPhotos(photos) {
    const beforeAfterGrid = document.getElementById("beforeAfterGrid")
    const beforeAfterSection = document.getElementById("beforeAfterSection")

    if (!photos || photos.length === 0) {
      beforeAfterSection.style.display = "none"
      return
    }

    beforeAfterSection.style.display = "block"
    beforeAfterGrid.innerHTML = photos.map((photo, index) => `
      <div class="before-after-item" onclick="window.doctorsManager.showImageViewer('${photo}', 'Работа врача ${index + 1}')">
        <img src="${photo}" alt="Работа врача ${index + 1}" loading="lazy" onerror="this.parentElement.style.display='none'">
        <div class="before-after-overlay">
          Работа ${index + 1}
        </div>
      </div>
    `).join("")
  }

  // ===== ПОКАЗ ПРОСМОТРЩИКА ИЗОБРАЖЕНИЙ =====
  showImageViewer(imageUrl, caption) {
    document.getElementById("imageViewerImg").src = imageUrl
    document.getElementById("imageViewerCaption").textContent = caption
    document.getElementById("imageViewerOverlay").classList.add("active")
  }

  // ===== ИНИЦИАЛИЗАЦИЯ МОДАЛЬНОГО ОКНА =====
  initModal() {
    // Закрытие модального окна врача
    document.getElementById("modalClose").addEventListener("click", () => {
      this.closeDoctorModal()
    })

    document.getElementById("doctorModalOverlay").addEventListener("click", (e) => {
      if (e.target === document.getElementById("doctorModalOverlay")) {
        this.closeDoctorModal()
      }
    })

    // Закрытие просмотрщика изображений
    document.getElementById("imageViewerClose").addEventListener("click", () => {
      this.closeImageViewer()
    })

    document.getElementById("imageViewerOverlay").addEventListener("click", (e) => {
      if (e.target === document.getElementById("imageViewerOverlay")) {
        this.closeImageViewer()
      }
    })

    // Закрытие по Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (document.getElementById("imageViewerOverlay").classList.contains("active")) {
          this.closeImageViewer()
        } else if (document.getElementById("doctorModalOverlay").classList.contains("active")) {
          this.closeDoctorModal()
        }
      }
    })
  }

  // ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ВРАЧА =====
  closeDoctorModal() {
    document.getElementById("doctorModalOverlay").classList.remove("active")
    document.body.style.overflow = ""
  }

  // ===== ЗАКРЫТИЕ ПРОСМОТРЩИКА ИЗОБРАЖЕНИЙ =====
  closeImageViewer() {
    document.getElementById("imageViewerOverlay").classList.remove("active")
  }

  // ===== ОБРАБОТКА ЗАПИСИ К ВРАЧУ =====
  handleBookingClick(doctorName) {
    try {
      const message = `Здравствуйте! Хочу записаться на прием к врачу ${doctorName}. Подскажите, пожалуйста, удобное время.`
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/77054026181?text=${encodedMessage}`

      window.open(whatsappUrl, "_blank")
      console.log("Открыт WhatsApp для записи к врачу:", doctorName)
    } catch (error) {
      console.error("Ошибка при открытии WhatsApp:", error)
    }
  }

  // ===== ОБНОВЛЕНИЕ ФИЛЬТРОВ =====
  updateFilters() {
    const filtersContainer = document.getElementById("doctorsFilterButtons")
    if (!filtersContainer) return

    const specializations = Array.from(this.specializations)
    const filterButtons = [
      `
      <button class="doctors-filter-btn active" data-filter="all">
        <i class="fa-solid fa-users"></i>
        <span>Все врачи</span>
        <div class="filter-count">${this.doctorsData.length}</div>
      </button>
    `,
    ]

    specializations.forEach((spec) => {
      const count = this.doctorsData.filter((doctor) => doctor.specialization.toLowerCase().includes(spec)).length

      const icon = this.getSpecializationIcon(spec)
      const name = this.getSpecializationName(spec)

      filterButtons.push(`
        <button class="doctors-filter-btn" data-filter="${spec}">
          <i class="fa-solid fa-${icon}"></i>
          <span>${name}</span>
          <div class="filter-count">${count}</div>
        </button>
      `)
    })

    filtersContainer.innerHTML = filterButtons.join("")
  }

  // ===== ПОЛУЧЕНИЕ ИКОНКИ СПЕЦИАЛИЗАЦИИ =====
  getSpecializationIcon(spec) {
    if (spec.includes("терапевт")) return "tooth"
    if (spec.includes("ортодонт")) return "grip-lines"
    if (spec.includes("эндодонт")) return "microscope"
    if (spec.includes("хирург")) return "scalpel"
    if (spec.includes("ортопед")) return "crown"
    return "user-doctor"
  }

  // ===== ПОЛУЧЕНИЕ НАЗВАНИЯ СПЕЦИАЛИЗАЦИИ =====
  getSpecializationName(spec) {
    if (spec.includes("терапевт")) return "Терапевты"
    if (spec.includes("ортодонт")) return "Ортодонты"
    if (spec.includes("эндодонт")) return "Эндодонтисты"
    if (spec.includes("хирург")) return "Хирурги"
    if (spec.includes("ортопед")) return "Ортопеды"
    return spec.charAt(0).toUpperCase() + spec.slice(1)
  }

  // ===== ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ =====
  initFilters() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".doctors-filter-btn")) {
        const btn = e.target.closest(".doctors-filter-btn")
        const filter = btn.getAttribute("data-filter")

        // Обновляем активный фильтр
        document.querySelectorAll(".doctors-filter-btn").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")

        this.currentFilter = filter
        this.renderDoctors()
      }
    })
  }

  // ===== ОБНОВЛЕНИЕ СТАТИСТИКИ =====
  updateStats() {
    const countElement = document.getElementById("doctorsCount")
    if (countElement) {
      countElement.textContent = `${this.doctorsData.length}+`
    }
  }

  // ===== ИЗМЕНЕНИЕ РАЗМЕРА ИЗОБРАЖЕНИЙ =====
  changeImageSize(newSize) {
    this.imageSize = newSize
    console.log(`Изменен размер изображений на: ${newSize}`)
    
    // Перезагружаем данные с новым размером
    this.doctorsData.forEach(doctor => {
      // Конвертируем фото врача
      if (doctor.originalPhotoUrl) {
        doctor.photoUrl = GoogleDriveConverter.convertToThumbnail(doctor.originalPhotoUrl, newSize)
      }
      
      // Конвертируем сертификаты
      if (doctor.originalCertificates) {
        doctor.certificates = GoogleDriveConverter.convertUrlsArray(doctor.originalCertificates, newSize)
      }
      
      // Конвертируем фото работ
      if (doctor.originalBeforeAfterPhotos) {
        doctor.beforeAfterPhotos = GoogleDriveConverter.convertUrlsArray(doctor.originalBeforeAfterPhotos, newSize)
      }
    })
    
    // Перерисовываем врачей
    this.renderDoctors()
  }

  // ===== ИНИЦИАЛИЗАЦИЯ МОБИЛЬНОГО МЕНЮ =====
  initMobileMenu() {
    try {
      const burger = document.getElementById("burger")
      const mobileNav = document.getElementById("mobileNav")
      const menuOverlay = document.getElementById("menuOverlay")
      const closeMenu = document.getElementById("closeMenu")

      if (!burger || !mobileNav || !menuOverlay || !closeMenu) {
        console.log("Элементы мобильного меню не найдены")
        return
      }

      const openMenu = () => {
        burger.classList.add("active")
        mobileNav.classList.add("open")
        menuOverlay.classList.add("active")
        document.body.style.overflow = "hidden"
      }

      const closeMenuFunc = () => {
        burger.classList.remove("active")
        mobileNav.classList.remove("open")
        menuOverlay.classList.remove("active")
        document.body.style.overflow = ""
      }

      burger.addEventListener("click", openMenu)
      closeMenu.addEventListener("click", closeMenuFunc)
      menuOverlay.addEventListener("click", closeMenuFunc)

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mobileNav.classList.contains("open")) {
          closeMenuFunc()
        }
      })

      console.log("Мобильное меню инициализировано")
    } catch (error) {
      console.error("Ошибка инициализации мобильного меню:", error)
    }
  }

  // ===== ОБНОВЛЕНИЕ СТАТУСА ЗАГРУЗКИ =====
  updateLoadingStatus(status) {
    const statusElement = document.getElementById("doctorsDataStatus")
    const lastUpdateElement = document.getElementById("doctorsLastUpdate")

    if (!statusElement) return

    statusElement.className = `status-${status}`

    switch (status) {
      case "loading":
        statusElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка информации о врачах...'
        break
      case "success":
        statusElement.innerHTML = '<i class="fa-solid fa-check-circle"></i> Информация о врачах обновлена'
        if (lastUpdateElement && this.lastUpdateTime) {
          lastUpdateElement.textContent = `Обновлено: ${this.lastUpdateTime.toLocaleTimeString("ru-RU")}`
        }
        break
      case "error":
        statusElement.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Ошибка загрузки информации о врачах'
        break
    }
  }

  // ===== ОБРАБОТКА ОШИБОК ЗАГРУЗКИ =====
  handleLoadError(error) {
    this.retryCount++

    if (this.retryCount <= this.maxRetries) {
      console.log(`Повторная попытка загрузки данных врачей (${this.retryCount}/${this.maxRetries})`)
      setTimeout(() => {
        this.loadDoctorsData()
      }, 2000 * this.retryCount)
    } else {
      this.updateLoadingStatus("error")
      this.showError("Не удалось загрузить информацию о врачах после " + this.maxRetries + " попыток")
    }
  }

  // ===== ПОКАЗ ОШИБКИ =====
  showError(message) {
    console.error("Ошибка:", message)

    const doctorsList = document.getElementById("doctorsList")
    if (doctorsList) {
      doctorsList.innerHTML = `
        <div class="error-doctors">
          <div class="error-icon">
            <i class="fa-solid fa-exclamation-triangle"></i>
          </div>
          <h3>Ошибка загрузки</h3>
          <p>${message}</p>
          <button onclick="window.location.reload()" class="retry-btn">
            <i class="fa-solid fa-refresh"></i>
            Попробовать снова
          </button>
        </div>
      `
    }
  }
}

// ===== УТИЛИТЫ ДЛЯ СТРАНИЦЫ ВРАЧЕЙ =====
class DoctorsPageUtils {
  static scrollToDoctors() {
    try {
      const doctorsSection = document.querySelector(".doctors-filter-section")
      if (doctorsSection) {
        doctorsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    } catch (error) {
      console.error("Ошибка прокрутки:", error)
    }
  }

  // Утилита для ручной конвертации ссылок (если нужно)
  static convertGoogleDriveLink(url, size = 'w1000') {
    return GoogleDriveConverter.convertToThumbnail(url, size)
  }

  // Утилита для изменения размера изображений
  static changeImageSize(size) {
    if (window.doctorsManager) {
      window.doctorsManager.changeImageSize(size)
    }
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("DOM загружен, начинаем инициализацию страницы врачей...")

    // Создаем глобальный экземпляр менеджера врачей
    window.doctorsManager = new DoctorsPageManager()

    // Делаем GoogleDriveConverter доступным глобально
    window.GoogleDriveConverter = GoogleDriveConverter

    console.log("Страница врачей инициализирована успешно")
  } catch (error) {
    console.error("Критическая ошибка инициализации страницы врачей:", error)
  }
})

// ===== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ =====
window.DoctorsPageUtils = DoctorsPageUtils