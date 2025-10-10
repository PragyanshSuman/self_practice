import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function FlatCards() {
  return (
    <View>
      <Text style={styles.headingText}>Flat Cards</Text>
      <View style={styles.container}>
        <View style={[styles.card,styles.cardOne]}>
            <Text>Red</Text>
        </View>
        <View style={[styles.card,styles.cardTwo]}>
            <Text>Blue </Text>
        </View>
        <View style={[styles.card,styles.cardThree]}>
            <Text>Green </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    headingText:{
        fontSize: 24,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        paddingVertical: 40
    },
    container:{
        flex:1,
        flexDirection:'row',
        padding: 8
    },
    card:{
        flex: 1,//flex itself doesn't do anything but let justifycontent and alignitems to do their work
        justifyContent:'center',
        alignItems:'center',
        width:100,
        height:100,
        borderRadius: 10,
        margin: 8
    },
    cardOne:{
        backgroundColor:'#EF5354'
    },
    cardTwo:{
        backgroundColor:'#00ffffff'
    },
    cardThree:{
        backgroundColor:'#53ef82ff'
    }
})