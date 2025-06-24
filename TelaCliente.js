import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";

const TelaCliente = ({ route }) => {
  const { cliente } = route.params;
  const [clienteInfo, setClienteInfo] = useState(cliente);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchProcessos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `http://localhost:3000/cliente/${cliente.identificador}/processos`,
        {
          timeout: 10000, // 10 segundos
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Resposta inválida do servidor"
        );
      }

      setProcessos(response.data.processos);
      setClienteInfo(response.data.cliente);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Erro na requisição:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      setError(error.response?.data?.message || "Erro ao carregar processos");
      setProcessos([]); // Limpa a lista em caso de erro
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProcessos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProcessos();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Não informada";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatCPF = (cpf) => {
    if (!cpf) return "Não informado";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#3498db"]}
        />
      }
    >
      {/* Seção de Informações Pessoais */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

        <View style={styles.infoItem}>
          <Icon name="person" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            {clienteInfo.nome} {clienteInfo.sobrenome}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="cake" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            {clienteInfo.data_nascimento
              ? formatDate(clienteInfo.data_nascimento)
              : "Não informada"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="id-card" size={20} color="#3498db" />
          <Text style={styles.infoText}>{formatCPF(clienteInfo.cpf)}</Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="email" size={20} color="#3498db" />
          <Text style={styles.infoText}>{clienteInfo.email}</Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="phone" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            {clienteInfo.celular || "Não informado"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="account-balance" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            Advogado: {clienteInfo.advogado_id || "Não vinculado"}
          </Text>
        </View>
      </View>

      {/* Seção de Processos */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Processos Vinculados</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchProcessos}
            >
              <Text style={styles.retryText}>TENTAR NOVAMENTE</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#3498db" />
        ) : processos.length === 0 ? (
          <Text style={styles.emptyMessage}>Nenhum processo encontrado</Text>
        ) : (
          processos.map((processo) => (
            <View key={processo.numero_processo} style={styles.processCard}>
              <Text style={styles.processSubject}>
                Advogado:{" "}
                {processo.advogado_responsavel?.nome || "Não vinculado"}
              </Text>
              <Text style={styles.processNumber}>
                Processo: {processo.numero_processo}
              </Text>
              <Text style={styles.processSubject}>
                Assunto: {processo.assunto}
              </Text>
              <Text style={styles.processComarca}>
                Comarca: {processo.comarca || "Não informada"}
              </Text>
              <Text style={styles.processDate}>Data: {processo.data}</Text>

              <View
                style={[
                  styles.statusBadge,
                  processo.status === "Pendente" && styles.statusPending,
                  processo.status === "Andamento" && styles.statusInProgress,
                  processo.status === "Concluído" && styles.statusCompleted,
                ]}
              >
                <Text style={styles.statusText}>{processo.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9fc",
    padding: 15,
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: "#3498db",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
    paddingBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#34495e",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#7f8c8d",
    padding: 10,
    fontSize: 16,
  },
  processCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  processNumber: {
    fontWeight: "bold",
    color: "#2c3e50",
    fontSize: 16,
  },
  processSubject: {
    color: "#34495e",
    marginTop: 5,
    fontSize: 15,
  },
  processComarca: {
    color: "#34495e",
    marginTop: 5,
    fontSize: 15,
  },
  processDate: {
    color: "#7f8c8d",
    marginTop: 5,
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  statusPending: {
    backgroundColor: "#e67e22",
  },
  statusInProgress: {
    backgroundColor: "#3498db",
  },
  statusCompleted: {
    backgroundColor: "#27ae60",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  errorContainer: {
    backgroundColor: "#fdecea",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default TelaCliente;
