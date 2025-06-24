const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "lawbridgem",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getClienteByIdentificador = async (identificador) => {
  const [cliente] = await pool.execute(
    "SELECT id, nome, sobrenome FROM cliente WHERE identificador = ? LIMIT 1",
    [identificador]
  );
  return cliente[0];
};

// Função para formatar data de DD/MM/YYYY para YYYY-MM-DD
function formatDateToMySQL(dateString) {
  if (!dateString) return null;
  const [day, month, year] = dateString.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

app.post("/login/advogado", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, nome, sobrenome, email, oab, identificadorA FROM advogado WHERE email = ? AND senha = ?",
      [email, senha]
    );

    if (rows.length > 0) {
      return res.json({
        success: true,
        message: "Login bem-sucedido",
        advogado: rows[0],
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({
      success: false,
      message: "Erro no servidor ao processar login",
    });
  }
});

app.post("/clientes", async (req, res) => {
  try {
    const {
      identificador,
      nome,
      sobrenome,
      data_nascimento,
      email,
      cpf,
      celular,
      senha,
    } = req.body;

    if (!nome || !email || !cpf || !senha) {
      return res
        .status(400)
        .json({ success: false, message: "Campos obrigatórios faltando" });
    }

    // Converter a data para o formato MySQL
    const dataNascimentoMySQL = formatDateToMySQL(data_nascimento);

    const [result] = await pool.execute(
      "INSERT INTO cliente (identificador, nome, sobrenome, data_nascimento, email, cpf, celular, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        identificador,
        nome,
        sobrenome,
        dataNascimentoMySQL,
        email,
        cpf,
        celular,
        senha,
      ]
    );

    res.json({
      success: true,
      message: "Cliente cadastrado com sucesso",
      clienteId: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Email ou CPF já cadastrado",
      });
    }
    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar cliente",
      error: error.message,
    });
  }
});
app.post("/processos", async (req, res) => {
  try {
    const { assunto, status, numprocesso, comarca, identificadorA, dataP } =
      req.body;

    console.log("Dados recebidos para cadastrar processo:", req.body);

    if (!assunto || !numprocesso || !identificadorA) {
      return res.status(400).json({
        success: false,
        message:
          "Assunto, número do processo e identificador do advogado são obrigatórios",
      });
    }

    // Verifica se o advogado existe
    const [advogado] = await pool.execute(
      "SELECT id FROM advogado WHERE identificadorA = ?",
      [identificadorA]
    );

    if (advogado.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Advogado não encontrado",
      });
    }

    // Formata a data para o formato MySQL (YYYY-MM-DD) se existir
    let dataFormatada = null;
    if (dataP) {
      const [dia, mes, ano] = dataP.split("/");
      if (dia && mes && ano) {
        dataFormatada = `${ano}-${mes}-${dia}`;
      }
    }

    const [result] = await pool.execute(
      "INSERT INTO processo (assunto, status, numprocesso, comarca, identificadorA, dataP) VALUES (?, ?, ?, ?, ?, ?)",
      [
        assunto,
        status || "Pendente",
        numprocesso,
        comarca || null,
        identificadorA,
        dataFormatada || null,
      ]
    );

    res.json({
      success: true,
      message: "Processo cadastrado com sucesso",
      processoId: result.insertId,
    });
  } catch (error) {
    console.error("Erro detalhado ao cadastrar processo:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
    });

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Número do processo já existe",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erro ao cadastrar processo",
      errorDetails: {
        code: error.code,
        message: error.message,
      },
    });
  }
});

app.post("/processos/vincular", async (req, res) => {
  try {
    const { processo_id, cliente_id } = req.body;

    console.log("Tentando vincular processo:", { processo_id, cliente_id });

    if (!processo_id || !cliente_id) {
      return res.status(400).json({
        success: false,
        message: "IDs do processo e cliente são obrigatórios",
      });
    }

    const [processo] = await pool.execute(
      "SELECT id FROM processo WHERE id = ?",
      [processo_id]
    );
    if (processo.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Processo não encontrado" });
    }

    const [cliente] = await pool.execute(
      "SELECT id FROM cliente WHERE id = ?",
      [cliente_id]
    );
    if (cliente.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente não encontrado" });
    }

    const [vinculoExistente] = await pool.execute(
      "SELECT * FROM cliente_processo WHERE processo_id = ? AND cliente_id = ?",
      [processo_id, cliente_id]
    );

    if (vinculoExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Este processo já está vinculado ao cliente",
      });
    }

    await pool.execute(
      "INSERT INTO cliente_processo (cliente_id, processo_id) VALUES (?, ?)",
      [cliente_id, processo_id]
    );

    res.json({
      success: true,
      message: "Processo vinculado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao vincular processo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao vincular processo",
      error: error.message,
    });
  }
});

app.get("/advogado/:identificadorA/processos", async (req, res) => {
  try {
    const { identificadorA } = req.params;

    const [processos] = await pool.execute(
      `SELECT p.*, c.nome as cliente_nome 
       FROM processo p 
       LEFT JOIN cliente_processo cp ON p.id = cp.processo_id 
       LEFT JOIN cliente c ON cp.cliente_id = c.id 
       WHERE p.identificadorA = ?`,
      [identificadorA]
    );

    res.json(processos);
  } catch (error) {
    console.error("Erro ao buscar processos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar processos",
    });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const [clientes] = await pool.execute(
      "SELECT id, nome, sobrenome FROM cliente"
    );
    res.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar clientes",
    });
  }
});

app.delete("/processos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute("DELETE FROM cliente_processo WHERE processo_id = ?", [
      id,
    ]);

    const [result] = await pool.execute("DELETE FROM processo WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Processo não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Processo removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar processo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar processo",
    });
  }
});

// Rota do Cliente - Versão Otimizada (SEM alterar as outras rotas)
app.get("/cliente/:identificador/processos", async (req, res) => {
  let connection;
  try {
    const { identificador } = req.params;

    // 1. Validação do identificador
    if (!identificador || !/^[a-zA-Z0-9-]{3,20}$/.test(identificador)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ID",
        message: "Identificador deve ter entre 3 e 20 caracteres alfanuméricos",
      });
    }

    connection = await pool.getConnection();

    // 2. Busca o cliente com tratamento de caso não encontrado
    const [cliente] = await connection.execute(
      `SELECT id, nome, sobrenome 
       FROM cliente 
       WHERE identificador = ? 
       LIMIT 1`,
      [identificador]
    );

    if (!cliente.length) {
      return res.status(404).json({
        success: false,
        code: "CLIENT_NOT_FOUND",
        message: "Cliente não encontrado",
      });
    }

    // 3. Query otimizada com LEFT JOIN para casos sem advogado vinculado
    const [processos] = await connection.execute(
      `SELECT 
         p.id,
         p.numprocesso,
         p.assunto,
         p.status,
         p.comarca,
         DATE_FORMAT(p.dataP, '%d/%m/%Y') as data_formatada,
         IFNULL(CONCAT(a.nome, ' ', a.sobrenome), 'Não vinculado') as advogado_nome,
         a.oab
       FROM processo p
       INNER JOIN cliente_processo cp ON p.id = cp.processo_id
       LEFT JOIN advogado a ON p.identificadorA = a.identificadorA
       WHERE cp.cliente_id = ?
       ORDER BY p.dataP DESC`,
      [cliente[0].id]
    );

    // 4. Resposta padronizada
    res.json({
      success: true,
      cliente: {
        nome_completo: `${cliente[0].nome} ${cliente[0].sobrenome}`,
      },
      processos: processos.map((p) => ({
        numero_processo: p.numprocesso,
        assunto: p.assunto,
        status: p.status,
        comarca: p.comarca || "Não informada",
        data: p.data_formatada || "Não informada",
        advogado_responsavel: {
          nome: p.advogado_nome,
          oab: p.oab || "Não informada",
        },
      })),
    });
  } catch (error) {
    console.error("Erro na rota /cliente/:identificador/processos:", {
      error: error.message,
      stack: error.stack,
      params: req.params,
    });

    res.status(500).json({
      success: false,
      code: "DATABASE_ERROR",
      message: "Erro ao consultar processos",
    });
  } finally {
    if (connection) connection.release(); // Libera a conexão de volta para o pool
  }
});
