/**
 * Investment Strategies Module
 * Defines allocation strategies for different investor profiles
 *
 * This module provides a flexible system for defining investment allocation
 * strategies that can be easily modified or extended without touching the
 * main application logic.
 *
 * @author Portfolio Allocation Interface
 * @version 1.0.0
 */

// ============================================================================
// Investment Profile Definitions
// ============================================================================

/**
 * Investment profiles with their allocation strategies
 * Each profile defines target allocations for different asset categories
 */
const INVESTMENT_PROFILES = {
  conservador: {
    name: "Conservador",
    description: "Perfil focado na preservação de capital com baixo risco",
    icon: "🛡️",
    color: "#10b981",
    riskLevel: "Baixo",
    expectedReturn: "4-6% ao ano",

    // Asset category allocations (percentages)
    allocations: {
      "renda-fixa": 70, // Fixed income: 70%
      fundos: 15, // Investment funds: 15%
      outros: 15, // Others (savings, real estate, etc.): 15%
    },

    // Specific asset type preferences within categories
    assetPreferences: {
      "renda-fixa": {
        "CDB, LCI, LCA": 35, // 35% of total portfolio
        "CRI, CRA, DEBENTURE": 35, // 35% of total portfolio
      },
      fundos: {
        Liquidez: 15, // 15% of total portfolio
      },
      outros: {
        Poupança: 10, // 10% of total portfolio
        Previdência: 5, // 5% of total portfolio
      },
    },
  },

  moderado: {
    name: "Moderado",
    description: "Perfil equilibrado entre segurança e crescimento",
    icon: "⚖️",
    color: "#f59e0b",
    riskLevel: "Médio",
    expectedReturn: "6-10% ao ano",

    allocations: {
      "renda-fixa": 50, // Fixed income: 50%
      fundos: 35, // Investment funds: 35%
      outros: 15, // Others: 15%
    },

    assetPreferences: {
      "renda-fixa": {
        "CDB, LCI, LCA": 25,
        "CRI, CRA, DEBENTURE": 25,
      },
      fundos: {
        Liquidez: 15,
        "Fundo de Ações": 20,
      },
      outros: {
        Poupança: 5,
        Previdência: 5,
        Imóvel: 5,
      },
    },
  },

  sofisticado: {
    name: "Sofisticado",
    description: "Perfil agressivo focado em crescimento de longo prazo",
    icon: "🚀",
    color: "#ef4444",
    riskLevel: "Alto",
    expectedReturn: "10-15% ao ano",

    allocations: {
      "renda-fixa": 25, // Fixed income: 25%
      fundos: 60, // Investment funds: 60%
      outros: 15, // Others: 15%
    },

    assetPreferences: {
      "renda-fixa": {
        "CDB, LCI, LCA": 10,
        "CRI, CRA, DEBENTURE": 15,
      },
      fundos: {
        Liquidez: 10,
        "Fundo de Ações": 50,
      },
      outros: {
        Previdência: 5,
        Imóvel: 10,
      },
    },
  },
};

// ============================================================================
// Strategy Calculation Engine
// ============================================================================

/**
 * Calculates specific asset allocations based on a profile and available assets
 * @param {string} profileKey - The profile key (conservador, moderado, sofisticado)
 * @param {Array} availableAssets - Array of available asset objects
 * @returns {Object} Allocation map with asset names as keys and percentages as values
 */
function calculateProfileAllocations(profileKey, availableAssets) {
  const profile = INVESTMENT_PROFILES[profileKey];
  if (!profile) {
    throw new Error(`Profile "${profileKey}" not found`);
  }

  const allocations = {};
  const assetsByCategory = groupAssetsByCategory(availableAssets);

  // Initialize all assets to 0
  availableAssets.forEach((asset) => {
    allocations[asset.name] = 0;
  });

  // Apply profile-based allocations
  for (const [category, categoryAllocation] of Object.entries(
    profile.allocations
  )) {
    const categoryAssets = assetsByCategory[category] || [];
    const preferences = profile.assetPreferences[category] || {};

    // Distribute category allocation among available assets
    distributeAllocationWithinCategory(
      allocations,
      categoryAssets,
      preferences,
      categoryAllocation
    );
  }

  // Ensure allocations sum to exactly 100%
  const normalizedAllocations = normalizeAllocations(allocations);

  // Validate the result
  if (!validateAllocations(normalizedAllocations)) {
    console.warn("Allocation validation failed, applying normalization");
  }

  return normalizedAllocations;
}

