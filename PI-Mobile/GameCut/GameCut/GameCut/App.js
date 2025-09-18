import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Image, View, Text, TouchableOpacity } from 'react-native';

import PaginaInicial from './screens/PaginaInicial';
import Perfil from './screens/Perfil'; // criaremos essa tela
import Entrar from './screens/Pagina01';
import Cadastrar from './screens/Pagina02';
import BuscarScreen from './screens/Pagina03';
import telaScreen from './screens/DetalhesJogoScreen';

import { AuthProvider, AuthContext } from './contexts/AuthContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#3C1F6F' }}>
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 100, height: 100, borderRadius: 50 }}
          resizeMode="contain"
        />
        {user && (
          <>
            <Text style={{ color: '#F7C21E', marginTop: 10 }}>{user.nome}</Text>
            <TouchableOpacity
              onPress={logout}
              style={{
                marginTop: 10,
                backgroundColor: '#F7C21E',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: '#3C1F6F', fontWeight: 'bold' }}>Sair</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AuthContext.Consumer>
          {({ user }) => (
            <Drawer.Navigator
              drawerContent={(props) => <CustomDrawerContent {...props} />}
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
              {user ? (
                <>
                  <Drawer.Screen name="Home" component={PaginaInicial} />
                  <Drawer.Screen name="Perfil" component={Perfil} />
                  <Drawer.Screen name="Busca" component={BuscarScreen} />
                </>
              ) : (
                <>
                  <Drawer.Screen name="Entrar" component={Entrar} />
                  <Drawer.Screen name="Cadastrar" component={Cadastrar} />
                </>
              )}
            </Drawer.Navigator>
          )}
        </AuthContext.Consumer>
      </NavigationContainer>
    </AuthProvider>
  );
}
