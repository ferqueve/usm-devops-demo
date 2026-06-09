module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // El plugin de worklets/reanimated DEBE ir último.
    plugins: ['react-native-worklets/plugin'],
  };
};
