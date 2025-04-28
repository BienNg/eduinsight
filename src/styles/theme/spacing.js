// src/styles/theme/spacing.js
export const spacing = {
    // Base unit in pixels
    unit: 8,
    
    // Common spacing values
    xxs: '4px',    // 0.5 * unit
    xs: '8px',     // 1 * unit
    sm: '12px',    // 1.5 * unit
    md: '16px',    // 2 * unit
    lg: '24px',    // 3 * unit
    xl: '32px',    // 4 * unit
    xxl: '48px',   // 6 * unit
    
    // Function to calculate dynamic spacing
    // Usage: spacing.calc(2) returns '16px'
    calc: (multiplier) => `${multiplier * 8}px`,
    
    // Layout-specific spacing
    layout: {
      containerPadding: '24px',
      sectionGap: '32px',
      cardPadding: '16px',
    },
    
    // Form element spacing
    form: {
      inputPadding: '12px 16px',
      labelMargin: '0 0 8px 0',
      fieldGap: '16px',
    },
  };