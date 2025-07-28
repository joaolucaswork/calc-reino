/**
 * Patrimony Sync System - Test Suite
 * Run this file to test all synchronization features
 */

(function() {
    'use strict';

    const TestSuite = {
        results: [],
        totalTests: 0,
        passedTests: 0,

        // Test runner
        async run() {
            console.log('🧪 Starting Patrimony Sync Test Suite...\n');

            // Wait for system to be ready
            await this.waitForSystem();

            // Run all tests
            await this.testMainInputSync();
            await this.testAllocationSync();
            await this.testRangeSliderSync();
            await this.testPercentageCalculations();
            await this.testCachePersistence();
            await this.testErrorHandling();
            await this.testEvents();

            // Display results
            this.displayResults();
        },

        // Wait for PatrimonySync to be ready
        waitForSystem() {
            return new Promise((resolve) => {
                if (window.PatrimonySync && window.PatrimonySync.getMainValue !== undefined) {
                    resolve();
                } else {
                    document.addEventListener('patrimonySyncReady', resolve, { once: true });
                }
            });
        },

        // Test helpers
        assert(condition, testName) {
            this.totalTests++;
            if (condition) {
                this.passedTests++;
                this.results.push({ test: testName, status: '✅ PASS' });
                console.log(`✅ ${testName}`);
            } else {
                this.results.push({ test: testName, status: '❌ FAIL' });
                console.error(`❌ ${testName}`);
            }
        },

        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // Test 1: Main Input Synchronization
        async testMainInputSync() {
            console.log('\n📋 Testing Main Input Synchronization...');

            // Reset first
            PatrimonySync.reset();
            await this.wait(100);

            // Test setting value programmatically
            const testValue = 500000;
            PatrimonySync.setMainValue(testValue);
            await this.wait(100);

            const mainInput = document.querySelector('[is-main="true"]');
            const currentValue = PatrimonySync.getMainValue();

            this.assert(currentValue === testValue, 'Main value setter works');
            this.assert(mainInput && mainInput.value.includes('500.000'), 'Main input displays formatted value');

            // Test direct input change
            if (mainInput) {
                mainInput.value = '1.000.000,00';
                mainInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400); // Wait for debounce

                const newValue = PatrimonySync.getMainValue();
                this.assert(newValue === 1000000, 'Direct input change updates global value');
            }
        },

        // Test 2: Allocation Synchronization
        async testAllocationSync() {
            console.log('\n📋 Testing Allocation Synchronization...');

            // Set a main value first
            PatrimonySync.setMainValue(1000000);
            await this.wait(100);

            const allocationInputs = document.querySelectorAll('[input-settings="receive"]');

            if (allocationInputs.length > 0) {
                // Test first allocation input
                const firstInput = allocationInputs[0];
                firstInput.value = '250.000,00';
                firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400);

                const allocations = PatrimonySync.getAllocations();
                this.assert(allocations.length > 0, 'Allocations array exists');
                this.assert(allocations[0].value === 250000, 'First allocation value updated correctly');
                this.assert(allocations[0].percentage === 25, 'Percentage calculated correctly (25%)');
            } else {
                console.warn('No allocation inputs found in section 3');
            }
        },

        // Test 3: Range Slider Synchronization
        async testRangeSliderSync() {
            console.log('\n📋 Testing Range Slider Synchronization...');

            const sliders = document.querySelectorAll('.active-produto-item range-slider');

            if (sliders.length > 0) {
                // Test first slider
                const firstSlider = sliders[0];
                const container = firstSlider.closest('.active-produto-item');
                const input = container.querySelector('[input-settings="receive"]');

                // Set slider to 0.3 (30%)
                firstSlider.value = 0.3;
                firstSlider.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(100);

                const expectedValue = PatrimonySync.getMainValue() * 0.3;
                const inputValue = this.parseCurrencyValue(input.value);

                this.assert(Math.abs(inputValue - expectedValue) < 1, 'Slider updates input correctly');

                // Test reverse: input updates slider
                input.value = '500.000,00';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400);

                const expectedSliderValue = 500000 / PatrimonySync.getMainValue();
                this.assert(Math.abs(firstSlider.value - expectedSliderValue) < 0.01, 'Input updates slider correctly');
            } else {
                console.warn('No range sliders found');
            }
        },

        // Test 4: Percentage Calculations
        async testPercentageCalculations() {
            console.log('\n📋 Testing Percentage Calculations...');

            PatrimonySync.setMainValue(1000000);
            await this.wait(100);

            const percentageDisplays = document.querySelectorAll('.porcentagem-calculadora');

            if (percentageDisplays.length > 0) {
                // Set first allocation to 200000 (20%)
                const firstInput = document.querySelector('[input-settings="receive"]');
                if (firstInput) {
                    firstInput.value = '200.000,00';
                    firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await this.wait(400);

                    const firstPercentage = percentageDisplays[0].textContent;
                    this.assert(firstPercentage === '20.0%', 'Percentage display shows correct format');
                }
            } else {
                console.warn('No percentage displays found');
            }

            // Test total allocation
            const totalAllocated = PatrimonySync.getTotalAllocated();
            const remaining = PatrimonySync.getRemainingValue();
            const mainValue = PatrimonySync.getMainValue();

            this.assert(totalAllocated + remaining === mainValue, 'Total allocated + remaining equals main value');
        },

        // Test 5: Cache Persistence
        async testCachePersistence() {
            console.log('\n📋 Testing Cache Persistence...');

            // Set values
            const testMainValue = 750000;
            PatrimonySync.setMainValue(testMainValue);
            await this.wait(100);

            // Check localStorage
            const cachedMain = localStorage.getItem('patrimony_main_value');
            this.assert(cachedMain !== null, 'Main value cached in localStorage');
            this.assert(JSON.parse(cachedMain) === testMainValue, 'Cached value matches set value');

            // Test allocation cache
            const firstInput = document.querySelector('[input-settings="receive"]');
            if (firstInput) {
                firstInput.value = '100.000,00';
                firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400);

                const cachedAllocations = localStorage.getItem('patrimony_allocations');
                this.assert(cachedAllocations !== null, 'Allocations cached in localStorage');

                const parsed = JSON.parse(cachedAllocations);
                this.assert(Array.isArray(parsed) && parsed.length > 0, 'Cached allocations is valid array');
            }
        },

        // Test 6: Error Handling
        async testErrorHandling() {
            console.log('\n📋 Testing Error Handling...');

            // Test zero main value
            PatrimonySync.setMainValue(0);
            await this.wait(100);

            const allocations = PatrimonySync.getAllocations();
            this.assert(allocations.every(a => a.percentage === 0), 'Handles zero main value gracefully');

            // Test invalid input
            const mainInput = document.querySelector('[is-main="true"]');
            if (mainInput) {
                mainInput.value = 'invalid';
                mainInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400);

                const value = PatrimonySync.getMainValue();
                this.assert(value === 0, 'Handles invalid input gracefully');
            }

            // Test allocation exceeding main value
            PatrimonySync.setMainValue(100000);
            await this.wait(100);

            const firstInput = document.querySelector('[input-settings="receive"]');
            if (firstInput) {
                firstInput.value = '200.000,00'; // Exceeds main value
                firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400);

                const allocations = PatrimonySync.getAllocations();
                this.assert(allocations[0].value <= 100000, 'Allocation capped at main value');
            }
        },

        // Test 7: Event System
        async testEvents() {
            console.log('\n📋 Testing Event System...');

            let mainValueEventFired = false;
            let allocationEventFired = false;

            // Listen for events
            const mainValueHandler = (e) => {
                mainValueEventFired = true;
                this.assert(e.detail.value === 888888, 'Main value event has correct value');
            };

            const allocationHandler = (e) => {
                allocationEventFired = true;
                this.assert(typeof e.detail.index === 'number', 'Allocation event has index');
                this.assert(typeof e.detail.value === 'number', 'Allocation event has value');
            };

            document.addEventListener('patrimonyMainValueChanged', mainValueHandler);
            document.addEventListener('allocationChanged', allocationHandler);

            // Trigger main value change
            PatrimonySync.setMainValue(888888);
            await this.wait(100);

            // Trigger allocation change
            const firstInput = document.querySelector('[input-settings="receive"]');
            if (firstInput) {
                firstInput.value = '111.111,00';
                firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                await this.wait(400);
            }

            this.assert(mainValueEventFired, 'Main value change event fired');
            this.assert(allocationEventFired, 'Allocation change event fired');

            // Cleanup
            document.removeEventListener('patrimonyMainValueChanged', mainValueHandler);
            document.removeEventListener('allocationChanged', allocationHandler);
        },

        // Utility function
        parseCurrencyValue(value) {
            if (!value || typeof value !== 'string') return 0;
            const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
            return parseFloat(cleanValue) || 0;
        },

        // Display test results
        displayResults() {
            console.log('\n' + '='.repeat(50));
            console.log('📊 TEST RESULTS');
            console.log('='.repeat(50));

            this.results.forEach(result => {
                console.log(`${result.status} ${result.test}`);
            });

            console.log('\n' + '-'.repeat(50));
            console.log(`Total Tests: ${this.totalTests}`);
            console.log(`Passed: ${this.passedTests}`);
            console.log(`Failed: ${this.totalTests - this.passedTests}`);
            console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
            console.log('='.repeat(50));

            // Create visual indicator
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 20px;
                background: ${this.passedTests === this.totalTests ? '#22c55e' : '#ef4444'};
                color: white;
                font-family: Arial, sans-serif;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 10000;
            `;
            indicator.innerHTML = `
                <h3 style="margin: 0 0 10px 0;">Test Results</h3>
                <p style="margin: 5px 0;">Total: ${this.totalTests}</p>
                <p style="margin: 5px 0;">Passed: ${this.passedTests}</p>
                <p style="margin: 5px 0;">Failed: ${this.totalTests - this.passedTests}</p>
                <p style="margin: 10px 0 0 0; font-weight: bold;">
                    ${this.passedTests === this.totalTests ? '✅ ALL TESTS PASSED!' : '❌ Some tests failed'}
                </p>
            `;
            document.body.appendChild(indicator);

            // Auto-remove after 10 seconds
            setTimeout(() => indicator.remove(), 10000);
        }
    };

    // Auto-run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TestSuite.run());
    } else {
        TestSuite.run();
    }

    // Expose globally for manual testing
    window.PatrimonySyncTest = TestSuite;

})();
