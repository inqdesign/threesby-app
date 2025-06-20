import { create } from 'twrnc';

// Create the customized version of the tailwind instance
const tw = create({
  theme: {
    extend: {
      colors: {
        // Match your OnShelf color palette
        primary: '#252525',
        secondary: '#9d9b9b',
        tertiary: '#585757',
        accent: '#ADFF8B',
      },
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
});

export default tw;
