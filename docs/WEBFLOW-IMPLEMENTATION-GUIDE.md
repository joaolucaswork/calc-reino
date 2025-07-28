# 📋 Guia de Implementação - Portfolio Slider no Webflow

## 🎯 Visão Geral

Este guia detalha como implementar corretamente o sistema de alocação de portfólio com sliders interativos no Webflow, incluindo a refatoração do código existente para se adaptar à arquitetura TypeScript modular do projeto.

## 📁 Estrutura do Projeto Atual

O projeto está organizado em módulos TypeScript separados:

```
src/
├── ativos/          # Módulo de drag-and-drop de ativos
├── currency/        # Módulo de formatação de moeda
├── utils/           # Utilitários compartilhados
└── index.ts         # Ponto de entrada principal
```

## 🏗️ Estrutura HTML Necessária no Webflow

### 1. Container Principal

```html
<div class="portfolio-container">
  <!-- Grid de Cards de Ativos -->
  <div class="portfolio-main-grid" id="portfolio-main-grid">
    <!-- Cards serão criados dinamicamente ou via CMS -->
  </div>

  <!-- Sidebar Direita -->
  <div class="portfolio-sidebar">
    <!-- Conteúdo da sidebar -->
  </div>
</div>
```

### 2. Template de Card de Ativo (CMS Collection ou Template)

```html
<div
  class="portfolio-asset-card"
  data-category="renda-fixa"
  data-asset="CDB"
  data-asset-id="cdb-1"
  data-asset-type="CDB, LCI, LCA"
>
  <div class="card-header">
    <div class="header-content">
      <div class="category-asset-line">
        <span class="category-text">Renda fixa</span>
        <span class="separator">></span>
        <span class="asset-type-text">CDB, LCI, LCA</span>
      </div>
    </div>
    <i class="fas fa-edit edit-icon"></i>
  </div>

  <div class="allocation-value">R$0</div>

  <div class="slider-container">
    <div class="allocation-slider-wrapper">
      <!-- Slider será inicializado via JavaScript -->
    </div>
  </div>
</div>
```

### 3. Sidebar com Perfis de Investimento

```html
<div class="portfolio-sidebar">
  <div class="portfolio-header">
    <!-- Seletor de Perfil -->
    <div class="profile-selector-section">
      <div class="profile-selector-label">Perfil de Investimento</div>
      <div class="profile-selector-container">
        <select id="investment-profile-selector" class="profile-selector">
          <option value="">Selecione seu perfil</option>
          <option value="conservador">🛡️ Conservador</option>
          <option value="moderado">⚖️ Moderado</option>
          <option value="sofisticado">🚀 Sofisticado</option>
        </select>
        <button id="apply-profile-btn" class="apply-profile-btn" disabled>Aplicar Perfil</button>
      </div>
    </div>

    <!-- Valores Totais -->
    <div class="total-label">Seu patrimônio total</div>
    <div class="total-value" data-currency="true">R$ 980.250,00</div>

    <div class="remaining-section">
      <div class="remaining-label">Falta alocar</div>
      <div class="remaining-value" data-currency="true">R$ 980.250,00</div>
    </div>

    <!-- Estratégia Dinâmica -->
    <div class="strategy-section">
      <div class="strategy-label">Sua estratégia</div>
      <div class="strategy-text" id="strategy-text">
        Comece alocando seus ativos para descobrir sua estratégia
      </div>
      <button class="learn-more-btn" id="learn-more-btn">Quero saber mais</button>
    </div>
  </div>

  <!-- Lista de Ativos Disponíveis -->
  <div class="assets-section">
    <h3>Seus Ativos</h3>

    <div class="asset-category">
      <h4>Renda fixa</h4>
      <div class="asset-chips ativos_main-list" id="renda-fixa-chips">
        <!-- Chips de ativos -->
      </div>
    </div>

    <div class="asset-category">
      <h4>Fundo de investimento</h4>
      <div class="asset-chips ativos_main-list" id="fundos-chips">
        <!-- Chips de ativos -->
      </div>
    </div>
  </div>
</div>
```

### 4. CDN Dependencies (Adicionar no Head)

```html
<!-- Fonts -->
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
/>

<!-- Range Slider Element -->
<script type="module" src="https://cdn.jsdelivr.net/npm/range-slider-element@2/+esm"></script>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/range-slider-element@2/dist/range-slider-element.css"
/>

<!-- SortableJS para drag-and-drop -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>

<!-- AutoNumeric para formatação de moeda -->
<script src="https://cdn.jsdelivr.net/npm/autonumeric@4.6.0/dist/autoNumeric.min.js"></script>
```