/**
 * Groups assets by their category
 * @param {Array} assets - Array of asset objects
 * @returns {Object} Assets grouped by category
 */
function groupAssetsByCategory(assets) {
  return assets.reduce((groups, asset) => {
    const category = asset.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(asset);
    return groups;
  }, {});
}

/**
 * Distributes allocation within a category based on preferences
 * @param {Object} allocations - The allocations object to modify
 * @param {Array} categoryAssets - Assets in this category
 * @param {Object} preferences - Preferred allocations for asset types
 * @param {number} totalCategoryAllocation - Total percentage for this category
 */
function distributeAllocationWithinCategory(
  allocations,
  categoryAssets,
  preferences,
  totalCategoryAllocation
) {
  // Group assets by type within the category
  const assetsByType = {};
  categoryAssets.forEach((asset) => {
    const assetType = asset.type;
    if (!assetsByType[assetType]) {
      assetsByType[assetType] = [];
    }
    assetsByType[assetType].push(asset);
  });

  // Distribute based on preferences
  let remainingAllocation = totalCategoryAllocation;

  for (const [assetType, preferredAllocation] of Object.entries(preferences)) {
    const assetsOfType = assetsByType[assetType] || [];
    if (assetsOfType.length === 0) continue;

    const allocationPerAsset = preferredAllocation / assetsOfType.length;

    assetsOfType.forEach((asset) => {
      allocations[asset.name] = Math.min(
        allocationPerAsset,
        remainingAllocation
      );
      remainingAllocation -= allocations[asset.name];
    });
  }

  // Distribute any remaining allocation evenly among unallocated assets
  if (remainingAllocation > 0.01) {
    const unallocatedAssets = categoryAssets.filter(
      (asset) => allocations[asset.name] === 0
    );
    if (unallocatedAssets.length > 0) {
      const remainingPerAsset = remainingAllocation / unallocatedAssets.length;
      unallocatedAssets.forEach((asset) => {
        allocations[asset.name] = remainingPerAsset;
      });
    } else if (categoryAssets.length > 0) {
      // If all assets already have allocations, distribute remaining proportionally
      const additionalPerAsset = remainingAllocation / categoryAssets.length;
      categoryAssets.forEach((asset) => {
        allocations[asset.name] =
          (allocations[asset.name] || 0) + additionalPerAsset;
      });
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all available investment profiles
 * @returns {Object} All investment profiles
 */
function getInvestmentProfiles() {
  return INVESTMENT_PROFILES;
}

/**
 * Gets a specific investment profile
 * @param {string} profileKey - The profile key
 * @returns {Object|null} The profile object or null if not found
 */
function getInvestmentProfile(profileKey) {
  return INVESTMENT_PROFILES[profileKey] || null;
}

/**
 * Validates if a profile allocation is valid (sums to 100%)
 * @param {Object} allocations - Allocation object
 * @returns {boolean} True if valid
 */
function validateAllocations(allocations) {
  const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  return Math.abs(total - 100) < 0.01; // Allow for small floating point errors
}

/**
 * Normalizes allocations to sum to exactly 100%
 * @param {Object} allocations - Allocation object
 * @returns {Object} Normalized allocations
 */
function normalizeAllocations(allocations) {
  const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  if (total === 0) return allocations;

  const normalized = {};
  for (const [asset, value] of Object.entries(allocations)) {
    normalized[asset] = (value / total) * 100;
  }

  return normalized;
}

// ============================================================================
// Export for use in main application
// ============================================================================

// Make functions available globally for the bundled architecture
if (typeof window !== "undefined") {
  window.InvestmentStrategies = {
    profiles: INVESTMENT_PROFILES,
    calculateProfileAllocations,
    getInvestmentProfiles,
    getInvestmentProfile,
    validateAllocations,
    normalizeAllocations,
  };
}

// Also support module exports for potential future use
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    INVESTMENT_PROFILES,
    calculateProfileAllocations,
    getInvestmentProfiles,
    getInvestmentProfile,
    validateAllocations,
    normalizeAllocations,
  };
}
