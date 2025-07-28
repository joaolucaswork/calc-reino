/**
 * Button Animation System Module
 * Extraído do fresh-reino - Sistema de animações para botões de currency
 * Gerencia efeitos de hover, press, ripple e seta interativa
 */

// Types
interface ButtonAnimationConfig {
  mainInputSelector: string;
  interactiveArrowSelector: string;
  increaseButtonSelector: string;
  decreaseButtonSelector: string;
  containerSelector: string;
  hideTimeout: number;
}

interface MotionEffects {
  animate: any;
  hover: any;
  press: any;
}

/**
 * Classe para gerenciar animações de botões de currency
 */
export class ButtonAnimationSystem {
  private config: ButtonAnimationConfig;
  private input: HTMLInputElement | null = null;
  private interactiveArrow: HTMLElement | null = null;
  private increaseBtn: HTMLElement | null = null;
  private decreaseBtn: HTMLElement | null = null;
  private motionEffects: MotionEffects | null = null;
  private hideTimeout: number | null = null;
  private isArrowVisible = true;
  private isButtonInteraction = false;

  constructor(config?: Partial<ButtonAnimationConfig>) {
    this.config = {
      mainInputSelector: 'input[is-main="true"]',
      interactiveArrowSelector: '#interative-arrow',
      increaseButtonSelector: '[currency-control="increase"]',
      decreaseButtonSelector: '[currency-control="decrease"]',
      containerSelector: '.money_content_right-wrapper',
      hideTimeout: 5000,
      ...config,
    };
  }

  /**
   * Inicializa o sistema de animações
   */
  public async init(): Promise<void> {
    await this.waitForMotion();
    this.findElements();
    this.setupAnimations();
  }

  private waitForMotion(): Promise<void> {
    return new Promise((resolve) => {
      if (window.Motion) {
        this.motionEffects = window.Motion;
        resolve();
        return;
      }

      const checkMotion = () => {
        if (window.Motion) {
          this.motionEffects = window.Motion;
          resolve();
        } else {
          setTimeout(checkMotion, 50);
        }
      };
      checkMotion();
    });
  }

  private findElements(): void {
    this.input = document.querySelector(this.config.mainInputSelector);
    this.interactiveArrow = document.querySelector(this.config.interactiveArrowSelector);

    if (!this.input || !this.interactiveArrow) {
      return;
    }

    // Busca o container pai
    const mainContainer = this.input.closest(this.config.containerSelector);
    if (!mainContainer) return;

    // Busca os botões dentro do container
    this.increaseBtn = mainContainer.querySelector(this.config.increaseButtonSelector);
    this.decreaseBtn = mainContainer.querySelector(this.config.decreaseButtonSelector);
  }

  private setupAnimations(): void {
    if (
      !this.motionEffects ||
      !this.input ||
      !this.interactiveArrow ||
      !this.increaseBtn ||
      !this.decreaseBtn
    ) {
      return;
    }

    this.setupArrowManagement();
    this.setupIncreaseButtonAnimations();
    this.setupDecreaseButtonAnimations();
    this.setupInputEventListeners();
    this.setupButtonStateManagement();
    this.resetHideTimer();
  }

  private setupArrowManagement(): void {
    // Métodos de controle da seta são definidos como parte da classe
  }

  private resetHideTimer(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (!this.isArrowVisible) {
      this.showArrow();
    }

    this.hideTimeout = window.setTimeout(() => {
      this.hideArrow();
    }, this.config.hideTimeout);
  }

  private hideArrow(): void {
    if (!this.motionEffects || !this.interactiveArrow) return;

    this.isArrowVisible = false;
    this.motionEffects.animate(
      this.interactiveArrow,
      {
        opacity: 0,
        scale: 0.8,
      },
      {
        duration: 0.4,
        ease: 'circInOut',
      }
    );
  }

  private showArrow(): void {
    if (!this.motionEffects || !this.interactiveArrow) return;

    this.isArrowVisible = true;
    this.motionEffects.animate(
      this.interactiveArrow,
      {
        opacity: 1,
        scale: 1,
      },
      {
        duration: 0.4,
        ease: 'backOut',
      }
    );
  }

  private rotateArrowDown(): void {
    if (!this.motionEffects || !this.interactiveArrow) return;

    this.motionEffects.animate(
      this.interactiveArrow,
      {
        rotate: 180,
        color: '#ef4444',
      },
      {
        duration: 0.3,
        ease: 'backOut',
      }
    );
  }

  private rotateArrowUp(): void {
    if (!this.motionEffects || !this.interactiveArrow) return;

    this.motionEffects.animate(
      this.interactiveArrow,
      {
        rotate: 0,
        color: '#22c55e',
      },
      {
        duration: 0.3,
        ease: 'backOut',
      }
    );
  }

