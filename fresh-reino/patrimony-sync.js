/**
 * Patrimony Synchronization System
 * Handles synchronized input system for main currency input and section 3 allocations
 * Includes validation to prevent over-allocation
 */

(function () {
  "use strict";

  // Global state management
  const PatrimonySync = {
    mainValue: 0,
    allocations: new Map(),
    isInitialized: false,
    cacheKey: "patrimony_main_value",
    allocationsCacheKey: "patrimony_allocations",
  };

  // Cache management
  const CacheManager = {
    get(key) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (e) {
        console.error("Cache get error:", e);
        return null;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("Cache set error:", e);
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("Cache remove error:", e);
      }
    },
  };

  // Utility functions
  const Utils = {
    // Parse currency value from formatted string
    parseCurrencyValue(value) {
      if (!value || typeof value !== "string") return 0;
      const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".");
      return parseFloat(cleanValue) || 0;
    },

    // Format number to Brazilian currency
    formatCurrency(value) {
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },

    // Calculate percentage
    calculatePercentage(value, total) {
      if (!total || total === 0) return 0;
      return (value / total) * 100;
    },

    // Format percentage display
    formatPercentage(value) {
      return `${value.toFixed(1)}%`;
    },

    // Debounce function for performance
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
  };

  // Main input synchronization
  const MainInputSync = {
    input: null,

    init() {
      this.input = document.querySelector('[is-main="true"]');
      if (!this.input) {
        console.warn("Main input not found");
        return;
      }

      // Load cached value
      const cachedValue = CacheManager.get(PatrimonySync.cacheKey);
      if (cachedValue !== null && cachedValue > 0) {
        PatrimonySync.mainValue = cachedValue;
        this.input.value = Utils.formatCurrency(cachedValue);
      }

      // Setup event listeners
      this.setupListeners();
    },

    setupListeners() {
      // Listen for currency change events (from existing currency system)
      this.input.addEventListener("currencyChange", (e) => {
        this.handleValueChange(e.detail.value);
      });

      // Listen for direct input changes
      this.input.addEventListener(
        "input",
        Utils.debounce((e) => {
          const value = Utils.parseCurrencyValue(e.target.value);
          this.handleValueChange(value);
        }, 300),
      );

      // Listen for programmatic changes
      this.input.addEventListener("change", (e) => {
        const value = Utils.parseCurrencyValue(e.target.value);
        this.handleValueChange(value);
      });
    },

    handleValueChange(value) {
      PatrimonySync.mainValue = value;
      CacheManager.set(PatrimonySync.cacheKey, value);

      // Dispatch custom event for other components
      document.dispatchEvent(
        new CustomEvent("patrimonyMainValueChanged", {
          detail: { value, formatted: Utils.formatCurrency(value) },
        }),
      );

      // Update all section 3 allocations and validate
      AllocationSync.updateAllAllocations();
      AllocationSync.validateAllAllocations();
    },

    getValue() {
      return PatrimonySync.mainValue;
    },

    setValue(value) {
      PatrimonySync.mainValue = value;
      if (this.input) {
        this.input.value = Utils.formatCurrency(value);
        this.input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
  };

  // Section 3 allocation synchronization with validation
  const AllocationSync = {
    items: [],

    init() {
      // Find all patrimonio interactive items
      const containers = document.querySelectorAll(
        ".patrimonio_interactive_item",
      );

      containers.forEach((container, index) => {
        // Find elements within the correct structure
        const activeItem = container.querySelector(".active-produto-item");
        const disabledItem = container.querySelector(".disabled-produto-item");

        if (!activeItem || !disabledItem) return;

        const input = activeItem.querySelector('[input-settings="receive"]');
        const slider = activeItem.querySelector("range-slider");
        const percentageDisplay = activeItem.querySelector(
          ".porcentagem-calculadora",
        );

        // Find elements in disabled state
        const valorProduto = disabledItem.querySelector(".valor-produto");
        const percentageDisabled = disabledItem.querySelector(
          ".porcentagem-calculadora-disabled",
        );
        const backgroundItemAcao = disabledItem.querySelector(
          ".background-item-acao",
        );

        if (input && slider) {
          const item = {
            container,
            activeItem,
            disabledItem,
            input,
            slider,
            percentageDisplay,
            valorProduto,
            percentageDisabled,
            backgroundItemAcao,
            index,
            value: 0,
            percentage: 0,
            maxAllowed: 0,
          };

          this.items.push(item);
          this.setupItemListeners(item);
        }
      });

      // Load cached allocations
      this.loadCachedAllocations();
    },

    setupItemListeners(item) {
      // Input change listener with validation
      item.input.addEventListener("currencyChange", (e) => {
        this.handleInputChange(item, e.detail.value);
      });

      item.input.addEventListener(
        "input",
        Utils.debounce((e) => {
          const value = Utils.parseCurrencyValue(e.target.value);
          this.handleInputChange(item, value);
        }, 300),
      );

      // Slider change listener with validation
      item.slider.addEventListener("input", (e) => {
        this.handleSliderChange(item, parseFloat(e.target.value));
      });

      // Focus/blur for better UX
      item.input.addEventListener("focus", () => {
        item.container.classList.add("input-focused");
        this.updateMaxAllowed(item);
      });

      item.input.addEventListener("blur", () => {
        item.container.classList.remove("input-focused");
        // Final validation on blur
        this.validateAllocation(item);
      });
    },

    handleInputChange(item, value) {
      const mainValue = MainInputSync.getValue();

      // Calculate max allowed for this item
      const otherAllocations = this.getTotalAllocatedExcept(item);
      const maxAllowed = Math.max(0, mainValue - otherAllocations);

      // Validate and cap the value
      if (value > maxAllowed) {
        value = maxAllowed;
        item.input.value = Utils.formatCurrency(value);
        VisualFeedback.showAllocationWarning(
          item.container,
          `Valor máximo disponível: R$ ${Utils.formatCurrency(maxAllowed)}`,
        );
      }

      item.value = value;
      item.percentage = Utils.calculatePercentage(value, mainValue);
      item.maxAllowed = maxAllowed;

      // Update all displays
      this.updateSlider(item);
      this.updatePercentageDisplay(item);
      this.updateValorProduto(item);
      this.updateBackgroundItemAcao(item);

      // Save to cache
      this.saveAllocations();

      // Dispatch event
      this.dispatchAllocationChange(item);

      // Check total allocation status
      this.checkTotalAllocationStatus();
    },

    handleSliderChange(item, sliderValue) {
      const mainValue = MainInputSync.getValue();
      let value = mainValue * sliderValue;

      // Validate against max allowed
      const otherAllocations = this.getTotalAllocatedExcept(item);
      const maxAllowed = Math.max(0, mainValue - otherAllocations);

      if (value > maxAllowed) {
        value = maxAllowed;
        // Update slider to reflect the capped value
        const cappedSliderValue = mainValue > 0 ? value / mainValue : 0;
        item.slider.value = cappedSliderValue;
        VisualFeedback.showAllocationWarning(
          item.container,
          `Valor máximo disponível: R$ ${Utils.formatCurrency(maxAllowed)}`,
        );
      }

      item.value = value;
      item.percentage =
        value > 0 && mainValue > 0 ? (value / mainValue) * 100 : 0;
      item.maxAllowed = maxAllowed;

      // Update displays
      item.input.value = Utils.formatCurrency(value);
      this.updatePercentageDisplay(item);
      this.updateValorProduto(item);
      this.updateBackgroundItemAcao(item);

      // Save to cache
      this.saveAllocations();

      // Dispatch event
      this.dispatchAllocationChange(item);

      // Check total allocation status
      this.checkTotalAllocationStatus();
    },

    updateSlider(item) {
      const mainValue = MainInputSync.getValue();
      if (mainValue > 0) {
        const sliderValue = item.value / mainValue;
        item.slider.value = Math.min(1, Math.max(0, sliderValue));
      } else {
        item.slider.value = 0;
      }
    },

    updatePercentageDisplay(item) {
      const formattedPercentage = Utils.formatPercentage(item.percentage);

      // Update active percentage display
      if (item.percentageDisplay) {
        item.percentageDisplay.textContent = formattedPercentage;
      }

      // Update disabled percentage display
      if (item.percentageDisabled) {
        item.percentageDisabled.textContent = formattedPercentage;
      }
    },

    updateValorProduto(item) {
      if (item.valorProduto) {
        item.valorProduto.textContent = Utils.formatCurrency(item.value);
      }
    },

    updateBackgroundItemAcao(item) {
      if (item.backgroundItemAcao && window.Motion) {
        const { animate } = window.Motion;
        const widthPercentage = Math.max(0, Math.min(100, item.percentage));

        animate(
          item.backgroundItemAcao,
          {
            width: `${widthPercentage}%`,
          },
          {
            duration: 0.5,
            easing: "ease-out",
          },
        );
      }
    },

    updateMaxAllowed(item) {
      const mainValue = MainInputSync.getValue();
      const otherAllocations = this.getTotalAllocatedExcept(item);
      item.maxAllowed = Math.max(0, mainValue - otherAllocations);
    },

    validateAllocation(item) {
      const mainValue = MainInputSync.getValue();
      const otherAllocations = this.getTotalAllocatedExcept(item);
      const maxAllowed = Math.max(0, mainValue - otherAllocations);

      if (item.value > maxAllowed) {
        item.value = maxAllowed;
        item.input.value = Utils.formatCurrency(maxAllowed);
        this.handleInputChange(item, maxAllowed);
      }
    },

    validateAllAllocations() {
      const mainValue = MainInputSync.getValue();
      const total = this.getTotalAllocated();

      if (total > mainValue) {
        // Proportionally reduce all allocations
        const ratio = mainValue / total;
        this.items.forEach((item) => {
          const newValue = item.value * ratio;
          this.handleInputChange(item, newValue);
        });
      }
    },

    updateAllAllocations() {
      const mainValue = MainInputSync.getValue();

      this.items.forEach((item) => {
        // Update max allowed for each item
        this.updateMaxAllowed(item);

        // Recalculate percentage based on current value
        if (mainValue > 0) {
          item.percentage = Utils.calculatePercentage(item.value, mainValue);
          this.updateSlider(item);
          this.updatePercentageDisplay(item);
          this.updateValorProduto(item);
          this.updateBackgroundItemAcao(item);
        } else {
          // Reset if main value is 0
          item.value = 0;
          item.percentage = 0;
          item.input.value = Utils.formatCurrency(0);
          item.slider.value = 0;
          this.updatePercentageDisplay(item);
          this.updateValorProduto(item);
          this.updateBackgroundItemAcao(item);
        }
      });
    },

    checkTotalAllocationStatus() {
      const mainValue = MainInputSync.getValue();
      const total = this.getTotalAllocated();
      const remaining = mainValue - total;

      document.dispatchEvent(
        new CustomEvent("allocationStatusChanged", {
          detail: {
            mainValue,
            totalAllocated: total,
            remaining,
            isFullyAllocated: remaining === 0,
            isOverAllocated: remaining < 0,
            percentageAllocated: mainValue > 0 ? (total / mainValue) * 100 : 0,
          },
        }),
      );
    },

    getTotalAllocated() {
      return this.items.reduce((sum, item) => sum + item.value, 0);
    },

    getTotalAllocatedExcept(excludeItem) {
      return this.items.reduce((sum, item) => {
        return item === excludeItem ? sum : sum + item.value;
      }, 0);
    },

    getRemainingValue() {
      const mainValue = MainInputSync.getValue();
      const totalAllocated = this.getTotalAllocated();
      return Math.max(0, mainValue - totalAllocated);
    },

    saveAllocations() {
      const allocations = this.items.map((item) => ({
        index: item.index,
        value: item.value,
        percentage: item.percentage,
      }));

      CacheManager.set(PatrimonySync.allocationsCacheKey, allocations);
    },

    loadCachedAllocations() {
      const cached = CacheManager.get(PatrimonySync.allocationsCacheKey);
      if (!cached || !Array.isArray(cached)) return;

      cached.forEach((cachedItem) => {
        const item = this.items.find((i) => i.index === cachedItem.index);
        if (item) {
          item.value = cachedItem.value;
          item.percentage = cachedItem.percentage;
          item.input.value = Utils.formatCurrency(item.value);
          this.updateSlider(item);
          this.updatePercentageDisplay(item);
          this.updateValorProduto(item);
          this.updateBackgroundItemAcao(item);
        }
      });

      // Validate after loading
      this.validateAllAllocations();
    },

    dispatchAllocationChange(item) {
      document.dispatchEvent(
        new CustomEvent("allocationChanged", {
          detail: {
            index: item.index,
            value: item.value,
            percentage: item.percentage,
            formatted: Utils.formatCurrency(item.value),
            remaining: this.getRemainingValue(),
          },
        }),
      );
    },
  };

  // Visual feedback system
  const VisualFeedback = {
    init() {
      // Add CSS for visual feedback
      const style = document.createElement("style");
      style.textContent = `
                .patrimony-sync-active {
                    transition: all 0.3s ease;
                }

                .input-focused {
                    transform: scale(1.02);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }

                .porcentagem-calculadora,
                .porcentagem-calculadora-disabled {
                    transition: all 0.3s ease;
                }

                .porcentagem-calculadora.updating,
                .porcentagem-calculadora-disabled.updating {
                    transform: scale(1.1);
                    color: #22c55e;
                }

                .valor-produto {
                    transition: all 0.3s ease;
                }

                .valor-produto.valor-updating {
                    transform: scale(1.05);
                    color: #3b82f6;
                }

                .allocation-warning {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.5rem;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    position: absolute;
                    background: white;
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.2);
                    z-index: 10;
                }

                .allocation-warning.show {
                    opacity: 1;
                }

                range-slider.dragging {
                    cursor: grabbing;
                }

                range-slider.dragging [data-thumb] {
                    transform: scale(1.2);
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                }

                .allocation-limit-reached {
                    border-color: #ef4444 !important;
                }

                .allocation-progress-bar {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .allocation-progress-bar.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .allocation-progress-bar .progress-track {
                    width: 100%;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 0.5rem 0;
                }

                .allocation-progress-bar .progress-fill {
                    height: 100%;
                    background: #22c55e;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }

                .allocation-progress-bar.limit-reached .progress-fill {
                    background: #ef4444;
                }

                .allocation-progress-bar .progress-text {
                    font-size: 0.875rem;
                    color: #6b7280;
                    display: flex;
                    justify-content: space-between;
                }
            `;
      document.head.appendChild(style);

      // Create progress bar element
      this.createProgressBar();
    },

    createProgressBar() {
      const progressBar = document.createElement("div");
      progressBar.className = "allocation-progress-bar";
      progressBar.innerHTML = `
                <div class="progress-text">
                    <span>Patrimônio alocado</span>
                    <span class="progress-percentage">0%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">
                    <span class="allocated-amount">R$ 0,00</span>
                    <span class="remaining-amount">R$ 0,00 disponível</span>
                </div>
            `;
      document.body.appendChild(progressBar);

      // Listen for allocation changes
      document.addEventListener("allocationStatusChanged", (e) => {
        this.updateProgressBar(e.detail);
      });
    },

    updateProgressBar(status) {
      const progressBar = document.querySelector(".allocation-progress-bar");
      if (!progressBar) return;

      const fill = progressBar.querySelector(".progress-fill");
      const percentage = progressBar.querySelector(".progress-percentage");
      const allocated = progressBar.querySelector(".allocated-amount");
      const remaining = progressBar.querySelector(".remaining-amount");

      // Update values
      const percentAllocated = Math.min(100, status.percentageAllocated);
      fill.style.width = `${percentAllocated}%`;
      percentage.textContent = `${percentAllocated.toFixed(1)}%`;
      allocated.textContent = `R$ ${Utils.formatCurrency(status.totalAllocated)}`;
      remaining.textContent = `R$ ${Utils.formatCurrency(status.remaining)} disponível`;

      // Update styling
      if (status.isFullyAllocated || status.isOverAllocated) {
        progressBar.classList.add("limit-reached");
      } else {
        progressBar.classList.remove("limit-reached");
      }

      // Show progress bar
      progressBar.classList.add("show");

      // Hide after delay if fully allocated
      if (status.isFullyAllocated) {
        setTimeout(() => {
          progressBar.classList.remove("show");
        }, 3000);
      }
    },

    showAllocationWarning(container, message) {
      let warning = container.querySelector(".allocation-warning");
      if (!warning) {
        warning = document.createElement("div");
        warning.className = "allocation-warning";
        container.style.position = "relative";
        container.appendChild(warning);
      }

      warning.textContent = message;
      warning.classList.add("show");

      // Position the warning
      const input = container.querySelector("input");
      if (input) {
        const rect = input.getBoundingClientRect();
        warning.style.top = `${input.offsetTop + rect.height + 5}px`;
        warning.style.left = `${input.offsetLeft}px`;
      }

      // Auto hide
      setTimeout(() => {
        warning.classList.remove("show");
      }, 3000);

      // Add limit reached styling to input
      if (input) {
        input.classList.add("allocation-limit-reached");
        setTimeout(() => {
          input.classList.remove("allocation-limit-reached");
        }, 3000);
      }
    },
  };

  // Public API
  window.PatrimonySync = {
    init() {
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          this.initialize.bind(this),
        );
      } else {
        this.initialize();
      }
    },

    initialize() {
      // Check for dependencies
      if (!window.currency) {
        console.error("Currency.js is required for PatrimonySync");
        return;
      }

      // Wait for Motion.js to be available
      const waitForMotion = () => {
        if (window.Motion) {
          this.initializeComponents();
        } else {
          setTimeout(waitForMotion, 50);
        }
      };
      waitForMotion();
    },

    initializeComponents() {
      // Initialize components
      VisualFeedback.init();
      MainInputSync.init();

      // Wait a bit for dynamic content to load
      setTimeout(() => {
        AllocationSync.init();
        PatrimonySync.isInitialized = true;

        // Initial status check
        AllocationSync.checkTotalAllocationStatus();

        // Dispatch ready event
        document.dispatchEvent(
          new CustomEvent("patrimonySyncReady", {
            detail: {
              mainValue: PatrimonySync.getMainValue(),
              totalAllocated: PatrimonySync.getTotalAllocated(),
              remaining: PatrimonySync.getRemainingValue(),
            },
          }),
        );
      }, 100);
    },

    // Public methods
    getMainValue() {
      return MainInputSync.getValue();
    },

    setMainValue(value) {
      MainInputSync.setValue(value);
    },

    getTotalAllocated() {
      return AllocationSync.getTotalAllocated();
    },

    getRemainingValue() {
      return AllocationSync.getRemainingValue();
    },

    getAllocations() {
      return AllocationSync.items.map((item) => ({
        index: item.index,
        value: item.value,
        percentage: item.percentage,
        formatted: Utils.formatCurrency(item.value),
        maxAllowed: item.maxAllowed,
      }));
    },

    clearCache() {
      CacheManager.remove(PatrimonySync.cacheKey);
      CacheManager.remove(PatrimonySync.allocationsCacheKey);
    },

    reset() {
      this.clearCache();
      MainInputSync.setValue(0);
      AllocationSync.items.forEach((item) => {
        item.value = 0;
        item.percentage = 0;
        item.maxAllowed = 0;
        item.input.value = Utils.formatCurrency(0);
        item.slider.value = 0;
        AllocationSync.updatePercentageDisplay(item);
        AllocationSync.updateValorProduto(item);
        AllocationSync.updateBackgroundItemAcao(item);
      });
      AllocationSync.checkTotalAllocationStatus();
    },
  };

  // Auto-initialize
  window.PatrimonySync.init();
})();
