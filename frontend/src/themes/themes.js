// Theme definitions with semantic color mappings
export const themes = {
  roygbiv: {
    name: 'ROYGBIV',
    description: 'Rainbow colors',
    colors: {
      primary: '#ff0000', // Red
      secondary: '#ff7f00', // Orange
      accent: '#ffff00', // Yellow
      background: '#00ff00', // Green
      surface: '#0000ff', // Blue
      text: '#4b0082', // Indigo
      textSecondary: '#9400d3', // Violet
      border: '#8b00ff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ff7f00',
      gradientStart: '#ff0000',
      gradientEnd: '#9400d3',
      shadow: 'rgba(148, 0, 211, 0.3)',
    }
  },
  blackWhite: {
    name: 'Black & White',
    description: 'Monochrome theme',
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#808080',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#cccccc',
      error: '#000000',
      success: '#000000',
      warning: '#666666',
      gradientStart: '#000000',
      gradientEnd: '#ffffff',
      shadow: 'rgba(0, 0, 0, 0.2)',
    }
  },
  roygbivMixed: {
    name: 'ROYGBIV Mixed',
    description: 'All rainbow colors blended',
    colors: {
      primary: '#ff6b9d', // Pink-red blend
      secondary: '#c44569', // Red-purple blend
      accent: '#f8b500', // Yellow-orange blend
      background: '#6c5ce7', // Blue-purple blend
      surface: '#a29bfe', // Light purple-blue
      text: '#2d3436', // Dark gray
      textSecondary: '#636e72',
      border: '#b2bec3',
      error: '#d63031',
      success: '#00b894',
      warning: '#fdcb6e',
      gradientStart: '#ff6b9d',
      gradientEnd: '#6c5ce7',
      shadow: 'rgba(108, 92, 231, 0.3)',
    }
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue ocean vibes',
    colors: {
      primary: '#006994',
      secondary: '#00a8cc',
      accent: '#0abde3',
      background: '#005f73',
      surface: '#e0f7fa',
      text: '#003d52',
      textSecondary: '#006994',
      border: '#b2ebf2',
      error: '#d32f2f',
      success: '#00acc1',
      warning: '#ffa726',
      gradientStart: '#006994',
      gradientEnd: '#00a8cc',
      shadow: 'rgba(0, 105, 148, 0.3)',
    }
  },
  forest: {
    name: 'Forest',
    description: 'Natural green tones',
    colors: {
      primary: '#2e7d32',
      secondary: '#4caf50',
      accent: '#66bb6a',
      background: '#1b5e20',
      surface: '#e8f5e9',
      text: '#1b5e20',
      textSecondary: '#388e3c',
      border: '#a5d6a7',
      error: '#c62828',
      success: '#2e7d32',
      warning: '#f57c00',
      gradientStart: '#2e7d32',
      gradientEnd: '#4caf50',
      shadow: 'rgba(46, 125, 50, 0.3)',
    }
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm orange and pink',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      accent: '#ffd23f',
      background: '#ff8c42',
      surface: '#fff5e6',
      text: '#8b4513',
      textSecondary: '#d2691e',
      border: '#ffcc99',
      error: '#d32f2f',
      success: '#ff9800',
      warning: '#ff6b35',
      gradientStart: '#ff6b35',
      gradientEnd: '#f7931e',
      shadow: 'rgba(255, 107, 53, 0.3)',
    }
  },
  midnight: {
    name: 'Midnight',
    description: 'Dark blue and purple',
    colors: {
      primary: '#1a237e',
      secondary: '#283593',
      accent: '#3949ab',
      background: '#0d47a1',
      surface: '#e3f2fd',
      text: '#0d47a1',
      textSecondary: '#1565c0',
      border: '#90caf9',
      error: '#c62828',
      success: '#0277bd',
      warning: '#ff6f00',
      gradientStart: '#1a237e',
      gradientEnd: '#3949ab',
      shadow: 'rgba(26, 35, 126, 0.4)',
    }
  },
  lavender: {
    name: 'Lavender',
    description: 'Soft purple tones',
    colors: {
      primary: '#9575cd',
      secondary: '#b39ddb',
      accent: '#ce93d8',
      background: '#7e57c2',
      surface: '#f3e5f5',
      text: '#4a148c',
      textSecondary: '#6a1b9a',
      border: '#ce93d8',
      error: '#c2185b',
      success: '#7b1fa2',
      warning: '#e91e63',
      gradientStart: '#9575cd',
      gradientEnd: '#ce93d8',
      shadow: 'rgba(149, 117, 205, 0.3)',
    }
  },
  emerald: {
    name: 'Emerald',
    description: 'Rich green and teal',
    colors: {
      primary: '#00897b',
      secondary: '#00acc1',
      accent: '#26a69a',
      background: '#00695c',
      surface: '#e0f2f1',
      text: '#004d40',
      textSecondary: '#00796b',
      border: '#80cbc4',
      error: '#c62828',
      success: '#00897b',
      warning: '#ff6f00',
      gradientStart: '#00897b',
      gradientEnd: '#00acc1',
      shadow: 'rgba(0, 137, 123, 0.3)',
    }
  },
  coral: {
    name: 'Coral',
    description: 'Vibrant coral and peach',
    colors: {
      primary: '#ff5722',
      secondary: '#ff7043',
      accent: '#ffab91',
      background: '#e64a19',
      surface: '#fbe9e7',
      text: '#bf360c',
      textSecondary: '#d84315',
      border: '#ffab91',
      error: '#d32f2f',
      success: '#ff6f00',
      warning: '#ff5722',
      gradientStart: '#ff5722',
      gradientEnd: '#ff7043',
      shadow: 'rgba(255, 87, 34, 0.3)',
    }
  }
};

export const defaultTheme = 'roygbiv';

