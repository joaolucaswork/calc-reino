/**
 * Portfolio Allocation Interface - Bundled Version
 * Clean, modern implementation without ES6 modules to avoid CORS issues
 * Built specifically for range-slider-element and FloatingUI
 */

// ============================================================================
// EventBus - Centralized event system for component communication
// ============================================================================
class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName).add(callback);

    return () => {
      const callbacks = this.events.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(eventName);
        }
      }
    };
  }

  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (...args) => {
      unsubscribe();
      callback(...args);
    });
    return unsubscribe;
  }

  emit(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error);
        }
      });
    }
  }

  off(eventName) {
    this.events.delete(eventName);
  }

  clear() {
    this.events.clear();
  }

  getActiveEvents() {
    return Array.from(this.events.keys());
  }

  getListenerCount(eventName) {
    const callbacks = this.events.get(eventName);
    return callbacks ? callbacks.size : 0;
  }
}

// ============================================================================
// PortfolioState - Centralized state management for portfolio allocations
// ============================================================================
class PortfolioState {
  constructor() {
    this.totalCapital = 980250.0;
    this.allocations = new Map();
    this.manualAllocations = new Map(); // Store manual allocations for restoration
    this.currentProfile = null;
    this.snapPoints = [
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
    ];

    this.initializeAssets();
  }

  initializeAssets() {
    const sliders = document.querySelectorAll('range-slider.allocation-slider');
    sliders.forEach((slider) => {
      const assetName = slider.dataset.asset;
      if (assetName) {
        this.allocations.set(assetName, 0);
      }
    });
  }

  setAllocation(assetName, percentage, skipValidation = false) {
    const oldValue = this.allocations.get(assetName) || 0;

    if (!skipValidation) {
      const availableBudget = this.getAvailableBudget(assetName);
      percentage = Math.min(percentage, availableBudget);
    }

    percentage = this.snapToNearestPoint(percentage);
    this.allocations.set(assetName, percentage);

    // Auto-save manual allocations when user makes changes (not during profile application)
    if (!this.currentProfile || skipValidation) {
      this.saveManualAllocations();
    }

    window.eventBus.emit('allocation:changed', {
      assetName,
      oldValue,
      newValue: percentage,
      allocations: this.getAllocations(),
      totalAllocated: this.getTotalAllocated(),
      remainingBudget: this.getRemainingBudget(),
    });
  }

  // New method for manual input that preserves exact values without snapping
  setManualAllocation(assetName, percentage, skipValidation = false) {
    const oldValue = this.allocations.get(assetName) || 0;

    if (!skipValidation) {
      const availableBudget = this.getAvailableBudget(assetName);
      percentage = Math.min(percentage, availableBudget);
    }

    // Do NOT snap to nearest point - preserve exact manual input
    this.allocations.set(assetName, percentage);

    // Auto-save manual allocations
    if (!this.currentProfile || skipValidation) {
      this.saveManualAllocations();
    }

    window.eventBus.emit('allocation:changed', {
      assetName,
      oldValue,
      newValue: percentage,
      allocations: this.getAllocations(),
      totalAllocated: this.getTotalAllocated(),
      remainingBudget: this.getRemainingBudget(),
    });
  }

  getAllocation(assetName) {
    return this.allocations.get(assetName) || 0;
  }

  getAllocations() {
    return Object.fromEntries(this.allocations);
  }

  getTotalAllocated() {
    return Array.from(this.allocations.values()).reduce((sum, val) => sum + val, 0);
  }

  getRemainingBudget() {
    return Math.max(0, 100 - this.getTotalAllocated());
  }

  getAvailableBudget(assetName) {
    let totalOthers = 0;
    for (const [asset, allocation] of this.allocations) {
      if (asset !== assetName) {
        totalOthers += allocation;
      }
    }
    return Math.max(0, 100 - totalOthers);
  }

