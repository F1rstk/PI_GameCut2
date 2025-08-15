import React, { useContext } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const UserContext = React.createContext();

export default function Perfil({ navigation }) {
  const user = useContext(UserContext);

  return (
    <View style={styles.container}>
      <Image
        source={
          user?.avatar
            ? { uri: user.avatar }
            : require("../assets/user.jpg")
        }
        style={styles.avatar}
      />
      <Text style={styles.nome}>{user?.nome || "Usuário"}</Text>

      {/* Botão para voltar para Jogos */}
      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() => navigation.navigate("Jogos", { screen: "JogosLista" })}
      >
        <Text style={styles.textoBotao}>Voltar para Jogos</Text>
      </TouchableOpacity>

      {/* Botão de Logout */}
      <TouchableOpacity
        style={styles.botaoLogout}
        onPress={() => {
          alert("Logout executado - implemente a lógica real");
          navigation.goBack(); // ou vá para tela de login
        }}
      >
        <Text style={styles.textoBotao}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333131",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  nome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F7C21E",
    marginBottom: 40,
  },
  botaoVoltar: {
    backgroundColor: "#F7C21E",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  botaoLogout: {
    backgroundColor: "#F7C21E",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoBotao: {
    color: "#333131",
    fontSize: 18,
    fontWeight: "bold",
  },
});
