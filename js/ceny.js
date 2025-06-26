// ===== КОНФИГУРАЦИЯ GOOGLE SHEETS =====
const GOOGLE_SHEETS_CONFIG = {
  API_KEY: "AIzaSyDgsAgBjpO7smUWNoP1AqJy8iwHWEaUUus",
  SPREADSHEET_ID: "1XtQEQpQGs_pbvTng58Mn-kND-hDkLudaai0fSF5u-jM",
  RANGE: "Sheet1!A:B",
  CACHE_DURATION: 5 * 60 * 1000, // 5 минут кеширования
}

// ===== ОСНОВНОЙ КЛАСС ДЛЯ УПРАВЛЕНИЯ СТРАНИЦЕЙ ЦЕН =====
class PricesPageManager {
  constructor() {
    this.pricesData = new Map()
    this.lastUpdateTime = null
    this.isLoading = false
    this.retryCount = 0
    this.maxRetries = 3

    this.init()
  }

  async init() {
    try {
      console.log("Инициализация страницы цен...")

      // Инициализация компонентов
      this.initMobileMenu()
      this.initServiceTabs()
      this.initScrollEffects()
      this.initBookingButtons()

      // Загрузка данных из Google Sheets
      await this.loadPricesData()

      // Обновление цен на странице
      this.updatePricesDisplay()

      // Автообновление каждые 5 минут
      setInterval(() => {
        this.loadPricesData()
      }, GOOGLE_SHEETS_CONFIG.CACHE_DURATION)

      console.log("Инициализация завершена успешно")
    } catch (error) {
      console.error("Ошибка инициализации:", error)
      this.showError("Ошибка загрузки данных: " + error.message)
    }
  }

