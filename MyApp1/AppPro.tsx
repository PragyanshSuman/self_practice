import React from 'react'

import {
    View,
    Text,
    StyleSheet,
    useColorScheme
} from 'react-native'

function AppPro(): JSX.Element{
    const isDarkMode = useColorScheme() === 'dark'

    return (
        <View style={styles.container}>
            <Text style={isDarkMode?styles.whiteText:styles.darkText}>
                Heloooooooo
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex : 1,
        alignItems:'center',//it works from left to right whereas justify content works from top to bottom
        justifyContent:'center',
    },
    whiteText:{
        color:'#FFFFFF'
    },
    darkText:{
        color:'#000000'
    }


})

export default AppPro