  private setupIncreaseButtonAnimations(): void {
    if (!this.motionEffects || !this.increaseBtn) return;

    // Hover effect
    this.motionEffects.hover(this.increaseBtn, (element: HTMLElement) => {
      if (element.classList.contains('disabled')) return;

      this.isButtonInteraction = true;
      this.motionEffects.animate(
        element,
        {
          scale: 1.08,
          y: -3,
          filter: 'brightness(1.1)',
        },
        {
          duration: 0.25,
          ease: 'circOut',
        }
      );

      this.rotateArrowUp();
      this.resetHideTimer();

      const icon = element.querySelector('svg');
      if (icon) {
        this.motionEffects.animate(
          icon,
          {
            scale: 1.15,
          },
          {
            duration: 0.2,
            ease: 'backOut',
          }
        );
      }

      return () => {
        this.isButtonInteraction = false;
        this.motionEffects.animate(
          element,
          {
            scale: 1,
            y: 0,
            filter: 'brightness(1)',
          },
          {
            duration: 0.2,
            ease: 'circInOut',
          }
        );

        if (icon) {
          this.motionEffects.animate(
            icon,
            {
              scale: 1,
            },
            {
              duration: 0.15,
            }
          );
        }
      };
    });

    // Press effect
    this.motionEffects.press(this.increaseBtn, (element: HTMLElement) => {
      if (element.classList.contains('disabled')) return;

      this.isButtonInteraction = true;
      this.motionEffects.animate(
        element,
        {
          scale: 0.92,
          y: 2,
        },
        {
          duration: 0.08,
          ease: 'circIn',
        }
      );

      this.createRippleEffect(element, '#9ca3af');
      this.rotateArrowUp();
      this.resetHideTimer();

      return () => {
        this.motionEffects.animate(
          element,
          {
            scale: 1.08,
            y: -3,
          },
          {
            duration: 0.12,
            ease: 'backOut',
          }
        );

        setTimeout(() => (this.isButtonInteraction = false), 100);
      };
    });
  }

  private setupDecreaseButtonAnimations(): void {
    if (!this.motionEffects || !this.decreaseBtn) return;

    // Hover effect
    this.motionEffects.hover(this.decreaseBtn, (element: HTMLElement) => {
      if (element.classList.contains('disabled')) return;

      this.isButtonInteraction = true;
      this.motionEffects.animate(
        element,
        {
          scale: 1.08,
          y: -3,
          filter: 'brightness(1.1)',
        },
        {
          duration: 0.25,
          ease: 'circOut',
        }
      );

      this.rotateArrowDown();
      this.resetHideTimer();

      const icon = element.querySelector('svg');
      if (icon) {
        this.motionEffects.animate(
          icon,
          {
            scale: 1.15,
          },
          {
            duration: 0.2,
            ease: 'backOut',
          }
        );
      }

      return () => {
        this.isButtonInteraction = false;
        this.motionEffects.animate(
          element,
          {
            scale: 1,
            y: 0,
            filter: 'brightness(1)',
          },
          {
            duration: 0.2,
            ease: 'circInOut',
          }
        );

        if (icon) {
          this.motionEffects.animate(
            icon,
            {
              scale: 1,
            },
            {
              duration: 0.15,
            }
          );
        }
      };
    });

    // Press effect
    this.motionEffects.press(this.decreaseBtn, (element: HTMLElement) => {
      if (element.classList.contains('disabled')) return;

      this.isButtonInteraction = true;
      this.motionEffects.animate(
        element,
        {
          scale: 0.92,
          y: 2,
        },
        {
          duration: 0.08,
          ease: 'circIn',
        }
      );

      this.createRippleEffect(element, '#9ca3af');
      this.rotateArrowDown();
      this.resetHideTimer();

      return () => {
        this.motionEffects.animate(
          element,
          {
            scale: 1.08,
            y: -3,
          },
          {
            duration: 0.12,
            ease: 'backOut',
          }
        );

        setTimeout(() => (this.isButtonInteraction = false), 100);
      };
    });
  }

  private setupInputEventListeners(): void {
    if (!this.input) return;

    this.input.addEventListener('input', () => {
      if (!this.isButtonInteraction) {
        this.hideArrow();
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }
      }
    });

    this.input.addEventListener('focus', () => {
      if (!this.isButtonInteraction) {
        this.hideArrow();
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }
      }
    });
  }

  private setupButtonStateManagement(): void {
    if (!this.input || !this.decreaseBtn) return;

    const updateButtonStates = () => {
      const current = parseFloat(this.input!.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      if (current <= 0) {
        this.decreaseBtn!.classList.add('disabled');
      } else {
        this.decreaseBtn!.classList.remove('disabled');
      }
    };

    this.input.addEventListener('input', updateButtonStates);
    updateButtonStates();
  }

  private createRippleEffect(element: HTMLElement, color: string): void {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 10px;
      height: 10px;
      background: ${color};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1;
      opacity: 0.4;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    if (this.motionEffects) {
      this.motionEffects.animate(
        ripple,
        {
          scale: [0, 4],
          opacity: [0.4, 0],
        },
        {
          duration: 0.5,
          ease: 'circOut',
        }
      );
    }

    setTimeout(() => ripple.remove(), 500);
  }

  // Métodos públicos
  public showArrowTemporarily(duration = 3000): void {
    this.showArrow();
    this.resetHideTimer();
  }

  public hideArrowPermanently(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideArrow();
  }

  public destroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }
}

// Auto-inicialização se estiver em ambiente browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const buttonAnimationSystem = new ButtonAnimationSystem();
    await buttonAnimationSystem.init();

    // Expõe no window para debugging
    (window as any).ButtonAnimationSystem = buttonAnimationSystem;
  });
}

export default ButtonAnimationSystem;
