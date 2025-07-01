// Enhanced JavaScript for Nelly Dental Clinic - Mobile Optimized

document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu elements
  const burger = document.getElementById("burger")
  const mobileNav = document.getElementById("mobileNav")
  const menuOverlay = document.getElementById("menuOverlay")
  const closeMenu = document.getElementById("closeMenu")
  const body = document.body

  // Mobile menu functionality
  function openMenu() {
    mobileNav.classList.add("open")
    menuOverlay.classList.add("active")
    burger.classList.add("active")
    body.style.overflow = "hidden"

    // Add focus to first menu item for accessibility
    const firstMenuItem = mobileNav.querySelector("a")
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 300)
    }
  }

  function closeMenuFunc() {
    mobileNav.classList.remove("open")
    menuOverlay.classList.remove("active")
    burger.classList.remove("active")
    body.style.overflow = ""

    // Return focus to burger button
    burger.focus()
  }

  // Event listeners for menu
  if (burger) {
    burger.addEventListener("click", openMenu)
  }

  if (closeMenu) {
    closeMenu.addEventListener("click", closeMenuFunc)
  }

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenuFunc)
  }

  // Close menu when clicking on navigation links
  const navLinks = mobileNav?.querySelectorAll("a") || []
  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenuFunc)
  })

  // Close menu with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileNav?.classList.contains("open")) {
      closeMenuFunc()
    }
  })

  // Touch gestures for mobile menu
  let touchStartX = 0
  let touchEndX = 0

  mobileNav?.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX
  })

  mobileNav?.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX
    handleSwipe()
  })

  function handleSwipe() {
    const swipeThreshold = 100
    const swipeDistance = touchEndX - touchStartX

    // Swipe right to close menu
    if (swipeDistance > swipeThreshold) {
      closeMenuFunc()
    }
  }

  // Header scroll effects
  const header = document.querySelector(".header")
  let lastScrollTop = 0
  let scrollTimeout

  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    // Add background blur effect when scrolling
    if (scrollTop > 100) {
      header.style.background = "rgba(255, 255, 255, 0.95)"
      header.style.backdropFilter = "blur(10px)"
      header.style.boxShadow = "0 2px 20px rgba(0,0,0,0.1)"
    } else {
      header.style.background = "#fff"
      header.style.backdropFilter = "none"
      header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)"
    }

    // Hide/show header on scroll (only on mobile)
    if (window.innerWidth <= 768) {
      if (scrollTop > lastScrollTop && scrollTop > 200) {
        header.style.transform = "translateY(-100%)"
      } else {
        header.style.transform = "translateY(0)"
      }
    }

    lastScrollTop = scrollTop
  }

  // Throttled scroll handler for better performance
  function throttledScroll() {
    if (scrollTimeout) {
      return
    }

    scrollTimeout = setTimeout(() => {
      handleScroll()
      scrollTimeout = null
    }, 16) // ~60fps
  }

  window.addEventListener("scroll", throttledScroll)

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))

      if (target) {
        const headerHeight = header?.offsetHeight || 0
        const targetPosition = target.offsetTop - headerHeight - 20

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })

        // Close mobile menu if open
        if (mobileNav?.classList.contains("open")) {
          closeMenuFunc()
        }
      }
    })
  })

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("animate-in")
        }, index * 100)
      }
    })
  }, observerOptions)

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(
    ".hero-title, .hero-subtitle, .service-item, .testimonial-card, .rating-card, .about-text, .about-image"
  );
  animatedElements.forEach((el) => {
    observer.observe(el)
  })

  // Phone number formatting for mobile
  function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, "")
    if (value.startsWith("7")) {
      value = "+7 " + value.slice(1, 4) + " " + value.slice(4, 7) + " " + value.slice(7, 9) + " " + value.slice(9, 11)
    }
    input.value = value
  }

  // Add phone formatting to phone inputs
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", () => formatPhoneNumber(input))
  })

  // Lazy loading for images
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.classList.add("loaded")
          imageObserver.unobserve(img)
        }
      }
    })
  })

  // Observe images with data-src attribute
  document.querySelectorAll("img[data-src]").forEach((img) => {
    imageObserver.observe(img)
  })

  // Resize handler
  function handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768 && mobileNav?.classList.contains("open")) {
      closeMenuFunc()
    }

    // Reset header transform on desktop
    if (window.innerWidth > 768) {
      header.style.transform = "translateY(0)"
    }
  }

  window.addEventListener("resize", handleResize)

  // Touch-friendly hover effects for mobile
  if ("ontouchstart" in window) {
    document.querySelectorAll(".service-item, .testimonial-card, .cta-button").forEach((el) => {
      el.addEventListener("touchstart", function () {
        this.classList.add("touch-active")
      })

      el.addEventListener("touchend", function () {
        setTimeout(() => {
          this.classList.remove("touch-active")
        }, 300)
      })
    })
  }

  // Prevent zoom on input focus (iOS Safari)
  const inputs = document.querySelectorAll("input, textarea, select")
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      if (window.innerWidth < 768) {
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")
        }
      }
    })

    input.addEventListener("blur", () => {
      if (window.innerWidth < 768) {
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute("content", "width=device-width, initial-scale=1.0")
        }
      }
    })
  })

  // Add loading class to body when page loads
  window.addEventListener("load", () => {
    body.classList.add("loaded")
  })

  // Focus trap for mobile menu accessibility
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
    )
    const firstFocusableElement = focusableElements[0]
    const lastFocusableElement = focusableElements[focusableElements.length - 1]

    element.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus()
            e.preventDefault()
          }
        }
      }
    })
  }

  // Apply focus trap to mobile menu
  if (mobileNav) {
    trapFocus(mobileNav)
  }

  // Performance optimization: Reduce animations on low-end devices
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2
  if (isLowEndDevice) {
    document.documentElement.style.setProperty("--animation-duration", "0.2s")
  }

  // Service Worker registration for offline functionality (optional)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }

  console.log("Nelly Dental Clinic - Mobile Optimized Version Loaded Successfully!")
})

