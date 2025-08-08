import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Pagina01 from './screens/Pagina01';
import Pagina02 from './screens/Pagina02';
import PaginaInicial from './screens/PaginaInicial';
import Pagina03 from './screens/Pagina03';
import CustomDrawer from './CustomDrawer'; // importe aqui

const Drawer = createDrawerNavigator();

function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
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
        <Drawer.Screen name="Busca" component={Pagina01} />
        <Drawer.Screen name="Entrar" component={Pagina02} />
        <Drawer.Screen name="Cadastrar-se" component={Pagina03} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default App;
