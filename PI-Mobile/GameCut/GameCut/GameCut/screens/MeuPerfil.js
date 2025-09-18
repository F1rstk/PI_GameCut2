// screens/MeuPerfil.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../App';

const MeuPerfil = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);

  async function deslogar() {
    await AsyncStorage.removeItem('usuario');
    setUser(null);
    Alert.alert('Deslogado', 'Você saiu da conta.');
    navigation.navigate('Home');
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>Você não está logado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meu Perfil</Text>
      <Text style={styles.info}>Nome: {user.nome}</Text>
      <Text style={styles.info}>Email: {user.email}</Text>

      <TouchableOpacity onPress={deslogar}>
        <Text style={styles.botao}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333131', justifyContent: 'center', alignItems: 'center' },
  titulo: { color: '#F7C21E', fontSize: 22, marginBottom: 20 },
  info: { color: '#fff', marginBottom: 8 },
  botao: { color: '#F7C21E', marginTop: 20, fontSize: 18 }
});

export default MeuPerfil;
