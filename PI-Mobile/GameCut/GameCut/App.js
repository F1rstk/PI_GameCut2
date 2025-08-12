import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Image, View } from 'react-native';

import PaginaInicial from './screens/PaginaInicial';
import Pagina03 from './screens/Pagina03';
import Entrar from './screens/Pagina01';
import Cadastrar from './screens/Pagina02';
import BuscarScreen from './screens/Pagina03';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#3C1F6F' }}>
      {/* Logo no topo */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Image
          source={require('./assets/logo.png')} // caminho da sua logo
          style={{ width: 100, height: 100, borderRadius: 50 }}
          resizeMode="contain"
        />
      </View>

      {/* Itens do menu */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {
            backgroundColor: '#3C1F6F',
          },
          drawerActiveTintColor: '#D9D9D9',
          drawerInactiveTintColor: '#F7C21E',
          headerStyle: {
            backgroundColor: '#3C1F6F',
          },
          headerTintColor: '#F7C21E',
        }}
      >
        <Drawer.Screen name="Home" component={PaginaInicial} />
        <Drawer.Screen name="Busca" component={BuscarScreen} />
        <Drawer.Screen name="Entrar" component={Entrar} />
        <Drawer.Screen name="Cadastrar" component={Cadastrar} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
