import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const SERVER = "http://10.0.2.2/pibd";
const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";
const { width } = Dimensions.get('window');

// Função para buscar capa na RAWG API (igual ao código anterior)
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

const CriarPartidaScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  
  // Estados para dados da partida
  const [jogos, setJogos] = useState([]);
  const [jogosFiltrados, setJogosFiltrados] = useState([]);
  const [buscaJogo, setBuscaJogo] = useState('');
  const [jogoSelecionado, setJogoSelecionado] = useState(null);
  
  // Estados para data/hora
  const [dataPartida, setDataPartida] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Estados para duração
  const [duracaoHoras, setDuracaoHoras] = useState('1');
  const [duracaoMinutos, setDuracaoMinutos] = useState('0');
  const [showPickerHoras, setShowPickerHoras] = useState(false);
  const [showPickerMinutos, setShowPickerMinutos] = useState(false);
  
  // Estados para jogadores
  const [jogadores, setJogadores] = useState([]);
  const [buscaJogador, setBuscaJogador] = useState('');
  const [jogadoresEncontrados, setJogadoresEncontrados] = useState([]);
  const [modalJogadores, setModalJogadores] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingJogos, setLoadingJogos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Opções para duração
  const horasOptions = Array.from({ length: 25 }, (_, i) => i.toString());
  const minutosOptions = ['0', '15', '30', '45'];

  // Efeito inicial
  useEffect(() => {
    carregarJogos();
    // Adiciona o usuário atual como primeiro jogador
    setJogadores([{
      idUsuario: user.idUsuario,
      nomeUsuario: user.nomeUsuario || user.nome,
      fotoUsuario: user.fotoUsuario,
      resultado: 1, // Vitória como padrão para o criador
      tempoJogado: calcularTempoTotalMinutos()
    }]);
  }, []);

  // Carregar jogos da API com capas da RAWG (lógica similar ao código anterior)
  const carregarJogos = async () => {
    setLoadingJogos(true);
    try {
      const response = await fetch(`${SERVER}/getJogos.php`);
      const jogosData = await response.json();

      // Processar jogos e buscar capas - mesma lógica do código anterior
      const jogosComImagem = await Promise.all(
        (jogosData || []).map(async (jogo) => {
          // Usar a mesma função fetchCapaRawg do código anterior
          const capa = await fetchCapaRawg(jogo.nome);
          
          return { 
            idJogo: jogo.id,
            nome: jogo.nome,
            genero: jogo.genero,
            desenvolvedora: jogo.desenvolvedora,
            descricao: jogo.descricao,
            imagem: capa || 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.jpg'
          };
        })
      );
      
      setJogos(jogosComImagem);
      setJogosFiltrados(jogosComImagem);
      
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
      Alert.alert('Erro', 'Falha ao conectar com o servidor');
    } finally {
      setLoadingJogos(false);
    }
  };

  // Buscar jogadores
  const buscarJogadores = async (nome) => {
    if (nome.length < 2) {
      setJogadoresEncontrados([]);
      return;
    }
    
    try {
      const response = await fetch(`${SERVER}/buscarUsuarios.php?nome=${encodeURIComponent(nome)}`);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const jogadoresFiltrados = data.filter(jogador => 
          jogador.idUsuario !== user.idUsuario &&
          !jogadores.find(j => j.idUsuario === jogador.idUsuario)
        );
        setJogadoresEncontrados(jogadoresFiltrados);
      }
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error);
    }
  };

  // Filtrar jogos
  const filtrarJogos = (texto) => {
    setBuscaJogo(texto);
    if (texto.trim() === '') {
      setJogosFiltrados(jogos);
    } else {
      const filtrados = jogos.filter(jogo =>
        jogo.nome.toLowerCase().includes(texto.toLowerCase())
      );
      setJogosFiltrados(filtrados);
    }
  };

  // Adicionar jogador
  const adicionarJogador = (jogador) => {
    if (jogadores.length >= 20) {
      Alert.alert('Limite atingido', 'Máximo de 20 jogadores permitido');
      return;
    }
    
    if (jogadores.find(j => j.idUsuario === jogador.idUsuario)) {
      Alert.alert('Jogador já adicionado', 'Este jogador já está na partida');
      return;
    }
    
    setJogadores([...jogadores, {
      ...jogador,
      resultado: 0,
      tempoJogado: calcularTempoTotalMinutos()
    }]);
    setBuscaJogador('');
    setJogadoresEncontrados([]);
  };

  // Remover jogador
  const removerJogador = (idUsuario) => {
    if (idUsuario === user.idUsuario) {
      Alert.alert('Ação não permitida', 'Você não pode remover a si mesmo da partida');
      return;
    }
    setJogadores(jogadores.filter(j => j.idUsuario !== idUsuario));
  };

  // Alterar resultado do jogador
  const alterarResultado = (idUsuario, resultado) => {
    setJogadores(jogadores.map(jogador =>
      jogador.idUsuario === idUsuario ? { 
        ...jogador, 
        resultado,
        tempoJogado: calcularTempoTotalMinutos()
      } : jogador
    ));
  };

  // Calcular tempo total em minutos
  const calcularTempoTotalMinutos = () => {
    const horas = parseInt(duracaoHoras) || 0;
    const minutos = parseInt(duracaoMinutos) || 0;
    return (horas * 60) + minutos;
  };

  // Formatar data para MySQL
  const formatarDataHoraMySQL = () => {
    return dataPartida.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Função principal para criar partida
  const criarPartida = async () => {
    setLoading(true);
    
    try {
      // Validações
      if (!jogoSelecionado) {
        Alert.alert('Erro', 'Selecione um jogo antes de criar a partida');
        return;
      }

      const tempoTotal = calcularTempoTotalMinutos();
      if (tempoTotal <= 0) {
        Alert.alert('Erro', 'Selecione uma duração válida para a partida');
        return;
      }

      // Preparar dados para envio
  // PREPARAR DADOS PARA ENVIO - VERSÃO CORRIGIDA
const dadosEnviar = {
  idJogo: jogoSelecionado.idJogo,
  dataPartida: formatarDataHoraMySQL(),
  duracaoMinutos: tempoTotal,
  idCriador: user.idUsuario,
  jogadores: jogadores.map(jogador => ({
    idUsuario: jogador.idUsuario,
    resultado: jogador.resultado,
    tempoJogado: jogador.tempoJogado
  }))
};

      console.log('📤 Enviando dados:', dadosEnviar);

      const partidaResponse = await fetch(`${SERVER}/criarPartida.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEnviar),
      });

      const responseText = await partidaResponse.text();
      console.log('📥 Resposta:', responseText);

      let partidaData;
      try {
        partidaData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Resposta inválida do servidor: ${responseText.substring(0, 200)}`);
      }
      
      if (!partidaData.success) {
        throw new Error(partidaData.message || 'Erro ao criar partida');
      }
      
      Alert.alert('✅ Sucesso', 'Partida criada com sucesso!', [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate('Partidas') 
        }
      ]);
      
    } catch (error) {
      console.error('❌ Erro:', error);
      Alert.alert('❌ Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh control
  const onRefresh = () => {
    setRefreshing(true);
    carregarJogos().then(() => setRefreshing(false));
  };

  // Renderizar item do jogo
  const renderJogoItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.jogoCard,
        jogoSelecionado?.idJogo === item.idJogo && styles.jogoSelecionado
      ]}
      onPress={() => setJogoSelecionado(item)}
    >
      {item.imagem ? (
        <Image
          source={{ uri: item.imagem }}
          style={styles.jogoImagem}
          defaultSource={require('../assets/logo.png')}
        />
      ) : (
        <View style={[styles.jogoImagem, styles.semImagem]}>
          <Text style={{ color: "#fff", fontSize: 12 }}>Sem imagem</Text>
        </View>
      )}
      <View style={styles.jogoInfo}>
        <Text style={styles.jogoNome} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.jogoGenero} numberOfLines={1}>{item.genero}</Text>
        <Text style={styles.jogoDev} numberOfLines={1}>{item.desenvolvedora}</Text>
      </View>
    </TouchableOpacity>
  );

  // Renderizar item do jogador
  const renderJogadorItem = ({ item }) => (
    <View style={styles.jogadorItem}>
      <Image
        source={item.fotoUsuario ? { uri: item.fotoUsuario } : require('../assets/user.jpg')}
        style={styles.jogadorFoto}
      />
      <View style={styles.jogadorInfo}>
        <Text style={styles.jogadorNome}>
          {item.nomeUsuario || item.nome}
          {item.idUsuario === user.idUsuario && ' (Você)'}
        </Text>
        <View style={styles.resultadoContainer}>
          <TouchableOpacity
            style={[
              styles.botaoResultado,
              item.resultado === 1 && styles.vitoriaSelecionada
            ]}
            onPress={() => alterarResultado(item.idUsuario, 1)}
          >
            <Text style={styles.textoBotaoResultado}>🎯 Vitória</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.botaoResultado,
              item.resultado === 0 && styles.derrotaSelecionada
            ]}
            onPress={() => alterarResultado(item.idUsuario, 0)}
          >
            <Text style={styles.textoBotaoResultado}>💥 Derrota</Text>
          </TouchableOpacity>
        </View>
      </View>
      {item.idUsuario !== user.idUsuario && (
        <TouchableOpacity 
          style={styles.botaoRemover}
          onPress={() => removerJogador(item.idUsuario)}
        >
          <Text style={styles.textoRemover}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Renderizar jogador encontrado
  const renderJogadorEncontrado = ({ item }) => (
    <TouchableOpacity
      style={styles.jogadorEncontrado}
      onPress={() => adicionarJogador(item)}
    >
      <Image
        source={item.fotoUsuario ? { uri: item.fotoUsuario } : require('../assets/user.jpg')}
        style={styles.jogadorFotoPequena}
      />
      <View style={styles.jogadorEncontradoInfo}>
        <Text style={styles.jogadorNome}>{item.nomeUsuario || item.nome}</Text>
        <Text style={styles.jogadorBio} numberOfLines={1}>
          {item.bio || 'Sem descrição'}
        </Text>
      </View>
      <Text style={styles.adicionarTexto}>+</Text>
    </TouchableOpacity>
  );

  // Modal para selecionar horas
  const renderModalHoras = () => (
    <Modal visible={showPickerHoras} transparent animationType="slide">
      <View style={styles.modalPickerContainer}>
        <View style={styles.modalPickerContent}>
          <Text style={styles.modalPickerTitulo}>Selecionar Horas</Text>
          <ScrollView style={styles.pickerScroll}>
            {horasOptions.map((hora) => (
              <TouchableOpacity
                key={hora}
                style={[
                  styles.pickerOption,
                  duracaoHoras === hora && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  setDuracaoHoras(hora);
                  setShowPickerHoras(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  duracaoHoras === hora && styles.pickerOptionTextSelected
                ]}>
                  {hora} {hora === '1' ? 'hora' : 'horas'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.botaoFecharPicker}
            onPress={() => setShowPickerHoras(false)}
          >
            <Text style={styles.textoBotaoFechar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal para selecionar minutos
  const renderModalMinutos = () => (
    <Modal visible={showPickerMinutos} transparent animationType="slide">
      <View style={styles.modalPickerContainer}>
        <View style={styles.modalPickerContent}>
          <Text style={styles.modalPickerTitulo}>Selecionar Minutos</Text>
          <ScrollView style={styles.pickerScroll}>
            {minutosOptions.map((minuto) => (
              <TouchableOpacity
                key={minuto}
                style={[
                  styles.pickerOption,
                  duracaoMinutos === minuto && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  setDuracaoMinutos(minuto);
                  setShowPickerMinutos(false);
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  duracaoMinutos === minuto && styles.pickerOptionTextSelected
                ]}>
                  {minuto} minutos
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.botaoFecharPicker}
            onPress={() => setShowPickerMinutos(false)}
          >
            <Text style={styles.textoBotaoFechar}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3C1F6F" barStyle="light-content" />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Text style={styles.textoBotaoVoltar}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Criar Nova Partida</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Seleção do Jogo */}
        <View style={styles.secao}>
          <Text style={styles.label}>🎮 Selecione o Jogo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Buscar jogo..."
            placeholderTextColor="#999"
            value={buscaJogo}
            onChangeText={filtrarJogos}
          />
          
          {loadingJogos ? (
            <ActivityIndicator size="large" color="#F7C21E" style={styles.carregando} />
          ) : (
            <FlatList
              data={jogosFiltrados.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.idJogo.toString()}
              renderItem={renderJogoItem}
              contentContainerStyle={styles.listaJogos}
            />
          )}

          {jogoSelecionado && (
            <View style={styles.jogoSelecionadoInfo}>
              <Text style={styles.jogoSelecionadoTexto}>
                ✅ Selecionado: <Text style={styles.jogoSelecionadoNome}>{jogoSelecionado.nome}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Data e Hora */}
        <View style={styles.secao}>
          <Text style={styles.label}>📅 Data e Hora da Partida *</Text>
          
          <TouchableOpacity 
            style={styles.botaoDataHora}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.textoBotaoDataHora}>
              📅 Data: {dataPartida.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.botaoDataHora}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.textoBotaoDataHora}>
              ⏰ Hora: {dataPartida.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dataPartida}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDataPartida(selectedDate);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={dataPartida}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) setDataPartida(selectedDate);
              }}
            />
          )}
        </View>

        {/* Duração */}
        <View style={styles.secao}>
          <Text style={styles.label}>⏱️ Duração da Partida *</Text>
          <View style={styles.duracaoContainer}>
            <View style={styles.duracaoGrupo}>
              <Text style={styles.duracaoLabel}>Horas</Text>
              <TouchableOpacity 
                style={styles.botaoDuracao}
                onPress={() => setShowPickerHoras(true)}
              >
                <Text style={styles.textoBotaoDuracao}>
                  {duracaoHoras} {duracaoHoras === '1' ? 'hora' : 'horas'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.duracaoGrupo}>
              <Text style={styles.duracaoLabel}>Minutos</Text>
              <TouchableOpacity 
                style={styles.botaoDuracao}
                onPress={() => setShowPickerMinutos(true)}
              >
                <Text style={styles.textoBotaoDuracao}>
                  {duracaoMinutos} min
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.duracaoTotal}>
            ⏰ Duração total: {calcularTempoTotalMinutos()} minutos
          </Text>
        </View>

        {/* Jogadores */}
        <View style={styles.secao}>
          <View style={styles.jogadoresHeader}>
            <Text style={styles.label}>
              👥 Jogadores ({jogadores.length}/20)
            </Text>
            <TouchableOpacity 
              style={styles.botaoAdicionar}
              onPress={() => setModalJogadores(true)}
            >
              <Text style={styles.textoBotaoAdicionar}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={jogadores}
            keyExtractor={(item) => item.idUsuario.toString()}
            renderItem={renderJogadorItem}
            scrollEnabled={false}
          />
        </View>

        {/* Botão Criar Partida */}
        <TouchableOpacity 
          style={[
            styles.botaoCriar,
            (!jogoSelecionado || loading) && styles.botaoCriarDesabilitado
          ]}
          onPress={criarPartida}
          disabled={!jogoSelecionado || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBotaoCriar}>
              🎯 Criar Partida
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Jogadores */}
      <Modal 
        visible={modalJogadores} 
        animationType="slide" 
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Adicionar Jogadores</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Buscar jogador..."
              placeholderTextColor="#999"
              value={buscaJogador}
              onChangeText={(text) => {
                setBuscaJogador(text);
                buscarJogadores(text);
              }}
            />
            
            <FlatList
              data={jogadoresEncontrados}
              keyExtractor={(item) => item.idUsuario.toString()}
              renderItem={renderJogadorEncontrado}
              style={styles.listaJogadores}
            />
            
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.botaoFechar}
                onPress={() => {
                  setModalJogadores(false);
                  setBuscaJogador('');
                  setJogadoresEncontrados([]);
                }}
              >
                <Text style={styles.textoBotaoFechar}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modais para seleção de duração */}
      {renderModalHoras()}
      {renderModalMinutos()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  scrollView: { flex: 1 },
  header: { 
    backgroundColor: '#3C1F6F', 
    padding: 15, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  botaoVoltar: { padding: 5 },
  textoBotaoVoltar: { color: '#F7C21E', fontSize: 20, fontWeight: 'bold' },
  titulo: { color: '#F7C21E', fontSize: 20, fontWeight: 'bold' },
  placeholder: { width: 30 },
  secao: { 
    backgroundColor: '#1a1a1a', 
    margin: 10, 
    padding: 15, 
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F7C21E'
  },
  label: { color: '#F7C21E', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  input: { 
    backgroundColor: '#2a2a2a', 
    color: '#fff',
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333'
  },
  carregando: { padding: 20 },
  listaJogos: { paddingVertical: 5 },
  jogoCard: { 
    width: 140, 
    margin: 5, 
    backgroundColor: '#2a2a2a', 
    borderRadius: 12, 
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5
  },
  jogoSelecionado: { borderColor: '#F7C21E', borderWidth: 3 },
  jogoImagem: { width: '100%', height: 120, borderRadius: 8 },
  semImagem: { 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#666" 
  },
  jogoInfo: { marginTop: 8 },
  jogoNome: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  jogoGenero: { color: '#F7C21E', fontSize: 10, textAlign: 'center' },
  jogoDev: { color: '#888', fontSize: 9, textAlign: 'center' },
  jogoSelecionadoInfo: { 
    backgroundColor: '#2a2a2a', 
    padding: 10, 
    borderRadius: 8, 
    marginTop: 10 
  },
  jogoSelecionadoTexto: { color: '#4CAF50', fontSize: 14 },
  jogoSelecionadoNome: { fontWeight: 'bold', color: '#fff' },
  botaoDataHora: { 
    backgroundColor: '#2a2a2a', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333'
  },
  textoBotaoDataHora: { color: '#fff', fontSize: 16, textAlign: 'center' },
  duracaoContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 10
  },
  duracaoGrupo: { flex: 1, alignItems: 'center', marginHorizontal: 5 },
  duracaoLabel: { color: '#fff', marginBottom: 8, fontSize: 14 },
  botaoDuracao: { 
    backgroundColor: '#2a2a2a', 
    padding: 15, 
    borderRadius: 8, 
    width: '100%',
    borderWidth: 1,
    borderColor: '#333'
  },
  textoBotaoDuracao: { color: '#fff', fontSize: 16, textAlign: 'center' },
  duracaoTotal: { 
    color: '#F7C21E', 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: 'bold',
    marginTop: 10
  },
  modalPickerContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center' 
  },
  modalPickerContent: { 
    backgroundColor: '#1a1a1a', 
    margin: 20, 
    padding: 20, 
    borderRadius: 15,
    maxHeight: '60%'
  },
  modalPickerTitulo: { 
    color: '#F7C21E', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  pickerScroll: { maxHeight: 300 },
  pickerOption: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#333' 
  },
  pickerOptionSelected: { backgroundColor: '#3C1F6F' },
  pickerOptionText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  pickerOptionTextSelected: { color: '#F7C21E', fontWeight: 'bold' },
  botaoFecharPicker: { 
    backgroundColor: '#F44336', 
    padding: 15, 
    borderRadius: 8, 
    marginTop: 10 
  },
  jogadoresHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  botaoAdicionar: { 
    backgroundColor: '#4CAF50', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  textoBotaoAdicionar: { color: '#fff', fontWeight: 'bold' },
  jogadorItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2a2a2a', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  jogadorFoto: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
  jogadorInfo: { flex: 1 },
  jogadorNome: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultadoContainer: { flexDirection: 'row', marginTop: 8 },
  botaoResultado: { 
    paddingHorizontal: 15, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginRight: 10,
    backgroundColor: '#333'
  },
  vitoriaSelecionada: { backgroundColor: '#4CAF50' },
  derrotaSelecionada: { backgroundColor: '#F44336' },
  textoBotaoResultado: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  botaoRemover: { padding: 8 },
  textoRemover: { color: '#F44336', fontSize: 16 },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    justifyContent: 'center' 
  },
  modalContent: { 
    backgroundColor: '#1a1a1a', 
    margin: 20, 
    padding: 20, 
    borderRadius: 15,
    maxHeight: '80%'
  },
  modalTitulo: { 
    color: '#F7C21E', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  listaJogadores: { maxHeight: 400 },
  jogadorEncontrado: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#333' 
  },
  jogadorFotoPequena: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  jogadorEncontradoInfo: { flex: 1 },
  jogadorBio: { color: '#888', fontSize: 12 },
  adicionarTexto: { color: '#4CAF50', fontSize: 20, fontWeight: 'bold' },
  modalBotoes: { marginTop: 20 },
  botaoFechar: { 
    backgroundColor: '#F44336', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  textoBotaoFechar: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  botaoCriar: { 
    backgroundColor: '#F7C21E', 
    margin: 20, 
    padding: 18, 
    borderRadius: 12,
    shadowColor: '#F7C21E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  botaoCriarDesabilitado: { backgroundColor: '#666', shadowOpacity: 0 },
  textoBotaoCriar: { 
    color: '#3C1F6F', 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  }
});

export default CriarPartidaScreen;