// Utility functions
const NellyDentalUtils = {
  // Debounce function for performance
  debounce: (func, wait, immediate) => {
    let timeout
    return function executedFunction() {
      
      const args = arguments
      const later = () => {
        timeout = null
        if (!immediate) func.apply(this, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this, args)
    }
  },

  // Throttle function for scroll events
  throttle: (func, limit) => {
    let inThrottle
    return function () {
      const args = arguments
      
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  // Check if element is in viewport
  isInViewport: (element) => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  },

  // Get device type
  getDeviceType: () => {
    const width = window.innerWidth
    if (width <= 480) return "mobile"
    if (width <= 768) return "tablet"
    return "desktop"
  },
}

// Export utils for global use
window.NellyDentalUtils = NellyDentalUtils

// Contacts page specific functionality
document.addEventListener("DOMContentLoaded", () => {
  // Contact form handling
  const contactForm = document.getElementById("contactForm")
  const formSuccess = document.getElementById("formSuccess")

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault()

      // Get form data
      const formData = new FormData(this)
      const name = formData.get("name")
      const phone = formData.get("phone")
      const email = formData.get("email")
      const service = formData.get("service")
      const message = formData.get("message")

      // Basic validation
      if (!name || !phone || !service) {
        alert("Пожалуйста, заполните обязательные поля")
        return
      }

      // Phone validation
      const phoneRegex = /^[\+]?[7]?[\s\-]?[$$]?[0-9]{3}[$$]?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/
      if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
        alert("Пожалуйста, введите корректный номер телефона")
        return
      }

      // Email validation (if provided)
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          alert("Пожалуйста, введите корректный email")
          return
        }
      }

      // Simulate form submission
      const submitBtn = this.querySelector(".submit-btn")
      const originalText = submitBtn.innerHTML
      
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ОТПРАВКА...'
      submitBtn.disabled = true

      // Simulate API call
      setTimeout(() => {
        // Show success message
        formSuccess.classList.add("show")
        
        // Reset form
        this.reset()
        
        // Reset button
        submitBtn.innerHTML = originalText
        submitBtn.disabled = false

        // Hide success message after 5 seconds
        setTimeout(() => {
          formSuccess.classList.remove("show")
        }, 5000)

        // In real implementation, you would send data to your server
        console.log("Form submitted:", {
          name,
          phone,
          email,
          service,
          message,
        })
      }, 2000)
    })
  }

  // Phone number formatting
  const phoneInput = document.getElementById("phone")
  if (phoneInput) {
    phoneInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "")
      
      if (value.startsWith("7")) {
        value = "+7 " + value.slice(1)
      } else if (value.startsWith("8")) {
        value = "+7 " + value.slice(1)
      } else if (value.length > 0 && !value.startsWith("7")) {
        value = "+7 " + value
      }

      // Format: +7 XXX XXX XX XX
      if (value.length > 2) {
        value = value.slice(0, 2) + " " + value.slice(2)
      }
      if (value.length > 6) {
        value = value.slice(0, 6) + " " + value.slice(6)
      }
      if (value.length > 10) {
        value = value.slice(0, 10) + " " + value.slice(10)
      }
      if (value.length > 13) {
        value = value.slice(0, 13) + " " + value.slice(13, 15)
      }

      e.target.value = value
    })
  }

  // Smooth scroll to form when clicking contact buttons
  const contactButtons = document.querySelectorAll('a[href*="contact"]')
  contactButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const contactFormSection = document.querySelector(".contact-form-section")
      if (contactFormSection) {
        e.preventDefault()
        contactFormSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Map interaction improvements for mobile
  const mapContainer = document.querySelector(".map-container")
  if (mapContainer) {
    let isMapActive = false

    mapContainer.addEventListener("click", function () {
      if (!isMapActive) {
        this.style.pointerEvents = "auto"
        isMapActive = true
        
        // Add overlay message for mobile
        if (window.innerWidth <= 768) {
          const overlay = document.createElement("div")
          overlay.className = "map-overlay-message"
          overlay.innerHTML = "Используйте два пальца для перемещения карты"
          overlay.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 10;
            pointer-events: none;
          `
          this.appendChild(overlay)
          
          setTimeout(() => {
            overlay.remove()
          }, 3000)
        }
      }
    })

    // Reset map interaction when clicking outside
    document.addEventListener("click", function (e) {
      if (!mapContainer.contains(e.target) && isMapActive) {
        mapContainer.style.pointerEvents = "none"
        isMapActive = false
      }
    })
  }

  console.log("Contacts page functionality loaded successfully!")
})
// Cases page specific functionality
document.addEventListener("DOMContentLoaded", () => {
  // Counter animation for hero stats
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-beautiful')
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count)
      const numberElement = counter.querySelector('.stat-number')
      const isPercentage = numberElement.textContent.includes('%')
      
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        
        if (isPercentage) {
          numberElement.textContent = Math.floor(current) + '%'
        } else {
          numberElement.textContent = Math.floor(current) + '+'
        }
      }, 20)
    })
  }

  // Trigger counter animation when hero section is visible
  const heroSection = document.querySelector('.cases-hero-beautiful')
  if (heroSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(animateCounters, 1000)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.5 })
    
    observer.observe(heroSection)
  }

  // Before/After slider functionality
  function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll('.before-after-slider')
    
    sliders.forEach(slider => {
      const handle = slider.querySelector('.slider-handle')
      const beforeImg = slider.querySelector('.before-img')
      let isDragging = false
      
      function updateSlider(x) {
        const rect = slider.getBoundingClientRect()
        const percentage = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100))
        
        beforeImg.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`
        handle.style.left = percentage + '%'
      }
      
      // Mouse events
      handle.addEventListener('mousedown', (e) => {
        isDragging = true
        e.preventDefault()
      })
      
      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          updateSlider(e.clientX)
        }
      })
      
      document.addEventListener('mouseup', () => {
        isDragging = false
      })
      
      // Touch events for mobile
      handle.addEventListener('touchstart', (e) => {
        isDragging = true
        e.preventDefault()
      })
      
      document.addEventListener('touchmove', (e) => {
        if (isDragging) {
          const touch = e.touches[0]
          updateSlider(touch.clientX)
        }
      })
      
      document.addEventListener('touchend', () => {
        isDragging = false
      })
      
      // Click to position
      slider.addEventListener('click', (e) => {
        if (!isDragging) {
          updateSlider(e.clientX)
        }
      })
    })
  }

  // Filter functionality
  function initCaseFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn')
    const caseCards = document.querySelectorAll('.case-card-beautiful')
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'))
        button.classList.add('active')
        
        const filter = button.dataset.filter
        
        // Filter cards with animation
        caseCards.forEach((card, index) => {
          const categories = card.dataset.category || ''
          const shouldShow = filter === 'all' || categories.includes(filter)
          
          setTimeout(() => {
            if (shouldShow) {
              card.classList.remove('filter-hidden')
              card.classList.add('filter-visible')
              card.style.display = 'block'
            } else {
              card.classList.add('filter-hidden')
              card.classList.remove('filter-visible')
              setTimeout(() => {
                if (card.classList.contains('filter-hidden')) {
                  card.style.display = 'none'
                }
              }, 300)
            }
          }, index * 50)
        })
      })
    })
  }

  // Showcase thumbnails functionality
  function initShowcaseThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail')
    const showcaseImages = document.querySelector('.before-after-showcase')
    
    // Sample data for different cases
    const caseData = {
      1: {
        before: '/img/do6.jfif',
        after: '/img/posle6.jfif',
        title: 'Коронки цирконевые',
        tags: ['E-max', 'Коронки']
      },
      2: {
        before: '/img/do7.jfif',
        after: '/img/posle7.jfif',
        title: 'Закрытие тремы брекетами',
        tags: ['Брекеты', 'Ортодонтия']
      },
      3: {
        before: '/img/do4.jfif',
        after: '/img/posle4.jfif',
        title: 'Брекет-система: металлические лигатурные',
        tags: ['Ортодонтия', 'Брекет-система']
      }
    }
    
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', () => {
        // Update active thumbnail
        thumbnails.forEach(t => t.classList.remove('active'))
        thumbnail.classList.add('active')
        
        const caseId = thumbnail.dataset.case
        const data = caseData[caseId]
        
        if (data && showcaseImages) {
          // Update images with fade effect
          const beforeImg = showcaseImages.querySelector('.before img')
          const afterImg = showcaseImages.querySelector('.after img')
          const title = document.querySelector('.showcase-info h3')
          const tags = document.querySelector('.showcase-tags')
          
          // Fade out
          showcaseImages.style.opacity = '0.5'
          
          setTimeout(() => {
            beforeImg.src = data.before
            afterImg.src = data.after
            title.textContent = data.title
            
            // Update tags
            tags.innerHTML = data.tags.map(tag => 
              `<span class="tag">${tag}</span>`
            ).join('')
            
            // Fade in
            showcaseImages.style.opacity = '1'
          }, 200)
        }
      })
    })
  }

  

  // Load more functionality
  function initLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn')
    const casesGrid = document.querySelector('.cases-grid-beautiful')
    
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        // Add loading state
        loadMoreBtn.classList.add('loading')
        loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...'
        
        // Simulate loading delay
        setTimeout(() => {
          // In a real application, you would fetch more cases from an API
          // For demo purposes, we'll just show a message
          loadMoreBtn.innerHTML = '<i class="fa-solid fa-check"></i> Все кейсы загружены'
          loadMoreBtn.disabled = true
          loadMoreBtn.style.opacity = '0.6'
        }, 2000)
      })
    }
  }

  // Smooth reveal animation for case cards
  function initCaseRevealAnimation() {
    const caseCards = document.querySelectorAll('.case-card-beautiful')
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }, index * 100)
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    })
    
    caseCards.forEach(card => {
      observer.observe(card)
    })
  }

  // Enhanced case card interactions
  function initCaseCardInteractions() {
    const caseCards = document.querySelectorAll('.case-card-beautiful')
    
    caseCards.forEach(card => {
      const viewBtn = card.querySelector('.view-case-btn')
      
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          
          // Add click animation
          viewBtn.style.transform = 'scale(0.95)'
          setTimeout(() => {
            viewBtn.style.transform = 'scale(1)'
          }, 150)
          
          // In a real application, this would open a modal or navigate to a detailed page
          console.log('Opening case details...')
          
          // For demo, show an alert
          const title = card.querySelector('h3').textContent
          alert(`Открытие подробной информации о кейсе: "${title}"`)
        })
      }
    })
  }

  // Initialize all functionality
  initBeforeAfterSliders()
  initCaseFilters()
  initShowcaseThumbnails()
  initLoadMore()
  initCaseRevealAnimation()
  initCaseCardInteractions()

  console.log('Cases page functionality loaded successfully!')
})