  // ===== ЗАГРУЗКА ДАННЫХ ИЗ GOOGLE SHEETS =====
  async loadPricesData() {
    if (this.isLoading) return

    this.isLoading = true
    this.updateLoadingStatus("loading")

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${GOOGLE_SHEETS_CONFIG.RANGE}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`

      console.log("Загрузка данных из URL:", url)

      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Ошибка HTTP:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("Получены данные:", data)

      if (data.values && data.values.length > 0) {
        this.processPricesData(data.values)
        this.lastUpdateTime = new Date()
        this.retryCount = 0
        this.updateLoadingStatus("success")
        this.updatePricesDisplay()
      } else {
        throw new Error("Нет данных в таблице")
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error)
      this.handleLoadError(error)
    } finally {
      this.isLoading = false
    }
  }

  // ===== ОБРАБОТКА ДАННЫХ ИЗ GOOGLE SHEETS =====
  processPricesData(values) {
    this.pricesData.clear()

    console.log("Обработка данных, всего строк:", values.length)

    // Пропускаем заголовок (первая строка)
    for (let i = 1; i < values.length; i++) {
      const row = values[i]
      if (row && row.length >= 2 && row[0] && row[1] !== undefined) {
        const serviceName = this.normalizeServiceName(row[0])
        const priceText = this.formatPriceText(row[1])

        if (serviceName && priceText) {
          this.pricesData.set(serviceName, priceText)
          console.log(`Добавлена услуга: "${serviceName}" = "${priceText}"`)
        }
      }
    }

    console.log("Загружено услуг:", this.pricesData.size)
  }

  // ===== НОРМАЛИЗАЦИЯ НАЗВАНИЯ УСЛУГИ =====
  normalizeServiceName(name) {
    if (!name) return ""
    return name.toString().trim().toLowerCase()
  }

  // ===== ФОРМАТИРОВАНИЕ ТЕКСТА ЦЕНЫ =====
  formatPriceText(price) {
    if (price === undefined || price === null) return ""

    const priceStr = price.toString().trim()

    // Если цена равна 0
    if (priceStr === "0") {
      return "Бесплатно"
    }

    // Если уже есть "от" в начале
    if (priceStr.toLowerCase().startsWith("от ")) {
      return priceStr
    }

    // Если это просто число с пробелами (например "5 000")
    if (/^\d[\d\s]*$/.test(priceStr)) {
      return priceStr + " ₸"
    }

    // Если уже есть валюта или другой текст
    if (priceStr.includes("₸") || priceStr.includes("тенге")) {
      return priceStr
    }

    // Добавляем валюту к числу
    return priceStr + " ₸"
  }

  // ===== ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ ЦЕН НА СТРАНИЦЕ =====
  updatePricesDisplay() {
    const priceElements = document.querySelectorAll("[data-service-key]")
    console.log("Обновление цен, найдено элементов:", priceElements.length)

    priceElements.forEach((element) => {
      const serviceKey = element.getAttribute("data-service-key")
      if (!serviceKey) return

      const normalizedKey = this.normalizeServiceName(serviceKey)
      const price = this.findPriceByKey(normalizedKey)

      console.log(`Поиск цены для "${serviceKey}" (нормализовано: "${normalizedKey}"):`, price)

      if (price) {
        element.textContent = price
        element.classList.remove("price-loading", "price-error")
        element.classList.add("price-loaded")
      } else {
        element.textContent = "Уточните цену"
        element.classList.add("price-error")
        element.classList.remove("price-loading", "price-loaded")
      }
    })
  }

  // ===== ПОИСК ЦЕНЫ ПО КЛЮЧУ =====
  findPriceByKey(searchKey) {
    if (!searchKey) return null

    console.log("Поиск цены для ключа:", searchKey)

    // Точное совпадение
    if (this.pricesData.has(searchKey)) {
      const price = this.pricesData.get(searchKey)
      console.log("Найдено точное совпадение:", price)
      return price
    }

    // Поиск по частичному совпадению
    const searchWords = searchKey.split(" ").filter((word) => word.length > 2)

    for (const [serviceName, price] of this.pricesData) {
      // Проверяем, содержит ли название услуги ключевые слова
      let matchCount = 0
      for (const word of searchWords) {
        if (serviceName.includes(word)) {
          matchCount++
        }
      }

      // Если найдено достаточно совпадений
      if (matchCount >= Math.min(searchWords.length, 2)) {
        console.log(`Найдено частичное совпадение: "${serviceName}" для "${searchKey}":`, price)
        return price
      }
    }

    // Поиск по вхождению ключа в название
    for (const [serviceName, price] of this.pricesData) {
      if (serviceName.includes(searchKey) || searchKey.includes(serviceName)) {
        console.log(`Найдено вхождение: "${serviceName}" для "${searchKey}":`, price)
        return price
      }
    }

    console.log("Цена не найдена для ключа:", searchKey)
    console.log("Доступные услуги:", Array.from(this.pricesData.keys()).slice(0, 10))
    return null
  }

  // ===== ОБРАБОТКА ОШИБОК ЗАГРУЗКИ =====
  handleLoadError(error) {
    this.retryCount++

    if (this.retryCount <= this.maxRetries) {
      console.log(`Повторная попытка загрузки (${this.retryCount}/${this.maxRetries})`)
      setTimeout(() => {
        this.loadPricesData()
      }, 2000 * this.retryCount)
    } else {
      this.updateLoadingStatus("error")
      this.showError("Не удалось загрузить актуальные цены после " + this.maxRetries + " попыток")
    }
  }

  // ===== ОБНОВЛЕНИЕ СТАТУСА ЗАГРУЗКИ =====
  updateLoadingStatus(status) {
    const statusElement = document.getElementById("dataStatus")
    const lastUpdateElement = document.getElementById("lastUpdate")

    if (!statusElement) {
      console.log("Элемент dataStatus не найден")
      return
    }

    statusElement.className = `status-${status}`

    switch (status) {
      case "loading":
        statusElement.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка цен...'
        break
      case "success":
        statusElement.innerHTML = '<i class="fa-solid fa-check-circle"></i> Цены обновлены'
        if (lastUpdateElement && this.lastUpdateTime) {
          lastUpdateElement.textContent = `Обновлено: ${this.lastUpdateTime.toLocaleTimeString("ru-RU")}`
        }
        break
      case "error":
        statusElement.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Ошибка загрузки'
        break
    }
  }

  // ===== ПОКАЗ ОШИБКИ =====
  showError(message) {
    console.error("Ошибка:", message)

    // Показываем ошибку в интерфейсе
    const statusElement = document.getElementById("dataStatus")
    if (statusElement) {
      statusElement.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> ${message}`
      statusElement.className = "status-error"
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

      // Закрытие по Escape
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

  // ===== ИНИЦИАЛИЗАЦИЯ ТАБОВ УСЛУГ =====
  initServiceTabs() {
    try {
      const tabs = document.querySelectorAll(".service-tab")
      const contents = document.querySelectorAll(".service-content")

      if (tabs.length === 0) {
        console.log("Табы услуг не найдены")
        return
      }

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const targetService = tab.getAttribute("data-service")

          // Убираем активный класс со всех табов и контента
          tabs.forEach((t) => t.classList.remove("active"))
          contents.forEach((c) => c.classList.remove("active"))

          // Добавляем активный класс к выбранному табу и контенту
          tab.classList.add("active")
          const targetContent = document.getElementById(targetService)
          if (targetContent) {
            targetContent.classList.add("active")
          }

          // Плавная прокрутка к контенту
          const servicesSection = document.querySelector(".services-content-section")
          if (servicesSection) {
            servicesSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        })
      })

