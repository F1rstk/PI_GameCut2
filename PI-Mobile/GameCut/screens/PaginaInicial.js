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
  Alert,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";

async function fetchCapaRawg(nome) {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(nome)}&key=${RAWG_API_KEY}`
    );
    const json = await response.json();
    if (json?.results?.length > 0) {
      return json.results[0].background_image || null;
    }
    return null;
  } catch (e) {
    console.log("Erro ao buscar capa RAWG:", e);
    return null;
  }
}

// ===================== LISTA DE JOGOS =====================
function JogosScreen({ navigation }) {
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarJogos() {
      try {
        const res = await fetch("http://10.0.2.2/pibd/getJogos.php");
        const jogosData = await res.json();

        const jogosComImagem = await Promise.all(
          (jogosData || []).map(async (jogo) => {
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

  const handleJogoPress = (jogo) => {
    console.log("Navegando para DetalhesJogo com:", jogo);
    navigation.navigate("DetalhesJogo", { jogo });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={{ color: "#fff", marginTop: 8 }}>Carregando jogos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jogos}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={{ padding: 10 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleJogoPress(item)}
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

const STATUS = {
  QUERO_JOGAR: 1,
  FAVORITOS: 2,
  JOGANDO: 3,
  COMPLETADO: 4,
};

// ===================== DETALHES DO JOGO =====================
function DetalhesJogoScreen({ route, navigation }) {
  const { jogo } = route.params;
  const { user } = useContext(AuthContext);

  const [nota, setNota] = useState("");
  const [comentario, setComentario] = useState("");
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [novaNota, setNovaNota] = useState("");
  const [novoComentario, setNovoComentario] = useState("");
  const [statusJogo, setStatusJogo] = useState(null);
  const [notaApi, setNotaApi] = useState(null);
  const [notaApp, setNotaApp] = useState(null);
  const [loadingNotas, setLoadingNotas] = useState(true);
  const userId = user?.idUsuario;

  // Função para determinar a cor baseada na nota
  const getCorNota = (nota) => {
    if (nota === null || nota === undefined) return "#666";
    if (nota >= 0 && nota <= 1) return "#FF0000";
    if (nota > 1 && nota <= 2.5) return "#FFA500";
    if (nota > 2.5 && nota <= 3.5) return "#0000FF";
    if (nota > 3.5 && nota <= 4) return "#00FF00";
    if (nota > 4 && nota <= 5) return "#800080";
    return "#666";
  };

  // Componente de exibição de nota com cor
  const NotaVisual = ({ nota, titulo }) => (
    <View style={styles.notaContainer}>
      <Text style={styles.notaTitulo}>{titulo}</Text>
      <View style={[styles.notaCirculo, { backgroundColor: getCorNota(nota) }]}>
        <Text style={styles.notaTexto}>
          {nota !== null ? nota.toFixed(1) : "N/A"}
        </Text>
      </View>
    </View>
  );

  // Buscar nota da API RAWG
  const buscarNotaDaAPI = async () => {
    try {
      const response = await fetch(
        `https://api.rawg.io/api/games?search=${encodeURIComponent(jogo.nome)}&key=${RAWG_API_KEY}`
      );
      const data = await response.json();
      
      if (data?.results?.length > 0) {
        const jogoApi = data.results[0];
        const notaRawg = jogoApi.rating;
        setNotaApi(notaRawg ? parseFloat(notaRawg) : null);
      }
    } catch (error) {
      console.log("Erro ao buscar nota da API:", error);
    }
  };

  // Calcular nota média do aplicativo
  const calcularNotaApp = (avaliacoes) => {
    if (!avaliacoes || avaliacoes.length === 0) return null;
    
    const soma = avaliacoes.reduce((total, av) => total + parseInt(av.notaAvaliacao), 0);
    const media = soma / avaliacoes.length;
    return parseFloat(media.toFixed(1));
  };

  useEffect(() => {
    carregarAvaliacoes();
    carregarStatusJogo();
    buscarNotaDaAPI();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      const response = await fetch(
        `http://10.0.2.2/pibd/getAvaliacoes.php?jogo_id=${jogo.id}&usuario_logado_id=${userId}`
      );
      const data = await response.json();
      setAvaliacoes(Array.isArray(data) ? data : []);
      
      const notaCalculada = calcularNotaApp(data);
      setNotaApp(notaCalculada);
    } catch (error) {
      console.log("Erro ao carregar avaliações:", error);
    } finally {
      setLoadingNotas(false);
    }
  };

  const carregarStatusJogo = async () => {
    try {
      const response = await fetch(
        `http://10.0.2.2/pibd/getSalvarJogos.php?idUsuario=${userId}&idJogo=${jogo.id}`
      );
      const data = await response.json();
      
      if (data.favoritos && data.favoritos.length > 0) {
        setStatusJogo(STATUS.FAVORITOS);
      } else if (data.jogando && data.jogando.length > 0) {
        setStatusJogo(STATUS.JOGANDO);
      } else if (data.completado && data.completado.length > 0) {
        setStatusJogo(STATUS.COMPLETADO);
      } else if (data.queroJogar && data.queroJogar.length > 0) {
        setStatusJogo(STATUS.QUERO_JOGAR);
      } else {
        setStatusJogo(null);
      }
    } catch (error) {
      console.log("Erro ao carregar status do jogo:", error);
    }
  };

  const enviarAvaliacao = async () => {
    const n = Number(nota);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      Alert.alert("Atenção", "Digite uma nota válida entre 0 e 5.");
      return;
    }
    if (!comentario.trim()) {
      Alert.alert("Atenção", "Digite um comentário.");
      return;
    }
    
    try {
      const response = await fetch("http://10.0.2.2/pibd/salvarAvaliacao.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: userId,
          idJogo: jogo.id,
          notaAvaliacao: n,
          descricaoAvaliacao: comentario
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert("Sucesso", data.message || "Avaliação enviada com sucesso!");
        setNota("");
        setComentario("");
        carregarAvaliacoes();
      } else {
        Alert.alert("Erro", data.message || "Erro ao salvar avaliação.");
      }
    } catch (error) {
      console.log("Erro de conexão:", error);
      Alert.alert("Erro", "Erro de conexão com o servidor");
    }
  };

  const salvarEdicao = async (avaliacaoId) => {
    const n = Number(novaNota);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      Alert.alert("Atenção", "Digite uma nota válida entre 0 e 5.");
      return;
    }
    if (!novoComentario.trim()) {
      Alert.alert("Atenção", "Digite um comentário.");
      return;
    }
    
    try {
      const response = await fetch("http://10.0.2.2/pibd/editarAvaliacao.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idAvaliacao: avaliacaoId,
          nota: n,
          comentario: novoComentario
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert("Sucesso", data.message || "Avaliação editada com sucesso!");
        setEditandoId(null);
        setNovaNota("");
        setNovoComentario("");
        carregarAvaliacoes();
      } else {
        Alert.alert("Erro", data.message || "Erro ao editar avaliação.");
      }
    } catch (error) {
      console.log("Erro de conexão:", error);
      Alert.alert("Erro", "Erro de conexão com o servidor");
    }
  };

  const apagarAvaliacao = async (avaliacaoId) => {
    try {
      const response = await fetch("http://10.0.2.2/pibd/apagarAvaliacao.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idAvaliacao: avaliacaoId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert("Sucesso", data.message || "Avaliação apagada com sucesso!");
        carregarAvaliacoes();
      } else {
        Alert.alert("Erro", data.message || "Erro ao apagar avaliação.");
      }
    } catch (error) {
      console.log("Erro de conexão:", error);
      Alert.alert("Erro", "Erro de conexão com o servidor");
    }
  };

  const salvarStatusJogo = async (idTipoSalvar) => {
    try {
      const response = await fetch("http://10.0.2.2/pibd/salvarJogo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: userId,
          idJogo: jogo.id,
          idTipoSalvar: idTipoSalvar
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusJogo(idTipoSalvar);
        Alert.alert("Sucesso", data.message || "Status do jogo atualizado!");
      } else {
        Alert.alert("Erro", data.message || "Não foi possível salvar o status.");
      }
    } catch (error) {
      console.log("Erro ao salvar status:", error);
      Alert.alert("Erro", "Erro de conexão com o servidor");
    }
  };

  return (
    <View style={styles.detalhesContainer}>
      <FlatList
        data={[{ key: 'header' }, ...avaliacoes]}
        keyExtractor={(item, index) => item.key || String(item?.idAvaliacao ?? index)}
        ListHeaderComponent={
          <View>
            {jogo.capa && <Image source={{ uri: jogo.capa }} style={styles.capaGrande} />}

            <Text style={styles.nomeJogoDetalhes}>{jogo.nome}</Text>
            
            {/* EXIBIÇÃO DAS NOTAS */}
            <View style={styles.notasContainer}>
              <NotaVisual nota={notaApi} titulo="Nota da API" />
              <NotaVisual nota={notaApp} titulo="Nota do App" />
            </View>

            <Text style={styles.texto}>Gênero: {jogo.genero}</Text>
            <Text style={styles.texto}>Desenvolvedora: {jogo.desenvolvedora}</Text>
            <Text style={styles.texto}>Descrição: {jogo.descricao}</Text>

            <Text style={styles.subtitulo}>Meu Status</Text>
<View style={styles.statusContainer}>
  <TouchableOpacity
    style={[styles.statusBotao, { backgroundColor: statusJogo === STATUS.QUERO_JOGAR ? "#F7C21E" : "#555" }]}
    onPress={() => salvarStatusJogo(STATUS.QUERO_JOGAR)}
  >
    <Text style={styles.statusTexto}>Quero jogar</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.statusBotao, { backgroundColor: statusJogo === STATUS.FAVORITOS ? "#F7C21E" : "#555" }]}
    onPress={() => salvarStatusJogo(STATUS.FAVORITOS)}
  >
    <Text style={styles.statusTexto}>Favoritos</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.statusBotao, { backgroundColor: statusJogo === STATUS.JOGANDO ? "#F7C21E" : "#555" }]}
    onPress={() => salvarStatusJogo(STATUS.JOGANDO)}
  >
    <Text style={styles.statusTexto}>Jogando</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.statusBotao, { backgroundColor: statusJogo === STATUS.COMPLETADO ? "#F7C21E" : "#555" }]}
    onPress={() => salvarStatusJogo(STATUS.COMPLETADO)}
  >
    <Text style={styles.statusTexto}>Completado</Text>
  </TouchableOpacity>
