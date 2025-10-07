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
import Perfil from './screens/Perfil';
import Entrar from './screens/Pagina01';
import Cadastrar from './screens/Pagina02';
import BuscarScreen from './screens/Pagina03';
import CriarPartidaScreen from './screens/CriarPartidaScreen';
import PartidasScreen from './screens/PartidasScreen';
import ListaJogosScreen from './screens/ListaJogosScreen'; // ADICIONE ESTA LINHA
import ListaUsuariosScreen from './screens/ListaUsuariosScreen'; // ADICIONE ESTA LINHA

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
            <Text style={{ color: '#F7C21E', marginTop: 10 }}>{user.nome || user.nomeUsuario}</Text>
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
                  <Drawer.Screen 
                    name="Home" 
                    component={PaginaInicial}
                    options={{ title: 'Início' }}
                  />
                  <Drawer.Screen 
                    name="Partidas" 
                    component={PartidasScreen}
                    options={{ title: 'Partidas' }}
                  />
                  <Drawer.Screen 
                    name="CriarPartida" 
                    component={CriarPartidaScreen}
                    options={{ title: 'Criar Partida' }}
                  />
                  <Drawer.Screen 
                    name="Perfil" 
                    component={Perfil}
                    options={{ title: 'Meu Perfil' }}
                  />
                  <Drawer.Screen 
                    name="Buscar" 
                    component={BuscarScreen}
                    options={{ title: 'Buscar' }}
                  />
                  {/* ADICIONE ESTAS DUAS NOVAS TELAS - MAS VOCÊ PODE ESCONDER DO DRAWER */}
                  <Drawer.Screen 
                    name="ListaJogos" 
                    component={ListaJogosScreen}
                    options={{ 
                      title: 'Lista de Jogos',
                      drawerItemStyle: { display: 'none' } // ESCONDE DO MENU DRAWER
                    }}
                  />
                  <Drawer.Screen 
                    name="ListaUsuarios" 
                    component={ListaUsuariosScreen}
                    options={{  
                      title: 'Lista de Usuários',
                      drawerItemStyle: { display: 'none' } // ESCONDE DO MENU DRAWER
                    }}
                  />
                </>
              ) : (
                <>
                  <Drawer.Screen 
                    name="Entrar" 
                    component={Entrar}
                    options={{ title: 'Entrar' }}
                  />
                  <Drawer.Screen 
                    name="Cadastrar" 
                    component={Cadastrar}
                    options={{ title: 'Cadastrar' }}
                  />
                </>
              )}
            </Drawer.Navigator>
          )}
        </AuthContext.Consumer>
      </NavigationContainer>
    </AuthProvider>
  );
}