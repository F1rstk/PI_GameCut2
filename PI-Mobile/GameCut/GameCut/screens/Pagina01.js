import React, { useState, useContext } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { AuthContext } from "../contexts/AuthContext";

const Entrar = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const { login } = useContext(AuthContext);

  async function validarLogin() {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch("http://10.0.2.2/pibd/validarLogin.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Erro", data?.erro || "Email ou senha incorretos.");
        return;
      }

      // Aceita tanto {usuario:{...}} quanto direto {...}
      const raw = data?.usuario ?? data;

      // Normaliza para o formato que o app usa: { id, nome, email }
      const userData = {
        id: raw.id ?? raw.idUsuario ?? raw.idusuario ?? null,
        nome: raw.nome ?? raw.nomeUsuario ?? raw.nomeusuario ?? "",
        email: raw.email ?? raw.emailUsuario ?? raw.emailusuario ?? "",
      };

      if (!userData.id || !userData.nome || !userData.email) {
        Alert.alert("Erro", "Resposta do servidor inesperada.");
        return;
      }

      // Salva no contexto -> o Drawer troca para as telas logadas automaticamente
      login(userData);

      // Importante: não chamar navigation.navigate("Home"/"Jogos") aqui,
      // pois o Navigator é trocado após o login e isso causa o erro NAVIGATE.
    } catch (error) {
      console.log("Erro login:", error);
      Alert.alert("Erro", "Erro ao conectar com o servidor.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Entrar</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#999"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity onPress={validarLogin}>
        <Text style={styles.botao}>Entrar</Text>
      </TouchableOpacity>

      {/* ajuste o nome da rota abaixo conforme seu App (ex: "Cadastrar") */}
      <TouchableOpacity onPress={() => {/* ex.: navigation.navigate("Cadastrar") */}}>
        <Text style={styles.link}>Não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333131',
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titulo: {
    fontSize: 24,
    color: "#F7C21E",
    marginBottom: 20,
  },
  input: {
    width: 250,
    height: 40,
    borderColor: "#F7C21E",
    borderWidth: 1,
    borderRadius: 5,
    color: "#fff",
    paddingHorizontal: 10,
    marginVertical: 8,
  },
  botao: {
    marginTop: 15,
    color: "#F7C21E",
    fontSize: 18,
    textAlign: "center",
  },
  link: {
    marginTop: 25,
    color: "#D9D9D9",
    textDecorationLine: "underline",
  }
});

export default Entrar;
