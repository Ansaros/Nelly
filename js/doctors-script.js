// ===== КОНФИГУРАЦИЯ GOOGLE SHEETS ДЛЯ ВРАЧЕЙ =====
const DOCTORS_GOOGLE_SHEETS_CONFIG = {
  API_KEY: "AIzaSyBHPY2RgfCFMe0Kqn_fY7LV1IgPUUEPnms",
  SPREADSHEET_ID: "1D5TTNXETLfPc3tAU1D9uVgYo9juvzRkUhZBznjp8CJ8",
  RANGE: "Врачи!A:N", // ФИО, С��аж, Специализация, Ссылка на фото, Описание, Сертификат1-7, фото до и после1-4
  CACHE_DURATION: 5 * 60 * 1000, // 5 минут кеширования
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

    this.init()
  }

  async init() {
    try {
      console.log("Инициализация страницы врачей...")

      // Инициализация компонентов
      this.initMobileMenu()
      this.initFilters()

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

    return {
      id: `doctor_${rowNumber}`,
      name: name,
      experience: this.cleanText(row[1]) || "",
      specialization: this.cleanText(row[2]) || "Стоматолог",
      photoUrl: this.cleanText(row[3]) || "/placeholder.svg?height=300&width=300",
      description: this.cleanText(row[4]) || "",
      certificates: this.extractUrls(row.slice(5, 12)),
      beforeAfterPhotos: this.extractUrls(row.slice(12, 16)),
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
          <img src="${doctor.photoUrl}" alt="${doctor.name}" loading="lazy" onerror="this.src='/placeholder.svg?height=300&width=300'">
          <div class="doctor-overlay-beautiful">
            <div class="overlay-content-doctors">
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
              <div class="stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
              </div>
              <span class="rating-text">${doctor.rating}</span>
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
            <button class="primary-btn-doctors" data-doctor-name="${doctor.name}">
              <i class="fa-solid fa-calendar-plus"></i>
              <span>Записаться на прием</span>
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
        this.handleBookingClick(doctorName)
      })
    })
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
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("DOM загружен, начинаем инициализацию страницы врачей...")

    // Создаем глобальный экземпляр менеджера врачей
    window.doctorsManager = new DoctorsPageManager()

    console.log("Страница врачей инициализирована успешно")
  } catch (error) {
    console.error("Критическая ошибка инициализации страницы врачей:", error)
  }
})

// ===== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ =====
window.DoctorsPageUtils = DoctorsPageUtils