/**
 * Float Bar Synchronization Module
 * Sincroniza os elementos da barra flutuante com o sistema de alocação de patrimônio
 * Integra com PatrimonySync existente
 */

(function() {
  'use strict';

  class FloatBarSync {
    constructor() {
      // Elementos da barra flutuante
      this.elements = {
        floatComponent: null,
        remainingValue: null,
        remainingPercent: null,
        totalValue: null,
        distributionChart: null,
        assetItems: [],
        iaButton: null,
        closeButton: null,
        iaInputWrapper: null,
        distributionWrapper: null
      };

      // Estado
      this.state = {
        isInitialized: false,
        isAIMode: false,
        patrimonySystem: null
      };

      // Configuração
      this.config = {
        updateDelay: 100,
        animationDuration: 300
      };
    }

    async init() {
      try {
        // Aguardar o PatrimonySync
        await this.waitForPatrimonySync();

        // Capturar elementos
        this.captureElements();

        // Configurar listeners
        this.setupEventListeners();

        // Sincronização inicial
        this.syncAllValues();

        this.state.isInitialized = true;
        console.log('FloatBarSync initialized successfully');
      } catch (error) {
        console.error('Error initializing FloatBarSync:', error);
      }
    }

    async waitForPatrimonySync() {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.PatrimonySync && window.PatrimonySync.initialized) {
            this.state.patrimonySystem = window.PatrimonySync;
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    captureElements() {
      // Componente principal
      this.elements.floatComponent = document.querySelector('.componente-alocao-float');

      if (!this.elements.floatComponent) {
        throw new Error('Float component not found');
      }

      // Valores do patrimônio
      this.elements.remainingValue = this.elements.floatComponent.querySelector('.patrimonio-restante');
      this.elements.remainingPercent = this.elements.floatComponent.querySelector('.percent-patrimony_wrapper > div');
      this.elements.totalValue = this.elements.floatComponent.querySelector('.patrimonio-total-value');

      // Gráfico de distribuição
      this.elements.distributionChart = this.elements.floatComponent.querySelector('.graficos-distribuicao-ativos');
      this.elements.distributionWrapper = this.elements.floatComponent.querySelector('.ativos-graficos-wrapper');

      // Botões
      this.elements.iaButton = this.elements.floatComponent.querySelector('.ia-button-alocacao');
      this.elements.closeButton = this.elements.floatComponent.querySelector('.close-ia');

      // IA input wrapper
      this.elements.iaInputWrapper = this.elements.floatComponent.querySelector('.ia-input_wrapper');

      // Capturar items de ativos
      this.captureAssetItems();
    }

    captureAssetItems() {
      const items = this.elements.floatComponent.querySelectorAll('.ativos-grafico-item');
      this.elements.assetItems = Array.from(items).map(item => ({
        element: item,
        bar: item.querySelector('.barra-porcentagem-item'),
        percentage: item.querySelector('.porcentagem-float-alocacao'),
        name: item.querySelector('.nome-produto-float'),
        productName: item.querySelector('.nome-produto-float')?.textContent.trim()
      }));
    }

    setupEventListeners() {
      // Listener para mudanças no PatrimonySync
      document.addEventListener('allocationChange', () => {
        this.debounce(() => this.syncAllValues(), this.config.updateDelay);
      });

      // Listener para mudanças no input principal
      const mainInput = document.querySelector('#currency');
      if (mainInput) {
        mainInput.addEventListener('input', () => {
          this.debounce(() => this.syncAllValues(), this.config.updateDelay);
        });
      }

      // Botão IA
      if (this.elements.iaButton) {
        this.elements.iaButton.addEventListener('click', () => {
          this.toggleAIMode(true);
        });
      }

      // Botão fechar IA
      if (this.elements.closeButton) {
        this.elements.closeButton.addEventListener('click', () => {
          this.toggleAIMode(false);
        });
      }

      // Atualizar quando inputs individuais mudarem
      document.querySelectorAll('.currency-input.individual').forEach(input => {
        input.addEventListener('input', () => {
          this.debounce(() => this.syncAllValues(), this.config.updateDelay);
        });
      });
    }

    syncAllValues() {
      if (!this.state.patrimonySystem) return;

      // Obter valores do sistema
      const mainValue = this.state.patrimonySystem.getMainValue();
      const totalAllocated = this.state.patrimonySystem.getTotalAllocated();
      const remainingValue = this.state.patrimonySystem.getRemainingValue();
      const allocations = this.state.patrimonySystem.getAllocations();

      // Calcular porcentagens
      const remainingPercent = mainValue > 0 ? (remainingValue / mainValue) * 100 : 0;

      // Atualizar valores
      this.updateRemainingValues(remainingValue, remainingPercent);
      this.updateTotalValue(mainValue);
      this.updateDistributionChart(allocations, mainValue);
    }

    updateRemainingValues(value, percent) {
      // Atualizar valor restante
      if (this.elements.remainingValue) {
        const formattedValue = this.formatCurrency(value);
        this.animateValue(this.elements.remainingValue, formattedValue);
      }

      // Atualizar porcentagem restante
      if (this.elements.remainingPercent) {
        const formattedPercent = `${Math.round(percent)}%`;
        this.animateValue(this.elements.remainingPercent, formattedPercent);

        // Adicionar classe de estilo baseado na porcentagem
        this.updatePercentageStyle(percent);
      }
    }

    updateTotalValue(value) {
      if (this.elements.totalValue) {
        const formattedValue = this.formatCurrency(value);
        this.animateValue(this.elements.totalValue, formattedValue);
      }
    }

    updateDistributionChart(allocations, totalValue) {
      if (!this.elements.distributionChart || allocations.length === 0) return;

      // Mapear alocações para os items do gráfico
      allocations.forEach(allocation => {
        const assetItem = this.findAssetItem(allocation);
        if (assetItem) {
          this.updateAssetItem(assetItem, allocation, totalValue);
        }
      });

      // Limpar items não alocados
      this.elements.assetItems.forEach(item => {
        const hasAllocation = allocations.some(a => this.matchesAllocation(item, a));
        if (!hasAllocation) {
          this.updateAssetItem(item, { value: 0, percentage: 0 }, totalValue);
        }
      });
    }

    findAssetItem(allocation) {
      return this.elements.assetItems.find(item =>
        this.matchesAllocation(item, allocation)
      );
    }

    matchesAllocation(item, allocation) {
      const itemName = item.productName?.toLowerCase();
      const subcategory = allocation.subcategory?.toLowerCase();

      // Tentar match direto
      if (itemName === subcategory) return true;

      // Tentar match parcial
      if (itemName && subcategory) {
        // Remover espaços e caracteres especiais para comparação
        const normalizedItem = itemName.replace(/[\s,]/g, '');
        const normalizedSub = subcategory.replace(/[\s,]/g, '');

        return normalizedItem.includes(normalizedSub) ||
               normalizedSub.includes(normalizedItem);
      }

      return false;
    }

    updateAssetItem(item, allocation, totalValue) {
      const percentage = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;

      // Atualizar porcentagem
      if (item.percentage) {
        item.percentage.textContent = `${Math.round(percentage)}%`;
      }

      // Atualizar barra de progresso
      if (item.bar) {
        const maxWidth = 60; // pixels máximos para a barra
        const width = (percentage / 100) * maxWidth;

        item.bar.style.width = `${width}px`;
        item.bar.style.backgroundColor = this.getColorForPercentage(percentage);
        item.bar.style.transition = `width ${this.config.animationDuration}ms ease-out`;
      }

      // Adicionar/remover classe ativa
      if (percentage > 0) {
        item.element.classList.add('active');
      } else {
        item.element.classList.remove('active');
      }
    }

    toggleAIMode(show) {
      this.state.isAIMode = show;

      if (this.elements.distributionChart) {
        this.elements.distributionChart.classList.toggle('hide', show);
      }

      if (this.elements.iaInputWrapper) {
        if (show) {
          this.elements.iaInputWrapper.style.display = 'flex';
          this.elements.iaInputWrapper.style.opacity = '0';

          setTimeout(() => {
            this.elements.iaInputWrapper.style.opacity = '1';
            this.elements.iaInputWrapper.style.transition = `opacity ${this.config.animationDuration}ms ease-out`;
          }, 10);

          // Focar no input
          const promptInput = this.elements.iaInputWrapper.querySelector('.prompt-input');
          if (promptInput) {
            promptInput.focus();
          }
        } else {
          this.elements.iaInputWrapper.style.opacity = '0';
          setTimeout(() => {
            this.elements.iaInputWrapper.style.display = 'none';
          }, this.config.animationDuration);
        }
      }
    }

    updatePercentageStyle(percent) {
      const wrapper = this.elements.floatComponent.querySelector('.percent-patrimony_wrapper');
      if (!wrapper) return;

      // Remover classes anteriores
      wrapper.classList.remove('low', 'medium', 'high');

      // Adicionar classe baseada na porcentagem
      if (percent < 10) {
        wrapper.classList.add('low');
      } else if (percent < 30) {
        wrapper.classList.add('medium');
      } else {
        wrapper.classList.add('high');
      }
    }

    getColorForPercentage(percentage) {
      if (percentage < 10) return '#4CAF50'; // Verde
      if (percentage < 20) return '#2196F3'; // Azul
      if (percentage < 30) return '#FF9800'; // Laranja
      return '#F44336'; // Vermelho
    }

    formatCurrency(value) {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    animateValue(element, newValue) {
      if (!element) return;

      const currentValue = element.textContent;
      if (currentValue === newValue) return;

      // Adicionar classe de animação
      element.classList.add('updating');

      // Atualizar valor
      element.textContent = newValue;

      // Remover classe após animação
      setTimeout(() => {
        element.classList.remove('updating');
      }, this.config.animationDuration);
    }

    debounce(func, wait) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(func, wait);
    }

    // Métodos públicos para integração externa
    refresh() {
      this.syncAllValues();
    }

    getState() {
      return {
        isInitialized: this.state.isInitialized,
        isAIMode: this.state.isAIMode,
        remainingValue: this.state.patrimonySystem?.getRemainingValue() || 0,
        totalValue: this.state.patrimonySystem?.getMainValue() || 0
      };
    }
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatBar);
  } else {
    initFloatBar();
  }

  function initFloatBar() {
    const floatBarSync = new FloatBarSync();
    floatBarSync.init().catch(console.error);

    // Exportar para debugging
    window.FloatBarSync = floatBarSync;
  }

})();
