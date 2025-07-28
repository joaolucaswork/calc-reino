/**
 * Section Visibility Test Suite
 * Test the conditional visibility functionality
 */

(function () {
  "use strict";

  const TestSuite = {
    results: [],
    totalTests: 0,
    passedTests: 0,

    // Test runner
    async run() {
      console.log("🧪 Starting Section Visibility Test Suite...\n");

      // Wait for system to be ready
      await this.waitForSystem();

      // Run all tests
      await this.testInitialization();
      await this.testElementDetection();
      await this.testVisibilityAPI();
      await this.testEventListeners();
      await this.testManualControl();

      // Display results
      this.displayResults();
    },

    // Wait for SectionVisibility to be ready
    waitForSystem() {
      return new Promise((resolve) => {
        if (
          window.SectionVisibility &&
          window.SectionVisibility.isInitialized()
        ) {
          resolve();
        } else {
          document.addEventListener("sectionVisibilityReady", resolve, {
            once: true,
          });
        }
      });
    },

    // Test helpers
    assert(condition, testName) {
      this.totalTests++;
      if (condition) {
        this.passedTests++;
        this.results.push({ test: testName, status: "✅ PASS" });
        console.log(`✅ ${testName}`);
      } else {
        this.results.push({ test: testName, status: "❌ FAIL" });
        console.log(`❌ ${testName}`);
      }
    },

    async wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    // Test system initialization
    async testInitialization() {
      console.log("\n📋 Testing System Initialization...");

      this.assert(
        window.SectionVisibility !== undefined,
        "SectionVisibility global object exists"
      );

      this.assert(
        typeof window.SectionVisibility.init === "function",
        "init method exists"
      );

      this.assert(
        window.SectionVisibility.isInitialized(),
        "System is initialized"
      );

      this.assert(
        typeof window.Motion !== "undefined",
        "Framer Motion is available"
      );
    },

    // Test element detection
    async testElementDetection() {
      console.log("\n🔍 Testing Element Detection...");

      const section = document.querySelector(".patrimonio-alocation");
      const floatComponent = document.querySelector(".componente-alocao-float");

      this.assert(section !== null, "Section .patrimonio-alocation found");

      this.assert(
        floatComponent !== null,
        "Float component .componente-alocao-float found"
      );

      if (floatComponent) {
        this.assert(
          floatComponent.getAttribute("aria-hidden") === "true",
          "Float component initially hidden from screen readers"
        );

        this.assert(
          floatComponent.style.pointerEvents === "none",
          "Float component initially has no pointer events"
        );
      }
    },

    // Test visibility API
    async testVisibilityAPI() {
      console.log("\n🔧 Testing Visibility API...");

      this.assert(
        typeof window.SectionVisibility.isVisible === "function",
        "isVisible method exists"
      );

      this.assert(
        typeof window.SectionVisibility.isAnimating === "function",
        "isAnimating method exists"
      );

      this.assert(
        typeof window.SectionVisibility.show === "function",
        "show method exists"
      );

      this.assert(
        typeof window.SectionVisibility.hide === "function",
        "hide method exists"
      );

      this.assert(
        typeof window.SectionVisibility.getConfig === "function",
        "getConfig method exists"
      );

      const config = window.SectionVisibility.getConfig();
      this.assert(
        config.sectionSelector === ".patrimonio-alocation",
        "Config has correct section selector"
      );

      this.assert(
        config.floatComponentSelector === ".componente-alocao-float",
        "Config has correct float component selector"
      );
    },

    // Test event listeners
    async testEventListeners() {
      console.log("\n📡 Testing Event Listeners...");

      let visibilityEventFired = false;
      let showEventFired = false;
      let hideEventFired = false;

      // Setup event listeners
      document.addEventListener("sectionVisibilityChanged", () => {
        visibilityEventFired = true;
      });

      document.addEventListener("floatComponentShown", () => {
        showEventFired = true;
      });

      document.addEventListener("floatComponentHidden", () => {
        hideEventFired = true;
      });

      // Trigger manual show
      window.SectionVisibility.show();
      await this.wait(600); // Wait for animation

      this.assert(visibilityEventFired, "sectionVisibilityChanged event fired");

      this.assert(showEventFired, "floatComponentShown event fired");

      // Trigger manual hide
      window.SectionVisibility.hide();
      await this.wait(600); // Wait for animation

      this.assert(hideEventFired, "floatComponentHidden event fired");
    },

    // Test manual control
    async testManualControl() {
      console.log("\n🎮 Testing Manual Control...");

      // Test show
      window.SectionVisibility.show();
      await this.wait(100); // Small delay

      this.assert(window.SectionVisibility.isVisible(), "Manual show works");

      // Test hide
      window.SectionVisibility.hide();
      await this.wait(100); // Small delay

      this.assert(!window.SectionVisibility.isVisible(), "Manual hide works");

      // Test animation state
      window.SectionVisibility.show();
      this.assert(
        window.SectionVisibility.isAnimating(),
        "Animation state detected during transition"
      );

      await this.wait(600); // Wait for animation to complete

      this.assert(
        !window.SectionVisibility.isAnimating(),
        "Animation state cleared after transition"
      );
    },

    // Display test results
    displayResults() {
      console.log("\n" + "=".repeat(50));
      console.log("📊 SECTION VISIBILITY TEST RESULTS");
      console.log("=".repeat(50));

      this.results.forEach((result) => {
        console.log(`${result.status} ${result.test}`);
      });

      console.log("\n" + "=".repeat(50));
      console.log(`✅ Passed: ${this.passedTests}/${this.totalTests}`);
      console.log(
        `❌ Failed: ${this.totalTests - this.passedTests}/${this.totalTests}`
      );
      console.log(
        `📈 Success Rate: ${Math.round(
          (this.passedTests / this.totalTests) * 100
        )}%`
      );
      console.log("=".repeat(50));

      if (this.passedTests === this.totalTests) {
        console.log(
          "🎉 All tests passed! Section visibility system is working correctly."
        );
      } else {
        console.log("⚠️ Some tests failed. Check the implementation.");
      }
    },
  };

  // Make TestSuite available globally for manual testing
  window.SectionVisibilityTests = TestSuite;

  // Auto-run tests when system is ready (optional)
  // Uncomment the next line to auto-run tests
  // document.addEventListener('sectionVisibilityReady', () => TestSuite.run());
})();

// Usage:
// Run tests manually in console: SectionVisibilityTests.run()
