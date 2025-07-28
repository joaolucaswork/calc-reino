/**
 * Motion Animations Module
 * Extraído do sistema ProductItem do fresh-reino
 * Gerencia animações e interações dos itens de patrimônio
 */

// Types
interface MotionConfig {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  delay: {
    deactivate: number;
    display: number;
  };
  animation: {
    blur: number;
    move: number;
    rotate: number;
  };
  ease: string;
}

interface ProductItemState {
  active: boolean;
  interacting: boolean;
  sliderDragging: boolean;
  animating: boolean;
  pinned: boolean;
}

// Global state para rastrear interações
let globalInteracting = false;
let activeSlider: ProductItem | null = null;

// Configuração padrão das animações
const defaultConfig: MotionConfig = {
  duration: {
    fast: 0.3,
    normal: 0.5,
    slow: 0.6,
  },
  delay: {
    deactivate: 1,
    display: 0.45,
  },
  animation: {
    blur: 8,
    move: 15,
    rotate: 10,
  },
  ease: 'circOut',
};

/**
 * Classe principal para gerenciar itens interativos de patrimônio
 */
export class ProductItem {
  private element: HTMLElement;
  private index: number;
  private activeDiv: HTMLElement | null;
  private disabledDiv: HTMLElement | null;
  private input: HTMLInputElement | null;
  private slider: HTMLElement | null;
  private sliderThumb: HTMLElement | null;
  private pinButton: HTMLButtonElement | null;
  private state: ProductItemState;
  private deactivateTimer: number | null;
  private config: MotionConfig;

  constructor(element: HTMLElement, index: number, config?: Partial<MotionConfig>) {
    this.element = element;
    this.index = index;
    this.config = { ...defaultConfig, ...config };

    // Query elementos
    this.activeDiv = element.querySelector('.active-produto-item');
    this.disabledDiv = element.querySelector('.disabled-produto-item');
    this.input = element.querySelector('.currency-input.individual');
    this.slider = element.querySelector('range-slider');
    this.sliderThumb = element.querySelector('[data-thumb]');
    this.pinButton = element.querySelector('.pin-function');

    // Estado inicial
    this.state = {
      active: false,
      interacting: false,
      sliderDragging: false,
      animating: false,
      pinned: false,
    };

    this.deactivateTimer = null;
    this.init();
  }

  private init(): void {
    if (!this.activeDiv || !this.disabledDiv) return;

    // Estado inicial
    this.activeDiv.style.display = 'none';
    this.disabledDiv.style.display = 'flex';

    // Oculta o pin inicialmente
    if (this.pinButton) {
      this.pinButton.style.display = 'none';
    }

    // Setup de eventos
    this.setupEvents();

    // Animação de entrada
    this.animateEntrance();
  }

  private animateEntrance(): void {
    if (!window.Motion) return;

    const { animate } = window.Motion;
    animate(
      this.element,
      {
        opacity: [0, 1],
        y: [30, 0],
      },
      {
        duration: this.config.duration.normal,
        ease: this.config.ease,
        delay: this.index * 0.1,
      }
    );
  }

  private setupEvents(): void {
    this.setupPinEvents();
    this.setupContainerEvents();
    this.setupInputEvents();
    this.setupSliderEvents();
    this.setupHoverEffect();
  }

