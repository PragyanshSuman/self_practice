import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet
} from 'react-native';

function App() {
  /* It won't show up on the screen if you haven't returned it */
  return (
    <SafeAreaView style={styles.container}>
      {/* In JSX, the starting tag which wraps everything must have an end tag, 
          or you can just wrap it around with <>...</> */}
      <View>
        <Text style={styles.text}>Hello World!</Text>
        <Text style={styles.text}>Hello World!</Text>
        <Text style={styles.text}>Hello World!</Text>
        <Text style={styles.text}>Hello World!</Text>
        <Text style={styles.text}>Hello World!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',   // White background for visibility
    justifyContent: 'center',  // Center vertically
    alignItems: 'center',      // Center horizontally
    padding: 16,
  },
  text: {
    fontSize: 20,
    color: 'black',
    marginVertical: 4,
  },
});

export default App;
