import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  useEffect(() => {
    // Any app-level initialization
    console.log('Phonic Check App Started');
  }, []);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
         // Fallback color if colors.background is undefined during migration
        backgroundColor={colors?.background || '#FFFFFF'}
      />
      <AppNavigator />
    </>
  );
};

export default App;
