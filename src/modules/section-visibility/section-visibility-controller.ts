/**
 * Section Visibility Controller
 * Handles conditional visibility for components based on section visibility
 * Extracted and modularized from fresh-reino project
 */

import type { SectionVisibilityConfig, SectionVisibilityState } from './types';

export class SectionVisibilityController {
  private static instance: SectionVisibilityController | null = null;

  private readonly config: SectionVisibilityConfig = {
    sectionSelector: '._3-section-patrimonio-alocation',
    floatComponentSelector: '.componente-alocao-float',
    threshold: 0.5,
    rootMargin: '0px 0px -200px 0px',
    animationDuration: 0.6,
    showEasing: 'backOut',
    hideEasing: 'circInOut',
  };

  private state: SectionVisibilityState = {
    isInitialized: false,
    section: null,
    floatComponent: null,
    observer: null,
    isVisible: false,
    animationInProgress: false,
    retryCount: 0,
    maxRetries: 20,
  };

  /**
   * Get singleton instance
   */
  public static getInstance(): SectionVisibilityController {
    if (!SectionVisibilityController.instance) {
      SectionVisibilityController.instance = new SectionVisibilityController();
    }
    return SectionVisibilityController.instance;
  }

  /**
   * Initialize the section visibility system
   */
  public init(): void {
    if (this.state.isInitialized) {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeWithDelay());
    } else {
      this.initializeWithDelay();
    }
  }

  /**
   * Initialize with a delay to ensure Webflow has finished loading
   */
  private initializeWithDelay(): void {
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }

  /**
   * Main initialization function
   */
  private initialize(): void {
    // Check for Motion.js dependency
    if (!window.Motion) {
      console.error('Framer Motion is required for section visibility');
      return;
    }

    // Find required elements
    if (!this.findElements()) {
      this.state.retryCount += 1;

      if (this.state.retryCount >= this.state.maxRetries) {
        console.error('Maximum retries reached. Elements not found:', {
          sectionSelector: this.config.sectionSelector,
          floatComponentSelector: this.config.floatComponentSelector,
          retriesAttempted: this.state.retryCount,
        });
        return;
      }

      setTimeout(() => this.initialize(), 500);
      return;
    }

    // Setup intersection observer
    this.setupIntersectionObserver();

    // Initial state setup
    this.setupInitialState();

    // Mark as initialized
    this.state.isInitialized = true;

    // Dispatch ready event
    document.dispatchEvent(
      new CustomEvent('sectionVisibilityReady', {
        detail: {
          section: this.state.section,
          floatComponent: this.state.floatComponent,
        },
      })
    );
  }

  /**
   * Find and cache required DOM elements
   */
  private findElements(): boolean {
    this.state.section = document.querySelector(this.config.sectionSelector);
    this.state.floatComponent = document.querySelector(this.config.floatComponentSelector);

    if (!this.state.section) {
      return false;
    }

    if (!this.state.floatComponent) {
      return false;
    }

    return true;
  }

  /**
   * Setup intersection observer for section visibility detection
   */
  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold,
    };

    this.state.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === this.state.section) {
          this.handleSectionVisibilityChange(entry.isIntersecting);
        }
      });
    }, options);

    if (this.state.section) {
      this.state.observer.observe(this.state.section);
    }
  }

  /**
   * Setup initial state for the float component
   */
  private setupInitialState(): void {
    if (!window.Motion || !this.state.floatComponent) return;

    const { animate } = window.Motion;

    // Set initial hidden state
    animate(
      this.state.floatComponent,
      {
        opacity: 0,
        scale: 0.8,
        y: 40,
        filter: 'blur(8px)',
        x: '-50%',
      },
      { duration: 0 }
    );

    // Ensure component is initially hidden from screen readers
    this.state.floatComponent.setAttribute('aria-hidden', 'true');
    this.state.floatComponent.style.pointerEvents = 'none';
  }

  /**
   * Handle section visibility changes
   */
  private handleSectionVisibilityChange(isIntersecting: boolean): void {
    if (this.state.isVisible === isIntersecting || this.state.animationInProgress) {
      return;
    }

    this.state.isVisible = isIntersecting;

    if (isIntersecting) {
      this.showFloatComponent();
    } else {
      this.hideFloatComponent();
    }

    // Dispatch visibility change event
    document.dispatchEvent(
      new CustomEvent('sectionVisibilityChanged', {
        detail: {
          isVisible: isIntersecting,
          section: this.config.sectionSelector,
          component: this.config.floatComponentSelector,
        },
      })
    );
  }

  /**
   * Show the float component with animation
   */
  private async showFloatComponent(): Promise<void> {
    if (this.state.animationInProgress || !window.Motion || !this.state.floatComponent) {
      return;
    }

    this.state.animationInProgress = true;
    const { animate } = window.Motion;

    // Enable interactions
    this.state.floatComponent.style.pointerEvents = 'auto';
    this.state.floatComponent.setAttribute('aria-hidden', 'false');

    try {
      // Quick micro-scale preparation
      await animate(
        this.state.floatComponent,
        {
          scale: 0.95,
          x: '-50%',
        },
        {
          duration: 0.1,
          ease: 'circOut',
        }
      );

      // Main entrance animation
      await animate(
        this.state.floatComponent,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          x: '-50%',
        },
        {
          duration: this.config.animationDuration,
          ease: this.config.showEasing,
        }
      );

      // Subtle overshoot
      await animate(
        this.state.floatComponent,
        {
          scale: 1.02,
          filter: 'brightness(1.05)',
          x: '-50%',
        },
        {
          duration: 0.15,
          ease: 'circOut',
        }
      );

      // Final settle
      await animate(
        this.state.floatComponent,
        {
          scale: 1,
          filter: 'brightness(1)',
          x: '-50%',
        },
        {
          duration: 0.2,
          ease: 'circInOut',
        }
      );

      this.state.animationInProgress = false;

      // Dispatch show complete event
      document.dispatchEvent(
        new CustomEvent('floatComponentShown', {
          detail: { component: this.state.floatComponent },
        })
      );
    } catch (error) {
      console.error('Error showing float component:', error);
      this.state.animationInProgress = false;
    }
  }

  /**
   * Hide the float component with animation
   */
  private async hideFloatComponent(): Promise<void> {
    if (this.state.animationInProgress || !window.Motion || !this.state.floatComponent) {
      return;
    }

    this.state.animationInProgress = true;
    const { animate } = window.Motion;

    try {
      // Quick scale down
      await animate(
        this.state.floatComponent,
        {
          scale: 0.98,
          filter: 'brightness(0.95)',
          x: '-50%',
        },
        {
          duration: 0.1,
          ease: 'circIn',
        }
      );

      // Main exit animation
      await animate(
        this.state.floatComponent,
        {
          opacity: 0,
          scale: 0.85,
          y: 30,
          filter: 'blur(4px)',
          x: '-50%',
        },
        {
          duration: this.config.animationDuration * 0.8,
          ease: this.config.hideEasing,
        }
      );

      // Disable interactions after animation
      this.state.floatComponent.style.pointerEvents = 'none';
      this.state.floatComponent.setAttribute('aria-hidden', 'true');

      this.state.animationInProgress = false;

      // Dispatch hide complete event
      document.dispatchEvent(
        new CustomEvent('floatComponentHidden', {
          detail: { component: this.state.floatComponent },
        })
      );
    } catch (error) {
      console.error('Error hiding float component:', error);
      this.state.animationInProgress = false;
    }
  }

  /**
   * Cleanup function
   */
  public cleanup(): void {
    if (this.state.observer) {
      this.state.observer.disconnect();
      this.state.observer = null;
    }

    this.state.isInitialized = false;
    this.state.section = null;
    this.state.floatComponent = null;
    this.state.isVisible = false;
    this.state.animationInProgress = false;
  }

  // Public API methods
  public getInitializationStatus(): boolean {
    return this.state.isInitialized;
  }

  public getVisibilityStatus(): boolean {
    return this.state.isVisible;
  }

  public getAnimationStatus(): boolean {
    return this.state.animationInProgress;
  }

  public show(): void {
    if (this.state.isInitialized && !this.state.isVisible) {
      this.handleSectionVisibilityChange(true);
    }
  }

  public hide(): void {
    if (this.state.isInitialized && this.state.isVisible) {
      this.handleSectionVisibilityChange(false);
    }
  }

  public updateConfig(newConfig: Partial<SectionVisibilityConfig>): void {
    Object.assign(this.config, newConfig);
    if (this.state.isInitialized) {
      console.error('Configuration updated. Consider reinitializing for full effect.');
    }
  }

  public getConfig(): SectionVisibilityConfig {
    return { ...this.config };
  }
}

// Global instance and auto-initialization
const sectionVisibility = SectionVisibilityController.getInstance();
sectionVisibility.init();

// Make available globally for backward compatibility
declare global {
  interface Window {
    SectionVisibility: typeof sectionVisibility;
  }
}

window.SectionVisibility = sectionVisibility;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  sectionVisibility.cleanup();
});

export default sectionVisibility;
