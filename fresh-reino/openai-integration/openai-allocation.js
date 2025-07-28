/**
 * OpenAI Asset Allocation Integration
 * Handles natural language processing for asset allocation requests
 * Integrates with existing patrimony-sync system
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview',
    maxTokens: 1000,
    temperature: 0.3,
    systemPrompt: `You are an asset allocation assistant. Parse natural language requests about investment allocation and return structured JSON data.

Available asset categories:
- Renda Fixa (CDB, LCI, LCA)
- Renda Fixa (CRI, CRA, DEBENTURE)
- Renda Fixa (Títulos públicos)
- Fundo de investimento (Ações)
- Fundo de investimento (Liquidez)
- Fundo de investimento (Renda Fixa)
- Renda variável (Ações)
- Renda variável (FII)
- Renda variável (ETF)
- Renda variável (BDR)
- Previdência privada (PGBL/VGBL)
- Outros investimentos

Instructions:
1. Parse the user's request for allocation changes
2. Return ONLY valid JSON with the requested allocations
3. Ensure total allocation does not exceed 100%
4. Use percentages for allocations
5. Match asset categories exactly as listed above

Response format:
{
  "allocations": [
    {
      "category": "exact category name",
      "subcategory": "exact subcategory name",
      "percentage": number
    }
  ],
  "totalPercentage": number
}`,
    retryAttempts: 3,
    retryDelay: 1000
  };

  // OpenAI Allocation Controller
  class OpenAIAllocationController {
    constructor() {
      this.apiKey = null;
      this.isProcessing = false;
      this.promptInput = null;
      this.processButton = null;
      this.patrimonySystem = null;
      this.loadingState = null;
    }

    async init() {
      // Wait for DOM and patrimony system
      await this.waitForDependencies();

      // Get API key from storage or prompt user
      this.apiKey = await this.getApiKey();

      if (!this.apiKey) {
        console.warn('OpenAI API key not configured');
        return;
      }

      // Setup UI elements
      this.setupUI();

      // Setup event listeners
      this.setupEventListeners();

      console.log('OpenAI Allocation Controller initialized');
    }

    async waitForDependencies() {
      // Wait for DOM
      if (document.readyState !== 'loading') {
        await this.waitForPatrimonySystem();
      } else {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', async () => {
            await this.waitForPatrimonySystem();
            resolve();
          });
        });
      }
    }

    async waitForPatrimonySystem() {
      // Wait for patrimony system to be available
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.PatrimonySync && window.PatrimonySync.initialized) {
            this.patrimonySystem = window.PatrimonySync;
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    async getApiKey() {
      // Check localStorage
      let apiKey = localStorage.getItem('openai_api_key');

      if (!apiKey) {
        // Create modal for API key input
        apiKey = await this.promptForApiKey();
        if (apiKey) {
          localStorage.setItem('openai_api_key', apiKey);
        }
      }

      return apiKey;
    }

    async promptForApiKey() {
      return new Promise((resolve) => {
        const modal = this.createApiKeyModal();
        document.body.appendChild(modal);

        const submitButton = modal.querySelector('#submit-api-key');
        const cancelButton = modal.querySelector('#cancel-api-key');
        const input = modal.querySelector('#api-key-input');

        submitButton.addEventListener('click', () => {
          const key = input.value.trim();
          if (key) {
            document.body.removeChild(modal);
            resolve(key);
          }
        });

        cancelButton.addEventListener('click', () => {
          document.body.removeChild(modal);
          resolve(null);
        });
      });
    }

    createApiKeyModal() {
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        ">
          <div style="
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
          ">
            <h3 style="margin: 0 0 20px 0;">Configure OpenAI API Key</h3>
            <p style="margin: 0 0 20px 0; color: #666;">
              Para usar a alocação por IA, você precisa configurar sua chave de API OpenAI.
            </p>
            <input
              id="api-key-input"
              type="password"
              placeholder="sk-..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                margin-bottom: 20px;
                box-sizing: border-box;
              "
            />
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button id="cancel-api-key" style="
                padding: 10px 20px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 5px;
                cursor: pointer;
              ">Cancelar</button>
              <button id="submit-api-key" style="
                padding: 10px 20px;
                border: none;
                background: #101010;
                color: white;
                border-radius: 5px;
                cursor: pointer;
              ">Salvar</button>
            </div>
          </div>
        </div>
      `;
      return modal;
    }

    setupUI() {
      // Find UI elements
      this.promptInput = document.querySelector('.prompt-input');
      this.processButton = document.querySelector('.process-prompt');

      if (!this.promptInput || !this.processButton) {
        console.error('Required UI elements not found');
        return;
      }

      // Create loading state
      this.createLoadingState();
    }

    createLoadingState() {
      this.loadingState = document.createElement('div');
      this.loadingState.className = 'ai-loading-state';
      this.loadingState.style.cssText = `
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      `;
      this.loadingState.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="spinner" style="
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #101010;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>Processando alocação...</span>
        </div>
      `;

      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      // Add to float component
      const floatComponent = document.querySelector('.componente-alocao-float');
      if (floatComponent) {
        floatComponent.style.position = 'relative';
        floatComponent.appendChild(this.loadingState);
      }
    }

    setupEventListeners() {
      // Process button click
      this.processButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.processAllocationRequest();
      });

      // Enter key on input
      this.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.processAllocationRequest();
        }
      });
    }

    async processAllocationRequest() {
      if (this.isProcessing) return;

      const prompt = this.promptInput.value.trim();
      if (!prompt) return;

      this.isProcessing = true;
      this.showLoading(true);

      try {
        // Get current allocations for context
        const currentAllocations = this.getCurrentAllocations();

        // Call OpenAI API
        const response = await this.callOpenAI(prompt, currentAllocations);

        // Parse and validate response
        const allocationData = this.parseAIResponse(response);

        if (allocationData) {
          // Apply allocations
          await this.applyAllocations(allocationData);

          // Clear input
          this.promptInput.value = '';

          // Show success feedback
          this.showSuccess();
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error processing allocation:', error);
        this.showError(error.message);
      } finally {
        this.isProcessing = false;
        this.showLoading(false);
      }
    }

    getCurrentAllocations() {
      if (!this.patrimonySystem) return {};

      const allocations = this.patrimonySystem.getAllocations();
      const mainValue = this.patrimonySystem.getMainValue();

      return {
        totalValue: mainValue,
        allocations: allocations.map(item => ({
          category: item.category,
          subcategory: item.subcategory,
          value: item.value,
          percentage: item.percentage
        }))
      };
    }

    async callOpenAI(prompt, currentAllocations) {
      const contextPrompt = `
Current allocations:
${JSON.stringify(currentAllocations, null, 2)}

User request: ${prompt}
      `;

      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: CONFIG.model,
          messages: [
            {
              role: 'system',
              content: CONFIG.systemPrompt
            },
            {
              role: 'user',
              content: contextPrompt
            }
          ],
          max_tokens: CONFIG.maxTokens,
          temperature: CONFIG.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }

    parseAIResponse(response) {
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const data = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (!data.allocations || !Array.isArray(data.allocations)) {
          throw new Error('Invalid allocation structure');
        }

        // Validate total percentage
        const total = data.allocations.reduce((sum, item) => sum + item.percentage, 0);
        if (total > 100.1) { // Allow small rounding errors
          throw new Error(`Total allocation exceeds 100% (${total.toFixed(1)}%)`);
        }

        return data;
      } catch (error) {
        console.error('Error parsing AI response:', error);
        return null;
      }
    }

    async applyAllocations(allocationData) {
      const mainValue = this.patrimonySystem.getMainValue();
      if (!mainValue || mainValue <= 0) {
        throw new Error('Por favor, defina o valor total do patrimônio primeiro');
      }

      // Map allocations to asset items
      const items = document.querySelectorAll('.patrimonio_interactive_item');

      for (const allocation of allocationData.allocations) {
        const item = this.findAssetItem(items, allocation.category, allocation.subcategory);

        if (item) {
          const value = (mainValue * allocation.percentage) / 100;
          const input = item.querySelector('.currency-input.individual');

          if (input) {
            // Trigger change event to update through patrimony system
            input.value = this.formatCurrency(value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    }

    findAssetItem(items, category, subcategory) {
      for (const item of items) {
        const categoryEl = item.querySelector('.categoria-ativo');
        const subcategoryEl = item.querySelector('.ativo_alocated_top-wrapper > div:not(.categoria-ativo)');

        if (categoryEl && subcategoryEl) {
          const itemCategory = categoryEl.textContent.trim();
          const itemSubcategory = subcategoryEl.textContent.trim();

          if (itemCategory === category && itemSubcategory === subcategory) {
            return item;
          }
        }
      }
      return null;
    }

    formatCurrency(value) {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    showLoading(show) {
      if (this.loadingState) {
        this.loadingState.style.display = show ? 'block' : 'none';
      }
    }

    showSuccess() {
      this.showNotification('Alocação aplicada com sucesso!', 'success');
    }

    showError(message) {
      this.showNotification(`Erro: ${message}`, 'error');
    }

    showNotification(message, type) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `;
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }
  }

  // Initialize when ready
  const controller = new OpenAIAllocationController();
  controller.init().catch(console.error);

  // Export for debugging
  window.OpenAIAllocationController = controller;

})();
