const path = require('path');

module.exports = {
  resolver: {
    extraNodeModules: {
      'react-native-worklets': path.resolve(__dirname, 'shims/react-native-worklets'),
    },
  },
};
