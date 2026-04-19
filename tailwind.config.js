const { platformSelect } = require('nativewind/theme');
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: '#38BDF8',
        'gold-light': '#7DD3FC',
        'gold-dark': '#0284C7',
        onyx: '#0B1220',
        charcoal: '#121A2B',
        'gray-dark': '#1E2940',
        'gray-mid': '#2A3A57',
        'gray-light': '#94A3B8',
        cream: '#F8FAFC',
        'cream-dark': '#E2E8F0',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
};