  private setupPinEvents(): void {
    if (!this.pinButton) return;

    this.pinButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePin();
    });

    this.pinButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }

  private setupContainerEvents(): void {
    const startInteraction = (e: Event) => {
      // Não inicia se já estiver em outro slider
      if (activeSlider && activeSlider !== this) return;
      this.state.interacting = true;
      this.activate();
    };

    const endInteraction = () => {
      // Só termina se não estiver arrastando slider e não estiver pinado
      if (!this.state.sliderDragging && !this.state.pinned) {
        this.state.interacting = false;
        this.scheduleDeactivate();
      }
    };

    // Mouse events no container
    this.element.addEventListener('mouseenter', startInteraction);
    this.element.addEventListener('mouseleave', () => {
      if (!this.state.sliderDragging && !globalInteracting && !this.state.pinned) {
        endInteraction();
      }
    });

    // Touch events no container
    this.element.addEventListener('touchstart', startInteraction, {
      passive: true,
    });
  }

  private setupInputEvents(): void {
    if (!this.input) return;

    this.input.addEventListener('focus', () => {
      this.state.interacting = true;
      this.activate();
    });

    this.input.addEventListener('blur', () => {
      if (!this.state.pinned) {
        this.state.interacting = false;
        this.scheduleDeactivate();
      }
    });

    this.input.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.state.interacting = true;
    });
  }

  private setupSliderEvents(): void {
    if (!this.slider) return;

    const startSliderDrag = (e: Event) => {
      this.state.sliderDragging = true;
      this.state.interacting = true;
      globalInteracting = true;
      activeSlider = this;
      this.activate();
      this.slider?.classList.add('dragging');
    };

    const endSliderDrag = () => {
      if (this.state.sliderDragging) {
        this.state.sliderDragging = false;
        globalInteracting = false;
        activeSlider = null;
        this.slider?.classList.remove('dragging');

        // Verifica se o mouse ainda está sobre o elemento
        const mouseOverElement = this.element.matches(':hover');
        if (!mouseOverElement && !this.state.pinned) {
          this.state.interacting = false;
          this.scheduleDeactivate();
        }
      }
    };

    // Mouse events no slider
    this.slider.addEventListener('mousedown', startSliderDrag);
    if (this.sliderThumb) {
      this.sliderThumb.addEventListener('mousedown', startSliderDrag);
    }

    // Touch events
    this.slider.addEventListener('touchstart', startSliderDrag, {
      passive: true,
    });
    if (this.sliderThumb) {
      this.sliderThumb.addEventListener('touchstart', startSliderDrag, {
        passive: true,
      });
    }

    // Eventos globais para fim do arraste
    document.addEventListener('mouseup', endSliderDrag);
    document.addEventListener('touchend', endSliderDrag);

    // Previne propagação de cliques no slider
    this.slider.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Mantém ativo durante mudanças
    this.slider.addEventListener('input', () => {
      this.state.interacting = true;
      this.activate();
    });
  }

  private setupHoverEffect(): void {
    if (!window.Motion) return;

    const { hover } = window.Motion;
    hover(this.element, {
      scale: 1.02,
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    });
  }

  private togglePin(): void {
    if (!window.Motion || !this.pinButton) return;

    const { animate } = window.Motion;
    this.state.pinned = !this.state.pinned;

    if (this.state.pinned) {
      // Ativa o pin
      this.pinButton.classList.add('active');
      if (this.deactivateTimer) {
        clearTimeout(this.deactivateTimer);
      }
    } else {
      // Desativa o pin
      this.pinButton.classList.remove('active');
      // Se não estiver interagindo, agenda desativação
      if (!this.state.interacting && !this.state.sliderDragging) {
        this.scheduleDeactivate();
      }
    }

    // Animação visual do pin
    animate(
      this.pinButton,
      {
        scale: [1.2, 1],
        rotate: this.state.pinned ? 45 : 0,
      },
      {
        duration: 0.3,
        ease: 'backOut',
      }
    );
  }

  private async activate(): Promise<void> {
    if (this.state.active || this.state.animating) return;
    if (!window.Motion || !this.activeDiv || !this.disabledDiv) return;

    const { animate } = window.Motion;

    if (this.deactivateTimer) {
      clearTimeout(this.deactivateTimer);
    }

    this.state.active = true;
    this.state.animating = true;

    try {
      // Oculta disabled
      await animate(
        this.disabledDiv,
        {
          opacity: 0,
          y: -this.config.animation.move,
          filter: `blur(${this.config.animation.blur}px)`,
        },
        {
          duration: this.config.duration.fast,
          ease: 'circIn',
        }
      ).finished;

      this.disabledDiv.style.display = 'none';
      this.activeDiv.style.display = 'block';

      // Mostra o pin button
      if (this.pinButton) {
        this.pinButton.style.display = 'block';
        animate(
          this.pinButton,
          {
            opacity: [0, 1],
            scale: [0.8, 1],
          },
          {
            duration: 0.3,
            ease: 'backOut',
            delay: 0.1,
          }
        );
      }

      // Mostra active
      await animate(
        this.activeDiv,
        {
          opacity: [0, 1],
          y: [this.config.animation.move, 0],
          filter: ['blur(5px)', 'blur(0px)'],
        },
        {
          duration: this.config.duration.normal,
          ease: 'backOut',
        }
      ).finished;
    } finally {
      this.state.animating = false;
    }
  }

  private scheduleDeactivate(): void {
    if (this.deactivateTimer) {
      clearTimeout(this.deactivateTimer);
    }

    // Não agenda se ainda estiver interagindo, arrastando ou pinado
    if (
      this.state.interacting ||
      this.state.sliderDragging ||
      globalInteracting ||
      this.state.pinned
    ) {
      return;
    }

    this.deactivateTimer = window.setTimeout(() => {
      if (
        !this.state.interacting &&
        !this.state.sliderDragging &&
        !globalInteracting &&
        !this.state.pinned
      ) {
        this.deactivate();
      }
    }, this.config.delay.deactivate * 1000);
  }

  private async deactivate(): Promise<void> {
    if (
      !this.state.active ||
      this.state.animating ||
      this.state.sliderDragging ||
      this.state.pinned
    )
      return;

    if (!window.Motion || !this.activeDiv || !this.disabledDiv) return;

    const { animate } = window.Motion;
    this.state.active = false;
    this.state.animating = true;

    try {
      // Oculta o pin button
      if (this.pinButton) {
        await animate(
          this.pinButton,
          {
            opacity: 0,
            scale: 0.8,
          },
          {
            duration: 0.2,
            ease: 'circIn',
          }
        ).finished;
        this.pinButton.style.display = 'none';
      }

      // Oculta active
      await animate(
        this.activeDiv,
        {
          opacity: 0,
          y: this.config.animation.move / 2,
          filter: 'blur(5px)',
        },
        {
          duration: this.config.duration.fast,
          ease: this.config.ease,
        }
      ).finished;

      this.activeDiv.style.display = 'none';
      this.disabledDiv.style.display = 'flex';

      // Mostra disabled
      await animate(
        this.disabledDiv,
        {
          opacity: [0, 1],
          y: [0, 0],
          filter: ['blur(5px)', 'blur(0px)'],
        },
        {
          duration: this.config.duration.normal,
          ease: this.config.ease,
        }
      ).finished;
    } finally {
      this.state.animating = false;
    }
  }

  // Métodos públicos
  public getState(): ProductItemState {
    return { ...this.state };
  }

  public isPinned(): boolean {
    return this.state.pinned;
  }

  public forceDeactivate(): void {
    if (this.state.pinned) {
      this.togglePin();
    }
    this.state.interacting = false;
    this.deactivate();
  }
}