  snapToNearestPoint(value) {
    let closest = this.snapPoints[0];
    let minDiff = Math.abs(value - closest);

    for (let point of this.snapPoints) {
      const diff = Math.abs(value - point);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }

  resetAll() {
    const oldAllocations = this.getAllocations();

    for (const assetName of this.allocations.keys()) {
      this.allocations.set(assetName, 0);
    }

    window.eventBus.emit('allocation:reset', {
      oldAllocations,
      newAllocations: this.getAllocations(),
    });
  }

  getCurrencyValue(percentage) {
    return (this.totalCapital * percentage) / 100;
  }

  getPercentageFromCurrency(currencyValue) {
    return (currencyValue / this.totalCapital) * 100;
  }

  formatCurrency(value, includeCurrencySymbol = true) {
    if (value === 0) return includeCurrencySymbol ? 'R$0' : '0';

    const formatted = new Intl.NumberFormat('pt-BR', {
      style: includeCurrencySymbol ? 'currency' : 'decimal',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

    return formatted;
  }

  // Profile-based allocation methods
  saveManualAllocations() {
    this.manualAllocations.clear();
    for (const [asset, allocation] of this.allocations) {
      this.manualAllocations.set(asset, allocation);
    }
  }

  applyProfileAllocations(profileKey) {
    if (!window.InvestmentStrategies) {
      console.error('Investment strategies not loaded');
      return false;
    }

    // Save current manual allocations before applying profile
    this.saveManualAllocations();

    try {
      const availableAssets = this.getAvailableAssets();
      const profileAllocations = window.InvestmentStrategies.calculateProfileAllocations(
        profileKey,
        availableAssets
      );

      // Apply the profile allocations
      for (const [asset, percentage] of Object.entries(profileAllocations)) {
        this.allocations.set(asset, percentage);
      }

      this.currentProfile = profileKey;

      window.eventBus.emit('profile:applied', {
        profileKey,
        allocations: this.getAllocations(),
        totalAllocated: this.getTotalAllocated(),
        remainingBudget: this.getRemainingBudget(),
      });

      return true;
    } catch (error) {
      console.error('Failed to apply profile allocations:', error);
      return false;
    }
  }

  getAvailableAssets() {
    const assets = [];
    const sliders = document.querySelectorAll('range-slider.allocation-slider');

    sliders.forEach((slider) => {
      const card = slider.closest('.asset-card');
      if (card) {
        const assetName = slider.dataset.asset;
        const { category } = card.dataset;
        const assetType =
          card.dataset.assetType ||
          card.querySelector('.asset-type')?.textContent?.trim() ||
          card.querySelector('.asset-type-text')?.textContent?.trim();

        assets.push({
          name: assetName,
          category: category,
          type: assetType,
        });
      }
    });

    return assets;
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  clearProfile() {
    this.currentProfile = null;
  }

  getSummary() {
    return {
      totalCapital: this.totalCapital,
      totalAllocated: this.getTotalAllocated(),
      remainingBudget: this.getRemainingBudget(),
      allocations: this.getAllocations(),
      currentProfile: this.currentProfile,
      currencyAllocations: Object.fromEntries(
        Array.from(this.allocations.entries()).map(([asset, percentage]) => [
          asset,
          this.getCurrencyValue(percentage),
        ])
      ),
    };
  }
}

// ============================================================================
// SliderComponent - Manages individual range-slider elements
// ============================================================================
class SliderComponent {
  constructor(sliderElement) {
    this.slider = sliderElement;
    this.assetName = sliderElement.dataset.asset;
    this.card = sliderElement.closest('.asset-card');
    this.valueDisplay = this.card.querySelector('.allocation-value');
    this.sliderContainer = this.card.querySelector('.slider-container');

    this.isInteracting = false;
    this.sliderTooltip = null; // New tooltip attached to slider

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createSliderTooltip();
    this.updateDisplay();
  }

  setupEventListeners() {
    this.slider.addEventListener('input', this.handleInput.bind(this));
    this.slider.addEventListener('change', this.handleChange.bind(this));

    const container = this.slider.closest('.slider-container');
    if (container) {
      container.addEventListener('mousedown', (e) => e.stopPropagation());
      container.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    // Add manual editing functionality
    this.setupManualEditing();

    // Global events for display updates
    window.eventBus.on('allocation:changed', this.handleStateChange.bind(this));
    window.eventBus.on('allocation:reset', this.handleReset.bind(this));
    window.eventBus.on('profile:applied', this.handleProfileApplied.bind(this));
    window.eventBus.on('allocation:restored', this.handleStateChange.bind(this));
  }

  setupManualEditing() {
    // Double-click on value to edit
    this.valueDisplay.addEventListener('dblclick', () => {
      this.startManualEdit();
    });

    // Edit icon click
    const editIcon = this.card.querySelector('.edit-icon');
    if (editIcon) {
      editIcon.addEventListener('click', () => {
        this.startManualEdit();
      });
    }
  }

  startManualEdit() {
    const currentValue = window.portfolioState.getCurrencyValue(
      window.portfolioState.getAllocation(this.assetName)
    );

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'allocation-value-input';
    input.value = window.portfolioState.formatCurrency(currentValue, false); // Without currency symbol

    // Hide current display and show input
    this.valueDisplay.classList.add('editing');
    this.valueDisplay.parentNode.appendChild(input);

    // Focus and select all text
    input.focus();
    input.select();

    // Handle input events
    const finishEdit = () => {
      const inputValue = parseFloat(input.value.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(inputValue)) {
        // Convert to percentage - this is the exact percentage we want to preserve
        const exactPercentage = (inputValue / window.portfolioState.totalCapital) * 100;
        const availableBudget = window.portfolioState.getAvailableBudget(this.assetName);

        // Only constrain by budget, but preserve the exact percentage within budget
        const constrainedPercentage = Math.min(exactPercentage, availableBudget);

        // Use the new method that preserves exact manual input without snapping
        window.portfolioState.setManualAllocation(this.assetName, constrainedPercentage);

        // Update slider to exact percentage (not snapped)
        this.slider.value = constrainedPercentage;

        // Update tooltip with precise percentage
        this.updateTooltipPosition(constrainedPercentage);
        this.updateTooltipVisibility(constrainedPercentage);

        // Mark this as a manual input for visual indication
        this.valueDisplay.classList.add('manual-input');
      }

      // Cleanup
      this.valueDisplay.classList.remove('editing');
      input.remove();
      this.updateDisplay();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEdit();
      } else if (e.key === 'Escape') {
        this.valueDisplay.classList.remove('editing', 'manual-input');
        input.remove();
      }
    });
  }

  handleInput(e) {
    this.isInteracting = true;
    const rawValue = parseFloat(e.target.value);

    // Remove manual input indicator since user is now using slider
    this.valueDisplay.classList.remove('manual-input');

    // Get available budget to constrain the value properly
    const availableBudget = window.portfolioState.getAvailableBudget(this.assetName);
    const constrainedValue = this.snapToNearestPoint(Math.min(rawValue, availableBudget));

    // Update slider to constrained value immediately
    this.slider.value = constrainedValue;

    // Update state and trigger events
    window.portfolioState.setAllocation(this.assetName, constrainedValue);

    // Update tooltip position using the constrained value to ensure sync
    // Use requestAnimationFrame to ensure DOM is updated before positioning
    requestAnimationFrame(() => {
      this.updateTooltipPosition(constrainedValue);
      this.updateTooltipVisibility(constrainedValue);
    });

    window.eventBus.emit('allocation:changed', {
      asset: this.assetName,
      value: constrainedValue,
      remainingBudget: window.portfolioState.getRemainingBudget(),
      allocations: window.portfolioState.getAllocations(),
    });
  }

  handleChange(e) {
    this.isInteracting = false;
    const finalValue = parseFloat(e.target.value);

    window.eventBus.emit('allocation:finalized', {
      asset: this.assetName,
      value: finalValue,
    });

    this.triggerVisualCorrelation();
  }

  // Touch handlers removidos - não são mais necessários para o tooltip unificado

  handleStateChange(data) {
    if (data.assetName === this.assetName) {
      this.updateDisplay();
      this.updateCardState();
    }
  }

  handleReset() {
    this.slider.value = 0;
    this.updateDisplay();
  }

  handleProfileApplied() {
    this.updateDisplay();
  }

  createSliderTooltip() {
    this.sliderTooltip = document.createElement('div');
    this.sliderTooltip.className = 'slider-tooltip';
    this.sliderTooltip.innerHTML = `<span class="tooltip-percentage">0%</span>`;

    // Add tooltip to the slider container
    this.sliderContainer.appendChild(this.sliderTooltip);

    // Initially hidden
    this.updateTooltipVisibility(0);
  }

  updateTooltipPosition(percentage) {
    if (!this.sliderTooltip) return;

    // Get the actual slider thumb position from the DOM
    const thumbElement = this.slider.querySelector('[data-thumb]');
    if (!thumbElement) return;

    // Get the slider container dimensions
    const containerRect = this.sliderContainer.getBoundingClientRect();
    const thumbRect = thumbElement.getBoundingClientRect();

    // Calculate the thumb's center position relative to the container
    const thumbCenterX = thumbRect.left - containerRect.left + thumbRect.width / 2;

    // Position tooltip centered above the actual thumb position
    this.sliderTooltip.style.left = `${thumbCenterX}px`;

    // Update tooltip content with precise decimal places
    const percentageElement = this.sliderTooltip.querySelector('.tooltip-percentage');
    if (percentageElement) {
      // For manual input, show more precision (up to 1 decimal place)
      // For values very close to whole numbers, show as whole numbers
      const roundedPercentage = Math.round(percentage * 10) / 10;
      if (roundedPercentage === Math.round(roundedPercentage)) {
        percentageElement.textContent = `${Math.round(roundedPercentage)}%`;
      } else {
        percentageElement.textContent = `${roundedPercentage}%`;
      }
    }
  }

  updateTooltipVisibility(percentage) {
    if (!this.sliderTooltip) return;

    // Show tooltip only when value > 0
    if (percentage > 0) {
      this.sliderTooltip.classList.add('visible');
    } else {
      this.sliderTooltip.classList.remove('visible');
    }
  }

  snapToNearestPoint(value) {
    const { snapPoints } = window.portfolioState;
    let closest = snapPoints[0];
    let minDiff = Math.abs(value - closest);

    for (const point of snapPoints) {
      const diff = Math.abs(value - point);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    return closest;
  }

  updateDisplay() {
    const percentage = window.portfolioState.getAllocation(this.assetName);
    const currencyValue = window.portfolioState.getCurrencyValue(percentage);

    this.slider.value = percentage;
    this.valueDisplay.textContent = window.portfolioState.formatCurrency(currencyValue);

    this.updateCardState();
    this.updateTooltipPosition(percentage);
    this.updateTooltipVisibility(percentage);
  }

  updateCardState() {
    const percentage = window.portfolioState.getAllocation(this.assetName);
    const isActive = percentage > 0;

    this.card.classList.toggle('active', isActive);
    this.valueDisplay.classList.toggle('has-value', isActive);
  }

  // Métodos antigos de tooltip removidos - agora usando apenas unified tooltip

  // Métodos antigos de tooltip removidos - agora usando apenas unified tooltip

  // Métodos showCardTooltip e hideCardTooltip removidos - agora usando unified tooltip

  triggerVisualCorrelation() {
    window.eventBus.emit('slider:correlation', { sourceAsset: this.assetName });
  }

  destroy() {
    // Remove slider tooltip
    if (this.sliderTooltip && this.sliderTooltip.parentNode) {
      this.sliderTooltip.parentNode.removeChild(this.sliderTooltip);
    }
  }
}

// ============================================================================
// DisplayManager - Manages display updates and visual feedback
// ============================================================================
class DisplayManager {
  constructor() {
    this.remainingValueElement = document.querySelector('.remaining-value');
    this.strategyTextElement = document.getElementById('strategy-text');
    this.remainingSection = document.querySelector('.remaining-section');

    this.strategies = this.initializeStrategies();
    this.currentStrategy = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateAllDisplays();
  }

  setupEventListeners() {
    window.eventBus.on('allocation:changed', this.handleAllocationChange.bind(this));
    window.eventBus.on('allocation:reset', this.handleReset.bind(this));
  }

  handleAllocationChange(data) {
    this.updateRemainingAmount(data.remainingBudget);
    this.updateStrategyText(data.allocations);
  }

  handleReset() {
    this.updateAllDisplays();
  }

  updateAllDisplays() {
    const summary = window.portfolioState.getSummary();
    this.updateRemainingAmount(summary.remainingBudget);
    this.updateStrategyText(summary.allocations);
  }

  updateRemainingAmount(remainingPercentage) {
    if (!this.remainingValueElement) return;

    const remainingValue = window.portfolioState.getCurrencyValue(remainingPercentage);
    this.remainingValueElement.textContent = window.portfolioState.formatCurrency(remainingValue);

    // Removed color-changing logic to maintain consistent appearance
  }

  updateStrategyText(allocations) {
    if (!this.strategyTextElement) return;

    const strategy = this.determineStrategy(allocations);

    if (this.currentStrategy !== strategy) {
      this.currentStrategy = strategy;
      this.animateStrategyChange(strategy);
    }
  }

  determineStrategy(allocations) {
    const matchingStrategies = Object.entries(this.strategies)
      .filter(([, strategy]) => strategy.condition(allocations))
      .sort((a, b) => a[1].priority - b[1].priority);

    return matchingStrategies.length > 0 ? matchingStrategies[0][1] : this.strategies.default;
  }

  animateStrategyChange(strategy) {
    this.strategyTextElement.style.opacity = '0.3';
    this.strategyTextElement.style.transform = 'translateY(5px)';

    setTimeout(() => {
      this.strategyTextElement.innerHTML = `
        <div class="strategy-content">
          <span class="strategy-icon" style="color: ${strategy.color}">${strategy.icon}</span>
          <span class="strategy-text">${strategy.text}</span>
        </div>
      `;

      this.strategyTextElement.setAttribute('data-strategy-type', this.getStrategyType(strategy));

      this.strategyTextElement.style.opacity = '1';
      this.strategyTextElement.style.transform = 'translateY(0)';
    }, 200);
  }

  getStrategyType(strategy) {
    if (strategy.text.includes('conservador')) return 'conservative';
    if (strategy.text.includes('agressivo')) return 'aggressive';
    if (strategy.text.includes('equilibrado')) return 'balanced';
    if (strategy.text.includes('liquidez')) return 'liquidity';
    if (strategy.text.includes('diversificação')) return 'diversified';
    return 'default';
  }

  initializeStrategies() {
    return {
      ultraConservative: {
        priority: 1,
        condition: (allocations) => {
          const fixedIncome = this.getCategoryTotal(allocations, ['renda-fixa']);
          const savings = this.getAssetTotal(allocations, 'Poupança');
          return fixedIncome + savings > 80 && fixedIncome > 60;
        },
        text: 'Perfil ultra-conservador - Máxima segurança com foco em preservação de capital.',
        icon: '🛡️',
        color: '#10b981',
      },

      conservative: {
        priority: 2,
        condition: (allocations) => {
          const fixedIncome = this.getCategoryTotal(allocations, ['renda-fixa']);
          const liquidityFunds = this.getAssetTotal(allocations, 'Liquidez');
          return fixedIncome > 50 && fixedIncome <= 80 && liquidityFunds > 15;
        },
        text: 'Perfil conservador - Priorizando segurança e liquidez com foco em renda fixa.',
        icon: '🏦',
        color: '#3b82f6',
      },

      balanced: {
        priority: 3,
        condition: (allocations) => {
          const fixedIncome = this.getCategoryTotal(allocations, ['renda-fixa']);
          const equity = this.getCategoryTotal(allocations, ['fundos']);
          return fixedIncome >= 30 && fixedIncome <= 60 && equity >= 20 && equity <= 50;
        },
        text: 'Perfil equilibrado - Diversificação balanceada entre renda fixa e variável.',
        icon: '⚖️',
        color: '#f59e0b',
      },

      aggressive: {
        priority: 4,
        condition: (allocations) => {
          const equity = this.getCategoryTotal(allocations, ['fundos']);
          const fixedIncome = this.getCategoryTotal(allocations, ['renda-fixa']);
          return equity > 60 && fixedIncome < 30;
        },
        text: 'Perfil agressivo - Foco em crescimento de longo prazo com alta exposição a renda variável.',
        icon: '🚀',
        color: '#ef4444',
      },

      liquidityFocused: {
        priority: 5,
        condition: (allocations) => {
          const liquidityFunds = this.getAssetTotal(allocations, 'Liquidez');
          const savings = this.getAssetTotal(allocations, 'Poupança');
          return liquidityFunds > 30 || savings > 25;
        },
        text: 'Estratégia de liquidez - Mantendo alta reserva para oportunidades e emergências.',
        icon: '💧',
        color: '#06b6d4',
      },

      diversified: {
        priority: 6,
        condition: (allocations) => {
          const categories = ['renda-fixa', 'fundos', 'outros'];
          const activeCats = categories.filter(
            (cat) => this.getCategoryTotal(allocations, [cat]) > 10
          );
          return activeCats.length >= 3;
        },
        text: 'Alta diversificação - Distribuindo riscos entre múltiplas classes de ativos.',
        icon: '🌐',
        color: '#6366f1',
      },

      default: {
        priority: 999,
        condition: () => true,
        text: 'Continue alocando para descobrir sua estratégia de investimento personalizada.',
        icon: '💡',
        color: '#6b7280',
      },
    };
  }

  getCategoryTotal(allocations, categories) {
    let total = 0;
    for (const [asset, value] of Object.entries(allocations)) {
      const card = document.querySelector(`[data-asset="${asset}"]`);
      if (card) {
        const { category } = card.dataset;
        if (categories.includes(category)) {
          total += value;
        }
      }
    }
    return total;
  }

  getAssetTotal(allocations, assetType) {
    let total = 0;
    for (const [asset, value] of Object.entries(allocations)) {
      const card = document.querySelector(`[data-asset="${asset}"]`);
      if (card) {
        const cardAssetType =
          card.querySelector('.asset-type')?.textContent?.trim() ||
          card.querySelector('.asset-type-text')?.textContent?.trim();
        if (cardAssetType === assetType) {
          total += value;
        }
      }
    }
    return total;
  }
}

// ============================================================================
// ProfileManager - Handles investment profile selection and application
// ============================================================================
class ProfileManager {
  constructor() {
    this.profileSelector = null;
    this.applyButton = null;
    this.isApplying = false;

    this.init();
  }

  init() {
    this.profileSelector = document.getElementById('investment-profile-selector');
    this.applyButton = document.getElementById('apply-profile-btn');

    if (!this.profileSelector || !this.applyButton) {
      console.warn('Profile selector elements not found');
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.profileSelector.addEventListener('change', this.handleProfileChange.bind(this));
    this.applyButton.addEventListener('click', this.handleApplyProfile.bind(this));

    window.eventBus.on('profile:applied', this.handleProfileApplied.bind(this));
    window.eventBus.on('allocation:changed', this.handleAllocationChanged.bind(this));
  }

  handleProfileChange() {
    const selectedProfile = this.profileSelector.value;
    this.applyButton.disabled = !selectedProfile;

    if (selectedProfile && window.InvestmentStrategies) {
      const profile = window.InvestmentStrategies.getInvestmentProfile(selectedProfile);
      if (profile) {
        this.applyButton.textContent = `Aplicar ${profile.name}`;
        this.applyButton.style.background = `rgba(255, 255, 255, 0.2)`;
      }
    } else {
      this.applyButton.textContent = 'Aplicar Perfil';
    }
  }

  async handleApplyProfile() {
    const selectedProfile = this.profileSelector.value;
    if (!selectedProfile || this.isApplying) return;

    this.isApplying = true;
    this.applyButton.disabled = true;
    this.applyButton.textContent = 'Aplicando...';

    try {
      const success = window.portfolioState.applyProfileAllocations(selectedProfile);

      if (success) {
        this.showProfileAppliedFeedback(selectedProfile);

        // Animate slider updates
        await this.animateSliderUpdates();

        // Get profile details - profile applied successfully
        const profile = window.InvestmentStrategies.getInvestmentProfile(selectedProfile);
        const profileName = profile ? profile.name : selectedProfile;

        // Profile application completed successfully
      } else {
        throw new Error('Failed to apply profile');
      }
    } catch (error) {
      console.error('Error applying profile:', error);
      // Error applying profile - could be logged or handled silently
    } finally {
      this.isApplying = false;
      this.applyButton.disabled = false;
      this.handleProfileChange(); // Reset button text
    }
  }

  async animateSliderUpdates() {
    const sliders = document.querySelectorAll('range-slider.allocation-slider');
    const animationPromises = [];

    sliders.forEach((slider, index) => {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          const assetName = slider.dataset.asset;
          const targetValue = window.portfolioState.getAllocation(assetName);
          const currentValue = parseFloat(slider.value);

          this.animateSliderToValue(slider, currentValue, targetValue, 500).then(resolve);
        }, index * 100); // Stagger animations
      });

      animationPromises.push(promise);
    });

    await Promise.all(animationPromises);
  }

  animateSliderToValue(slider, fromValue, toValue, duration) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const difference = toValue - fromValue;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = fromValue + difference * easedProgress;

        slider.value = currentValue;
        slider.dispatchEvent(new Event('input', { bubbles: true }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          slider.dispatchEvent(new Event('change', { bubbles: true }));
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  showProfileAppliedFeedback(profileKey) {
    if (!window.InvestmentStrategies) return;

    const profile = window.InvestmentStrategies.getInvestmentProfile(profileKey);
    if (!profile) return;

    // Update selector appearance
    this.profileSelector.style.background = `rgba(255, 255, 255, 0.25)`;
    this.profileSelector.style.borderColor = `rgba(255, 255, 255, 0.5)`;

    setTimeout(() => {
      this.profileSelector.style.background = `rgba(255, 255, 255, 0.15)`;
      this.profileSelector.style.borderColor = `rgba(255, 255, 255, 0.3)`;
    }, 2000);
  }

  handleProfileApplied(data) {
    // Profile was applied successfully
    console.log('Profile applied:', data.profileKey);
  }

  handleAllocationChanged() {
    // Check if manual changes invalidate the current profile
    const currentProfile = window.portfolioState.getCurrentProfile();
    if (currentProfile && !this.isApplying) {
      // Show warning about manual changes
      const profile = window.InvestmentStrategies.getInvestmentProfile(currentProfile);
      const profileName = profile ? profile.name : currentProfile;

      // Manual change detected - clear profile selection
      this.profileSelector.value = '';
      this.applyButton.disabled = true;
      this.applyButton.textContent = 'Aplicar Perfil';
      window.portfolioState.clearProfile();
    }
  }

  getSelectedProfile() {
    return this.profileSelector?.value || null;
  }

  setProfile(profileKey) {
    if (this.profileSelector) {
      this.profileSelector.value = profileKey;
      this.handleProfileChange();
    }
  }
}

// ============================================================================
// CorrelationManager - Handles visual correlation effects between sliders
// ============================================================================
class CorrelationManager {
  constructor() {
    this.isEnabled = true;
    this.effectIntensity = 0.02;
    this.effectDuration = 300;
    this.activeEffects = new Set();

    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.eventBus.on('slider:correlation', this.handleCorrelationTrigger.bind(this));
  }

  handleCorrelationTrigger(data) {
    if (!this.isEnabled) return;

    this.triggerVisualCorrelation(data.sourceAsset);
  }

  triggerVisualCorrelation(sourceAsset) {
    const allSliders = document.querySelectorAll('range-slider.allocation-slider');
    const otherSliders = Array.from(allSliders).filter(
      (slider) => slider.dataset.asset !== sourceAsset
    );

    if (otherSliders.length === 0) return;

    const numCorrelated = Math.min(2, otherSliders.length);
    const correlatedSliders = this.getRandomSliders(otherSliders, numCorrelated);

    correlatedSliders.forEach((slider, index) => {
      const card = slider.closest('.asset-card');
      const delay = index * 50;

      setTimeout(() => {
        this.applyCorrelationEffect(card, slider.dataset.asset);
      }, delay);
    });
  }

  applyCorrelationEffect(card, assetName) {
    if (this.activeEffects.has(assetName)) return;

    this.activeEffects.add(assetName);

    const originalTransform = card.style.transform;
    const originalBoxShadow = card.style.boxShadow;
    const originalBorderColor = card.style.borderColor;
    const originalTransition = card.style.transition;

    card.style.transform = 'scale(1.02) translateY(-2px)';
    card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease';
    card.style.boxShadow = '0 8px 25px rgba(196, 151, 37, 0.15)';
    card.style.borderColor = 'rgba(196, 151, 37, 0.3)';

    this.addCorrelationIndicator(card);

    setTimeout(() => {
      card.style.transform = originalTransform;
      card.style.boxShadow = originalBoxShadow;
      card.style.borderColor = originalBorderColor;
      card.style.transition = originalTransition;

      this.removeCorrelationIndicator(card);
      this.activeEffects.delete(assetName);
    }, this.effectDuration);
  }

  addCorrelationIndicator(card) {
    const indicator = document.createElement('div');
    indicator.className = 'correlation-indicator';
    indicator.innerHTML = '↗️';
    indicator.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 12px;
      opacity: 0.7;
      animation: correlationPulse 0.3s ease;
      z-index: 10;
    `;

    card.style.position = 'relative';
    card.appendChild(indicator);
  }

  removeCorrelationIndicator(card) {
    const indicator = card.querySelector('.correlation-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  getRandomSliders(sliders, count) {
    const shuffled = [...sliders].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  setIntensity(intensity) {
    this.effectIntensity = Math.max(0, Math.min(1, intensity));
  }

  setDuration(duration) {
    this.effectDuration = Math.max(100, duration);
  }

  getSettings() {
    return {
      enabled: this.isEnabled,
      intensity: this.effectIntensity,
      duration: this.effectDuration,
      activeEffects: this.activeEffects.size,
    };
  }
}

// ============================================================================
// PortfolioApp - Main Application Class
// ============================================================================
class PortfolioApp {
  constructor() {
    this.sliders = new Map();
    this.displayManager = null;
    this.correlationManager = null;
    this.profileManager = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('Initializing Portfolio App...');

      this.showLoadingIndicator();

      await this.waitForCustomElements();

      this.initializeSliders();
      this.displayManager = new DisplayManager();
      this.correlationManager = new CorrelationManager();
      this.profileManager = new ProfileManager();

      this.setupGlobalEventListeners();
      this.setupLearnMoreButton();
      this.updateAllDisplays();

      this.hideLoadingIndicator();

      this.isInitialized = true;
      console.log('Portfolio App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Portfolio App:', error);
    }
  }

  async waitForCustomElements() {
    if (customElements.get('range-slider')) {
      return Promise.resolve();
    }

    return customElements.whenDefined('range-slider');
  }

  initializeSliders() {
    const sliderElements = document.querySelectorAll('range-slider.allocation-slider');

    sliderElements.forEach((sliderElement) => {
      const assetName = sliderElement.dataset.asset;
      if (assetName) {
        const sliderComponent = new SliderComponent(sliderElement);
        this.sliders.set(assetName, sliderComponent);
      }
    });

    console.log(`Initialized ${this.sliders.size} sliders`);
  }

  setupGlobalEventListeners() {
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  setupLearnMoreButton() {
    const learnMoreBtn = document.getElementById('learn-more-btn');
    if (learnMoreBtn) {
      learnMoreBtn.addEventListener('click', () => {
        // You can customize this action - for now it shows an alert
        alert('Aqui você pode aprender mais sobre estratégias de investimento!');
        // In a real implementation, this could:
        // - Open a modal with detailed information
        // - Navigate to a learning resource page
        // - Show contextual help based on current strategy
      });
    }
  }

  handleKeyboardShortcuts(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      this.resetAllAllocations();
    }

    if (e.key === 'Escape') {
      this.hideAllTooltips();
    }
  }

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.handleResizeComplete();
    }, 250);
  }

  handleResizeComplete() {
    this.sliders.forEach((slider) => {
      if (slider.tooltip && slider.tooltip.classList.contains('show')) {
        slider.hideTooltip();
        setTimeout(() => slider.showTooltip(), 100);
      }
    });
  }

  handleBeforeUnload() {
    this.cleanup();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.hideAllTooltips();
    }
  }

  handleError(e) {
    console.error('JavaScript error:', e.error);
    this.showErrorMessage('Erro detectado. A aplicação pode não funcionar corretamente.');
  }

  handleUnhandledRejection(e) {
    console.error('Unhandled promise rejection:', e.reason);
    this.showErrorMessage('Erro inesperado detectado.');
  }

  updateAllDisplays() {
    if (this.displayManager) {
      this.displayManager.updateAllDisplays();
    }
  }

  resetAllAllocations() {
    if (confirm('Tem certeza que deseja resetar todas as alocações?')) {
      window.portfolioState.resetAll();
      // All allocations have been reset
    }
  }

  hideAllTooltips() {
    this.sliders.forEach((slider) => {
      slider.hideTooltip();
    });
  }

  showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'app-loading';
    loadingDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(2px);
      ">
        <div style="text-align: center; color: #1e293b;">
          <div style="
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #c49725;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          "></div>
          <div style="font-size: 16px; font-weight: 500; color: #64748b;">
            Carregando interface...
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(loadingDiv);
  }

  hideLoadingIndicator() {
    const loadingDiv = document.getElementById('app-loading');
    if (loadingDiv) {
      loadingDiv.style.opacity = '0';
      loadingDiv.style.transition = 'opacity 0.3s ease';

      setTimeout(() => {
        if (loadingDiv.parentNode) {
          loadingDiv.parentNode.removeChild(loadingDiv);
        }
      }, 300);
    }
  }

  getState() {
    return {
      isInitialized: this.isInitialized,
      sliderCount: this.sliders.size,
      portfolioSummary: window.portfolioState.getSummary(),
      correlationSettings: this.correlationManager?.getSettings(),
    };
  }

  cleanup() {
    this.sliders.forEach((slider) => {
      slider.destroy();
    });
    this.sliders.clear();

    window.eventBus.clear();

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    console.log('Portfolio App cleaned up');
  }
}

// ============================================================================
// Initialization and Global Setup
// ============================================================================

// Add correlation pulse animation to CSS
if (!document.querySelector('#correlation-styles')) {
  const style = document.createElement('style');
  style.id = 'correlation-styles';
  style.textContent = `
    @keyframes correlationPulse {
      0% {
        opacity: 0;
        transform: scale(0.5);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
      }
      100% {
        opacity: 0.7;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}

// Create global instances
window.eventBus = new EventBus();
window.portfolioState = new PortfolioState();

// Initialize app when DOM is ready
let app = null;

function initializeApp() {
  app = new PortfolioApp();
  app.init();

  // Make app available globally for debugging
  if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
    window.portfolioApp = app;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
