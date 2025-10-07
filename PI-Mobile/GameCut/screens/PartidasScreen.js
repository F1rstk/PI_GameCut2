import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

const SERVER = "http://10.0.2.2/pibd";
const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";
const { width } = Dimensions.get('window');

// Função para buscar capa na RAWG API (mesma lógica do código anterior)
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

const PartidasScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [partidaSelecionada, setPartidaSelecionada] = useState(null);
  const [detalhesPartida, setDetalhesPartida] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'minhas', 'participando'

  useEffect(() => {
    carregarPartidas();
  }, [filtro]);

  const carregarPartidas = async () => {
    try {
      setLoading(true);
      let url = `${SERVER}/getPartidas.php`;
      
      if (filtro === 'minhas' || filtro === 'participando') {
        url = `${SERVER}/getPartidasUsuario.php?idUsuario=${user.idUsuario}`;
      }

      console.log('📡 Carregando partidas da URL:', url);
      
      const response = await fetch(url);
      const responseText = await response.text();
      console.log('📥 Resposta bruta:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Erro ao fazer parse do JSON:', e);
        throw new Error('Resposta inválida do servidor');
      }
      
      console.log('📊 Dados recebidos:', data);
      
      if (data.success) {
        let partidasFiltradas = data.partidas || [];
        
        if (filtro === 'minhas') {
          partidasFiltradas = partidasFiltradas.filter(p => p.tipoParticipacao === 'criador');
        } else if (filtro === 'participando') {
          partidasFiltradas = partidasFiltradas.filter(p => p.tipoParticipacao === 'participante');
        }
        
        // Processar partidas e buscar capas
        const partidasComCapas = await Promise.all(
          partidasFiltradas.map(async (partida) => {
            let capaUrl = partida.imagemJogo;
            
            // Se não tem capa, busca na RAWG API
            if (!capaUrl && partida.nomeJogo) {
              capaUrl = await fetchCapaRawg(partida.nomeJogo);
            }
            
            // Imagem padrão se não encontrar
            if (!capaUrl) {
              capaUrl = 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.jpg';
            }
            
            return {
              ...partida,
              imagemJogo: capaUrl
            };
          })
        );
        
        setPartidas(partidasComCapas);
      } else {
        console.error('❌ Erro do servidor:', data.error);
        Alert.alert('Erro', data.error || 'Erro ao carregar partidas');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar partidas:', error);
      Alert.alert('Erro', 'Falha ao conectar com o servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const carregarDetalhesPartida = async (idPartida) => {
    setCarregandoDetalhes(true);
    try {
      console.log('📡 Carregando detalhes da partida:', idPartida);
      
      const response = await fetch(`${SERVER}/getDetalhesPartida.php?idPartida=${idPartida}`);
      const responseText = await response.text();
      console.log('📥 Resposta detalhes:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Erro ao fazer parse do JSON:', e);
        throw new Error('Resposta inválida do servidor');
      }
      
      if (data.success) {
        // Buscar capa para os detalhes também
        let capaUrl = data.partida?.imagemJogo;
        if (!capaUrl && data.partida?.nomeJogo) {
          capaUrl = await fetchCapaRawg(data.partida.nomeJogo);
        }
        
        if (!capaUrl) {
          capaUrl = 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.jpg';
        }
        
        setDetalhesPartida({
          ...data,
          partida: {
            ...data.partida,
            imagemJogo: capaUrl
          }
        });
      } else {
        console.error('❌ Erro ao carregar detalhes:', data.error);
        Alert.alert('Erro', data.error || 'Erro ao carregar detalhes da partida');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Falha ao carregar detalhes da partida');
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  const abrirDetalhesPartida = (partida) => {
    setPartidaSelecionada(partida);
    setModalVisible(true);
    carregarDetalhesPartida(partida.idPartida);
  };

  const formatarData = (dataString) => {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const formatarDuracao = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarPartidas();
  };

  const renderItemPartida = ({ item }) => (
    <TouchableOpacity 
      style={styles.cardPartida}
      onPress={() => abrirDetalhesPartida(item)}
    >
      {item.imagemJogo ? (
        <Image
          source={{ uri: item.imagemJogo }}
          style={styles.imagemJogo}
          defaultSource={require('../assets/logo.png')}
        />
      ) : (
        <View style={[styles.imagemJogo, styles.semImagem]}>
          <Text style={{ color: "#fff", fontSize: 10, textAlign: 'center' }}>Sem imagem</Text>
        </View>
      )}
      
      <View style={styles.infoPartida}>
        <Text style={styles.nomeJogo} numberOfLines={1}>{item.nomeJogo}</Text>
        
        <View style={styles.infoLinha}>
          <Text style={styles.dataPartida}>
            📅 {formatarData(item.dataPartida)}
          </Text>
        </View>
        
        <View style={styles.infoLinha}>
          <Text style={styles.duracaoPartida}>
            ⏱️ {formatarDuracao(item.duracaoMinutos)}
          </Text>
          <Text style={styles.jogadoresPartida}>
            👥 {item.totalJogadores || 0} jogadores
          </Text>
        </View>
        
        <View style={styles.infoLinha}>
          <View style={styles.criadorContainer}>
            <Image
              source={{ uri: item.fotoCriador || 'https://via.placeholder.com/40' }}
              style={styles.fotoCriador}
              defaultSource={require('../assets/user.jpg')}
            />
            <Text style={styles.nomeCriador}>
              Por: {item.nomeCriador || 'Desconhecido'}
              {item.idCriador === user.idUsuario && ' (Você)'}
            </Text>
          </View>
        </View>

        {item.meuResultado !== undefined && (
          <View style={[
            styles.badgeResultado,
            item.meuResultado === 1 ? styles.badgeVitoria : styles.badgeDerrota
          ]}>
            <Text style={styles.textoBadge}>
              {item.meuResultado === 1 ? '🎯 Vitória' : '💥 Derrota'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderJogadorItem = ({ item }) => (
    <View style={styles.jogadorItem}>
      <Image
        source={{ uri: item.fotoUsuario || 'https://via.placeholder.com/40' }}
        style={styles.fotoJogador}
        defaultSource={require('../assets/user.jpg')}
      />
      <View style={styles.infoJogador}>
        <Text style={styles.nomeJogador}>
          {item.nomeUsuario || 'Jogador'}
          {item.idUsuario === user.idUsuario && ' (Você)'}
        </Text>
        <Text style={styles.tempoJogador}>
          ⏱️ {formatarDuracao(item.tempoJogadoMinutos || 0)}
        </Text>
      </View>
      <View style={[
        styles.badgeResultadoJogador,
        item.resultado === 1 ? styles.badgeVitoria : styles.badgeDerrota
      ]}>
        <Text style={styles.textoBadgeJogador}>
          {item.resultado === 1 ? '🎯' : '💥'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#3C1F6F" barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.titulo}>Partidas</Text>
        </View>
        <View style={styles.carregandoContainer}>
          <ActivityIndicator size="large" color="#F7C21E" />
          <Text style={styles.textoCarregando}>Carregando partidas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3C1F6F" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Partidas</Text>
        <TouchableOpacity 
          style={styles.botaoNovaPartida}
          onPress={() => navigation.navigate('CriarPartida')}
        >
          <Text style={styles.textoBotaoNova}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroBotao, filtro === 'todas' && styles.filtroAtivo]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.textoFiltro, filtro === 'todas' && styles.textoFiltroAtivo]}>
            Todas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filtroBotao, filtro === 'minhas' && styles.filtroAtivo]}
          onPress={() => setFiltro('minhas')}
        >
          <Text style={[styles.textoFiltro, filtro === 'minhas' && styles.textoFiltroAtivo]}>
            Minhas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filtroBotao, filtro === 'participando' && styles.filtroAtivo]}
          onPress={() => setFiltro('participando')}
        >
          <Text style={[styles.textoFiltro, filtro === 'participando' && styles.textoFiltroAtivo]}>
            Participando
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Partidas */}
      <FlatList
        data={partidas}
        keyExtractor={(item) => item.idPartida?.toString() || Math.random().toString()}
        renderItem={renderItemPartida}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#F7C21E']}
            tintColor="#F7C21E"
          />
        }
        ListEmptyComponent={
          <View style={styles.listaVazia}>
            <Text style={styles.textoListaVazia}>
              {filtro === 'todas' 
                ? 'Nenhuma partida encontrada' 
                : filtro === 'minhas' 
                ? 'Você ainda não criou partidas' 
                : 'Você não está participando de partidas'
              }
            </Text>
            <TouchableOpacity 
              style={styles.botaoCriarPartida}
              onPress={() => navigation.navigate('CriarPartida')}
            >
              <Text style={styles.textoBotaoCriar}>Criar Primeira Partida</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={partidas.length === 0 ? styles.listaVaziaContainer : styles.listaContainer}
      />

      {/* Modal de Detalhes */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {carregandoDetalhes ? (
              <View style={styles.carregandoDetalhes}>
                <ActivityIndicator size="large" color="#F7C21E" />
                <Text style={styles.textoCarregando}>Carregando detalhes...</Text>
              </View>
            ) : detalhesPartida ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitulo}>Detalhes da Partida</Text>
                  <TouchableOpacity 
                    style={styles.botaoFecharModal}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.textoFecharModal}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Informações do Jogo */}
                  <View style={styles.secaoModal}>
                    <View style={styles.jogoInfoModal}>
                      {detalhesPartida.partida?.imagemJogo ? (
                        <Image
                          source={{ uri: detalhesPartida.partida.imagemJogo }}
                          style={styles.imagemJogoModal}
                          defaultSource={require('../assets/logo.png')}
                        />
                      ) : (
                        <View style={[styles.imagemJogoModal, styles.semImagem]}>
                          <Text style={{ color: "#fff", fontSize: 12, textAlign: 'center' }}>Sem imagem</Text>
                        </View>
                      )}
                      <View style={styles.jogoDetalhesModal}>
                        <Text style={styles.nomeJogoModal}>
                          {detalhesPartida.partida?.nomeJogo || 'Jogo não encontrado'}
                        </Text>
                        <Text style={styles.generoJogoModal}>
                          {detalhesPartida.partida?.generoJogo || 'Gênero não informado'}
                        </Text>
                        <Text style={styles.dataPartidaModal}>
                          📅 {formatarData(detalhesPartida.partida?.dataPartida)}
                        </Text>
                        <Text style={styles.duracaoPartidaModal}>
                          ⏱️ {formatarDuracao(detalhesPartida.partida?.duracaoMinutos || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Estatísticas */}
                  {detalhesPartida.estatisticas && (
                    <View style={styles.secaoModal}>
                      <Text style={styles.subtituloModal}>Estatísticas</Text>
                      <View style={styles.estatisticasContainer}>
                        <View style={styles.estatisticaItem}>
                          <Text style={styles.estatisticaNumero}>
                            {detalhesPartida.estatisticas.totalJogadores || 0}
                          </Text>
                          <Text style={styles.estatisticaLabel}>Jogadores</Text>
                        </View>
                        <View style={styles.estatisticaItem}>
                          <Text style={styles.estatisticaNumero}>
                            {detalhesPartida.estatisticas.totalVitorias || 0}
                          </Text>
                          <Text style={styles.estatisticaLabel}>Vitórias</Text>
                        </View>
                        <View style={styles.estatisticaItem}>
                          <Text style={styles.estatisticaNumero}>
                            {detalhesPartida.estatisticas.totalDerrotas || 0}
                          </Text>
                          <Text style={styles.estatisticaLabel}>Derrotas</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Jogadores */}
                  {detalhesPartida.jogadores && (
                    <View style={styles.secaoModal}>
                      <Text style={styles.subtituloModal}>
                        Jogadores ({detalhesPartida.jogadores.length})
                      </Text>
                      <FlatList
                        data={detalhesPartida.jogadores}
                        keyExtractor={(item) => item.idUsuario?.toString() || Math.random().toString()}
                        renderItem={renderJogadorItem}
                        scrollEnabled={false}
                      />
                    </View>
                  )}
                </ScrollView>
              </>
            ) : (
              <View style={styles.carregandoDetalhes}>
                <Text style={styles.textoCarregando}>Erro ao carregar detalhes</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    backgroundColor: '#3C1F6F',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    color: '#F7C21E',
    fontSize: 20,
    fontWeight: 'bold',
  },
  botaoNovaPartida: {
    backgroundColor: '#F7C21E',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  textoBotaoNova: {
    color: '#3C1F6F',
    fontWeight: 'bold',
  },
  filtrosContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1a1a1a',
  },
  filtroBotao: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  filtroAtivo: {
    backgroundColor: '#3C1F6F',
  },
  textoFiltro: {
    color: '#888',
    fontWeight: 'bold',
  },
  textoFiltroAtivo: {
    color: '#F7C21E',
  },
  listaContainer: {
    padding: 10,
  },
  listaVaziaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPartida: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  imagemJogo: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 15,
  },
  semImagem: {
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#666" 
  },
  infoPartida: {
    flex: 1,
  },
  nomeJogo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  dataPartida: {
    color: '#F7C21E',
    fontSize: 12,
  },
  duracaoPartida: {
    color: '#888',
    fontSize: 12,
  },
  jogadoresPartida: {
    color: '#888',
    fontSize: 12,
  },
  criadorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fotoCriador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
  },
  nomeCriador: {
    color: '#888',
    fontSize: 12,
  },
  badgeResultado: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  badgeVitoria: {
    backgroundColor: '#4CAF50',
  },
  badgeDerrota: {
    backgroundColor: '#F44336',
  },
  textoBadge: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  carregandoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCarregando: {
    color: '#F7C21E',
    marginTop: 10,
  },
  listaVazia: {
    alignItems: 'center',
    padding: 40,
  },
  textoListaVazia: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  botaoCriarPartida: {
    backgroundColor: '#F7C21E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  textoBotaoCriar: {
    color: '#3C1F6F',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitulo: {
    color: '#F7C21E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  botaoFecharModal: {
    padding: 5,
  },
  textoFecharModal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 20,
  },
  secaoModal: {
    marginBottom: 20,
  },
  jogoInfoModal: {
    flexDirection: 'row',
  },
  imagemJogoModal: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  jogoDetalhesModal: {
    flex: 1,
  },
  nomeJogoModal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  generoJogoModal: {
    color: '#F7C21E',
    fontSize: 14,
    marginBottom: 5,
  },
  dataPartidaModal: {
    color: '#888',
    fontSize: 14,
    marginBottom: 3,
  },
  duracaoPartidaModal: {
    color: '#888',
    fontSize: 14,
  },
  subtituloModal: {
    color: '#F7C21E',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  estatisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  estatisticaItem: {
    alignItems: 'center',
  },
  estatisticaNumero: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  estatisticaLabel: {
    color: '#888',
    fontSize: 12,
  },
  jogadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fotoJogador: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  infoJogador: {
    flex: 1,
  },
  nomeJogador: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tempoJogador: {
    color: '#888',
    fontSize: 12,
  },
  badgeResultadoJogador: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textoBadgeJogador: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  carregandoDetalhes: {
    padding: 40,
    alignItems: 'center',
  },
});

export default PartidasScreen;