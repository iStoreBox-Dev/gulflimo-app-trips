const path = require('path');

module.exports = {
  resolver: {
    extraNodeModules: {
      'react-native-worklets': path.resolve(__dirname, 'shims/react-native-worklets'),
      'missing-asset-registry-path': require.resolve('react-native/Libraries/Image/AssetRegistry'),
    },
    assetRegistryPath: require.resolve('react-native/Libraries/Image/AssetRegistry'),
  },
  transformer: {
    unstable_allowRequireContext: true,
  },
};
