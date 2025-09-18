import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

export default function BuscarScreen({ navigation }) {
  const [todosJogos, setTodosJogos] = useState([]);
  const [jogosFiltrados, setJogosFiltrados] = useState([]);
  const [textoBusca, setTextoBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function buscarJogos() {
      try {
        const response = await fetch("http://10.0.2.2/pibd/getJogos.php");
        const data = await response.json();
        setTodosJogos(data);
        setJogosFiltrados(data);
      } catch (error) {
        console.error("Erro ao buscar jogos:", error);
      } finally {
        setLoading(false);
      }
    }
    buscarJogos();
  }, []);

  function filtrarJogos(texto) {
    setTextoBusca(texto);
    if (texto.trim() === "") {
      setJogosFiltrados(todosJogos);
    } else {
      const filtro = todosJogos.filter((jogo) =>
        jogo.nome.toLowerCase().includes(texto.toLowerCase())
      );
      setJogosFiltrados(filtro);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={{ color: "#fff" }}>Carregando jogos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Digite o nome do jogo..."
        placeholderTextColor="#999"
        style={styles.input}
        value={textoBusca}
        onChangeText={filtrarJogos}
      />

      {jogosFiltrados.length === 0 ? (
        <Text style={styles.semResultado}>Nenhum jogo encontrado.</Text>
      ) : (
        <FlatList
          data={jogosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("DetalhesJogo", { jogo: item })}
            >
              <Text style={styles.nomeJogo}>{item.nome}</Text>
              <Text style={styles.generoJogo}>{item.genero}</Text>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333131",
    padding: 10,
  },
  input: {
    height: 45,
    backgroundColor: "#444",
    borderRadius: 8,
    paddingHorizontal: 15,
    color: "#fff",
    fontSize: 16,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 7,
    marginBottom: 10,
  },
  nomeJogo: {
    color: "#F7C21E",
    fontWeight: "bold",
    fontSize: 18,
  },
  generoJogo: {
    color: "#ddd",
    marginTop: 4,
  },
  semResultado: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 30,
  },
  center: {
    flex: 1,
    backgroundColor: "#333131",
    justifyContent: "center",
    alignItems: "center",
  },
});