// Utility functions for cases page
const CasesPageUtils = {
  // Smooth scroll to cases section
  scrollToCases: () => {
    const casesSection = document.querySelector('.cases-gallery-beautiful')
    if (casesSection) {
      casesSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  },

  // Filter cases by category
  filterCases: (category) => {
    const filterBtn = document.querySelector(`[data-filter="${category}"]`)
    if (filterBtn) {
      filterBtn.click()
    }
  },

  // Get case statistics
  getCaseStats: () => {
    const caseCards = document.querySelectorAll('.case-card-beautiful')
    const categories = {}
    
    caseCards.forEach(card => {
      const category = card.dataset.category || 'other'
      category.split(' ').forEach(cat => {
        categories[cat] = (categories[cat] || 0) + 1
      })
    })
    
    return {
      total: caseCards.length,
      categories: categories
    }
  }
}

// Export utils for global use
window.CasesPageUtils = CasesPageUtils

// Media page specific functionality
document.addEventListener("DOMContentLoaded", () => {
  // Counter animation for hero stats
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-media, .stat-card-beautiful')
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count || counter.querySelector('[data-count]')?.dataset.count)
      if (!target) return
      
      const numberElement = counter.querySelector('.stat-number-media, .stat-number-big')
      if (!numberElement) return
      
      const isPercentage = numberElement.textContent.includes('%')
      const isThousands = target >= 1000
      
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        
        let displayValue = Math.floor(current)
        
        if (isPercentage) {
          numberElement.textContent = displayValue + '%'
        } else if (isThousands && displayValue >= 1000) {
          numberElement.textContent = (displayValue / 1000).toFixed(1) + 'K+'
        } else {
          numberElement.textContent = displayValue + '+'
        }
      }, 20)
    })
  }

  // Trigger counter animation when sections are visible
  const heroSection = document.querySelector('.media-hero-beautiful')
  const statsSection = document.querySelector('.video-stats-beautiful')
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(animateCounters, 500)
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.5 })
  
  if (heroSection) observer.observe(heroSection)
  if (statsSection) observer.observe(statsSection)

  // Video modal functionality
  function initVideoModal() {
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    const modal = document.getElementById('videoModal')
    const modalIframe = document.getElementById('modalIframe')
    const modalTitle = document.getElementById('modalTitle')
    const closeBtn = document.getElementById('closeModal')
    const prevBtn = document.getElementById('prevVideo')
    const nextBtn = document.getElementById('nextVideo')
    const modalOverlay = document.querySelector('.modal-overlay-beautiful')
    
    let currentVideoIndex = 0
    let videoData = []
    
    // Collect video data
    videoCards.forEach((card, index) => {
      const videoUrl = card.dataset.video
      const title = card.querySelector('h3').textContent
      const category = card.dataset.category
      
      videoData.push({
        url: videoUrl,
        title: title,
        category: category,
        element: card
      })
    })
    
    function openModal(index) {
      currentVideoIndex = index
      const video = videoData[index]
      
      modalIframe.src = video.url
      modalTitle.textContent = video.title
      modal.classList.add('active')
      document.body.style.overflow = 'hidden'
      
      // Update navigation buttons
      prevBtn.disabled = index === 0
      nextBtn.disabled = index === videoData.length - 1
      
      // Add modal open animation
      setTimeout(() => {
        modal.querySelector('.modal-content-beautiful').style.transform = 'scale(1)'
      }, 10)
    }
    
    function closeModal() {
      modal.classList.remove('active')
      modalIframe.src = ''
      document.body.style.overflow = 'auto'
      
      // Reset modal position
      modal.querySelector('.modal-content-beautiful').style.transform = 'scale(0.8)'
    }
    
    function showPrevVideo() {
      if (currentVideoIndex > 0) {
        openModal(currentVideoIndex - 1)
      }
    }
    
    function showNextVideo() {
      if (currentVideoIndex < videoData.length - 1) {
        openModal(currentVideoIndex + 1)
      }
    }
    
    // Event listeners
    videoCards.forEach((card, index) => {
      card.addEventListener('click', () => {
        openModal(index)
      })
    })
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal)
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal)
    if (prevBtn) prevBtn.addEventListener('click', showPrevVideo)
    if (nextBtn) nextBtn.addEventListener('click', showNextVideo)
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (modal.classList.contains('active')) {
        switch(e.key) {
          case 'Escape':
            closeModal()
            break
          case 'ArrowLeft':
            showPrevVideo()
            break
          case 'ArrowRight':
            showNextVideo()
            break
        }
      }
    })
  }

  // Filter functionality
  function initVideoFilters() {
    const filterButtons = document.querySelectorAll('.media-filter-btn')
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'))
        button.classList.add('active')
        
        const filter = button.dataset.filter
        
        // Filter cards with animation
        videoCards.forEach((card, index) => {
          const category = card.dataset.category || ''
          const shouldShow = filter === 'all' || category.includes(filter)
          
          setTimeout(() => {
            if (shouldShow) {
              card.classList.remove('filter-hidden')
              card.classList.add('filter-visible')
              card.style.display = 'block'
            } else {
              card.classList.add('filter-hidden')
              card.classList.remove('filter-visible')
              setTimeout(() => {
                if (card.classList.contains('filter-hidden')) {
                  card.style.display = 'none'
                }
              }, 300)
            }
          }, index * 50)
        })
      })
    })
  }

  // Load more functionality
  function initLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn-media')
    
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        // Add loading state
        loadMoreBtn.classList.add('loading')
        loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Загрузка...</span>'
        
        // Simulate loading delay
        setTimeout(() => {
          // In a real application, you would fetch more videos from an API
          loadMoreBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Все видео загружены</span>'
          loadMoreBtn.disabled = true
          loadMoreBtn.style.opacity = '0.6'
        }, 2000)
      })
    }
  }

  // Video card hover effects
  function initVideoCardEffects() {
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    
    videoCards.forEach(card => {
      const thumbnail = card.querySelector('.video-thumbnail-beautiful')
      const overlay = card.querySelector('.video-overlay-beautiful')
      const playButton = card.querySelector('.play-button-beautiful')
      
      card.addEventListener('mouseenter', () => {
        // Add hover animation to play button
        if (playButton) {
          playButton.style.transform = 'scale(1.1)'
        }
      })
      
      card.addEventListener('mouseleave', () => {
        // Reset play button
        if (playButton) {
          playButton.style.transform = 'scale(1)'
        }
      })
      
      // Add click ripple effect
      card.addEventListener('click', (e) => {
        const ripple = document.createElement('div')
        ripple.className = 'click-ripple'
        
        const rect = card.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(102, 126, 234, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
          z-index: 10;
        `
        
        card.style.position = 'relative'
        card.appendChild(ripple)
        
        setTimeout(() => {
          ripple.remove()
        }, 600)
      })
    })
    
    // Add ripple animation CSS
    const style = document.createElement('style')
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }

  // Smooth reveal animation for video cards
  function initVideoRevealAnimation() {
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }, index * 100)
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    })
    
    videoCards.forEach(card => {
      observer.observe(card)
    })
  }

  // Video lazy loading
  function initVideoLazyLoading() {
    const videoThumbnails = document.querySelectorAll('.video-thumbnail-beautiful img')
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          
          // Add loading animation
          img.style.opacity = '0'
          img.style.transition = 'opacity 0.3s ease'
          
          img.onload = () => {
            img.style.opacity = '1'
          }
          
          // If image is already cached, show it immediately
          if (img.complete) {
            img.style.opacity = '1'
          }
          
          imageObserver.unobserve(img)
        }
      })
    })
    
    videoThumbnails.forEach(img => {
      imageObserver.observe(img)
    })
  }

  // Search functionality (if needed)
  function initVideoSearch() {
    const searchInput = document.getElementById('videoSearch')
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase()
        
        videoCards.forEach(card => {
          const title = card.querySelector('h3').textContent.toLowerCase()
          const description = card.querySelector('p').textContent.toLowerCase()
          const tags = Array.from(card.querySelectorAll('.tag-beautiful')).map(tag => tag.textContent.toLowerCase())
          
          const matches = title.includes(searchTerm) || 
                         description.includes(searchTerm) || 
                         tags.some(tag => tag.includes(searchTerm))
          
          if (matches || searchTerm === '') {
            card.style.display = 'block'
            card.classList.remove('filter-hidden')
          } else {
            card.style.display = 'none'
            card.classList.add('filter-hidden')
          }
        })
      })
    }
  }

  // Video view tracking (for analytics)
  function trackVideoView(videoTitle, videoCategory) {
    // In a real application, you would send this data to your analytics service
    console.log('Video viewed:', {
      title: videoTitle,
      category: videoCategory,
      timestamp: new Date().toISOString()
    })
    
    // Example: Google Analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'video_view', {
        'video_title': videoTitle,
        'video_category': videoCategory
      })
    }
  }

  // Initialize all functionality
  initVideoModal()
  initVideoFilters()
  initLoadMore()
  initVideoCardEffects()
  initVideoRevealAnimation()
  initVideoLazyLoading()
  initVideoSearch()

  console.log('Media page functionality loaded successfully!')
})

// Utility functions for media page
const MediaPageUtils = {
  // Smooth scroll to videos section
  scrollToVideos: () => {
    const videosSection = document.querySelector('.video-gallery-beautiful')
    if (videosSection) {
      videosSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  },

  // Filter videos by category
  filterVideos: (category) => {
    const filterBtn = document.querySelector(`[data-filter="${category}"]`)
    if (filterBtn) {
      filterBtn.click()
    }
  },

  // Get video statistics
  getVideoStats: () => {
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    const categories = {}
    
    videoCards.forEach(card => {
      const category = card.dataset.category || 'other'
      categories[category] = (categories[category] || 0) + 1
    })
    
    return {
      total: videoCards.length,
      categories: categories
    }
  },

  // Play specific video by index
  playVideo: (index) => {
    const videoCards = document.querySelectorAll('.video-card-beautiful')
    if (videoCards[index]) {
      videoCards[index].click()
    }
  },

  // Share video functionality
  shareVideo: (videoTitle, videoUrl) => {
    if (navigator.share) {
      navigator.share({
        title: videoTitle,
        text: `Посмотрите это видео от Nelly dental clinic: ${videoTitle}`,
        url: videoUrl
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(videoUrl).then(() => {
        alert('Ссылка на видео скопирована в буфер обмена!')
      })
    }
  }
}

// Export utils for global use
window.MediaPageUtils = MediaPageUtils

// Add some additional CSS for enhanced animations
const additionalStyles = `
  .video-card-beautiful {
    will-change: transform, opacity;
  }
  
  .play-button-beautiful {
    will-change: transform;
  }
  
  .video-thumbnail-beautiful img {
    will-change: transform;
  }
  
  .modal-content-beautiful {
    will-change: transform, opacity;
  }
  
  /* Enhanced loading animation */
  .video-card-beautiful.loading {
    position: relative;
    overflow: hidden;
  }
  
  .video-card-beautiful.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  
  /* Smooth transitions for all interactive elements */
  .media-filter-btn,
  .video-card-beautiful,
  .play-button-beautiful,
  .control-btn-beautiful,
  .cta-btn-media {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`

// Inject additional styles
const styleSheet = document.createElement('style')
styleSheet.textContent = additionalStyles
document.head.appendChild(styleSheet)


// Doctors page specific functionality
document.addEventListener("DOMContentLoaded", () => {
  // Counter animation for hero stats
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-doctors')
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count)
      const numberElement = counter.querySelector('.stat-number-doctors')
      const isPercentage = numberElement.textContent.includes('%')
      
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        
        if (isPercentage) {
          numberElement.textContent = Math.floor(current) + '%'
        } else {
          numberElement.textContent = Math.floor(current) + (target > 10 ? '+' : '')
        }
      }, 20)
    })
  }

  // Trigger counter animation when hero section is visible
  const heroSection = document.querySelector('.doctors-hero-beautiful')
  if (heroSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(animateCounters, 1000)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.5 })
    
    observer.observe(heroSection)
  }

  // Doctor data for modal
  const doctorsData = {
    nelly: {
      name: "Нелли Курмаева Ринатовна",
      position: "Стоматолог-терапевт, Главный врач",
      photo: "../img/nellyvrach.JPG",
      experience: "14 лет стажа",
      rating: 5.0,
      specialties: ["Терапия", "Эстетика", "Эндодонтия", "Управление"],
      description: "Опытный стоматолог-терапевт с 14-летним стажем. Специализируется на лечении кариеса, пульпита и периодонтита, прямых эстетических реставрациях, контроле качества лечения, а также координации работы команды и повышении стандартов клинической практики. Главный врач клиники.",
      achievements: [
        "14 лет успешной практики",
        "Главный врач клиники",
        "Более 500 довольных пациентов",
        "Специализация в эстетической стоматологии",
        "Эксперт в эндодонтическом лечении"
      ],
      schedule: {
        "Понедельник": "10:00-19:00",
        "Вторник": "10:00-19:00", 
        "Среда": "10:00-19:00",
        "Четверг": "10:00-19:00",
        "Пятница": "10:00-19:00",
        "Суббота": "10:00-16:00",
        "Воскресенье": "Выходной"
      }
    },
    erik: {
      name: "Ерік Оңдабаев Қуанышұлы",
      position: "Эндодонтист",
      photo: "../img/eric.png",
      experience: "5 лет стажа",
      rating: 4.9,
      specialties: ["Эндодонтия", "Микроскоп", "Каналы", "Реставрация"],
      description: "Специализируется на лечении корневых каналов под микроскопом, проводит первичное и повторное эндодонтическое лечение, удаление сломанных инструментов, устранение перфораций, апексификация, лечение сложной анатомии каналов и обеспечивает высокую точность и сохранность тканей зуба.",
      achievements: [
        "5 лет специализации в эндодонтии",
        "Работа под микроскопом",
        "Сложные клинические случаи",
        "Высокая точность лечения",
        "Современные методики"
      ],
      schedule: {
        "Понедельник": "10:00-19:00",
        "Вторник": "Выходной",
        "Среда": "10:00-19:00",
        "Четверг": "10:00-19:00",
        "Пятница": "10:00-19:00",
        "Суббота": "10:00-16:00",
        "Воскресенье": "Выходной"
      }
    },
    yernar: {
      name: "Ернар Ержанович",
      position: "Стоматолог-ортодонт",
      photo: "../img/yernar.JPG",
      experience: "3 года стажа",
      rating: 4.8,
      specialties: ["Ортодонтия", "Брекеты", "Элайнеры", "Прикус"],
      description: "Специализируется на выравнивании зубов, коррекции прикуса, улучшении эстетики улыбки и восстановлении правильной функции жевания с помощью брекетов, элайнеров и других ортодонтических аппаратов.",
      achievements: [
        "3 года ортодонтической практики",
        "Более 200 исправленных улыбок",
        "Работа с брекет-системами",
        "Элайнеры и капы",
        "Коррекция сложных случаев"
      ],
      schedule: {
        "Понедельник": "Выходной",
        "Вторник": "10:00-19:00",
        "Среда": "10:00-19:00",
        "Четверг": "Выходной",
        "Пятница": "10:00-19:00",
        "Суббота": "10:00-16:00",
        "Воскресенье": "10:00-16:00"
      }
    },
    akmaral: {
      name: "Акмарал Айдарбековна",
      position: "Стоматолог-терапевт",
      photo: "../img/akmaral.JPG",
      experience: "3 года стажа",
      rating: 4.9,
      specialties: ["Терапия", "Реставрация", "Эндодонтия", "Профилактика"],
      description: "Специализируется на лечении кариеса, пульпита и периодонтита, проводит прямые эстетические реставрации, повторное эндодонтическое лечение, восстановление формы и функции зубов и профилактикой осложнений.",
      achievements: [
        "3 года клинической практики",
        "Индивидуальный подход к пациентам",
        "Эстетические реставрации",
        "Профилактическая стоматология",
        "Комфортное лечение"
      ],
      schedule: {
        "Понедельник": "10:00-19:00",
        "Вторник": "10:00-19:00",
        "Среда": "Выходной",
        "Четверг": "10:00-19:00",
        "Пятница": "10:00-19:00",
        "Суббота": "Выходной",
        "Воскресенье": "10:00-16:00"
      }
    },
    merey: {
      name: "Мерей Амирулловна",
      position: "Стоматолог-терапевт",
      photo: "../img/merey.PNG",
      experience: "8 лет стажа",
      rating: 4.9,
      specialties: ["Терапия", "Диагностика", "Профилактика", "Эндодонтия"],
      description: "Проводит диагностику и лечение кариеса и его осложнений (пульпита и периодонтита). Выполняет прямые эстетические реставрации, повторное эндодонтическое лечение, восстановление формы и функции зубов. Особое внимание уделяет сохранению здоровых тканей и профилактике осложнений.",
      achievements: [
        "8 лет успешной практики",
        "Экспертиза в диагностике",
        "Профилактическая стоматология",
        "Сохранение здоровых тканей",
        "Комплексный подход к лечению"
      ],
      schedule: {
        "Понедельник": "10:00-19:00",
        "Вторник": "Выходной",
        "Среда": "10:00-19:00",
        "Четверг": "10:00-19:00",
        "Пятница": "Выходной",
        "Суббота": "10:00-16:00",
        "Воскресенье": "10:00-16:00"
      }
    },
    ulmeken: {
      name: "Улмекен Аширханова Тенелбаевна",
      position: "Стоматолог-терапевт",
      photo: "../img/ulmeken.JPG",
      experience: "5 лет стажа",
      rating: 4.8,
      specialties: ["Терапия", "Реставрация", "Эндодонтия", "Эстетика"],
      description: "Специализируется на лечении кариеса, пульпита и периодонтита, проводит прямые эстетические реставрации, повторное эндодонтическое лечение, восстановление формы и функции зубов и профилактикой осложнений.",
      achievements: [
        "5 лет клинической практики",
        "Эстетические реставрации",
        "Качественное эндодонтическое лечение",
        "Восстановление функции зубов",
        "Профилактика осложнений"
      ],
      schedule: {
        "Понедельник": "Выходной",
        "Вторник": "10:00-19:00",
        "Среда": "10:00-19:00",
        "Четверг": "10:00-19:00",
        "Пятница": "10:00-19:00",
        "Суббота": "Выходной",
        "Воскресенье": "10:00-16:00"
      }
    }
  }

  // Doctor modal functionality
  function initDoctorModal() {
    const modal = document.getElementById('doctorModal')
    const closeBtn = document.getElementById('closeDoctorModal')
    const modalOverlay = document.querySelector('.modal-overlay-doctors')
    
    // Open modal buttons
    const viewButtons = document.querySelectorAll('.view-doctor-btn, .secondary-btn-doctors')
    const bookButtons = document.querySelectorAll('.book-doctor-btn, .primary-btn-doctors')
    
    function openModal(doctorId) {
      const doctor = doctorsData[doctorId]
      if (!doctor) return
      
      // Populate modal content
      document.getElementById('modalDoctorName').textContent = doctor.name
      document.getElementById('modalDoctorPhoto').src = doctor.photo
      document.getElementById('modalDoctorPhoto').alt = doctor.name
      document.getElementById('modalExperience').textContent = doctor.experience
      document.getElementById('modalDoctorFullName').textContent = doctor.name
      document.getElementById('modalDoctorPosition').textContent = doctor.position
      document.getElementById('modalDoctorDescription').textContent = doctor.description
      
      // Rating
      const ratingContainer = document.getElementById('modalRating')
      ratingContainer.innerHTML = ''
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('i')
        star.className = i < Math.floor(doctor.rating) ? 'fa-solid fa-star' : 'fa-regular fa-star'
        ratingContainer.appendChild(star)
      }
      document.getElementById('modalRatingText').textContent = doctor.rating
      
      // Specialties
      const specialtiesContainer = document.getElementById('modalSpecialties')
      specialtiesContainer.innerHTML = doctor.specialties.map((specialty, index) => 
        `<span class="specialty-tag ${index === 0 ? 'primary' : ''}">${specialty}</span>`
      ).join('')
      
      // Achievements
      const achievementsContainer = document.getElementById('modalAchievements')
      achievementsContainer.innerHTML = doctor.achievements.map(achievement => 
        `<li>${achievement}</li>`
      ).join('')
      
      // Schedule
      const scheduleContainer = document.getElementById('modalSchedule')
      scheduleContainer.innerHTML = Object.entries(doctor.schedule).map(([day, time]) => 
        `<div class="schedule-item ${time !== 'Выходной' ? 'available' : ''}">
          <div style="font-weight: 600; margin-bottom: 4px;">${day}</div>
          <div>${time}</div>
        </div>`
      ).join('')
      
      // Show modal
      modal.classList.add('active')
      document.body.style.overflow = 'hidden'
    }
    
    function closeModal() {
      modal.classList.remove('active')
      document.body.style.overflow = 'auto'
    }
    
    // Event listeners
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const doctorId = btn.dataset.doctor || btn.closest('.doctor-card-beautiful').querySelector('[data-doctor]').dataset.doctor
        openModal(doctorId)
      })
    })
    
    bookButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const doctorId = btn.dataset.doctor || btn.closest('.doctor-card-beautiful').querySelector('[data-doctor]').dataset.doctor
        // In a real application, this would open a booking form
        alert(`Запись к врачу: ${doctorsData[doctorId]?.name}. Позвоните +7 705 402 61 81 для записи.`)
      })
    })
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal)
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal)
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (modal.classList.contains('active') && e.key === 'Escape') {
        closeModal()
      }
    })
  }

  // Filter functionality
  function initDoctorFilters() {
    const filterButtons = document.querySelectorAll('.doctors-filter-btn')
    const doctorCards = document.querySelectorAll('.doctor-card-beautiful')
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'))
        button.classList.add('active')
        
        const filter = button.dataset.filter
        
        // Filter cards with animation
        doctorCards.forEach((card, index) => {
          const specialization = card.dataset.specialization || ''
          const shouldShow = filter === 'all' || specialization.includes(filter)
          
          setTimeout(() => {
            if (shouldShow) {
              card.classList.remove('filter-hidden')
              card.classList.add('filter-visible')
              card.style.display = 'block'
            } else {
              card.classList.add('filter-hidden')
              card.classList.remove('filter-visible')
              setTimeout(() => {
                if (card.classList.contains('filter-hidden')) {
                  card.style.display = 'none'
                }
              }, 300)
            }
          }, index * 100)
        })
        
        // Update filter counts
        updateFilterCounts()
      })
    })
  }

  // Update filter counts
  function updateFilterCounts() {
    const filterButtons = document.querySelectorAll('.doctors-filter-btn')
    const doctorCards = document.querySelectorAll('.doctor-card-beautiful')
    
    filterButtons.forEach(button => {
      const filter = button.dataset.filter
      const countElement = button.querySelector('.filter-count')
      
      if (filter === 'all') {
        countElement.textContent = doctorCards.length
      } else {
        const count = Array.from(doctorCards).filter(card => 
          card.dataset.specialization && card.dataset.specialization.includes(filter)
        ).length
        countElement.textContent = count
      }
    })
  }

  // Doctor card hover effects
  function initDoctorCardEffects() {
    const doctorCards = document.querySelectorAll('.doctor-card-beautiful')
    
    doctorCards.forEach(card => {
      const image = card.querySelector('.doctor-image-beautiful img')
      const overlay = card.querySelector('.doctor-overlay-beautiful')
      
      card.addEventListener('mouseenter', () => {
        // Add hover animation
        if (image) {
          image.style.transform = 'scale(1.05)'
        }
      })
      
      card.addEventListener('mouseleave', () => {
        // Reset image
        if (image) {
          image.style.transform = 'scale(1)'
        }
      })
      
      // Add click ripple effect
      card.addEventListener('click', (e) => {
        // Only add ripple if not clicking on buttons
        if (e.target.closest('button')) return
        
        const ripple = document.createElement('div')
        ripple.className = 'click-ripple-doctors'
        
        const rect = card.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(102, 126, 234, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: rippleDoctors 0.6s ease-out;
          pointer-events: none;
          z-index: 10;
        `
        
        card.style.position = 'relative'
        card.appendChild(ripple)
        
        setTimeout(() => {
          ripple.remove()
        }, 600)
      })
    })
    
    // Add ripple animation CSS
    const style = document.createElement('style')
    style.textContent = `
      @keyframes rippleDoctors {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }

  // Smooth reveal animation for doctor cards
  function initDoctorRevealAnimation() {
    const doctorCards = document.querySelectorAll('.doctor-card-beautiful')
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }, index * 150)
          observer.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    })
    
    doctorCards.forEach(card => {
      observer.observe(card)
    })
  }

  // Doctor search functionality
  function initDoctorSearch() {
    const searchInput = document.getElementById('doctorSearch')
    const doctorCards = document.querySelectorAll('.doctor-card-beautiful')
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase()
        
        doctorCards.forEach(card => {
          const name = card.querySelector('h3').textContent.toLowerCase()
          const position = card.querySelector('.doctor-position-beautiful').textContent.toLowerCase()
          const description = card.querySelector('.doctor-description-beautiful').textContent.toLowerCase()
          const specialties = Array.from(card.querySelectorAll('.specialty-tag')).map(tag => tag.textContent.toLowerCase())
          
          const matches = name.includes(searchTerm) || 
                         position.includes(searchTerm) || 
                         description.includes(searchTerm) ||
                         specialties.some(specialty => specialty.includes(searchTerm))
          
          if (matches || searchTerm === '') {
            card.style.display = 'block'
            card.classList.remove('filter-hidden')
          } else {
            card.style.display = 'none'
            card.classList.add('filter-hidden')
          }
        })
      })
    }
  }

  // Doctor booking tracking
  function trackDoctorBooking(doctorName, doctorSpecialty) {
    // In a real application, you would send this data to your analytics service
    console.log('Doctor booking initiated:', {
      doctor: doctorName,
      specialty: doctorSpecialty,
      timestamp: new Date().toISOString()
    })
    
    // Example: Google Analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'doctor_booking', {
        'doctor_name': doctorName,
        'doctor_specialty': doctorSpecialty
      })
    }
  }

  // Initialize all functionality
  initDoctorModal()
  initDoctorFilters()
  initDoctorCardEffects()
  initDoctorRevealAnimation()
  initDoctorSearch()
  updateFilterCounts()

  console.log('Doctors page functionality loaded successfully!')
})

// Utility functions for doctors page
const DoctorsPageUtils = {
  // Smooth scroll to doctors section
  scrollToDoctors: () => {
    const doctorsSection = document.querySelector('.doctors-grid-beautiful')
    if (doctorsSection) {
      doctorsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  },

  // Filter doctors by specialization
  filterDoctors: (specialization) => {
    const filterBtn = document.querySelector(`[data-filter="${specialization}"]`)
    if (filterBtn) {
      filterBtn.click()
    }
  },

  // Get doctor statistics
  getDoctorStats: () => {
    const doctorCards = document.querySelectorAll('.doctor-card-beautiful')
    const specializations = {}
    
    doctorCards.forEach(card => {
      const specialization = card.dataset.specialization || 'other'
      specializations[specialization] = (specializations[specialization] || 0) + 1
    })
    
    return {
      total: doctorCards.length,
      specializations: specializations
    }
  },

  // Open specific doctor modal
  openDoctorModal: (doctorId) => {
    const viewBtn = document.querySelector(`[data-doctor="${doctorId}"]`)
    if (viewBtn) {
      viewBtn.click()
    }
  },

  // Book appointment with specific doctor
  bookDoctor: (doctorId) => {
    const bookBtn = document.querySelector(`[data-doctor="${doctorId}"].primary-btn-doctors`)
    if (bookBtn) {
      bookBtn.click()
    }
  }
}

// Export utils for global use
window.DoctorsPageUtils = DoctorsPageUtils

// Add some additional CSS for enhanced animations

