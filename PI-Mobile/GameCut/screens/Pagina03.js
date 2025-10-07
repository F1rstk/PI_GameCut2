import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";

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
             "https://i.imgur.com/5tj6S7O.jpg";
    }
    return "https://i.imgur.com/5tj6S7O.jpg";
  } catch (e) {
    console.log("Erro ao buscar imagem RAWG:", e);
    return "https://i.imgur.com/5tj6S7O.jpg";
  }
}

// Função melhorada para fazer requisições
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const responseText = await response.text();
    
    try {
      const jsonData = JSON.parse(responseText);
      return jsonData;
    } catch (e) {
      return { erro: "Resposta não é JSON", _raw: responseText };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error);
    return { erro: error.message };
  }
};

export default function BuscarScreen({ navigation }) {
  const [todosJogos, setTodosJogos] = useState([]);
  const [jogosFiltrados, setJogosFiltrados] = useState([]);
  const [textoBusca, setTextoBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [imagensJogos, setImagensJogos] = useState({});
  const [carregandoImagens, setCarregandoImagens] = useState({});

  // Carregar todos os jogos do servidor
  useEffect(() => {
    carregarTodosJogos();
  }, []);

  const carregarTodosJogos = async () => {
    try {
      setLoading(true);
      
      console.log("🔗 Buscando todos os jogos...");
      
      // Tenta primeiro com GET
      let data;
      try {
        data = await fetchWithErrorHandling(`${SERVER}/getJogos.php`);
        console.log("✅ Jogos carregados via GET");
      } catch (err) {
        // Se GET falhar, tenta POST
        console.log("❌ GET falhou, tentando POST...");
        data = await fetchWithErrorHandling(`${SERVER}/getJogos.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({})
        });
        console.log("✅ Jogos carregados via POST");
      }

      console.log("📊 Total de jogos encontrados:", data?.length || 0);

      if (data && !data.erro) {
        const jogosArray = Array.isArray(data) ? data : [];
        setTodosJogos(jogosArray);
        setJogosFiltrados(jogosArray);
        
        // Carregar imagens para todos os jogos
        carregarImagensParaJogos(jogosArray);
      } else {
        console.log("❌ Erro ao carregar jogos:", data?.erro);
        setTodosJogos([]);
        setJogosFiltrados([]);
      }
    } catch (err) {
      console.error("Erro carregarTodosJogos:", err);
      setTodosJogos([]);
      setJogosFiltrados([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar imagens para os jogos
  const carregarImagensParaJogos = async (jogosLista) => {
    const novasImagens = { ...imagensJogos };
    const novoCarregando = { ...carregandoImagens };

    for (const jogo of jogosLista.slice(0, 20)) { // Limita a 20 jogos para performance
      if (!novasImagens[jogo.id] && !novoCarregando[jogo.id]) {
        novoCarregando[jogo.id] = true;
        
        try {
          const imagem = await fetchImagemJogo(jogo.nome);
          novasImagens[jogo.id] = imagem;
        } catch (error) {
          console.log(`❌ Erro ao carregar imagem para ${jogo.nome}:`, error);
          novasImagens[jogo.id] = "https://i.imgur.com/5tj6S7O.jpg";
        }
        
        novoCarregando[jogo.id] = false;
      }
    }

    setImagensJogos(novasImagens);
    setCarregandoImagens(novoCarregando);
  };

  // Filtrar jogos
  const filtrarJogos = (texto) => {
    setTextoBusca(texto);
    if (texto.trim() === "") {
      setJogosFiltrados(todosJogos);
    } else {
      const filtro = todosJogos.filter((jogo) =>
        jogo.nome.toLowerCase().includes(texto.toLowerCase())
      );
      setJogosFiltrados(filtro);
    }
  };

  // Navegar para detalhes do jogo
  const verDetalhesJogo = (jogo) => {
    navigation.navigate("DetalhesJogo", { 
      jogo: {
        ...jogo,
        capa: imagensJogos[jogo.id] || "https://i.imgur.com/5tj6S7O.jpg",
        nome: jogo.nome,
        genero: jogo.genero,
        desenvolvedora: jogo.desenvolvedora,
        descricao: jogo.descricao
      }
    });
  };

  // Renderizar cada item do jogo
  const renderizarJogo = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => verDetalhesJogo(item)}
    >
      <View style={styles.jogoInfo}>
        <Image
          source={{ 
            uri: imagensJogos[item.id] || "https://i.imgur.com/5tj6S7O.jpg" 
          }}
          style={styles.jogoImagem}
          resizeMode="cover"
        />
        <View style={styles.jogoTexto}>
          <Text style={styles.nomeJogo} numberOfLines={2}>
            {item.nome}
          </Text>
          {item.genero && (
            <Text style={styles.generoJogo} numberOfLines={1}>
              {item.genero}
            </Text>
          )}
          {item.desenvolvedora && (
            <Text style={styles.desenvolvedoraJogo} numberOfLines={1}>
              {item.desenvolvedora}
            </Text>
          )}
        </View>
      </View>
      
      {carregandoImagens[item.id] && (
        <View style={styles.carregandoOverlay}>
          <ActivityIndicator size="small" color="#F7C21E" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={styles.carregandoTexto}>Carregando jogos...</Text>
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
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.contador}>
        {jogosFiltrados.length} {jogosFiltrados.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}
      </Text>

      {jogosFiltrados.length === 0 && textoBusca ? (
        <View style={styles.semResultadoContainer}>
          <Text style={styles.semResultado}>Nenhum jogo encontrado para "{textoBusca}"</Text>
          <Text style={styles.sugestao}>Tente verificar a ortografia ou usar termos mais gerais</Text>
        </View>
      ) : (
        <FlatList
          data={jogosFiltrados}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderizarJogo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 15,
  },
  input: {
    height: 50,
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#fff",
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  contador: {
    color: "#F7C21E",
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
  },
  listaContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F7C21E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  jogoInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  jogoImagem: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#333",
    marginRight: 15,
  },
  jogoTexto: {
    flex: 1,
  },
  nomeJogo: {
    color: "#F7C21E",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  generoJogo: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 2,
  },
  desenvolvedoraJogo: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
  },
  carregandoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  semResultadoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  semResultado: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  sugestao: {
    color: "#bbb",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  carregandoTexto: {
    color: "#F7C21E",
    marginTop: 10,
    fontSize: 16,
  },
});