## 🔧 Refatoração do Código TypeScript

### 1. Criar Novo Módulo: `src/portfolio/`

#### `src/portfolio/index.ts`

```typescript
import { PortfolioManager } from './portfolio-manager';
import { InvestmentStrategies } from './investment-strategies';
import { SliderComponent } from './slider-component';
import { ProfileManager } from './profile-manager';

export { PortfolioManager, InvestmentStrategies, SliderComponent, ProfileManager };

// Auto-inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const portfolioManager = new PortfolioManager();
  portfolioManager.init();
});
```

#### `src/portfolio/types.ts`

```typescript
export interface AssetData {
  name: string;
  category: string;
  type: string;
  id: string;
}

export interface AllocationData {
  [assetName: string]: number;
}

export interface InvestmentProfile {
  name: string;
  description: string;
  icon: string;
  color: string;
  riskLevel: string;
  expectedReturn: string;
  allocations: {
    [category: string]: number;
  };
  assetPreferences: {
    [category: string]: {
      [assetType: string]: number;
    };
  };
}

export interface PortfolioState {
  totalCapital: number;
  allocations: Map<string, number>;
  currentProfile: string | null;
  manualAllocations: Map<string, number>;
}
```

#### `src/portfolio/config.ts`

```typescript
export const PORTFOLIO_CONFIG = {
  totalCapital: 980250.0,
  snapPoints: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
  selectors: {
    mainGrid: '#portfolio-main-grid',
    assetCard: '.portfolio-asset-card',
    allocationSlider: '.allocation-slider-wrapper',
    profileSelector: '#investment-profile-selector',
    applyProfileBtn: '#apply-profile-btn',
    strategyText: '#strategy-text',
    remainingValue: '.remaining-value',
    totalValue: '.total-value',
  },
  classes: {
    assetCard: 'portfolio-asset-card',
    active: 'active',
    focused: 'focused',
    editing: 'editing',
    hasValue: 'has-value',
    manualInput: 'manual-input',
  },
};
```

#### `src/portfolio/investment-strategies.ts`

```typescript
import { InvestmentProfile, AllocationData, AssetData } from './types';

export class InvestmentStrategies {
  private static profiles: { [key: string]: InvestmentProfile } = {
    conservador: {
      name: 'Conservador',
      description: 'Perfil focado na preservação de capital com baixo risco',
      icon: '🛡️',
      color: '#10b981',
      riskLevel: 'Baixo',
      expectedReturn: '4-6% ao ano',
      allocations: {
        'renda-fixa': 70,
        fundos: 15,
        outros: 15,
      },
      assetPreferences: {
        'renda-fixa': {
          'CDB, LCI, LCA': 35,
          'CRI, CRA, DEBENTURE': 35,
        },
        fundos: {
          Liquidez: 15,
        },
        outros: {
          Poupança: 10,
          Previdência: 5,
        },
      },
    },
    // ... outros perfis
  };

  static getProfile(profileKey: string): InvestmentProfile | null {
    return this.profiles[profileKey] || null;
  }

  static getAllProfiles(): { [key: string]: InvestmentProfile } {
    return this.profiles;
  }

  static calculateProfileAllocations(
    profileKey: string,
    availableAssets: AssetData[]
  ): AllocationData {
    const profile = this.getProfile(profileKey);
    if (!profile) {
      throw new Error(`Profile "${profileKey}" not found`);
    }

    const allocations: AllocationData = {};
    const assetsByCategory = this.groupAssetsByCategory(availableAssets);

    // Inicializar todos os ativos com 0
    availableAssets.forEach((asset) => {
      allocations[asset.name] = 0;
    });

    // Aplicar alocações baseadas no perfil
    for (const [category, categoryAllocation] of Object.entries(profile.allocations)) {
      const categoryAssets = assetsByCategory[category] || [];
      const preferences = profile.assetPreferences[category] || {};

      this.distributeAllocationWithinCategory(
        allocations,
        categoryAssets,
        preferences,
        categoryAllocation
      );
    }

    return this.normalizeAllocations(allocations);
  }

  private static groupAssetsByCategory(assets: AssetData[]): { [category: string]: AssetData[] } {
    return assets.reduce(
      (groups, asset) => {
        if (!groups[asset.category]) {
          groups[asset.category] = [];
        }
        groups[asset.category].push(asset);
        return groups;
      },
      {} as { [category: string]: AssetData[] }
    );
  }

  private static distributeAllocationWithinCategory(
    allocations: AllocationData,
    categoryAssets: AssetData[],
    preferences: { [assetType: string]: number },
    totalCategoryAllocation: number
  ): void {
    // Implementação da distribuição de alocação
    // ... lógica de distribuição
  }

  private static normalizeAllocations(allocations: AllocationData): AllocationData {
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    if (total === 0) return allocations;

    const normalized: AllocationData = {};
    for (const [asset, value] of Object.entries(allocations)) {
      normalized[asset] = (value / total) * 100;
    }

    return normalized;
  }
}
```

