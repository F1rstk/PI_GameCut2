import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Pagina03 = () => {
    return (
        <View style={styles.container}>
            <Text>Página Inicial</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#333131', 
        justifyContent: 'center', 
        alignItems: 'center',
    }
});

export default Pagina03;
