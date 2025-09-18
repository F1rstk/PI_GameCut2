import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { fotosMap } from "../contexts/fotosMap";

const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";
const SERVER = "http://10.0.2.2/pibd";

const PerfilScreen = ({ route, navigation }) => {
  const { user: usuarioLogado } = useContext(AuthContext);
  const idUsuarioLogado = usuarioLogado?.idUsuario;
  const idUsuarioPerfil = route?.params?.idUsuarioPerfil || idUsuarioLogado;
  const isMeuPerfil = idUsuarioPerfil === idUsuarioLogado;

  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState({});
  const [seguidores, setSeguidores] = useState(0);
  const [seguindo, setSeguindo] = useState(0);
  const [jaSegue, setJaSegue] = useState(false);
  const [listasJogos, setListasJogos] = useState({
    queroJogar: [],
    favoritos: [],
    jogando: [],
    completado: [],
  });

  // Estados para busca e modal
  const [modalBuscaAberto, setModalBuscaAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [usuariosEncontrados, setUsuariosEncontrados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    carregarTudo();
  }, [idUsuarioPerfil]);

  const carregarTudo = async () => {
    setLoading(true);
    await Promise.all([
      carregarUsuario(),
      carregarContadores(),
      carregarListasJogos(),
    ]);
    setLoading(false);
  };

  const carregarUsuario = async () => {
    try {
      const res = await fetch(`${SERVER}/getPerfil.php?idUsuario=${idUsuarioPerfil}`);
      const data = await res.json();
      if (data && !data.erro) {
        setUsuario(data.usuario || {});
      }
    } catch (err) {
      console.error("Erro carregarUsuario:", err);
    }
  };

  const carregarContadores = async () => {
    try {
      const res = await fetch(
        `${SERVER}/contadores.php?idUsuario=${idUsuarioPerfil}&idUsuarioLogado=${idUsuarioLogado}`
      );
      const data = await res.json();
      setSeguidores(Number(data.seguidores ?? 0));
      setSeguindo(Number(data.seguindo ?? 0));
      setJaSegue(Boolean(Number(data.jaSegue ?? 0)));
    } catch (err) {
      console.error("Erro carregarContadores:", err);
    }
  };

  const carregarListasJogos = async () => {
    try {
      const res = await fetch(`${SERVER}/listasJogos.php?idUsuario=${idUsuarioPerfil}`);
      const data = await res.json();
      setListasJogos({
        queroJogar: data.queroJogar ?? [],
        favoritos: data.favoritos ?? [],
        jogando: data.jogando ?? [],
        completado: data.completado ?? [],
      });
    } catch (err) {
      console.error("Erro carregarListasJogos:", err);
    }
  };

  const alternarSeguir = async () => {
    try {
      const res = await fetch(`${SERVER}/seguir.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idSeguidor: idUsuarioLogado,
          idSeguido: idUsuarioPerfil,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJaSegue(data.action === "follow");
        carregarContadores();
      } else {
        Alert.alert("Erro", data.message || "Erro ao seguir/deixar de seguir");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha na conexão");
    }
  };

  const buscarUsuarios = async () => {
    if (!termoBusca.trim()) return;
    
    setBuscando(true);
    try {
      const res = await fetch(`${SERVER}/buscarUsuarios.php?nome=${encodeURIComponent(termoBusca)}`);
      const data = await res.json();
      setUsuariosEncontrados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro buscarUsuarios:", err);
    } finally {
      setBuscando(false);
    }
  };

  const verPerfilUsuario = (idUsuario) => {
    if (idUsuario === idUsuarioLogado) {
      navigation.navigate("Perfil");
    } else {
      navigation.push("Perfil", { idUsuarioPerfil: idUsuario });
    }
    setModalBuscaAberto(false);
    setTermoBusca("");
  };

  const verListaCompleta = (tipoLista, titulo) => {
    navigation.navigate("ListaJogos", {
      idUsuario: idUsuarioPerfil,
      tipoLista,
      titulo,
    });
  };

  const verSeguidores = () => {
    navigation.navigate("ListaUsuarios", {
      idUsuario: idUsuarioPerfil,
      tipo: "seguidores",
      titulo: "Seguidores",
    });
  };

  const verSeguindo = () => {
    navigation.navigate("ListaUsuarios", {
      idUsuario: idUsuarioPerfil,
      tipo: "seguindo",
      titulo: "Seguindo",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
      </View>
    );
  }

  const ListaJogos = ({ jogos, titulo, tipo }) => {
    const [imagensCarregadas, setImagensCarregadas] = useState({});
  
    // Função para buscar imagem da API
    const buscarImagemJogo = async (nomeJogo, idJogo) => {
      try {
        const response = await fetch(
          `https://api.rawg.io/api/games?search=${encodeURIComponent(nomeJogo)}&key=${RAWG_API_KEY}`
        );
        const data = await response.json();
        
        if (data?.results?.length > 0) {
          const jogo = data.results[0];
          const imagem = jogo.background_image || 
                        (jogo.short_screenshots && jogo.short_screenshots[0]?.image);
          
          if (imagem) {
            setImagensCarregadas(prev => ({
              ...prev,
              [idJogo]: imagem
            }));
            return imagem;
          }
        }
        return "https://i.imgur.com/5tj6S7O.jpg";
      } catch (error) {
        console.log("Erro ao buscar imagem:", error);
        return "https://i.imgur.com/5tj6S7O.jpg";
      }
    };
  
    // Efeito para carregar imagens quando a lista mudar
    useEffect(() => {
      const carregarImagens = async () => {
        for (const jogo of jogos.slice(0, 5)) {
          if (!imagensCarregadas[jogo.idJogo]) {
            await buscarImagemJogo(jogo.nomeJogo, jogo.idJogo);
          }
        }
      };
  
      carregarImagens();
    }, [jogos]);
  
    return (
      <View style={styles.listaContainer}>
        <View style={styles.listaHeader}>
          <Text style={styles.listaTitulo}>{titulo}</Text>
          {jogos.length > 0 && (
            <TouchableOpacity onPress={() => verListaCompleta(tipo, titulo)}>
              <Text style={styles.verTodos}>Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>
        {jogos.length === 0 ? (
          <Text style={styles.listaVazia}>Nenhum jogo</Text>
        ) : (
          <FlatList
            horizontal
            data={jogos.slice(0, 5)}
            keyExtractor={(item) => item.idJogo.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.jogoItem}
                onPress={() => navigation.navigate("DetalhesJogo", { 
                  jogo: {
                    ...item,
                    capa: imagensCarregadas[item.idJogo] || "https://i.pinimg.com/originals/8a/c1/29/8ac12962c05648c55ca85771f4a69b2d.gif",
                    nome: item.nomeJogo,
                    genero: item.generoJogo,
                    desenvolvedora: item.desenvolvedoraJogo,
                    descricao: item.descricaoJogo
                  }
                })}
              >
                <Image
                  source={{ 
                    uri: imagensCarregadas[item.idJogo] || "https://i.pinimg.com/originals/8a/c1/29/8ac12962c05648c55ca85771f4a69b2d.gif" 
                  }}
                  style={styles.jogoImagem}
                  onError={() => {
                    setImagensCarregadas(prev => ({
                      ...prev,
                      [item.idJogo]: "https://i.pinimg.com/originals/8a/c1/29/8ac12962c05648c55ca85771f4a69b2d.gif"
                    }));
                  }}
                />
                <Text style={styles.jogoNome} numberOfLines={2}>{item.nomeJogo}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header do Perfil */}
        <View style={styles.header}>
          <Image
            source={usuario.fotoUsuario ? fotosMap[usuario.fotoUsuario] : require('../assets/logo.png')}
            style={styles.fotoPerfil}
          />
          
          <View style={styles.infoContainer}>
            <Text style={styles.nome}>{usuario.nomeUsuario || "Usuário"}</Text>
            <Text style={styles.bio}>{usuario.bioUsuario || "Sem biografia"}</Text>
            
            {!isMeuPerfil && (
              <TouchableOpacity
                style={[styles.botaoSeguir, jaSegue && styles.botaoSeguindo]}
                onPress={alternarSeguir}
              >
                <Text style={styles.textoSeguir}>
                  {jaSegue ? "Seguindo" : "Seguir"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Estatísticas */}
        <View style={styles.estatisticas}>
          <TouchableOpacity style={styles.estatisticaItem} onPress={verSeguidores}>
            <Text style={styles.estatisticaNumero}>{seguidores}</Text>
            <Text style={styles.estatisticaLabel}>Seguidores</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.estatisticaItem} onPress={verSeguindo}>
            <Text style={styles.estatisticaNumero}>{seguindo}</Text>
            <Text style={styles.estatisticaLabel}>Seguindo</Text>
          </TouchableOpacity>
          
          <View style={styles.estatisticaItem}>
            <Text style={styles.estatisticaNumero}>{listasJogos.favoritos.length}</Text>
            <Text style={styles.estatisticaLabel}>Favoritos</Text>
          </View>
        </View>

        {/* Listas de Jogos */}
        <ListaJogos jogos={listasJogos.queroJogar} titulo="🎮 Quero Jogar" tipo="queroJogar" />
        <ListaJogos jogos={listasJogos.favoritos} titulo="⭐ Favoritos" tipo="favoritos" />
        <ListaJogos jogos={listasJogos.jogando} titulo="🔥 Jogando" tipo="jogando" />
        <ListaJogos jogos={listasJogos.completado} titulo="🏆 Completado" tipo="completado" />

        {/* Modal de Busca */}
        <Modal visible={modalBuscaAberto} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitulo}>Buscar Usuários</Text>
              
              <TextInput
                style={styles.inputBusca}
                placeholder="Digite o nome do usuário..."
                value={termoBusca}
                onChangeText={setTermoBusca}
                onSubmitEditing={buscarUsuarios}
              />
              
              <TouchableOpacity style={styles.botaoBuscar} onPress={buscarUsuarios}>
                <Text style={styles.textoBotao}>Buscar</Text>
              </TouchableOpacity>

              {buscando ? (
                <ActivityIndicator size="small" color="#F7C21E" />
              ) : (
                <FlatList
                  data={usuariosEncontrados}
                  keyExtractor={(item) => item.idUsuario.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.usuarioItem}
                      onPress={() => verPerfilUsuario(item.idUsuario)}
                    >
                      <Image
                        source={item.fotoUsuario ? fotosMap[item.fotoUsuario] : require('../assets/logo.png')}
                        style={styles.usuarioFoto}
                      />
                      <Text style={styles.usuarioNome}>{item.nomeUsuario}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              <TouchableOpacity
                style={styles.botaoFechar}
                onPress={() => setModalBuscaAberto(false)}
              >
                <Text style={styles.textoBotao}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Botão de Busca flutuante */}
      {isMeuPerfil && (
        <TouchableOpacity
          style={styles.botaoBuscaFlutuante}
          onPress={() => setModalBuscaAberto(true)}
        >
          <Text style={styles.iconeBusca}>🔍</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" },
  
  header: { flexDirection: "row", padding: 20, alignItems: "center" },
  fotoPerfil: { width: 100, height: 100, borderRadius: 50, marginRight: 15 },
  infoContainer: { flex: 1 },
  nome: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  bio: { color: "#bbb", marginBottom: 15 },
  
  estatisticas: { flexDirection: "row", justifyContent: "space-around", padding: 15, borderBottomWidth: 1, borderBottomColor: "#333" },
  estatisticaItem: { alignItems: "center" },
  estatisticaNumero: { color: "#F7C21E", fontSize: 18, fontWeight: "bold" },
  estatisticaLabel: { color: "#fff", fontSize: 12 },
  
  listaContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#333" },
  listaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  listaTitulo: { color: "#F7C21E", fontSize: 18, fontWeight: "bold" },
  verTodos: { color: "#1DA1F2", fontSize: 12 },
  listaVazia: { color: "#666", textAlign: "center", padding: 20 },
  
  jogoItem: { width: 100, marginRight: 10, alignItems: "center" },
  jogoImagem: { width: 80, height: 120, borderRadius: 8, backgroundColor: "#333" },
  jogoNome: { color: "#fff", fontSize: 10, textAlign: "center", marginTop: 5 },
  
  botaoSeguir: { backgroundColor: "#1DA1F2", padding: 10, borderRadius: 8, alignItems: "center" },
  botaoSeguindo: { backgroundColor: "#333" },
  textoSeguir: { color: "#fff", fontWeight: "bold" },
  
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center" },
  modalContent: { backgroundColor: "#222", margin: 20, padding: 20, borderRadius: 10 },
  modalTitulo: { color: "#F7C21E", fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  
  inputBusca: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
  botaoBuscar: { backgroundColor: "#1DA1F2", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 15 },
  
  usuarioItem: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: 1, borderBottomColor: "#333" },
  usuarioFoto: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  usuarioNome: { color: "#fff", fontSize: 16 },
  
  botaoFechar: { backgroundColor: "#E53935", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  
  botaoBuscaFlutuante: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#F7C21E",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  iconeBusca: { fontSize: 24 },
});

export default PerfilScreen;