import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

const RAWG_API_KEY = "2bf7427a54a148aa9674a33abf59fa0a";

const DetalhesJogoScreen = ({ route, navigation }) => {
  const { jogo } = route.params;
  const [detalhesJogo, setDetalhesJogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagemCarregada, setImagemCarregada] = useState(false);

  useEffect(() => {
    carregarDetalhesJogo();
  }, [jogo]);

  const carregarDetalhesJogo = async () => {
    try {
      setLoading(true);
      
      // Busca detalhes adicionais da API RAWG
      const response = await fetch(
        `https://api.rawg.io/api/games?search=${encodeURIComponent(jogo.nome)}&key=${RAWG_API_KEY}`
      );
      const data = await response.json();
      
      if (data?.results?.length > 0) {
        const jogoRAWG = data.results[0];
        setDetalhesJogo({
          ...jogo,
          descricao: jogoRAWG.description_raw || jogo.descricao || 'Descrição não disponível',
          rating: jogoRAWG.rating,
          released: jogoRAWG.released,
          platforms: jogoRAWG.platforms?.map(p => p.platform.name).join(', ') || 'N/A',
          genres: jogoRAWG.genres?.map(g => g.name).join(', ') || jogo.genero,
        });
      } else {
        setDetalhesJogo(jogo);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setDetalhesJogo(jogo);
    } finally {
      setLoading(false);
    }
  };

  const adicionarAsListas = () => {
    Alert.alert(
      "Adicionar às Listas",
      "Escolha em qual lista deseja adicionar este jogo:",
      [
        { text: "Quero Jogar", onPress: () => console.log("Adicionar a Quero Jogar") },
        { text: "Jogando", onPress: () => console.log("Adicionar a Jogando") },
        { text: "Completado", onPress: () => console.log("Adicionar a Completado") },
        { text: "Favoritos", onPress: () => console.log("Adicionar a Favoritos") },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F7C21E" />
        <Text style={styles.carregandoTexto}>Carregando detalhes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Imagem do jogo */}
      <View style={styles.imagemContainer}>
        <Image
          source={{ uri: jogo.capa }}
          style={styles.capa}
          resizeMode="cover"
          onLoad={() => setImagemCarregada(true)}
          onError={() => setImagemCarregada(true)}
        />
        {!imagemCarregada && (
          <View style={styles.carregandoImagem}>
            <ActivityIndicator size="large" color="#F7C21E" />
          </View>
        )}
      </View>

      {/* Informações do jogo */}
      <View style={styles.infoContainer}>
        <Text style={styles.titulo}>{detalhesJogo?.nome || jogo.nome}</Text>
        
        <View style={styles.metaInfo}>
          {detalhesJogo?.rating && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Avaliação:</Text>
              <Text style={styles.metaValue}>⭐ {detalhesJogo.rating}/5</Text>
            </View>
          )}
          
          {detalhesJogo?.released && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Lançamento:</Text>
              <Text style={styles.metaValue}>{new Date(detalhesJogo.released).getFullYear()}</Text>
            </View>
          )}
        </View>

        {/* Gênero */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Gênero</Text>
          <Text style={styles.secaoTexto}>{detalhesJogo?.genres || jogo.genero || 'Não informado'}</Text>
        </View>

        {/* Desenvolvedora */}
        {jogo.desenvolvedora && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Desenvolvedora</Text>
            <Text style={styles.secaoTexto}>{jogo.desenvolvedora}</Text>
          </View>
        )}

        {/* Plataformas */}
        {detalhesJogo?.platforms && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Plataformas</Text>
            <Text style={styles.secaoTexto}>{detalhesJogo.platforms}</Text>
          </View>
        )}

        {/* Descrição */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Descrição</Text>
          <Text style={styles.descricao}>
            {detalhesJogo?.descricao || 'Descrição não disponível para este jogo.'}
          </Text>
        </View>

        {/* Botão para adicionar às listas */}
        <TouchableOpacity style={styles.botaoAdicionar} onPress={adicionarAsListas}>
          <Text style={styles.textoBotao}>➕ Adicionar às Minhas Listas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  carregandoTexto: {
    color: '#F7C21E',
    marginTop: 10,
    fontSize: 16,
  },
  imagemContainer: {
    height: 300,
    position: 'relative',
  },
  capa: {
    width: '100%',
    height: '100%',
  },
  carregandoImagem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  infoContainer: {
    padding: 20,
  },
  titulo: {
    color: '#F7C21E',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 10,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    color: '#bbb',
    fontSize: 12,
    marginBottom: 5,
  },
  metaValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secao: {
    marginBottom: 20,
  },
  secaoTitulo: {
    color: '#F7C21E',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  secaoTexto: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  descricao: {
    color: '#ddd',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  botaoAdicionar: {
    backgroundColor: '#F7C21E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBotao: {
    color: '#3C1F6F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetalhesJogoScreen;