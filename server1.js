const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000; // Porta da aplicação (não use 3306)

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Pool de conexão
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "lawbridgem",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Utilitários
function formatDateToMySQL(dateString) {
  if (!dateString) return null;
  const [dia, mes, ano] = dateString.split("/");
  return `${ano}-${mes}-${dia}`;
}

function validarCamposObrigatorios(campos, reqBody, res) {
  for (const campo of campos) {
    if (!reqBody[campo]) {
      res.status(400).json({
        success: false,
        message: `Campo obrigatório: ${campo}`,
      });
      return false;
    }
  }
  return true;
}

// Rotas
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

app.post("/advogado", async (req, res) => {
  const { email, senha } = req.body;
  if (!validarCamposObrigatorios(["email", "senha"], req.body, res)) return;

  try {
    await pool.execute("INSERT INTO advogado (email, senha) VALUES (?, ?)", [
      email,
      senha,
    ]);
    res.json({ success: true, message: "Advogado cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar advogado:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

app.post("/clientes", async (req, res) => {
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

  if (
    !validarCamposObrigatorios(
      ["identificador", "nome", "email", "senha"],
      req.body,
      res
    )
  )
    return;

  try {
    const dataFormatada = formatDateToMySQL(data_nascimento);
    await pool.execute(
      `INSERT INTO cliente (identificador, nome, sobrenome, data_nascimento, email, cpf, celular, senha) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        identificador,
        nome,
        sobrenome,
        dataFormatada,
        email,
        cpf,
        celular,
        senha,
      ]
    );
    res.json({ success: true, message: "Cliente cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar cliente:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
});

app.post("/processos", async (req, res) => {
  try {
    const { assunto, status, numprocesso, comarca, identificadorA, dataP } =
      req.body;
    if (!assunto || !numprocesso || !identificadorA) {
      return res
        .status(400)
        .json({ success: false, message: "Campos obrigatórios ausentes" });
    }

    const [advogado] = await pool.execute(
      "SELECT id FROM advogado WHERE identificadorA = ?",
      [identificadorA]
    );
    if (!advogado.length) {
      return res
        .status(400)
        .json({ success: false, message: "Advogado não encontrado" });
    }

    const dataFormatada = formatDateToMySQL(dataP);

    const [result] = await pool.execute(
      `INSERT INTO processo (assunto, status, numprocesso, comarca, identificadorA, dataP)
       VALUES (?, ?, ?, ?, ?, ?)`,
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
  } catch (err) {
    console.error("Erro ao cadastrar processo:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao cadastrar processo" });
  }
});

app.post("/processo/vincular", async (req, res) => {
  try {
    const { processo_id, cliente_id } = req.body;

    if (!processo_id || !cliente_id) {
      return res
        .status(400)
        .json({ success: false, message: "IDs obrigatórios" });
    }

    const [existeProcesso] = await pool.execute(
      "SELECT id FROM processo WHERE id = ?",
      [processo_id]
    );
    const [existeCliente] = await pool.execute(
      "SELECT id FROM cliente WHERE id = ?",
      [cliente_id]
    );
    if (!existeProcesso.length || !existeCliente.length) {
      return res.status(404).json({
        success: false,
        message: "Cliente ou processo não encontrado",
      });
    }

    const [vinculo] = await pool.execute(
      "SELECT * FROM clienteprocesso WHERE processo_id = ? AND cliente_id = ?",
      [processo_id, cliente_id]
    );

    if (vinculo.length > 0) {
      return res.status(400).json({ success: false, message: "Já vinculado" });
    }

    await pool.execute(
      "INSERT INTO clienteprocesso (cliente_id, processo_id) VALUES (?, ?)",
      [cliente_id, processo_id]
    );
    res.json({ success: true, message: "Vinculado com sucesso" });
  } catch (err) {
    console.error("Erro ao vincular processo:", err);
    res.status(500).json({ success: false, message: "Erro ao vincular" });
  }
});
app.post("/login/cliente", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, nome, sobrenome, email, identificador FROM cliente WHERE email = ? AND senha = ?",
      [email, senha]
    );

    if (rows.length > 0) {
      return res.json({
        success: true,
        message: "Login bem-sucedido",
        cliente: rows[0],
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }
  } catch (error) {
    console.error("Erro no login de cliente:", error);
    return res.status(500).json({
      success: false,
      message: "Erro no servidor ao processar login de cliente",
    });
  }
});

app.get("/clientes", async (req, res) => {
  try {
    const [clientes] = await pool.execute(
      `SELECT id, nome, sobrenome, advogado_id, celular, data_nascimento, email, cpf FROM cliente`
    );
    res.json(clientes);
  } catch (err) {
    console.error("Erro ao buscar clientes:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar clientes" });
  }
});

app.get("/advogado/:identificadorA/processos", async (req, res) => {
  try {
    const { identificadorA } = req.params;
    const [processos] = await pool.execute(
      `SELECT p.*, c.nome AS cliente_nome
       FROM processo p
       LEFT JOIN clienteprocesso cp ON p.id = cp.processo_id
       LEFT JOIN cliente c ON cp.cliente_id = c.id
       WHERE p.identificadorA = ?`,
      [identificadorA]
    );
    res.json(processos);
  } catch (err) {
    console.error("Erro ao buscar processos do advogado:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar processos" });
  }
});

app.get("/cliente/:identificador/processos", async (req, res) => {
  let connection;
  try {
    const { identificador } = req.params;

    if (!identificador || !/^[a-zA-Z0-9-]{3,20}$/.test(identificador)) {
      return res
        .status(400)
        .json({ success: false, message: "Identificador inválido" });
    }

    connection = await pool.getConnection();

    const [clienteRows] = await connection.execute(
      `SELECT 
         c.id, c.nome, c.sobrenome, c.email, c.celular, c.data_nascimento, c.cpf,
         a.nome AS advogado_id, a.sobrenome AS advogado_sobrenome, a.oab
       FROM cliente c
       LEFT JOIN advogado a ON c.advogado_id = a.id
       WHERE c.identificador = ?
       LIMIT 1`,
      [identificador]
    );

    if (!clienteRows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente não encontrado" });
    }

    const cliente = clienteRows[0];

    const [processos] = await connection.execute(
      `SELECT 
         p.id, p.numprocesso, p.assunto, p.status, p.comarca,
         DATE_FORMAT(p.dataP, '%d/%m/%Y') AS data_formatada,
         IFNULL(CONCAT(a.nome, ' ', a.sobrenome), 'Não vinculado') AS advogado_id,
         a.oab
       FROM processo p
       INNER JOIN clienteprocesso cp ON p.id = cp.processo_id
       LEFT JOIN advogado a ON p.identificadorA = a.identificadorA
       WHERE cp.cliente_id = ?
       ORDER BY p.dataP DESC`,
      [cliente.id]
    );

    res.json({
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        sobrenome: cliente.sobrenome,
        email: cliente.email,
        celular: cliente.celular,
        data_nascimento: cliente.data_nascimento,
        cpf: cliente.cpf,
        advogado_id: cliente.advogado_id
      },
      processos: processos.map((p) => ({
        numero_processo: p.numprocesso,
        assunto: p.assunto,
        status: p.status,
        comarca: p.comarca || "Não informada",
        data: p.data_formatada || "Não informada",
        advogado_responsavel: {
          nome: p.advogado_id,
          oab: p.oab || "Não informada",
        },
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar processos do cliente:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar processos" });
  } finally {
    if (connection) connection.release();
  }
});

app.delete("/processos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute("DELETE FROM clienteprocesso WHERE processo_id = ?", [
      id,
    ]);
    const [result] = await pool.execute("DELETE FROM processo WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Processo não encontrado" });
    }

    res.json({ success: true, message: "Processo removido com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar processo:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao deletar processo" });
  }
});

// 🔊 Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
