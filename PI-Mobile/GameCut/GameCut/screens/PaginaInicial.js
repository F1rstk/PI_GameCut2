// PaginaInicial.js
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons"; // Ícones

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";
const UserContext = React.createContext();

// Função auxiliar: busca capa do jogo na API RAWG
async function fetchCapaRawg(nome) {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(nome)}&key=${RAWG_API_KEY}`
    );
    const json = await response.json();
    if (json.results && json.results.length > 0) {
      return json.results[0].background_image;
    }
    return null;
  } catch (e) {
    console.log("Erro ao buscar capa RAWG:", e);
    return null;
  }
}

// Tela de listagem de jogos
function JogosScreen({ navigation }) {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarJogos() {
      try {
        const res = await fetch("http://10.0.2.2/pibd/getJogos.php");
        const jogosData = await res.json();

        const jogosComImagem = await Promise.all(
          jogosData.map(async (jogo) => {
            const capa = await fetchCapaRawg(jogo.nome);
            return { ...jogo, capa };
          })
        );

        setJogos(jogosComImagem);
      } catch (error) {
        console.log("Erro ao carregar jogos:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarJogos();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={{ color: "#fff" }}>Carregando jogos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jogos}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      contentContainerStyle={{ padding: 10 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("DetalhesJogo", { jogo: item })}
        >
          {item.capa ? (
            <Image source={{ uri: item.capa }} style={styles.capa} />
          ) : (
            <View style={[styles.capa, styles.semImagem]}>
              <Text style={{ color: "#fff" }}>Sem imagem</Text>
            </View>
          )}
          <Text style={styles.nomeJogo} numberOfLines={1}>
            {item.nome}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}
// Tela de detalhes de um jogo
function DetalhesJogo({ route }) {
  const { jogo } = route.params;
  const { user } = useContext(AuthContext);
  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [novaNota, setNovaNota] = useState("");
  const [novoComentario, setNovoComentario] = useState("");

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      const response = await fetch(
        `http://10.0.2.2/pibd/getAvaliacoes.php?jogo_id=${jogo.id}`
      );
      const data = await response.json();
      setAvaliacoes(data);
    } catch (error) {
      console.log(error);
    }
  };

  const enviarAvaliacao = async () => {
    if (!nota || isNaN(nota) || nota < 0 || nota > 5) {
      alert("Digite uma nota válida entre 0 e 5.");
      return;
    }
    try {
      const response = await fetch(
        "http://10.0.2.2/pibd/salvarAvaliacao.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `idUsuario=${user.id}&idJogo=${jogo.id}&notaAvaliacao=${nota}&descricaoAvaliacao=${comentario}`,
        }
      );
      const data = await response.json();
      if (data.success) {
        setNota("");
        setComentario("");
        carregarAvaliacoes();
      } else {
        alert("Erro ao salvar avaliação.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const salvarEdicao = async (avaliacaoId) => {
    if (!novaNota || isNaN(novaNota) || novaNota < 0 || novaNota > 5) {
      alert("Digite uma nota válida entre 0 e 5.");
      return;
    }
    try {
      const res = await fetch("http://10.0.2.2/pibd/editarAvaliacao.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `idAvaliacao=${avaliacaoId}&nota=${novaNota}&comentario=${encodeURIComponent(
          novoComentario
        )}`,
      });
      const data = await res.json();
      if (data.success) {
        setEditandoId(null);
        setNovaNota("");
        setNovoComentario("");
        carregarAvaliacoes();
      } else {
        alert("Erro ao editar avaliação.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const apagarAvaliacao = async (avaliacaoId) => {
    try {
      const res = await fetch("http://10.0.2.2/pibd/apagarAvaliacao.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `idAvaliacao=${avaliacaoId}`,
      });
      const data = await res.json();
      if (data.success) {
        carregarAvaliacoes();
      } else {
        alert("Erro ao apagar avaliação.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView
      style={styles.detalhesContainer}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {jogo.capa && (
        <Image source={{ uri: jogo.capa }} style={styles.capaGrande} />
      )}
      <Text style={styles.nomeJogoDetalhes}>{jogo.nome}</Text>
      <Text style={styles.texto}>Gênero: {jogo.genero}</Text>
      <Text style={styles.texto}>Desenvolvedora: {jogo.desenvolvedora}</Text>
      <Text style={styles.texto}>Descrição: {jogo.descricao}</Text>

      {/* Avaliação */}
      <Text style={styles.subtitulo}>Avaliar este jogo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nota (0 a 5)"
        keyboardType="numeric"
        value={nota}
        onChangeText={setNota}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Escreva um comentário..."
        multiline
        value={comentario}
        onChangeText={setComentario}
      />
      <TouchableOpacity
        style={[styles.botao, { marginBottom: 15 }]}
        onPress={enviarAvaliacao}
      >
        <Text style={styles.textoBotao}>Enviar Avaliação</Text>
      </TouchableOpacity>

      {/* Lista de comentários */}
      <Text style={styles.subtitulo}>Comentários</Text>
      {avaliacoes.length === 0 && (
        <Text style={styles.texto}>Nenhuma avaliação ainda.</Text>
      )}
      <FlatList
        data={avaliacoes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.comentario}>
            {editandoId === item.idAvaliacao ? (
              <>
                <TextInput
                  style={[styles.input, { marginBottom: 5 }]}
                  keyboardType="numeric"
                  value={novaNota}
                  onChangeText={setNovaNota}
                />
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  multiline
                  value={novoComentario}
                  onChangeText={setNovoComentario}
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <TouchableOpacity
                    style={[styles.botao, { flex: 1, marginRight: 5 }]}
                    onPress={() => salvarEdicao(item.idAvaliacao)}
                  >
                    <Text style={styles.textoBotao}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.botao, { flex: 1, backgroundColor: "#999" }]}
                    onPress={() => setEditandoId(null)}
                  >
                    <Text style={styles.textoBotao}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.usuario}>
                    {item.nomeUsuario} - Nota: {item.notaAvaliacao}
                  </Text>
                  {item.idUsuario === user.id && (
                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditandoId(item.idAvaliacao);
                          setNovaNota(item.notaAvaliacao.toString());
                          setNovoComentario(item.descricaoAvaliacao);
                        }}
                        style={{ marginRight: 10 }}
                      >
                        <Ionicons name="pencil" size={20} color="black" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => apagarAvaliacao(item.idAvaliacao)}
                      >
                        <Ionicons name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <Text style={styles.texto}>{item.descricaoAvaliacao}</Text>
              </>
            )}
          </View>
        )}
      />
    </ScrollView>
  );
}
// Tela de Notícias
function NoticiasScreen() {
  return (
    <View style={styles.center}>
      <Text style={{ color: "#fff" }}>Página de Notícias</Text>
    </View>
  );
}

// Stack de Jogos
function JogosStack() {
  const user = useContext(UserContext);
  const nomeHeader = user?.nome ? user.nome.substring(0, 6) : "Usuário";

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: "#3C1F6F" },
        headerTintColor: "#F7C21E",
        headerLeft: () =>
          user ? (
            <TouchableOpacity
              style={styles.userInfoContainer}
              onPress={() => navigation.navigate("Perfil")}
            >
              <Image
                source={
                  user.avatar
                    ? { uri: user.avatar }
                    : require("../assets/user.jpg")
                }
                style={styles.userAvatar}
              />
              <Text style={styles.userName}>{nomeHeader}</Text>
            </TouchableOpacity>
          ) : null,
      })}
    >
      <Stack.Screen
        name="JogosLista"
        component={JogosScreen}
        options={{ title: "Jogos" }}
      />
      <Stack.Screen
        name="DetalhesJogo"
        component={DetalhesJogo}
        options={{ title: "Detalhes do Jogo" }}
      />
      <Stack.Screen
        name="Perfil"
        component={require("./Perfil").default}
        options={{ title: "Meu Perfil" }}
      />
    </Stack.Navigator>
  );
}

// Tela principal com abas (Bottom Tabs)
export default function PaginaInicial() {
  const { user } = useContext(AuthContext);

  const userComAvatar = user
    ? {
        ...user,
        avatar:
          user.avatar ||
          "https://uploads.jovemnerd.com.br/wp-content/uploads/2023/10/004__108uf17.webp",
      }
    : null;

  return (
    <UserContext.Provider value={userComAvatar}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: "#3C1F6F" },
          tabBarActiveTintColor: "#F7C21E",
          tabBarInactiveTintColor: "#D9D9D9",
        }}
      >
        <Tab.Screen
          name="Jogos"
          component={JogosStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="game-controller" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Notícias"
          component={NoticiasScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="newspaper" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </UserContext.Provider>
  );
}

// Estilos
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#333131",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: "#333131",
    borderRadius: 7,
    alignItems: "center",
    paddingTop: 10,
  },
  capa: {
    width: 150,
    height: 200,
    borderRadius: 8,
  },
  semImagem: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#666",
  },
  nomeJogo: {
    color: "#F7C21E",
    fontWeight: "bold",
    marginVertical: 8,
    width: 150,
    textAlign: "center",
  },
  detalhesContainer: {
    flex: 1,
    backgroundColor: "#333131",
    padding: 15,
  },
  capaGrande: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  nomeJogoDetalhes: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F7C21E",
    marginBottom: 10,
    textAlign: "center",
  },
  texto: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F7C21E",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#000",
    backgroundColor: "#fff",
  },
  botao: {
    backgroundColor: "#F7C21E",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBotao: {
    fontSize: 16,
    fontWeight: "bold",
  },
  comentario: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  usuario: {
    fontWeight: "bold",
    color: "#F7C21E",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  userName: {
    color: "#F7C21E",
    fontWeight: "bold",
    fontSize: 16,
  },
});
