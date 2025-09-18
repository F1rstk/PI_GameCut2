import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";

const SERVER = "http://10.0.2.2/pibd";
const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";

// Função para buscar imagem da API RAWG
async function fetchImagemJogo(nomeJogo) {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(nomeJogo)}&key=${RAWG_API_KEY}`
    );
    const data = await response.json();
    
    if (data?.results?.length > 0) {
      const jogo = data.results[0];
      return jogo.background_image || 
             (jogo.short_screenshots && jogo.short_screenshots[0]?.image) || 
             null;
    }
    return null;
  } catch (e) {
    console.log("Erro ao buscar imagem RAWG:", e);
    return null;
  }
}

const ListaJogosScreen = ({ route, navigation }) => {
  const { idUsuario, tipoLista, titulo } = route.params;
  const [jogos, setJogos] = useState([]);
  const [imagensJogos, setImagensJogos] = useState({});
  const [loading, setLoading] = useState(true);

  // Buscar imagens para os jogos
  const buscarImagensJogos = async (jogosLista) => {
    const imagens = {};
    
    for (const jogo of jogosLista) {
      if (!imagens[jogo.idJogo]) {
        const imagem = await fetchImagemJogo(jogo.nomeJogo);
        imagens[jogo.idJogo] = imagem || "https://i.imgur.com/5tj6S7O.jpg";
      }
    }
    
    setImagensJogos(imagens);
  };

  useEffect(() => {
    carregarJogos();
  }, []);

  const carregarJogos = async () => {
    try {
      const res = await fetch(`${SERVER}/listasJogos.php?idUsuario=${idUsuario}`);
      const data = await res.json();
      const lista = data[tipoLista] || [];
      setJogos(Array.isArray(lista) ? lista : []);
      buscarImagensJogos(lista);
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
            onPress={() => navigation.navigate("DetalhesJogo", { 
              jogo: {
                ...item,
                capa: imagensJogos[item.idJogo],
                nome: item.nomeJogo,
                genero: item.generoJogo,
                desenvolvedora: item.desenvolvedoraJogo,
                descricao: item.descricaoJogo
              }
            })}
          >
            <Image
              source={{ uri: imagensJogos[item.idJogo] || "https://i.imgur.com/5tj6S7O.jpg" }}
              style={styles.jogoImagem}
              resizeMode="cover"
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
  jogoItem: { 
    width: "45%", 
    margin: "2.5%", 
    backgroundColor: "#222", 
    borderRadius: 10, 
    padding: 10, 
    alignItems: "center" 
  },
  jogoImagem: { 
    width: 120, 
    height: 180, 
    borderRadius: 8, 
    backgroundColor: "#333" 
  },
  jogoNome: { 
    color: "#fff", 
    fontSize: 12, 
    textAlign: "center", 
    marginTop: 8 
  },
});

export default ListaJogosScreen;