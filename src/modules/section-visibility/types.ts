/**
 * Section Visibility Types
 */

export interface SectionVisibilityConfig {
  sectionSelector: string;
  floatComponentSelector: string;
  threshold: number;
  rootMargin: string;
  animationDuration: number;
  showEasing: string;
  hideEasing: string;
}

export interface SectionVisibilityState {
  isInitialized: boolean;
  section: HTMLElement | null;
  floatComponent: HTMLElement | null;
  observer: IntersectionObserver | null;
  isVisible: boolean;
  animationInProgress: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface MotionAPI {
  animate: (
    element: HTMLElement,
    properties: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<void>;
}
