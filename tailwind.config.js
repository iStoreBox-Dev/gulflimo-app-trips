const { platformSelect } = require('nativewind/theme');
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        'gold-light': '#E8C97A',
        'gold-dark': '#A07830',
        onyx: '#0a0a0a',
        charcoal: '#1a1a1a',
        'gray-dark': '#2a2a2a',
        'gray-mid': '#3a3a3a',
        'gray-light': '#6b6b6b',
        cream: '#F5F0E8',
        'cream-dark': '#EBE4D6',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
    },
  },
};
