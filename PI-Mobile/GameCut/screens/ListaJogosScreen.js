import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";

const SERVER = "http://10.0.2.2/pibd";

const ListaJogosScreen = ({ route, navigation }) => {
  const { idUsuario, tipoLista, titulo } = route.params;
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarJogos();
  }, []);

  const carregarJogos = async () => {
    try {
      const res = await fetch(`${SERVER}/listasJogos.php?idUsuario=${idUsuario}`);
      const data = await res.json();
      const lista = data[tipoLista] || [];
      setJogos(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("Erro carregarJogos:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo} ({jogos.length})</Text>
      
      <FlatList
        data={jogos}
        keyExtractor={(item) => item.idJogo.toString()}
        numColumns={2}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.jogoItem}
            onPress={() => navigation.navigate("DetalhesJogo", { jogo: item })}
          >
            <Image
              source={{ uri: item.imagemApi || "https://i.imgur.com/5tj6S7O.jpg" }}
              style={styles.jogoImagem}
            />
            <Text style={styles.jogoNome} numberOfLines={2}>{item.nomeJogo}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
  titulo: { color: "#F7C21E", fontSize: 24, fontWeight: "bold", padding: 20, textAlign: "center" },
  jogoItem: { width: "45%", margin: "2.5%", backgroundColor: "#222", borderRadius: 10, padding: 10, alignItems: "center" },
  jogoImagem: { width: 120, height: 180, borderRadius: 8, backgroundColor: "#333" },
  jogoNome: { color: "#fff", fontSize: 12, textAlign: "center", marginTop: 8 },
});

export default ListaJogosScreen;