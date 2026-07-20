// StorePrint — Brand Theme (ORIGINAL — Ideas green)
// BACKUP: This is the original theme. To revert, change theme.js to import from this file.

export const colors = {
  // Primary brand green (from Ideas logo)
  primary:        '#5CAD2C',
  primaryDark:    '#3D7A18',
  primaryLight:   '#7DC94E',
  primaryBg:      '#F0F8EA',

  // Neutrals
  dark:           '#1A1A1A',
  darkGrey:       '#333333',
  midGrey:        '#666666',
  lightGrey:      '#999999',
  border:         '#E0E0E0',
  inputBg:        '#F8FAF6',
  background:     '#F4F7F1',
  white:          '#FFFFFF',

  // Semantic
  success:        '#5CAD2C',
  warning:        '#F5A623',
  error:          '#D0021B',
  info:           '#4A90E2',

  // Status chips
  statusActive:   '#E8F5E2',
  statusActiveText: '#2E7D32',
  statusInactive: '#F5F5F5',
  statusInactiveText: '#757575',
  statusWarning:  '#FFF8E1',
  statusWarningText: '#F57F17',
};

export const typography = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  26,
  xxxl: 32,
};

export const radius = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  green: {
    shadowColor: '#5CAD2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};