      console.log("Табы услуг инициализированы:", tabs.length)
    } catch (error) {
      console.error("Ошибка инициализации табов:", error)
    }
  }

  // ===== ИНИЦИАЛИЗАЦИЯ ЭФФЕКТОВ ПРОКРУТКИ =====
  initScrollEffects() {
    try {
      // Sticky header
      const header = document.querySelector(".header")

      if (header) {
        window.addEventListener("scroll", () => {
          const currentScrollY = window.scrollY
          if (currentScrollY > 100) {
            header.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.15)"
          } else {
            header.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)"
          }
        })
      }

      console.log("Эффекты прокрутки инициализированы")
    } catch (error) {
      console.error("Ошибка инициализации эффектов прокрутки:", error)
    }
  }

  // ===== ИНИЦИАЛИЗАЦИЯ КНОПОК ЗАПИСИ =====
  initBookingButtons() {
    try {
      const bookingButtons = document.querySelectorAll(".book-service-btn")

      bookingButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          const serviceName = button.getAttribute("data-service") || "Консультация"
          this.handleBookingClick(serviceName, button)
        })
      })

      console.log("Кнопки записи инициализированы:", bookingButtons.length)
    } catch (error) {
      console.error("Ошибка инициализации кнопок записи:", error)
    }
  }

  // ===== ОБРАБОТКА КЛИКА ПО КНОПКЕ ЗАПИСИ =====
  handleBookingClick(serviceName, button) {
    try {
      // Добавляем эффект нажатия
      button.style.transform = "scale(0.95)"
      setTimeout(() => {
        button.style.transform = ""
      }, 150)

      // Формируем сообщение для WhatsApp
      const message = `Здравствуйте! Хочу записаться на "${serviceName}". Подскажите, пожалуйста, удобное время.`
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/77054026181?text=${encodedMessage}`

      // Открываем WhatsApp
      window.open(whatsappUrl, "_blank")

      console.log("Открыт WhatsApp для услуги:", serviceName)
    } catch (error) {
      console.error("Ошибка обработки клика по кнопке записи:", error)
    }
  }

  // ===== ПЛАВНАЯ ПРОКРУТКА К ЦЕНАМ =====
  scrollToPrices() {
    try {
      const pricesSection = document.querySelector(".services-nav-section")
      if (pricesSection) {
        pricesSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    } catch (error) {
      console.error("Ошибка прокрутки к ценам:", error)
    }
  }
}

// ===== УТИЛИТЫ ДЛЯ СТРАНИЦЫ ЦЕН =====
class PricesPageUtils {
  static scrollToPrices() {
    try {
      const pricesSection = document.querySelector(".services-nav-section")
      if (pricesSection) {
        pricesSection.scrollIntoView({
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
    console.log("DOM загружен, начинаем инициализацию...")

    // Создаем глобальный экземпляр менеджера цен
    window.pricesManager = new PricesPageManager()

    // Добавляем обработчики для кнопок
    const scrollButton = document.querySelector(".scroll-to-prices-btn")
    if (scrollButton) {
      scrollButton.addEventListener("click", PricesPageUtils.scrollToPrices)
    }

    console.log("Страница цен инициализирована успешно")
  } catch (error) {
    console.error("Критическая ошибка инициализации:", error)
  }
})

// ===== ОБРАБОТКА ОШИБОК JAVASCRIPT =====
window.addEventListener("error", (event) => {
  console.error("JavaScript Error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
})

// ===== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ =====
window.PricesPageUtils = PricesPageUtils
