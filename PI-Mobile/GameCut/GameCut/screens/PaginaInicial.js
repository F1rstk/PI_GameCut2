import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

// Telas individuais
function JogosScreen() {
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Jogos</Text>
    </View>
  );
}

function ReviewsScreen() {
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Reviews</Text>
    </View>
  );
}

function NoticiasScreen() {
  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabText}>Notícias</Text>
    </View>
  );
}

// Criar o Tab Navigator
const Tab = createBottomTabNavigator();

const PaginaInicial = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#222',
        },
        tabBarActiveTintColor: '#F7C21E',
        tabBarInactiveTintColor: '#ccc',
        headerStyle: {
          backgroundColor: '#3C1F6F',
        },
        headerTintColor: '#F7C21E',
      }}
    >
      <Tab.Screen name="Jogos" component={JogosScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Notícias" component={NoticiasScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: '#333131',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: '#fff',
    fontSize: 18,
  }
});

export default PaginaInicial;