#### `src/portfolio/slider-component.ts`

```typescript
import { PORTFOLIO_CONFIG } from './config';

export class SliderComponent {
  private element: HTMLElement;
  private slider: HTMLElement;
  private assetName: string;
  private tooltip: HTMLElement | null = null;

  constructor(cardElement: HTMLElement) {
    this.element = cardElement;
    this.assetName = cardElement.dataset.asset || '';
    this.initializeSlider();
    this.setupEventListeners();
  }

  private initializeSlider(): void {
    const sliderContainer = this.element.querySelector('.slider-container');
    if (!sliderContainer) return;

    // Criar range-slider element
    const rangeSlider = document.createElement('range-slider');
    rangeSlider.className = 'allocation-slider';
    rangeSlider.setAttribute('min', '0');
    rangeSlider.setAttribute('max', '100');
    rangeSlider.setAttribute('value', '0');
    rangeSlider.setAttribute('data-asset', this.assetName);
    rangeSlider.setAttribute('aria-label', `${this.assetName} allocation percentage`);

    const wrapper = sliderContainer.querySelector('.allocation-slider-wrapper');
    if (wrapper) {
      wrapper.appendChild(rangeSlider);
      this.slider = rangeSlider;
    }
  }

  private setupEventListeners(): void {
    if (!this.slider) return;

    this.slider.addEventListener('input', this.handleSliderInput.bind(this));
    this.slider.addEventListener('change', this.handleSliderChange.bind(this));
  }

  private handleSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);

    // Emitir evento para o gerenciador principal
    this.element.dispatchEvent(
      new CustomEvent('allocation-change', {
        detail: { assetName: this.assetName, value },
        bubbles: true,
      })
    );
  }

  private handleSliderChange(event: Event): void {
    // Lógica para snap points e validação final
    const target = event.target as HTMLInputElement;
    const value = this.snapToNearestPoint(parseFloat(target.value));
    target.value = value.toString();

    this.handleSliderInput(event);
  }

  private snapToNearestPoint(value: number): number {
    return PORTFOLIO_CONFIG.snapPoints.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }

  public setValue(value: number): void {
    if (this.slider) {
      (this.slider as any).value = value;
      this.updateDisplay(value);
    }
  }

  private updateDisplay(value: number): void {
    const allocationValue = this.element.querySelector('.allocation-value');
    if (allocationValue) {
      const currencyValue = (value / 100) * PORTFOLIO_CONFIG.totalCapital;
      allocationValue.textContent = this.formatCurrency(currencyValue);

      // Adicionar classe para valores > 0
      if (value > 0) {
        allocationValue.classList.add(PORTFOLIO_CONFIG.classes.hasValue);
      } else {
        allocationValue.classList.remove(PORTFOLIO_CONFIG.classes.hasValue);
      }
    }

    this.updateTooltip(value);
  }

  private updateTooltip(value: number): void {
    if (!this.tooltip) {
      this.createTooltip();
    }

    if (this.tooltip) {
      this.tooltip.textContent = `${value.toFixed(1)}%`;
      this.tooltip.style.display = value > 0 ? 'block' : 'none';
    }
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'unified-tooltip';
    this.tooltip.innerHTML = '<div class="tooltip-percentage">0%</div>';
    this.element.appendChild(this.tooltip);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
```

#### `src/portfolio/portfolio-manager.ts`

