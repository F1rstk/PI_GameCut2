import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { fotosMap } from "../contexts/fotosMap";

const SERVER = "http://10.0.2.2/pibd";

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

const ListaUsuariosScreen = ({ route, navigation }) => {
  const { user: usuarioLogado } = useContext(AuthContext);
  const { idUsuario, tipo, titulo } = route.params;

  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      
      console.log(`🔗 Carregando ${tipo} para usuário ${idUsuario}`);
      
      const data = await fetchWithErrorHandling(`${SERVER}/listaUsuarios.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idUsuario: idUsuario,
          tipo: tipo
        })
      });

      console.log("📊 Resposta da lista de usuários:", data);

      if (data && !data.erro) {
        // Verifica diferentes estruturas de resposta
        if (Array.isArray(data)) {
          setUsuarios(data);
        } else if (data.usuarios && Array.isArray(data.usuarios)) {
          setUsuarios(data.usuarios);
        } else if (data.seguidores && Array.isArray(data.seguidores)) {
          setUsuarios(data.seguidores);
        } else if (data.seguindo && Array.isArray(data.seguindo)) {
          setUsuarios(data.seguindo);
        } else {
          console.log("❌ Estrutura de dados inesperada:", data);
          setUsuarios([]);
        }
      } else {
        console.log("❌ Erro ao carregar usuários:", data?.erro);
        setUsuarios([]);
        Alert.alert("Erro", data?.erro || "Falha ao carregar lista de usuários");
      }
    } catch (err) {
      console.error("Erro carregarUsuarios:", err);
      setUsuarios([]);
      Alert.alert("Erro", "Falha na conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, [idUsuario, tipo]);

  const verPerfilUsuario = (idUsuarioAlvo) => {
    if (idUsuarioAlvo === usuarioLogado?.idUsuario) {
      // Se for o próprio usuário, vai para o próprio perfil
      navigation.navigate("Perfil");
    } else {
      // Se for outro usuário, vai para o perfil dele
      navigation.navigate("Perfil", { idUsuarioPerfil: idUsuarioAlvo });
    }
  };

  const renderizarUsuario = ({ item }) => (
    <TouchableOpacity
      style={styles.usuarioItem}
      onPress={() => verPerfilUsuario(item.idUsuario)}
    >
      <Image
        source={item.fotoUsuario ? fotosMap[item.fotoUsuario] : require('../assets/logo.png')}
        style={styles.usuarioFoto}
      />
      <View style={styles.usuarioInfo}>
        <Text style={styles.usuarioNome}>{item.nomeUsuario}</Text>
        {item.bioUsuario && (
          <Text style={styles.usuarioBio} numberOfLines={2}>
            {item.bioUsuario}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={styles.carregandoTexto}>Carregando {titulo.toLowerCase()}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        {titulo} ({usuarios.length})
      </Text>

      {usuarios.length === 0 ? (
        <View style={styles.listaVaziaContainer}>
          <Text style={styles.listaVaziaTexto}>
            {tipo === 'seguidores' 
              ? 'Nenhum seguidor' 
              : 'Não segue ninguém'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.idUsuario.toString()}
          renderItem={renderizarUsuario}
          contentContainerStyle={styles.listaContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  carregandoTexto: {
    color: "#F7C21E",
    marginTop: 10,
    fontSize: 16,
  },
  titulo: {
    color: "#F7C21E",
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  listaContainer: {
    padding: 10,
  },
  usuarioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  usuarioFoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNome: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  usuarioBio: {
    color: "#bbb",
    fontSize: 12,
  },
  listaVaziaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listaVaziaTexto: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
});

export default ListaUsuariosScreen;