/**
 * Section Visibility Controller
 * Handles conditional visibility for componente-alocao-float based on section 3 visibility
 * Uses Framer Motion for smooth animations
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    sectionSelector: "._3-section-patrimonio-alocation",
    floatComponentSelector: ".componente-alocao-float",
    threshold: 0.5, // Trigger when 50% of section is visible (meio da tela)
    rootMargin: "0px 0px -200px 0px", // Aguarda mais antes de triggerar
    animationDuration: 0.6,
    showEasing: "backOut", // Premium spring-like entrance
    hideEasing: "circInOut", // Smooth exit
  };

  // State management
  const SectionVisibility = {
    isInitialized: false,
    section: null,
    floatComponent: null,
    observer: null,
    isVisible: false,
    animationInProgress: false,
    retryCount: 0,
    maxRetries: 20, // Maximum 10 seconds of retrying (20 * 500ms)
  };

  /**
   * Initialize the section visibility system
   */
  function init() {
    if (SectionVisibility.isInitialized) {
      console.warn("Section visibility already initialized");
      return;
    }

    // Wait for DOM and Motion.js to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeWithDelay);
    } else {
      initializeWithDelay();
    }
  }

  /**
   * Initialize with a delay to ensure Webflow has finished loading
   */
  function initializeWithDelay() {
    // Wait for Webflow to potentially finish loading
    setTimeout(() => {
      initialize();
    }, 1000); // Wait 1 second for Webflow to load
  }

  /**
   * Main initialization function
   */
  function initialize() {
    // Check for Motion.js dependency
    if (!window.Motion) {
      console.error("Framer Motion is required for section visibility");
      return;
    }

    // Find required elements
    if (!findElements()) {
      SectionVisibility.retryCount++;

      if (SectionVisibility.retryCount >= SectionVisibility.maxRetries) {
        console.error("Maximum retries reached. Elements not found:", {
          sectionSelector: CONFIG.sectionSelector,
          floatComponentSelector: CONFIG.floatComponentSelector,
          retriesAttempted: SectionVisibility.retryCount,
        });
        return;
      }

      console.warn(
        `Required elements not found, retrying in 500ms (${SectionVisibility.retryCount}/${SectionVisibility.maxRetries})`
      );
      setTimeout(initialize, 500);
      return;
    }

    // Setup intersection observer
    setupIntersectionObserver();

    // Initial state setup
    setupInitialState();

    // Mark as initialized
    SectionVisibility.isInitialized = true;

    console.log("Section visibility system initialized");

    // Dispatch ready event
    document.dispatchEvent(
      new CustomEvent("sectionVisibilityReady", {
        detail: {
          section: SectionVisibility.section,
          floatComponent: SectionVisibility.floatComponent,
        },
      })
    );
  }

  /**
   * Find and cache required DOM elements
   */
  function findElements() {
    // Debug: Log all available elements to help troubleshoot
    console.log("Searching for elements...");
    console.log(
      "Available sections:",
      Array.from(document.querySelectorAll("section")).map((s) => s.className)
    );
    console.log(
      'Available divs with "alocao":',
      Array.from(document.querySelectorAll('div[class*="alocao"]')).map(
        (d) => d.className
      )
    );

    SectionVisibility.section = document.querySelector(CONFIG.sectionSelector);
    SectionVisibility.floatComponent = document.querySelector(
      CONFIG.floatComponentSelector
    );

    if (!SectionVisibility.section) {
      console.warn(`Section with class "${CONFIG.sectionSelector}" not found`);
      return false;
    }

    if (!SectionVisibility.floatComponent) {
      console.warn(
        `Float component with class "${CONFIG.floatComponentSelector}" not found`
      );
      return false;
    }

    console.log("Elements found successfully:", {
      section: SectionVisibility.section,
      floatComponent: SectionVisibility.floatComponent,
    });

    return true;
  }

  /**
   * Setup intersection observer for section visibility detection
   */
  function setupIntersectionObserver() {
    const options = {
      root: null, // Use viewport as root
      rootMargin: CONFIG.rootMargin,
      threshold: CONFIG.threshold,
    };

    SectionVisibility.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === SectionVisibility.section) {
          handleSectionVisibilityChange(entry.isIntersecting);
        }
      });
    }, options);

    // Start observing the section
    SectionVisibility.observer.observe(SectionVisibility.section);
  }

  /**
   * Setup initial state for the float component
   */
  function setupInitialState() {
    const { animate } = window.Motion;

    // Set initial hidden state without animation
    // Start from bottom with more dramatic initial state
    // IMPORTANT: Preserve the CSS centering transform: translate(-50%)
    animate(
      SectionVisibility.floatComponent,
      {
        opacity: 0,
        scale: 0.8,
        y: 40,
        filter: "blur(8px)",
        x: "-50%", // Preserve horizontal centering
      },
      { duration: 0 }
    );

    // Ensure component is initially hidden from screen readers
    SectionVisibility.floatComponent.setAttribute("aria-hidden", "true");
    SectionVisibility.floatComponent.style.pointerEvents = "none";
  }

  /**
   * Handle section visibility changes
   */
  function handleSectionVisibilityChange(isIntersecting) {
    // Prevent duplicate animations
    if (
      SectionVisibility.isVisible === isIntersecting ||
      SectionVisibility.animationInProgress
    ) {
      return;
    }

    SectionVisibility.isVisible = isIntersecting;

    if (isIntersecting) {
      showFloatComponent();
    } else {
      hideFloatComponent();
    }

    // Dispatch visibility change event
    document.dispatchEvent(
      new CustomEvent("sectionVisibilityChanged", {
        detail: {
          isVisible: isIntersecting,
          section: CONFIG.sectionSelector,
          component: CONFIG.floatComponentSelector,
        },
      })
    );
  }

  /**
   * Show the float component with animation
   */
  function showFloatComponent() {
    if (SectionVisibility.animationInProgress) return;

    SectionVisibility.animationInProgress = true;
    const { animate } = window.Motion;

    // Enable interactions
    SectionVisibility.floatComponent.style.pointerEvents = "auto";
    SectionVisibility.floatComponent.setAttribute("aria-hidden", "false");

    // Premium entrance animation sequence
    // First: Quick micro-scale preparation
    animate(
      SectionVisibility.floatComponent,
      {
        scale: 0.95,
        x: "-50%", // Maintain centering
      },
      {
        duration: 0.1,
        ease: "circOut",
      }
    )
      .then(() => {
        // Main entrance: Spring-like backOut with multiple properties
        return animate(
          SectionVisibility.floatComponent,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            x: "-50%", // Maintain centering
          },
          {
            duration: CONFIG.animationDuration,
            ease: CONFIG.showEasing,
          }
        );
      })
      .then(() => {
        // Subtle overshoot and settle for premium feel
        return animate(
          SectionVisibility.floatComponent,
          {
            scale: 1.02,
            filter: "brightness(1.05)",
            x: "-50%", // Maintain centering
          },
          {
            duration: 0.15,
            ease: "circOut",
          }
        );
      })
      .then(() => {
        // Final settle
        return animate(
          SectionVisibility.floatComponent,
          {
            scale: 1,
            filter: "brightness(1)",
            x: "-50%", // Maintain centering
          },
          {
            duration: 0.2,
            ease: "circInOut",
          }
        );
      })
      .then(() => {
        SectionVisibility.animationInProgress = false;

        // Dispatch show complete event
        document.dispatchEvent(
          new CustomEvent("floatComponentShown", {
            detail: { component: SectionVisibility.floatComponent },
          })
        );
      });

    console.log("Float component shown with premium animation");
  }

  /**
   * Hide the float component with animation
   */
  function hideFloatComponent() {
    if (SectionVisibility.animationInProgress) return;

    SectionVisibility.animationInProgress = true;
    const { animate } = window.Motion;

    // Premium exit animation - quick scale down first
    animate(
      SectionVisibility.floatComponent,
      {
        scale: 0.98,
        filter: "brightness(0.95)",
        x: "-50%", // Maintain centering
      },
      {
        duration: 0.1,
        ease: "circIn",
      }
    )
      .then(() => {
        // Main exit animation with smooth circular easing
        return animate(
          SectionVisibility.floatComponent,
          {
            opacity: 0,
            scale: 0.85,
            y: 30,
            filter: "blur(4px)",
            x: "-50%", // Maintain centering
          },
          {
            duration: CONFIG.animationDuration * 0.8, // Slightly faster exit
            ease: CONFIG.hideEasing,
          }
        );
      })
      .then(() => {
        // Disable interactions after animation
        SectionVisibility.floatComponent.style.pointerEvents = "none";
        SectionVisibility.floatComponent.setAttribute("aria-hidden", "true");

        SectionVisibility.animationInProgress = false;

        // Dispatch hide complete event
        document.dispatchEvent(
          new CustomEvent("floatComponentHidden", {
            detail: { component: SectionVisibility.floatComponent },
          })
        );
      });

    console.log("Float component hidden with premium animation");
  }

  /**
   * Cleanup function
   */
  function cleanup() {
    if (SectionVisibility.observer) {
      SectionVisibility.observer.disconnect();
      SectionVisibility.observer = null;
    }

    SectionVisibility.isInitialized = false;
    SectionVisibility.section = null;
    SectionVisibility.floatComponent = null;
    SectionVisibility.isVisible = false;
    SectionVisibility.animationInProgress = false;

    console.log("Section visibility system cleaned up");
  }

  /**
   * Public API
   */
  window.SectionVisibility = {
    init,
    cleanup,

    // Getter methods
    isInitialized: () => SectionVisibility.isInitialized,
    isVisible: () => SectionVisibility.isVisible,
    isAnimating: () => SectionVisibility.animationInProgress,

    // Manual control methods
    show: () => {
      if (SectionVisibility.isInitialized && !SectionVisibility.isVisible) {
        handleSectionVisibilityChange(true);
      }
    },
    hide: () => {
      if (SectionVisibility.isInitialized && SectionVisibility.isVisible) {
        handleSectionVisibilityChange(false);
      }
    },

    // Configuration
    getConfig: () => ({ ...CONFIG }),
    updateConfig: (newConfig) => {
      Object.assign(CONFIG, newConfig);
      if (SectionVisibility.isInitialized) {
        console.warn(
          "Configuration updated. Consider reinitializing for full effect."
        );
      }
    },
  };

  // Auto-initialize when script loads
  init();

  // Cleanup on page unload
  window.addEventListener("beforeunload", cleanup);
})();
