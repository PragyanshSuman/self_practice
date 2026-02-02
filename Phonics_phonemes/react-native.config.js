module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts'],
  dependencies: {
    '@react-native-voice/voice': {
      platforms: {
        android: null, // Disable autolinking on Android to use Manual Link
      },
    },
  },
};