```typescript
import { SliderComponent } from './slider-component';
import { InvestmentStrategies } from './investment-strategies';
import { ProfileManager } from './profile-manager';
import { PORTFOLIO_CONFIG } from './config';
import { PortfolioState, AssetData, AllocationData } from './types';

export class PortfolioManager {
  private state: PortfolioState;
  private sliders: Map<string, SliderComponent> = new Map();
  private profileManager: ProfileManager;

  constructor() {
    this.state = {
      totalCapital: PORTFOLIO_CONFIG.totalCapital,
      allocations: new Map(),
      currentProfile: null,
      manualAllocations: new Map(),
    };

    this.profileManager = new ProfileManager(this);
  }

  public init(): void {
    this.initializeAssetCards();
    this.setupEventListeners();
    this.profileManager.init();
  }

  private initializeAssetCards(): void {
    const cards = document.querySelectorAll(PORTFOLIO_CONFIG.selectors.assetCard);

    cards.forEach((card) => {
      const htmlCard = card as HTMLElement;
      const assetName = htmlCard.dataset.asset;

      if (assetName) {
        const slider = new SliderComponent(htmlCard);
        this.sliders.set(assetName, slider);
        this.state.allocations.set(assetName, 0);
      }
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('allocation-change', this.handleAllocationChange.bind(this));
  }

  private handleAllocationChange(event: CustomEvent): void {
    const { assetName, value } = event.detail;

    // Validar orçamento disponível
    if (!this.validateBudget(assetName, value)) {
      this.showBudgetWarning();
      return;
    }

    // Atualizar estado
    this.state.allocations.set(assetName, value);

    // Salvar como alocação manual se não estiver aplicando perfil
    if (!this.profileManager.isApplyingProfile()) {
      this.state.manualAllocations.set(assetName, value);
      this.profileManager.clearCurrentProfile();
    }

    // Atualizar displays
    this.updateRemainingAmount();
    this.updateStrategyText();
  }

  private validateBudget(assetName: string, newValue: number): boolean {
    const currentTotal = Array.from(this.state.allocations.values()).reduce(
      (sum, val) => sum + val,
      0
    );
    const currentAssetValue = this.state.allocations.get(assetName) || 0;
    const newTotal = currentTotal - currentAssetValue + newValue;

    return newTotal <= 100.01; // Pequena margem para erros de ponto flutuante
  }

  private showBudgetWarning(): void {
    // Implementar notificação de aviso de orçamento
    console.warn('Budget exceeded!');
  }

  private updateRemainingAmount(): void {
    const total = Array.from(this.state.allocations.values()).reduce((sum, val) => sum + val, 0);
    const remaining = 100 - total;
    const remainingCurrency = (remaining / 100) * this.state.totalCapital;

    const remainingElement = document.querySelector(PORTFOLIO_CONFIG.selectors.remainingValue);
    if (remainingElement) {
      remainingElement.textContent = this.formatCurrency(remainingCurrency);
    }
  }

  private updateStrategyText(): void {
    const strategy = this.determineStrategy();
    const strategyElement = document.querySelector(PORTFOLIO_CONFIG.selectors.strategyText);

    if (strategyElement) {
      strategyElement.textContent = strategy;
    }
  }

  private determineStrategy(): string {
    const allocations = Object.fromEntries(this.state.allocations);

    // Lógica para determinar estratégia baseada nas alocações
    const rendaFixaTotal = this.getCategoryTotal(allocations, ['renda-fixa']);
    const fundosTotal = this.getCategoryTotal(allocations, ['fundos']);
    const outrosTotal = this.getCategoryTotal(allocations, ['outros']);

    if (rendaFixaTotal > 60) {
      return 'Estratégia conservadora focada em preservação de capital';
    } else if (fundosTotal > 50) {
      return 'Estratégia agressiva focada em crescimento';
    } else if (Math.abs(rendaFixaTotal - fundosTotal) < 20) {
      return 'Estratégia equilibrada entre segurança e crescimento';
    }

    return 'Comece alocando seus ativos para descobrir sua estratégia';
  }

  private getCategoryTotal(allocations: AllocationData, categories: string[]): number {
    // Implementar lógica para calcular total por categoria
    return 0;
  }

  public applyProfile(profileKey: string): void {
    const availableAssets = this.getAvailableAssets();
    const allocations = InvestmentStrategies.calculateProfileAllocations(
      profileKey,
      availableAssets
    );

    // Aplicar alocações com animação
    for (const [assetName, value] of Object.entries(allocations)) {
      const slider = this.sliders.get(assetName);
      if (slider) {
        slider.setValue(value);
        this.state.allocations.set(assetName, value);
      }
    }

    this.state.currentProfile = profileKey;
    this.updateRemainingAmount();
    this.updateStrategyText();
  }

  private getAvailableAssets(): AssetData[] {
    const assets: AssetData[] = [];
    const cards = document.querySelectorAll(PORTFOLIO_CONFIG.selectors.assetCard);

    cards.forEach((card) => {
      const htmlCard = card as HTMLElement;
      const asset: AssetData = {
        name: htmlCard.dataset.asset || '',
        category: htmlCard.dataset.category || '',
        type: htmlCard.dataset.assetType || '',
        id: htmlCard.dataset.assetId || '',
      };
      assets.push(asset);
    });

    return assets;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Métodos públicos para integração
  public getAllocations(): AllocationData {
    return Object.fromEntries(this.state.allocations);
  }

  public getTotalAllocated(): number {
    return Array.from(this.state.allocations.values()).reduce((sum, val) => sum + val, 0);
  }

  public resetAll(): void {
    this.state.allocations.clear();
    this.state.manualAllocations.clear();
    this.state.currentProfile = null;

    this.sliders.forEach((slider) => slider.setValue(0));
    this.updateRemainingAmount();
    this.updateStrategyText();
  }
}
```

#### `src/portfolio/profile-manager.ts`

```typescript
import { PortfolioManager } from './portfolio-manager';
import { InvestmentStrategies } from './investment-strategies';
import { PORTFOLIO_CONFIG } from './config';

export class ProfileManager {
  private portfolioManager: PortfolioManager;
  private isApplying = false;

  constructor(portfolioManager: PortfolioManager) {
    this.portfolioManager = portfolioManager;
  }

  public init(): void {
    this.setupEventListeners();
    this.populateProfileSelector();
  }

  private setupEventListeners(): void {
    const profileSelector = document.querySelector(
      PORTFOLIO_CONFIG.selectors.profileSelector
    ) as HTMLSelectElement;
    const applyBtn = document.querySelector(
      PORTFOLIO_CONFIG.selectors.applyProfileBtn
    ) as HTMLButtonElement;

    if (profileSelector) {
      profileSelector.addEventListener('change', this.handleProfileChange.bind(this));
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', this.handleApplyProfile.bind(this));
    }
  }

  private populateProfileSelector(): void {
    const selector = document.querySelector(
      PORTFOLIO_CONFIG.selectors.profileSelector
    ) as HTMLSelectElement;
    if (!selector) return;

    const profiles = InvestmentStrategies.getAllProfiles();

    // Limpar opções existentes (exceto a primeira)
    while (selector.children.length > 1) {
      selector.removeChild(selector.lastChild!);
    }

    // Adicionar opções de perfil
    for (const [key, profile] of Object.entries(profiles)) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${profile.icon} ${profile.name}`;
      selector.appendChild(option);
    }
  }

  private handleProfileChange(): void {
    const selector = document.querySelector(
      PORTFOLIO_CONFIG.selectors.profileSelector
    ) as HTMLSelectElement;
    const applyBtn = document.querySelector(
      PORTFOLIO_CONFIG.selectors.applyProfileBtn
    ) as HTMLButtonElement;

    if (selector && applyBtn) {
      applyBtn.disabled = !selector.value;
    }
  }

  private handleApplyProfile(): void {
    const selector = document.querySelector(
      PORTFOLIO_CONFIG.selectors.profileSelector
    ) as HTMLSelectElement;
    if (!selector.value) return;

    this.isApplying = true;

    try {
      this.portfolioManager.applyProfile(selector.value);
      this.showSuccessNotification(selector.value);
    } catch (error) {
      console.error('Error applying profile:', error);
      this.showErrorNotification();
    } finally {
      this.isApplying = false;
    }
  }

  public isApplyingProfile(): boolean {
    return this.isApplying;
  }

  public clearCurrentProfile(): void {
    const selector = document.querySelector(
      PORTFOLIO_CONFIG.selectors.profileSelector
    ) as HTMLSelectElement;
    if (selector) {
      selector.value = '';
      this.handleProfileChange();
    }
  }

  private showSuccessNotification(profileKey: string): void {
    const profile = InvestmentStrategies.getProfile(profileKey);
    if (profile) {
      // Implementar notificação de sucesso
      console.log(`Perfil ${profile.name} aplicado com sucesso!`);
    }
  }

  private showErrorNotification(): void {
    // Implementar notificação de erro
    console.error('Erro ao aplicar perfil');
  }
}
```

### 2. Integração com Módulos Existentes

#### Atualizar `src/index.ts`

```typescript
// Import existing modules
import './ativos';
import './currency';

