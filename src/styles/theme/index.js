// src/styles/theme/index.js
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';
import { breakpoints } from './breakpoints';

// Additional theme elements
const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
  circle: '50%',
};

const transitions = {
  default: 'all 0.2s ease',
  fast: 'all 0.1s ease',
  slow: 'all 0.3s ease',
};

// Combine all theme elements
export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  breakpoints,
  borderRadius,
  transitions,
};

export default theme;