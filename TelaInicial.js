import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";

const TelaInicial = ({ navigation }) => {
  const [exibirLoginAdvogado, setExibirLoginAdvogado] = useState(false);
  const [exibirLoginCliente, setExibirLoginCliente] = useState(false);
  const [emailAdvogado, setEmailAdvogado] = useState("");
  const [senhaAdvogado, setSenhaAdvogado] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [senhaCliente, setSenhaCliente] = useState("");
  const [senhaAdvogadoVisivel, setSenhaAdvogadoVisivel] = useState(false);
  const [senhaClienteVisivel, setSenhaClienteVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const botaoLarguraInicial = 150;
  const botaoLarguraExpandida = 240;
  const botaoAdvogadoLargura = useRef(
    new Animated.Value(botaoLarguraInicial)
  ).current;
  const botaoClienteLargura = useRef(
    new Animated.Value(botaoLarguraInicial)
  ).current;
  const [exibirBotaoCliente, setExibirBotaoCliente] = useState(true);
  const [exibirBotaoAdvogado, setExibirBotaoAdvogado] = useState(true);

  const handleLoginAdvogado = async () => {
    console.log("Iniciando processo de login...");

    // Validação básica
    if (!emailAdvogado || !senhaAdvogado) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    // Validação de email
    if (!/^\S+@\S+\.\S+$/.test(emailAdvogado)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    setLoading(true);
    console.log("Enviando requisição para o servidor...");

    try {
      const response = await axios.post(
        "http://localhost:3000/login/advogado",
        {
          email: emailAdvogado,
          senha: senhaAdvogado,
        }
      );

      console.log("Resposta do servidor:", response.data);

      if (response.data.success) {
        console.log("Login bem-sucedido, navegando para TelaAdvogado");
        navigation.navigate("TelaAdvogado", {
          advogado: response.data.advogado,
        });
      } else {
        console.log("Login falhou:", response.data.message);
        Alert.alert("Erro", response.data.message);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);

      if (error.response) {
        console.error("Detalhes do erro:", error.response.data);
        Alert.alert("Erro", error.response.data.message || "Erro no servidor");
      } else if (error.request) {
        console.error("Sem resposta do servidor");
        Alert.alert(
          "Erro",
          "Não foi possível conectar ao servidor. Verifique sua conexão."
        );
      } else {
        console.error("Erro ao configurar a requisição:", error.message);
        Alert.alert("Erro", "Ocorreu um erro ao tentar fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginCliente = async () => {
    // Validação básica
    if (!emailCliente || !senhaCliente) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    // Validação de email
    if (!/^\S+@\S+\.\S+$/.test(emailCliente)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/login/cliente", {
        email: emailCliente,
        senha: senhaCliente,
      });

      if (response.data.success) {
        const cliente = response.data.cliente;
        navigation.navigate("TelaCliente", { cliente });
      } else {
        Alert.alert("Erro", response.data.message);
      }
    } catch (error) {
      console.error("Erro no login do cliente:", error);
      Alert.alert("Erro", "Erro ao tentar fazer login");
    } finally {
      setLoading(false);
    }
  };

  const animarBotoes = (exibirAdvogado, exibirCliente) => {
    Animated.parallel([
      Animated.timing(botaoAdvogadoLargura, {
        toValue: exibirAdvogado
          ? botaoLarguraExpandida
          : exibirCliente
          ? 0
          : botaoLarguraInicial,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(botaoClienteLargura, {
        toValue: exibirCliente
          ? botaoLarguraExpandida
          : exibirAdvogado
          ? 0
          : botaoLarguraInicial,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setExibirBotaoCliente(!exibirAdvogado);
      setExibirBotaoAdvogado(!exibirCliente);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tituloContainer}>
        <Text style={styles.titulo}>LawBridge</Text>
      </View>
      <Text style={styles.mensagem}>
        Este é o melhor lugar para ter suas informações jurídicas, tanto sendo
        cliente quanto profissional.
      </Text>
      <View style={styles.botoesContainer}>
        {exibirBotaoAdvogado && (
          <Animated.View
            style={{
              width: botaoAdvogadoLargura,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              style={styles.botaoAdvogado}
              onPress={() => {
                setExibirLoginAdvogado(!exibirLoginAdvogado);
                setExibirLoginCliente(false);
                animarBotoes(!exibirLoginAdvogado, false);
              }}
            >
              <Text style={styles.textoBotao}>Advogado</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {exibirBotaoCliente && (
          <Animated.View
            style={{
              width: botaoClienteLargura,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              style={styles.botaoCliente}
              onPress={() => {
                setExibirLoginCliente(!exibirLoginCliente);
                setExibirLoginAdvogado(false);
                animarBotoes(false, !exibirLoginCliente);
              }}
            >
              <Text style={styles.textoBotao}>Cliente</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      {exibirLoginAdvogado && (
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitulo}>Login Advogado</Text>
          <TextInput
            style={[styles.input, { height: 50, width: 250 }]}
            placeholder="Email"
            onChangeText={setEmailAdvogado}
            value={emailAdvogado}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.senhaContainer}>
            <TextInput
              style={[styles.input, { height: 50, width: 250 }]}
              placeholder="Senha"
              secureTextEntry={!senhaAdvogadoVisivel}
              onChangeText={setSenhaAdvogado}
              value={senhaAdvogado}
            />
            <TouchableOpacity
              onPress={() => setSenhaAdvogadoVisivel(!senhaAdvogadoVisivel)}
            >
              <Icon
                name={senhaAdvogadoVisivel ? "visibility" : "visibility-off"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.botaoLogin, { backgroundColor: "#9370db" }]}
            onPress={handleLoginAdvogado}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.textoBotaoLogin}>Entrar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => {
              setExibirLoginAdvogado(false);
              animarBotoes(false, false);
            }}
          >
            <Text style={styles.textoBotaoVoltar}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
      {exibirLoginCliente && (
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitulo}>Login Cliente</Text>
          <TextInput
            style={[styles.input, { height: 50, width: 250 }]}
            placeholder="Email"
            onChangeText={setEmailCliente}
            value={emailCliente}
          />
          <View style={styles.senhaContainer}>
            <TextInput
              style={[styles.input, { height: 50, width: 250 }]}
              placeholder="Senha"
              secureTextEntry={!senhaClienteVisivel}
              onChangeText={setSenhaCliente}
              value={senhaCliente}
            />
            <TouchableOpacity
              onPress={() => setSenhaClienteVisivel(!senhaClienteVisivel)}
            >
              <Icon
                name={senhaClienteVisivel ? "visibility" : "visibility-off"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.botaoLogin, { backgroundColor: "#6495ed" }]}
            onPress={handleLoginCliente}
          >
            <Text style={styles.textoBotaoLogin}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => {
              setExibirLoginCliente(false);
              animarBotoes(false, false);
            }}
          >
            <Text style={styles.textoBotaoVoltar}>Voltar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5dc",
  },
  tituloContainer: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: -80,
  },
  titulo: {
    fontSize: 40,
    fontWeight: "bold",
    fontFamily: "serif",
  },
  mensagem: {
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
    paddingHorizontal: 20,
    fontFamily: "sans-serif",
  },
  botoesContainer: {
    flexDirection: "row",
  },
  botaoAdvogado: {
    backgroundColor: "#9370db",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginRight: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoCliente: {
    backgroundColor: "#6495ed",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotao: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  loginContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  botaoLogin: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 50,
  },
  textoBotaoLogin: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  botaoVoltar: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  textoBotaoVoltar: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  senhaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default TelaInicial;