// Import new portfolio module
import './portfolio';

// Export all modules
export * from './currency';
export * from './ativos';
export * from './portfolio';
```

#### Integração com Currency Module

O módulo de currency existente pode ser usado para formatar os valores monetários. Adicione a classe `data-currency="true"` nos elementos que devem ser formatados automaticamente.

#### Integração com Ativos Module

O módulo de ativos existente pode ser usado para o drag-and-drop. Certifique-se de que os containers de chips tenham a classe `ativos_main-list`.

## 🎨 CSS Necessário no Webflow

### 1. Estilos Base (Adicionar no Custom CSS)

```css
/* Container Principal */
.portfolio-container {
  display: flex;
  min-height: 100vh;
  gap: 32px;
  padding: 32px;
  max-width: 1500px;
  margin: 0 auto;
}

/* Grid Principal */
.portfolio-main-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 16px 12px;
  min-height: 640px;
}

/* Cards de Ativos */
.portfolio-asset-card {
  background: white;
  border-radius: 16px;
  padding: 20px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid transparent;
  opacity: 0.5;
}

.portfolio-asset-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  border-color: #e2e8f0;
}

.portfolio-asset-card.active {
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  opacity: 1;
}

/* Header do Card */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.category-asset-line {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 1.3;
}

.category-asset-line .asset-type-text {
  font-weight: 700;
  color: #1e293b;
}

.category-asset-line .separator {
  margin: 0 6px;
  color: #cbd5e1;
}

/* Valor de Alocação */
.allocation-value {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
  text-align: center;
  cursor: pointer;
  transition: color 0.2s ease;
}

.allocation-value:hover {
  color: #c49725;
}

.allocation-value.has-value {
  color: #c49725;
  font-weight: 700;
}

/* Container do Slider */
.slider-container {
  position: relative;
  margin-top: 32px;
}

/* Range Slider Styling */
.allocation-slider {
  width: 100%;
  --track-size: 8px;
  --thumb-size: 24px;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease-out;
}

range-slider.allocation-slider [data-track] {
  background: #e5e7eb;
  border-radius: 4px;
  height: var(--track-size);
}