</View>

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
            <TouchableOpacity style={[styles.botao, { marginBottom: 15 }]} onPress={enviarAvaliacao}>
              <Text style={styles.textoBotao}>Enviar Avaliação</Text>
            </TouchableOpacity>

            <Text style={styles.subtitulo}>Comentários</Text>
            {avaliacoes.length === 0 && <Text style={styles.texto}>Nenhuma avaliação ainda.</Text>}
          </View>
        }
        renderItem={({ item }) => {
          if (item.key === 'header') return null;
          
          const podeEditar = item?.podeEditar === 1;

          return (
            <View style={styles.comentario}>
              <View style={styles.comentarioHeader}>
                <Text style={styles.usuario}>{item?.nomeUsuario}</Text>
                <View style={[styles.notaPequena, { backgroundColor: getCorNota(item?.notaAvaliacao) }]}>
                  <Text style={styles.notaPequenaTexto}>{item?.notaAvaliacao}</Text>
                </View>
              </View>

              {podeEditar && editandoId !== item.idAvaliacao && (
                <View style={{ flexDirection: "row", marginTop: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditandoId(item.idAvaliacao);
                      setNovaNota(String(item?.notaAvaliacao ?? ""));
                      setNovoComentario(item?.descricaoAvaliacao ?? "");
                    }}
                    style={[styles.smallBtn, { backgroundColor: "#F7C21E", marginRight: 8 }]}
                  >
                    <Text style={styles.smallBtnTextDark}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Confirmação",
                        "Deseja realmente apagar seu comentário?",
                        [
                          { text: "Cancelar", style: "cancel" },
                          { text: "Apagar", onPress: () => apagarAvaliacao(item.idAvaliacao) },
                        ]
                      )
                    }
                    style={[styles.smallBtn, { backgroundColor: "#E53935" }]}
                  >
                    <Text style={styles.smallBtnText}>Apagar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {editandoId === item.idAvaliacao && podeEditar && (
                <>
                  <TextInput
                    style={[styles.input, { marginBottom: 6 }]}
                    keyboardType="numeric"
                    value={novaNota}
                    onChangeText={setNovaNota}
                    placeholder="Nova nota (0 a 5)"
                  />
                  <TextInput
                    style={[styles.input, { height: 60, marginBottom: 8 }]}
                    multiline
                    value={novoComentario}
                    onChangeText={setNovoComentario}
                    placeholder="Novo comentário"
                  />
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: "#4CAF50", marginRight: 8 }]}
                      onPress={() => salvarEdicao(item.idAvaliacao)}
                    >
                      <Text style={styles.smallBtnText}>Salvar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: "#9E9E9E" }]}
                      onPress={() => setEditandoId(null)}
                    >
                      <Text style={styles.smallBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <Text style={styles.texto}>{item?.descricaoAvaliacao}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

function NoticiasScreen() {
  return (
    <View style={styles.center}>
      <Text style={{ color: "#fff" }}>Página de Notícias</Text>
    </View>
  );
}

// ===================== STACK DE JOGOS =====================
function JogosStack() {
  const { user } = useContext(AuthContext);
  const nomeHeader = user?.nomeUsuario ? user.nomeUsuario.substring(0, 6) : "Usuário";

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
                source={user.fotoUsuario ? { uri: user.fotoUsuario } : require("../assets/user.jpg")}
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
        component={DetalhesJogoScreen} 
        options={{ title: "Detalhes do Jogo" }} 
      />
    </Stack.Navigator>
  );
}

// ===================== TABS =====================
export default function PaginaInicial() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#3C1F6F" },
        tabBarActiveTintColor: "#F7C21E",
        tabBarInactiveTintColor: "#D9D9D9",
      }}
    >
      <Tab.Screen
        name="JogosStack"
        component={JogosStack}
        options={{
          title: "Jogos",
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
  );
}

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
    paddingHorizontal: 10,
  },
  texto: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F7C21E",
    marginVertical: 10,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: "#333",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    textAlign: 'center',
  },
  botao: {
    backgroundColor: "#F7C21E",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  textoBotao: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  comentario: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    marginHorizontal: 15,
  },
  usuario: {
    fontWeight: "bold",
    color: "#F7C21E",
    textAlign: "left",
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  smallBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  smallBtnTextDark: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
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
  // NOVOS ESTILOS PARA CENTRALIZAR E ESPAÇAR
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statusBotao: {
    padding: 12,
    borderRadius: 8,
    margin: 8,
    minWidth: "40%",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  formContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  notasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  notaContainer: {
    alignItems: 'center',
  },
  notaTitulo: {
    color: '#F7C21E',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notaCirculo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  notaTexto: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notaPequena: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  notaPequenaTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  botoesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 10,
  }
});