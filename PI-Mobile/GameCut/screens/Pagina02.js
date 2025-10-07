import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";

const Cadastrar = ({ navigation }) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  async function validarCadastro() {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "Senhas não coincidem.");
      return;
    }

    try {
      const response = await fetch("http://10.0.2.2/pibd/cadastrar.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, confirmarSenha }),
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        Alert.alert("Sucesso", data.mensagem);
        navigation.navigate("Entrar");
      } else {
        Alert.alert("Erro", data.erro || "Erro ao cadastrar");
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível conectar ao servidor");
      console.error(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastrar-se</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor="#999"
        value={nome}
        onChangeText={setNome}
      />

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

      <TextInput
        style={styles.input}
        placeholder="Confirmar senha"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
      />

      <TouchableOpacity onPress={validarCadastro}>
        <Text style={styles.botao}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Entrar")}>
        <Text style={styles.link}>Já tem uma conta? Entrar</Text>
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

export default Cadastrar;
