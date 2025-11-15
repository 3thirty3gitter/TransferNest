/**
 * Tax Calculator for Canadian Provinces
 * Rates as of 2025
 */

export interface TaxBreakdown {
  gst: number;
  pst: number;
  hst: number;
  total: number;
  rate: number;
}

export interface ProvinceTaxRate {
  province: string;
  gst: number;
  pst: number;
  hst: number;
  total: number;
}

// Canadian provincial tax rates
export const TAX_RATES: Record<string, ProvinceTaxRate> = {
  // Atlantic
  'NL': { province: 'Newfoundland and Labrador', gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  'PE': { province: 'Prince Edward Island', gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  'NS': { province: 'Nova Scotia', gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  'NB': { province: 'New Brunswick', gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  
  // Central
  'QC': { province: 'Quebec', gst: 0.05, pst: 0.09975, hst: 0, total: 0.14975 },
  'ON': { province: 'Ontario', gst: 0, pst: 0, hst: 0.13, total: 0.13 },
  
  // Prairies
  'MB': { province: 'Manitoba', gst: 0.05, pst: 0.07, hst: 0, total: 0.12 },
  'SK': { province: 'Saskatchewan', gst: 0.05, pst: 0.06, hst: 0, total: 0.11 },
  'AB': { province: 'Alberta', gst: 0.05, pst: 0, hst: 0, total: 0.05 },
  
  // West Coast
  'BC': { province: 'British Columbia', gst: 0.05, pst: 0.07, hst: 0, total: 0.12 },
  
  // Territories
  'YT': { province: 'Yukon', gst: 0.05, pst: 0, hst: 0, total: 0.05 },
  'NT': { province: 'Northwest Territories', gst: 0.05, pst: 0, hst: 0, total: 0.05 },
  'NU': { province: 'Nunavut', gst: 0.05, pst: 0, hst: 0, total: 0.05 },
};

// US state tax rates (for future expansion)
export const US_TAX_RATES: Record<string, { state: string; rate: number }> = {
  'CA': { state: 'California', rate: 0.0725 },
  'NY': { state: 'New York', rate: 0.04 },
  'TX': { state: 'Texas', rate: 0.0625 },
  'FL': { state: 'Florida', rate: 0.06 },
  // Add more as needed
};

/**
 * Calculate tax based on province/state and amount
 */
export function calculateTax(
  amount: number,
  provinceOrState: string,
  country: string = 'CA'
): TaxBreakdown {
  const code = provinceOrState.toUpperCase().trim();
  
  if (country === 'CA' || country === 'Canada') {
    const taxRate = TAX_RATES[code];
    
    if (!taxRate) {
      // Default to Ontario HST if province not found
      console.warn(`Unknown province code: ${code}, defaulting to Ontario HST`);
      const defaultRate = TAX_RATES['ON'];
      return {
        gst: amount * defaultRate.gst,
        pst: amount * defaultRate.pst,
        hst: amount * defaultRate.hst,
        total: amount * defaultRate.total,
        rate: defaultRate.total,
      };
    }
    
    return {
      gst: amount * taxRate.gst,
      pst: amount * taxRate.pst,
      hst: amount * taxRate.hst,
      total: amount * taxRate.total,
      rate: taxRate.total,
    };
  }
  
  if (country === 'US' || country === 'USA') {
    const taxRate = US_TAX_RATES[code];
    
    if (!taxRate) {
      // Default to 0% for unknown US states
      return {
        gst: 0,
        pst: 0,
        hst: 0,
        total: 0,
        rate: 0,
      };
    }
    
    return {
      gst: 0,
      pst: 0,
      hst: amount * taxRate.rate,
      total: amount * taxRate.rate,
      rate: taxRate.rate,
    };
  }
  
  // No tax for other countries
  return {
    gst: 0,
    pst: 0,
    hst: 0,
    total: 0,
    rate: 0,
  };
}

/**
 * Get tax rate information for a province/state
 */
export function getTaxRate(provinceOrState: string, country: string = 'CA'): ProvinceTaxRate | null {
  const code = provinceOrState.toUpperCase().trim();
  
  if (country === 'CA' || country === 'Canada') {
    return TAX_RATES[code] || null;
  }
  
  return null;
}

/**
 * Format tax breakdown for display
 */
export function formatTaxBreakdown(taxBreakdown: TaxBreakdown): string {
  const parts: string[] = [];
  
  if (taxBreakdown.gst > 0) {
    parts.push(`GST: $${taxBreakdown.gst.toFixed(2)}`);
  }
  if (taxBreakdown.pst > 0) {
    parts.push(`PST: $${taxBreakdown.pst.toFixed(2)}`);
  }
  if (taxBreakdown.hst > 0) {
    parts.push(`HST: $${taxBreakdown.hst.toFixed(2)}`);
  }
  
  return parts.join(' + ') || 'No tax';
}

/**
 * Validate province/state code
 */
export function isValidProvinceCode(code: string, country: string = 'CA'): boolean {
  const upperCode = code.toUpperCase().trim();
  
  if (country === 'CA' || country === 'Canada') {
    return upperCode in TAX_RATES;
  }
  
  if (country === 'US' || country === 'USA') {
    return upperCode in US_TAX_RATES;
  }
  
  return false;
}