/**
 * Manager para inicializar todos os ProductItems
 */
export class ProductItemManager {
  private items: ProductItem[] = [];
  private config: MotionConfig;

  constructor(config?: Partial<MotionConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  public async initialize(): Promise<void> {
    // Aguarda o Motion carregar
    await this.waitForMotion();

    // Encontra todos os itens
    const elements = document.querySelectorAll('.patrimonio_interactive_item');

    // Inicializa cada item
    elements.forEach((element, index) => {
      if (element instanceof HTMLElement) {
        const item = new ProductItem(element, index, this.config);
        this.items.push(item);
      }
    });

    // Adiciona estilos CSS
    this.addDragStyles();
  }

  private waitForMotion(): Promise<void> {
    return new Promise((resolve) => {
      if (window.Motion) {
        resolve();
        return;
      }

      const checkMotion = setInterval(() => {
        if (window.Motion) {
          clearInterval(checkMotion);
          resolve();
        }
      }, 50);
    });
  }

  private addDragStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      range-slider.dragging {
        cursor: grabbing !important;
      }
      range-slider.dragging [data-thumb] {
        cursor: grabbing !important;
        transform: scale(1.1);
        transition: transform 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }

  public getItems(): ProductItem[] {
    return [...this.items];
  }

  public getPinnedItems(): ProductItem[] {
    return this.items.filter((item) => item.isPinned());
  }

  public unpinAll(): void {
    this.items.forEach((item) => {
      if (item.isPinned()) {
        item.forceDeactivate();
      }
    });
  }
}

// Export tipos
export type { MotionConfig, ProductItemState };

// Auto-inicialização se estiver em ambiente browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const manager = new ProductItemManager();
    manager.initialize();

    // Expõe no window para debugging
    (window as any).ProductItemManager = manager;
  });
}
