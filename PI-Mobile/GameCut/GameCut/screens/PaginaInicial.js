import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthContext } from "../contexts/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";
const UserContext = React.createContext();

async function fetchCapaRawg(nome) {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(
        nome
      )}&key=${RAWG_API_KEY}`
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

function DetalhesJogo({ route }) {
  const { jogo } = route.params;
  return (
    <View style={styles.detalhesContainer}>
      {jogo.capa && <Image source={{ uri: jogo.capa }} style={styles.capaGrande} />}
      <Text style={styles.nomeJogoDetalhes}>{jogo.nome}</Text>
      <Text style={styles.texto}>Gênero: {jogo.genero}</Text>
      <Text style={styles.texto}>Desenvolvedora: {jogo.desenvolvedora}</Text>
      <Text style={styles.texto}>Descrição: {jogo.descricao}</Text>
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

function JogosStack() {
  const user = useContext(UserContext);

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
                    : require("../assets/user.jpg") // padrão se não tiver avatar
                }
                style={styles.userAvatar}
              />
              <Text style={styles.userName}>{user.nome}</Text>
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

export default function PaginaInicial() {
  const { user } = useContext(AuthContext); // pega usuário logado do contexto

  // Aqui definimos um avatar padrão caso o usuário não tenha
  const userComAvatar = user
    ? { ...user, avatar: user.avatar || "https://uploads.jovemnerd.com.br/wp-content/uploads/2023/10/004__108uf17.webp" }
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
        <Tab.Screen name="Jogos" component={JogosStack} />
        <Tab.Screen name="Notícias" component={NoticiasScreen} />
      </Tab.Navigator>
    </UserContext.Provider>
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
    padding: 15,
    alignItems: "center",
  },
  capaGrande: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 15,
  },
  nomeJogoDetalhes: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F7C21E",
    marginBottom: 10,
  },
  texto: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
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
