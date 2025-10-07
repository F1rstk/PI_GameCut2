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

// Função melhorada para fazer requisições
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    console.log(`🔗 Fazendo request para: ${url}`);
    console.log(`📦 Método: ${options.method || 'GET'}`);
    if (options.body) {
      console.log(`📄 Body: ${options.body}`);
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const responseText = await response.text();
    console.log(`📋 Resposta status: ${response.status}`);
    console.log(`📋 Resposta bruta: ${responseText.substring(0, 500)}`);

    try {
      const jsonData = JSON.parse(responseText);
      return jsonData;
    } catch (e) {
      console.log(`❌ Não é JSON válido`);
      return { erro: "Resposta não é JSON", _raw: responseText };
    }
  } catch (error) {
    console.error(`❌ Erro na requisição:`, error);
    return { erro: error.message };
  }
};

const PerfilScreen = ({ route, navigation }) => {
  const { user: usuarioLogado } = useContext(AuthContext);
  const idUsuarioLogado = usuarioLogado?.idUsuario;
  const idUsuarioPerfil = route?.params?.idUsuarioPerfil || idUsuarioLogado;
  const isMeuPerfil = idUsuarioPerfil === idUsuarioLogado;

  console.log("=== DEBUG PERFIL ===");
  console.log("idUsuarioLogado:", idUsuarioLogado);
  console.log("idUsuarioPerfil:", idUsuarioPerfil);

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

  const carregarUsuario = async () => {
    try {
      if (!idUsuarioPerfil) {
        setUsuario({ nomeUsuario: "ID não definido", bioUsuario: "" });
        return;
      }

      console.log("🔗 Enviando POST para getPerfil.php com ID:", idUsuarioPerfil);

      const data = await fetchWithErrorHandling(`${SERVER}/getPerfil.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idUsuario: idUsuarioPerfil
        })
      });

      console.log("📊 RESPOSTA DO PHP:", data);

      if (data.erro) {
        console.log("❌ Erro do PHP:", data.erro);
        setUsuario({
          nomeUsuario: "Erro: " + data.erro,
          bioUsuario: "",
          fotoUsuario: null
        });
        return;
      }

      if (data.usuario) {
        console.log("✅ Usuário encontrado:", data.usuario.nomeUsuario);
        setUsuario(data.usuario);
      } else {
        console.log("❌ Estrutura inesperada");
        setUsuario({
          nomeUsuario: "Usuário " + idUsuarioPerfil,
          bioUsuario: "Estrutura inesperada",
          fotoUsuario: null
        });
      }
        
    } catch (err) {
      console.error("Erro carregarUsuario:", err);
      setUsuario({
        nomeUsuario: "Erro de conexão",
        bioUsuario: "Tente novamente",
        fotoUsuario: null
      });
    }
  };

  const carregarContadores = async () => {
    try {
      // Tenta primeiro com GET (para compatibilidade com versões antigas)
      let data;
      
      // Tenta GET primeiro
      try {
        data = await fetchWithErrorHandling(
          `${SERVER}/contadores.php?idUsuario=${idUsuarioPerfil}&idUsuarioLogado=${idUsuarioLogado}`
        );
        console.log("✅ Contadores carregados via GET");
      } catch (err) {
        // Se GET falhar, tenta POST
        console.log("❌ GET falhou, tentando POST...");
        data = await fetchWithErrorHandling(`${SERVER}/contadores.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idUsuario: idUsuarioPerfil,
            idUsuarioLogado: idUsuarioLogado
          })
        });
        console.log("✅ Contadores carregados via POST");
      }
      
      if (!data.erro) {
        setSeguidores(Number(data.seguidores || 0));
        setSeguindo(Number(data.seguindo || 0));
        setJaSegue(Boolean(data.jaSegue || false));
        
        console.log("📊 Contadores:", {
          seguidores: data.seguidores,
          seguindo: data.seguindo,
          jaSegue: data.jaSegue
        });
      }
    } catch (err) {
      console.error("Erro carregarContadores:", err);
      setSeguidores(0);
      setSeguindo(0);
      setJaSegue(false);
    }
  };

  const carregarListasJogos = async () => {
    try {
      // Tenta primeiro com GET (para compatibilidade)
      let data;
      
      try {
        data = await fetchWithErrorHandling(
          `${SERVER}/listasJogos.php?idUsuario=${idUsuarioPerfil}`
        );
        console.log("✅ Listas carregadas via GET");
      } catch (err) {
        // Se GET falhar, tenta POST
        console.log("❌ GET falhou, tentando POST...");
        data = await fetchWithErrorHandling(`${SERVER}/listasJogos.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idUsuario: idUsuarioPerfil
          })
        });
        console.log("✅ Listas carregadas via POST");
      }

      console.log("📊 Dados das listas:", data);

      if (!data.erro) {
        // Tenta diferentes estruturas de resposta
        const listas = {
          queroJogar: data.queroJogar || data.quero_jogar || data[0]?.queroJogar || [],
          favoritos: data.favoritos || data[0]?.favoritos || [],
          jogando: data.jogando || data[0]?.jogando || [],
          completado: data.completado || data[0]?.completado || [],
        };

        console.log("🎮 Listas processadas:", {
          queroJogar: listas.queroJogar.length,
          favoritos: listas.favoritos.length,
          jogando: listas.jogando.length,
          completado: listas.completado.length
        });

        setListasJogos(listas);
      } else {
        console.log("❌ Erro ao carregar listas:", data.erro);
        setListasJogos({
          queroJogar: [],
          favoritos: [],
          jogando: [],
          completado: [],
        });
      }
    } catch (err) {
      console.error("Erro carregarListasJogos:", err);
      setListasJogos({
        queroJogar: [],
        favoritos: [],
        jogando: [],
        completado: [],
      });
    }
  };

  const carregarTudo = async () => {
    try {
      await Promise.all([
        carregarUsuario(),
        carregarContadores(),
        carregarListasJogos(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      setLoading(true);
      await carregarTudo();
      setLoading(false);
    };
    
    inicializar();
  }, [idUsuarioPerfil]);

  const alternarSeguir = async () => {
    try {
      const data = await fetchWithErrorHandling(`${SERVER}/seguir.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idSeguidor: idUsuarioLogado,
          idSeguido: idUsuarioPerfil,
        }),
      });
      
      if (data.success) {
        setJaSegue(data.action === "follow");
        carregarContadores();
      } else {
        Alert.alert("Erro", data.message || "Erro ao seguir/deixar de seguir");
      }
    } catch (err) {
      Alert.alert("Erro", "Falha na conexão com o servidor");
    }
  };

  const buscarUsuarios = async () => {
    if (!termoBusca.trim()) return;
    
    setBuscando(true);
    try {
      // Buscar usuários provavelmente ainda usa GET
      const data = await fetchWithErrorHandling(
        `${SERVER}/buscarUsuarios.php?nome=${encodeURIComponent(termoBusca)}`
      );
      
      console.log("👥 Usuários encontrados:", data);
      setUsuariosEncontrados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro buscarUsuarios:", err);
      setUsuariosEncontrados([]);
      Alert.alert("Erro", "Falha ao buscar usuários");
    } finally {
      setBuscando(false);
    }
  };

  const verPerfilUsuario = (idUsuario) => {
    setModalBuscaAberto(false);
    setTermoBusca("");
    
    if (idUsuario === idUsuarioLogado) {
      navigation.navigate("Perfil");
    } else {  
      navigation.navigate("Perfil", { idUsuarioPerfil: idUsuario });
    }
  };

  const voltarAoMeuPerfil = () => {
    navigation.navigate("Perfil");
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

  const ListaJogos = ({ jogos, titulo, tipo }) => {
    const [imagensCarregadas, setImagensCarregadas] = useState({});
  
    const buscarImagemJogo = async (nomeJogo, idJogo) => {
      try {
        const response = await fetch(
          `https://api.rawg.io/api/games?search=${encodeURIComponent(nomeJogo)}&key=${RAWG_API_KEY}`
        );
        
        const data = await response.json();
        
        if (data?.results?.length > 0) {
          const imagem = data.results[0].background_image;
          if (imagem) {
            setImagensCarregadas(prev => ({ ...prev, [idJogo]: imagem }));
            return imagem;
          }
        }
        return "https://i.imgur.com/5tj6S7O.jpg";
      } catch (error) {
        return "https://i.imgur.com/5tj6S7O.jpg";
      }
    };
  
    useEffect(() => {
      const carregarImagens = async () => {
        for (const jogo of jogos.slice(0, 5)) {
          if (jogo.idJogo && !imagensCarregadas[jogo.idJogo]) {
            await buscarImagemJogo(jogo.nomeJogo || jogo.nome, jogo.idJogo);
          }
        }
      };
  
      if (jogos.length > 0) {
        console.log(`🎮 Carregando imagens para ${titulo}:`, jogos.length, "jogos");
        carregarImagens();
      }
    }, [jogos]);
  
    return (
      <View style={styles.listaContainer}>
        <View style={styles.listaHeader}>
          <Text style={styles.listaTitulo}>{titulo}</Text>
          {jogos.length > 0 && (
            <TouchableOpacity onPress={() => verListaCompleta(tipo, titulo)}>
              <Text style={styles.verTodos}>Ver todos ({jogos.length})</Text>
            </TouchableOpacity>
          )}
        </View>
        {jogos.length === 0 ? (
          <Text style={styles.listaVazia}>Nenhum jogo</Text>
        ) : (
          <FlatList
            horizontal
            data={jogos.slice(0, 5)}
            keyExtractor={(item) => item.idJogo?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.jogoItem}
                onPress={() => navigation.navigate("DetalhesJogo", { 
                  jogo: {
                    ...item,
                    capa: imagensCarregadas[item.idJogo] || "https://i.pinimg.com/originals/8a/c1/29/8ac12962c05648c55ca85771f4a69b2d.gif",
                    nome: item.nomeJogo || item.nome,
                  }
                })}
              >
                <Image
                  source={{ 
                    uri: imagensCarregadas[item.idJogo] || "https://i.pinimg.com/originals/8a/c1/29/8ac12962c05648c55ca85771f4a69b2d.gif" 
                  }}
                  style={styles.jogoImagem}
                />
                <Text style={styles.jogoNome} numberOfLines={2}>
                  {item.nomeJogo || item.nome || "Jogo"}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={styles.carregandoTexto}>Carregando perfil...</Text>
      </View>
    );
  }

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
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity style={styles.botaoBuscar} onPress={buscarUsuarios}>
                <Text style={styles.textoBotao}>Buscar</Text>
              </TouchableOpacity>

              {buscando ? (
                <View style={styles.buscandoContainer}>
                  <ActivityIndicator size="small" color="#F7C21E" />
                  <Text style={styles.buscandoTexto}>Buscando...</Text>
                </View>
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
                  ListEmptyComponent={
                    termoBusca ? (
                      <Text style={styles.listaVazia}>Nenhum usuário encontrado</Text>
                    ) : null
                  }
                  style={styles.listaUsuarios}
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

      {/* Botões Flutuantes */}
      <View style={styles.botoesFlutuantes}>
        {/* Botão de Busca - SEMPRE VISÍVEL */}
        <TouchableOpacity
          style={[styles.botaoFlutuante, styles.botaoBuscaFlutuante]}
          onPress={() => setModalBuscaAberto(true)}
        >
          <Text style={styles.iconeBotaoFlutuante}>🔍</Text>
        </TouchableOpacity>

        {/* Botão Voltar ao Meu Perfil - VISÍVEL APENAS QUANDO NÃO ESTIVER NO PRÓPRIO PERFIL */}
        {!isMeuPerfil && (
          <TouchableOpacity
            style={[styles.botaoFlutuante, styles.botaoVoltarPerfil]}
            onPress={voltarAoMeuPerfil}
          >
            <Text style={styles.iconeBotaoFlutuante}>👤</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#111" 
  },
  carregandoTexto: {
    color: "#F7C21E", 
    marginTop: 10,
    fontSize: 16
  },
  
  header: { flexDirection: "row", padding: 20, alignItems: "center" },
  fotoPerfil: { width: 100, height: 100, borderRadius: 50, marginRight: 15 },
  infoContainer: { flex: 1 },
  nome: { color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  bio: { color: "#bbb", marginBottom: 15 },
  
  estatisticas: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: "#333" 
  },
  estatisticaItem: { alignItems: "center" },
  estatisticaNumero: { color: "#F7C21E", fontSize: 18, fontWeight: "bold" },
  estatisticaLabel: { color: "#fff", fontSize: 12 },
  
  listaContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#333" },
  listaHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 10 
  },
  listaTitulo: { color: "#F7C21E", fontSize: 18, fontWeight: "bold" },
  verTodos: { color: "#1DA1F2", fontSize: 12 },
  listaVazia: { color: "#666", textAlign: "center", padding: 20 },
  
  jogoItem: { width: 100, marginRight: 10, alignItems: "center" },
  jogoImagem: { width: 80, height: 120, borderRadius: 8, backgroundColor: "#333" },
  jogoNome: { color: "#fff", fontSize: 10, textAlign: "center", marginTop: 5 },
  
  botaoSeguir: { backgroundColor: "#1DA1F2", padding: 10, borderRadius: 8, alignItems: "center" },
  botaoSeguindo: { backgroundColor: "#333" },
  textoSeguir: { color: "#fff", fontWeight: "bold" },
  
  modalContainer: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.8)", 
    justifyContent: "center" 
  },
  modalContent: { 
    backgroundColor: "#222", 
    margin: 20, 
    padding: 20, 
    borderRadius: 10,
    maxHeight: '80%'
  },
  modalTitulo: { 
    color: "#F7C21E", 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 15, 
    textAlign: "center" 
  },
  
  inputBusca: { 
    backgroundColor: "#fff", 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10,
    color: "#000"
  },
  botaoBuscar: { 
    backgroundColor: "#1DA1F2", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center", 
    marginBottom: 15 
  },
  
  buscandoContainer: {
    alignItems: "center",
    padding: 20
  },
  buscandoTexto: {
    color: "#F7C21E",
    marginTop: 10
  },
  
  usuarioItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#333" 
  },
  usuarioFoto: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  usuarioNome: { color: "#fff", fontSize: 16 },
  listaUsuarios: {
    maxHeight: 200
  },
  
  botaoFechar: { 
    backgroundColor: "#E53935", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 10 
  },
  textoBotao: { color: "#fff", fontWeight: "bold" },
  
  // Estilos para os botões flutuantes
  botoesFlutuantes: {
    position: "absolute",
    right: 20,
    bottom: 20,
    alignItems: "flex-end",
  },
  botaoFlutuante: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    marginBottom: 15,
  },
  botaoBuscaFlutuante: {
    backgroundColor: "#F7C21E",
  },
  botaoVoltarPerfil: {
    backgroundColor: "#1DA1F2",
  },
  iconeBotaoFlutuante: { 
    fontSize: 24,
  },

  debugBox: { 
    backgroundColor: "#333", 
    padding: 10, 
    margin: 10, 
    borderRadius: 5 
  },
  debugText: { 
    color: "#F7C21E", 
    fontSize: 12,
    fontFamily: 'monospace'
  },
});

export default PerfilScreen;