range-slider.allocation-slider [data-track-fill] {
  background: linear-gradient(90deg, #c49725 0%, #a67b1f 100%);
  border-radius: 4px;
  transition: all 0.15s ease-out;
}

range-slider.allocation-slider [data-thumb] {
  width: var(--thumb-size);
  height: var(--thumb-size);
  border-radius: 50%;
  background: #c49725;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: grab;
  transition: all 0.2s ease;
}

range-slider.allocation-slider [data-thumb]:hover {
  background: #a67b1f;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(196, 151, 37, 0.3);
}

/* Tooltip Unificado */
.unified-tooltip {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f8f9fa;
  color: #1e293b;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  border: 1px solid #e2e8f0;
  pointer-events: none;
  transition: all 0.2s ease;
  min-width: 40px;
  text-align: center;
  line-height: 1.2;
  display: none;
}

/* Sidebar */
.portfolio-sidebar {
  width: 380px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  height: fit-content;
  border: 1px solid transparent;
}

/* Header da Sidebar */
.portfolio-header {
  background: linear-gradient(135deg, #c49725, #a67b1f);
  color: white;
  padding: 28px 24px;
  border-radius: 24px;
  position: relative;
  overflow: visible;
}

/* Seletor de Perfil */
.profile-selector-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-selector-label {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-selector-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.profile-selector {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.profile-selector:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.apply-profile-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  white-space: nowrap;
}

.apply-profile-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.apply-profile-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Valores Totais */
.total-label {
  font-size: 18px;
  font-weight: 400;
  opacity: 0.95;
  margin-bottom: 8px;
  text-align: left;
}

.total-value {
  font-size: 42px;
  font-weight: 300;
  letter-spacing: -1px;
  margin-bottom: 24px;
  text-align: left;
  line-height: 1.1;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* Seção de Valor Restante */
.remaining-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.remaining-label {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.95;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.remaining-value {
  font-size: 22px;
  font-weight: 600;
  opacity: 1;
  transition: all 0.3s ease;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: right;
}

/* Seção de Estratégia */
.strategy-section {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
  margin-top: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.strategy-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.strategy-text {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
  opacity: 0.95;
  min-height: 44px;
  transition: all 0.3s ease;
}

/* Botão Saiba Mais */
.learn-more-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  white-space: nowrap;
  margin-top: 12px;
  display: inline-block;
}

.learn-more-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

/* Seção de Ativos */
.assets-section {
  padding: 28px;
  max-height: 500px;
  overflow-y: auto;
}

.assets-section h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 24px;
}

.asset-category {
  margin-bottom: 28px;
}

.asset-category h4 {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
}

.asset-chips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.asset-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #475569;
  cursor: move;
  transition: all 0.3s ease;
}

.asset-chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Responsividade */
@media (max-width: 1200px) {
  .portfolio-main-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .portfolio-container {
    flex-direction: column;
    padding: 16px;
  }

  .portfolio-main-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    min-height: auto;
  }

  .portfolio-sidebar {
    width: 100%;
    order: -1;
  }

  .assets-section {
    max-height: 300px;
  }
}
```

## 🚀 Passos de Implementação no Webflow

### 1. Preparação do Projeto

1. **Criar nova página** ou seção para o portfolio slider
2. **Adicionar CDN dependencies** no head da página
3. **Criar estrutura HTML** conforme especificado acima

### 2. Configuração do CMS (Opcional)

Se quiser usar CMS Collection para os ativos:

```
Collection: Portfolio Assets
Fields:
- Name (Text)
- Category (Option: renda-fixa, fundos, outros)
- Asset Type (Text)
- Asset ID (Text)
- Icon (Text/Image)
```

### 3. Implementação do CSS

1. **Adicionar CSS customizado** no Custom CSS do projeto
2. **Configurar classes** nos elementos via Webflow Designer
3. **Testar responsividade** em diferentes breakpoints

### 4. Integração do JavaScript

1. **Compilar o TypeScript** usando `pnpm build`
2. **Adicionar o bundle** gerado no Webflow
3. **Testar funcionalidades** em ambiente de staging

### 5. Configuração Final

1. **Configurar valores** no `PORTFOLIO_CONFIG`
2. **Personalizar perfis** de investimento se necessário
3. **Testar integração** com módulos existentes (currency, ativos)

## 🧪 Testes e Validação

### Testes Funcionais

- [ ] Sliders respondem corretamente
- [ ] Tooltips aparecem/desaparecem conforme esperado
- [ ] Perfis de investimento aplicam corretamente
- [ ] Validação de orçamento funciona
- [ ] Drag-and-drop integra com módulo de ativos
- [ ] Formatação de moeda integra com módulo currency

### Testes de Performance

- [ ] Carregamento rápido da página
- [ ] Animações suaves
- [ ] Responsividade em dispositivos móveis
- [ ] Compatibilidade com navegadores

### Testes de Integração

- [ ] Módulos TypeScript carregam corretamente
- [ ] Event system funciona entre componentes
- [ ] Estado é mantido consistente
- [ ] Cleanup adequado de event listeners

## 📚 Documentação Adicional

### Arquivos de Referência

- `slider-experiencia/USER-GUIDE.md` - Guia do usuário
- `slider-experiencia/README-melhorias.md` - Melhorias implementadas
- `slider-experiencia/TOOLTIP-CONSOLIDATION-SUMMARY.md` - Sistema de tooltips

### Estrutura de Arquivos Final

```
src/
├── ativos/              # Módulo existente (drag-and-drop)
├── currency/            # Módulo existente (formatação)
├── portfolio/           # Novo módulo (slider portfolio)
│   ├── index.ts
│   ├── types.ts
│   ├── config.ts
│   ├── portfolio-manager.ts
│   ├── slider-component.ts
│   ├── profile-manager.ts
│   └── investment-strategies.ts
├── utils/               # Utilitários compartilhados
└── index.ts             # Ponto de entrada principal
```

## 🎯 Próximos Passos

1. **Implementar a refatoração** seguindo a estrutura TypeScript proposta
2. **Criar a estrutura HTML** no Webflow conforme especificado
3. **Adicionar o CSS customizado** para styling
4. **Testar a integração** com os módulos existentes
5. **Validar funcionalidades** em ambiente de produção
6. **Documentar customizações** específicas do projeto

---

**Este guia fornece uma base sólida para implementar o sistema de portfolio slider no Webflow mantendo a arquitetura modular TypeScript do projeto.**
