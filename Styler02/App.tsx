import { View, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native'
import { ScrollView } from 'react-native'
import FlatCards from './components/FlatCards'

const App = () => {
  return (
    <SafeAreaView>
        <ScrollView>
            <FlatCards/> {/*it can be self closing or can be in two tags*/}
            <ElevatedCards/>
        </ScrollView>
    </SafeAreaView>
  )
}

export default App