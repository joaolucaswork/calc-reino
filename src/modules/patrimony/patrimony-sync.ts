/**
 * Patrimony Synchronization System
 * Main class for handling wealth allocation and synchronization
 * Extracted and modularized from fresh-reino project
 */

import { AllocationSync } from './allocation-sync';
import { CacheManager } from './cache-manager';
import { MainInputSync } from './main-input-sync';
import type { AllocationItem, AllocationStatus, PatrimonyConfig } from './types';
import { Utils } from './utils';
import { VisualFeedback } from './visual-feedback';

export class PatrimonySync {
  private static instance: PatrimonySync | null = null;

  private mainValue = 0;
  private allocations = new Map<number, AllocationItem>();
  private isInitialized = false;

  private mainInputSync: MainInputSync;
  private allocationSync: AllocationSync;
  private visualFeedback: VisualFeedback;
  private cacheManager: CacheManager;
  private utils: Utils;

  private readonly config: PatrimonyConfig = {
    mainInputSelector: '[is-main="true"]',
    allocationItemSelector: '.patrimonio_interactive_item',
    cacheKey: 'patrimony_main_value',
    allocationsCacheKey: 'patrimony_allocations',
    updateDelay: 300,
    animationDuration: 500,
  };

  private constructor() {
    this.cacheManager = new CacheManager();
    this.utils = new Utils();
    this.mainInputSync = new MainInputSync(this.cacheManager, this.utils, this.config);
    this.allocationSync = new AllocationSync(this.cacheManager, this.utils, this.config);
    this.visualFeedback = new VisualFeedback();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): PatrimonySync {
    if (!PatrimonySync.instance) {
      PatrimonySync.instance = new PatrimonySync();
    }
    return PatrimonySync.instance;
  }

  /**
   * Initialize the patrimony system
   */
  public init(): void {
    if (this.isInitialized) {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }

  private initialize(): void {
    // Check for dependencies
    if (!window.currency) {
      console.error('Currency.js is required for PatrimonySync');
      return;
    }

    // Wait for Motion.js to be available
    this.waitForMotion().then(() => {
      this.initializeComponents();
    });
  }

  private async waitForMotion(): Promise<void> {
    return new Promise((resolve) => {
      const checkMotion = () => {
        if (window.Motion) {
          resolve();
        } else {
          setTimeout(checkMotion, 50);
        }
      };
      checkMotion();
    });
  }

  private initializeComponents(): void {
    // Initialize components
    this.visualFeedback.init();
    this.mainInputSync.init();

    // Wait for dynamic content to load
    setTimeout(() => {
      this.allocationSync.init();
      this.isInitialized = true;

      // Setup event listeners between components
      this.setupEventListeners();

      // Initial status check
      this.checkTotalAllocationStatus();

      // Dispatch ready event
      document.dispatchEvent(
        new CustomEvent('patrimonySyncReady', {
          detail: {
            mainValue: this.getMainValue(),
            totalAllocated: this.getTotalAllocated(),
            remaining: this.getRemainingValue(),
          },
        })
      );
    }, 100);
  }

  private setupEventListeners(): void {
    // Listen for main value changes
    document.addEventListener('patrimonyMainValueChanged', () => {
      this.allocationSync.updateAllAllocations();
      this.allocationSync.validateAllAllocations();
    });

    // Listen for allocation changes
    document.addEventListener('allocationChanged', () => {
      this.checkTotalAllocationStatus();
    });
  }

  /**
   * Check and dispatch total allocation status
   */
  public checkTotalAllocationStatus(): void {
    const mainValue = this.getMainValue();
    const total = this.getTotalAllocated();
    const remaining = mainValue - total;

    const status: AllocationStatus = {
      mainValue,
      totalAllocated: total,
      remaining,
      isFullyAllocated: remaining === 0,
      isOverAllocated: remaining < 0,
      percentageAllocated: mainValue > 0 ? (total / mainValue) * 100 : 0,
    };

    document.dispatchEvent(
      new CustomEvent('allocationStatusChanged', {
        detail: status,
      })
    );
  }

  // Public API methods
  public getMainValue(): number {
    return this.mainInputSync.getValue();
  }

  public setMainValue(value: number): void {
    this.mainInputSync.setValue(value);
  }

  public getTotalAllocated(): number {
    return this.allocationSync.getTotalAllocated();
  }

  public getRemainingValue(): number {
    return this.allocationSync.getRemainingValue();
  }

  public getAllocations(): AllocationItem[] {
    return this.allocationSync.getAllocations();
  }

  public clearCache(): void {
    this.cacheManager.remove(this.config.cacheKey);
    this.cacheManager.remove(this.config.allocationsCacheKey);
  }

  public reset(): void {
    this.clearCache();
    this.setMainValue(0);
    this.allocationSync.resetAllAllocations();
    this.checkTotalAllocationStatus();
  }

  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

// Global instance and auto-initialization
const patrimonySync = PatrimonySync.getInstance();
patrimonySync.init();

// Make available globally for backward compatibility
declare global {
  interface Window {
    PatrimonySync: typeof patrimonySync;
    Motion?: {
      animate: Function;
      hover: Function;
      press: Function;
    };
  }
}

window.PatrimonySync = patrimonySync;

export default patrimonySync;
