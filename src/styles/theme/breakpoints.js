// src/styles/theme/breakpoints.js
export const breakpoints = {
    values: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    },
    
    // Media query helpers
    up: (key) => `@media (min-width: ${breakpoints.values[key]}px)`,
    down: (key) => `@media (max-width: ${breakpoints.values[key] - 0.05}px)`,
    between: (start, end) => 
      `@media (min-width: ${breakpoints.values[start]}px) and (max-width: ${breakpoints.values[end] - 0.05}px)`,
  };