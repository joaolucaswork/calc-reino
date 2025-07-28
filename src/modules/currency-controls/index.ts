/**
 * Currency Control System Module
 * Extraído do fresh-reino - Sistema de controle +/- para valores de currency
 * Gerencia incremento/decremento inteligente baseado no valor atual
 */

// Types
interface CurrencyControlConfig {
  mainInputSelector: string;
  increaseSelector: string;
  decreaseSelector: string;
  minValue: number;
}

/**
 * Classe para gerenciar controles de currency (+/-)
 */
export class CurrencyControlSystem {
  private config: CurrencyControlConfig;
  private mainInput: HTMLInputElement | null = null;

  constructor(config?: Partial<CurrencyControlConfig>) {
    this.config = {
      mainInputSelector: '[is-main="true"]',
      increaseSelector: '[currency-control="increase"]',
      decreaseSelector: '[currency-control="decrease"]',
      minValue: 0,
      ...config,
    };
  }

  /**
   * Inicializa o sistema de controles
   */
  public init(): void {
    this.findElements();
    this.setupEventListeners();
  }

  private findElements(): void {
    this.mainInput = document.querySelector(this.config.mainInputSelector);

    if (!this.mainInput) {
      console.warn('Currency Control: Main input not found');
      return;
    }
  }

  private setupEventListeners(): void {
    if (!this.mainInput) return;

    // Setup decrease buttons
    const decreaseButtons = document.querySelectorAll(this.config.decreaseSelector);
    decreaseButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.decreaseValue();
      });
    });

    // Setup increase buttons
    const increaseButtons = document.querySelectorAll(this.config.increaseSelector);
    increaseButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.increaseValue();
      });
    });
  }

  /**
   * Calcula incremento inteligente baseado no valor atual
   */
  private getIncrement(value: number): number {
    if (value < 1000) return 100;
    if (value < 10000) return 1000;
    if (value < 100000) return 10000;
    if (value < 1000000) return 50000;
    return 100000;
  }

  /**
   * Atualiza o valor do input principal
   */
  private updateValue(newValue: number): void {
    if (!this.mainInput) return;

    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(newValue);

    this.mainInput.value = formattedValue;

    // Dispara evento de input para notificar outros sistemas
    this.mainInput.dispatchEvent(
      new Event('input', {
        bubbles: true,
      })
    );
  }

  /**
   * Obtém o valor atual do input como número
   */
  private getCurrentValue(): number {
    if (!this.mainInput) return 0;

    return parseFloat(this.mainInput.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }

  /**
   * Aumenta o valor
   */
  private increaseValue(): void {
    const current = this.getCurrentValue();
    const increment = this.getIncrement(current);
    this.updateValue(current + increment);
  }

  /**
   * Diminui o valor
   */
  private decreaseValue(): void {
    const current = this.getCurrentValue();
    const increment = this.getIncrement(current);
    const newValue = Math.max(this.config.minValue, current - increment);
    this.updateValue(newValue);
  }

  /**
   * Define valor específico
   */
  public setValue(value: number): void {
    this.updateValue(Math.max(this.config.minValue, value));
  }

  /**
   * Obtém valor atual
   */
  public getValue(): number {
    return this.getCurrentValue();
  }

  /**
   * Define incremento customizado para um valor específico
   */
  public setCustomIncrement(value: number, increment: number): void {
    // Override temporário do método getIncrement
    const originalGetIncrement = this.getIncrement;
    this.getIncrement = (val) => (val === value ? increment : originalGetIncrement.call(this, val));
  }
}

// Auto-inicialização se estiver em ambiente browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const currencyControlSystem = new CurrencyControlSystem();
    currencyControlSystem.init();

    // Expõe no window para debugging
    (window as any).CurrencyControlSystem = currencyControlSystem;
  });
}

export default CurrencyControlSystem;
