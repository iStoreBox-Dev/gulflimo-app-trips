// Project shim for react-native-worklets/plugin — kept in source control.
// Exports a no-op Babel plugin so Babel `require('react-native-worklets/plugin')` succeeds.
module.exports = function() {
  return {
    name: 'react-native-worklets-shim',
    visitor: {},
  };
};
