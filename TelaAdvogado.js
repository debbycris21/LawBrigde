import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Picker,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axios from "axios";

const TelaAdvogado = ({ route, navigation }) => {
  const { advogado } = route.params;
  const [processos, setProcessos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [modalProcessoVisible, setModalProcessoVisible] = useState(false);

  const [clienteData, setClienteData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    cpf: "",
    celular: "",
    senha: "123456",
    data_nascimento: "",
  });

  const [processoData, setProcessoData] = useState({
    assunto: "",
    numprocesso: "",
    comarca: "",
    status: "Pendente",
    cliente_id: "",
    dataP: "",
  });

  const fetchData = async () => {
    try {
      const [processosResponse, clientesResponse] = await Promise.all([
        axios.get(
          `http://localhost:3000/advogado/${advogado.identificadorA}/processos`
        ),
        axios.get(`http://localhost:3000/clientes`),
      ]);
      setProcessos(processosResponse.data);
      setClientes(clientesResponse.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados");
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCadastrarCliente = async () => {
    try {
      if (!clienteData.nome || !clienteData.email || !clienteData.cpf) {
        Alert.alert("Atenção", "Preencha todos os campos obrigatórios");
        return;
      }

      const identificador = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // Validar formato da data antes de enviar
      if (clienteData.data_nascimento) {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(clienteData.data_nascimento)) {
          Alert.alert("Atenção", "Formato de data inválido. Use DD/MM/AAAA");
          return;
        }
      }

      const response = await axios.post("http://localhost:3000/clientes", {
        ...clienteData,
        identificador,
      });

      Alert.alert("Sucesso", "Cliente cadastrado com sucesso");
      setModalClienteVisible(false);
      setClienteData({
        nome: "",
        sobrenome: "",
        email: "",
        cpf: "",
        celular: "",
        senha: "123456",
        data_nascimento: "",
      });
      fetchData();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Erro ao cadastrar cliente"
      );
    }
  };

  const handleCadastrarProcesso = async () => {
    try {
      if (!processoData.assunto || !processoData.numprocesso) {
        Alert.alert("Atenção", "Preencha todos os campos obrigatórios");
        return;
      }

      console.log("Enviando dados do processo:", {
        ...processoData,
        identificadorA: advogado.identificadorA,
      });

      const response = await axios.post("http://localhost:3000/processos", {
        assunto: processoData.assunto,
        status: processoData.status,
        numprocesso: processoData.numprocesso,
        comarca: processoData.comarca || null,
        identificadorA: advogado.identificadorA,
        dataP: processoData.dataP || null,
      });

      console.log("Resposta do servidor:", response.data);

      if (processoData.cliente_id) {
        console.log("Vinculando processo ao cliente:", {
          processo_id: response.data.processoId,
          cliente_id: processoData.cliente_id,
        });

        await axios.post("http://localhost:3000/processo/vincular", {
          processo_id: response.data.processoId,
          cliente_id: processoData.cliente_id,
        });
      }

      Alert.alert(
        "Sucesso",
        processoData.cliente_id
          ? "Processo cadastrado e vinculado ao cliente com sucesso!"
          : "Processo cadastrado com sucesso!"
      );

      setModalProcessoVisible(false);
      setProcessoData({
        assunto: "",
        numprocesso: "",
        comarca: "",
        status: "Pendente",
        cliente_id: "",
        dataP: "",
      });
      fetchData();
    } catch (error) {
      console.error("Erro detalhado:", {
        message: error.message,
        response: error.response?.data,
        config: error.config,
      });

      let errorMessage = "Erro ao cadastrar processo";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errorDetails?.message) {
        errorMessage = error.response.data.errorDetails.message;
      }

      Alert.alert("Erro", errorMessage);
    }
  };

  const handleDeleteProcesso = async (processoId) => {
    try {
      await axios.delete(`http://localhost:3000/processos/${processoId}`);
      Alert.alert("Sucesso", "Processo removido com sucesso");
      fetchData();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível remover o processo");
      console.error(error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Não informada";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {advogado.nome} {advogado.sobrenome}
            </Text>
            <Text style={styles.userOab}>OAB: {advogado.oab}</Text>
            <Text style={styles.userEmail}>{advogado.email}</Text>
            <Text style={styles.userCelular}>{advogado.celular}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalClienteVisible(true)}
          >
            <Icon name="person-add" size={24} color="#fff" />
            <Text style={styles.actionText}>Novo Cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalProcessoVisible(true)}
          >
            <Icon name="note-add" size={24} color="#fff" />
            <Text style={styles.actionText}>Novo Processo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Relatorios")}
          >
            <Icon name="assessment" size={24} color="#fff" />
            <Text style={styles.actionText}>Relatórios</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryNumber}>{processos.length}</Text>{" "}
            Processos
          </Text>
          <Text style={styles.summarySubText}>
            {processos.filter((p) => p.status === "Pendente").length} pendentes
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processos Recentes</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#9370db" />
          ) : processos.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhum processo cadastrado</Text>
          ) : (
            processos.slice(0, 5).map((processo) => (
              <View key={processo.id} style={styles.processItem}>
                <View style={styles.processInfo}>
                  <Text style={styles.processNumber}>
                    {processo.numprocesso}
                  </Text>
                  <Text style={styles.processSubject}>{processo.assunto}</Text>
                  <Text style={styles.processClient}>
                    {processo.cliente_nome || "Cliente não associado"}
                  </Text>
                  <Text style={styles.processDate}>
                    Data: {formatDate(processo.dataP)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      processo.status === "Pendente" && styles.statusPending,
                      processo.status === "Andamento" &&
                        styles.statusInProgress,
                      processo.status === "Concluído" && styles.statusCompleted,
                    ]}
                  >
                    <Text style={styles.statusText}>{processo.status}</Text>
                  </View>
                </View>

                <View style={styles.processActions}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditarProcesso", { processo })
                    }
                  >
                    <Icon name="edit" size={20} color="#9370db" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProcesso(processo.id)}
                  >
                    <Icon name="delete" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => navigation.navigate("ListaProcessos")}
          >
            <Text style={styles.seeAllText}>Ver todos os processos</Text>
            <Icon name="chevron-right" size={20} color="#9370db" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalClienteVisible}
        onRequestClose={() => setModalClienteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContainer} onPress={Keyboard.dismiss}>
            <View style={[styles.modalContainerInner, { maxHeight: "70%" }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cadastrar Novo Cliente</Text>
                <TouchableOpacity onPress={() => setModalClienteVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do cliente"
                  value={clienteData.nome}
                  onChangeText={(text) =>
                    setClienteData({ ...clienteData, nome: text })
                  }
                />

                <Text style={styles.inputLabel}>Sobrenome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sobrenome do cliente"
                  value={clienteData.sobrenome}
                  onChangeText={(text) =>
                    setClienteData({ ...clienteData, sobrenome: text })
                  }
                />

                <Text style={styles.inputLabel}>
                  Data de Nascimento (DD/MM/AAAA)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={clienteData.data_nascimento}
                  onChangeText={(text) =>
                    setClienteData({ ...clienteData, data_nascimento: text })
                  }
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email do cliente"
                  keyboardType="email-address"
                  value={clienteData.email}
                  onChangeText={(text) =>
                    setClienteData({ ...clienteData, email: text })
                  }
                />

                <Text style={styles.inputLabel}>CPF *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CPF do cliente"
                  keyboardType="numeric"
                  value={clienteData.cpf}
                  onChangeText={(text) =>
                    setClienteData({ ...clienteData, cpf: text })
                  }
                />

                <Text style={styles.inputLabel}>Celular</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Celular do cliente"
                  keyboardType="phone-pad"
                  value={clienteData.celular}
                  onChangeText={(text) =>
                    setClienteData({ ...clienteData, celular: text })
                  }
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalClienteVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCadastrarCliente}
                >
                  <Text style={styles.saveButtonText}>Salvar Cliente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalProcessoVisible}
        onRequestClose={() => setModalProcessoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContainer} onPress={Keyboard.dismiss}>
            <View style={[styles.modalContainerInner, { maxHeight: "70%" }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cadastrar Novo Processo</Text>
                <TouchableOpacity
                  onPress={() => setModalProcessoVisible(false)}
                >
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Número do Processo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Número do processo"
                  value={processoData.numprocesso}
                  onChangeText={(text) =>
                    setProcessoData({ ...processoData, numprocesso: text })
                  }
                />

                <Text style={styles.inputLabel}>Assunto *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Assunto do processo"
                  value={processoData.assunto}
                  onChangeText={(text) =>
                    setProcessoData({ ...processoData, assunto: text })
                  }
                />

                <Text style={styles.inputLabel}>Comarca</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Comarca do processo"
                  value={processoData.comarca}
                  onChangeText={(text) =>
                    setProcessoData({ ...processoData, comarca: text })
                  }
                />

                <Text style={styles.inputLabel}>
                  Data do Processo (DD/MM/AAAA)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/AAAA"
                  value={processoData.dataP}
                  onChangeText={(text) =>
                    setProcessoData({ ...processoData, dataP: text })
                  }
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Cliente</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={processoData.cliente_id}
                    onValueChange={(itemValue) =>
                      setProcessoData({
                        ...processoData,
                        cliente_id: itemValue,
                      })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Selecione um cliente" value="" />
                    {clientes.map((cliente) => (
                      <Picker.Item
                        key={cliente.id}
                        label={`${cliente.nome} ${cliente.sobrenome}`}
                        value={cliente.id}
                      />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setProcessoData({ ...processoData, status: "Pendente" })
                    }
                  >
                    <View style={styles.radioCircle}>
                      {processoData.status === "Pendente" && (
                        <View style={styles.radioChecked} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Pendente</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setProcessoData({ ...processoData, status: "Andamento" })
                    }
                  >
                    <View style={styles.radioCircle}>
                      {processoData.status === "Andamento" && (
                        <View style={styles.radioChecked} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Andamento</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() =>
                      setProcessoData({ ...processoData, status: "Concluído" })
                    }
                  >
                    <View style={styles.radioCircle}>
                      {processoData.status === "Concluído" && (
                        <View style={styles.radioChecked} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>Concluído</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalProcessoVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCadastrarProcesso}
                >
                  <Text style={styles.saveButtonText}>Salvar Processo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "#9370db",
  },
  userInfo: {
    marginTop: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  userOab: {
    fontSize: 16,
    color: "#fff",
    marginTop: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#e0e0e0",
    marginTop: 5,
  },
  userCelular: {
    fontSize: 14,
    color: "#e0e0e0",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: "#6495ed",
    padding: 12,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9370db",
  },
  summarySubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#666",
    padding: 10,
  },
  processItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  processInfo: {
    flex: 1,
  },
  processNumber: {
    fontWeight: "bold",
    color: "#333",
  },
  processSubject: {
    color: "#555",
    marginTop: 3,
  },
  processClient: {
    color: "#666",
    fontSize: 14,
    marginTop: 3,
    fontStyle: "italic",
  },
  processDate: {
    color: "#666",
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  statusPending: {
    backgroundColor: "#ff9800",
  },
  statusInProgress: {
    backgroundColor: "#2196f3",
  },
  statusCompleted: {
    backgroundColor: "#4caf50",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  processActions: {
    flexDirection: "row",
    gap: 15,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    marginTop: 5,
  },
  seeAllText: {
    color: "#9370db",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
  },
  modalContainerInner: {
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: "70%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
    height: 40,
  },
  saveButton: {
    backgroundColor: "#9370db",
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9370db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  radioChecked: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9370db",
  },
  radioLabel: {
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 8,
    height: 40,
    justifyContent: "center",
  },
  picker: {
    width: "100%",
  },
});

export default TelaAdvogado;
