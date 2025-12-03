const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

// Importações do Sequelize e Operadores
const { Sequelize, DataTypes, Op } = require('sequelize');

// Configuração de Upload (Para as imagens dos pratos)
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// 1. CONFIGURAÇÃO DA CONEXÃO COM O BANCO
// ==========================================
const sequelize = new Sequelize('Sapori', 'admin', 'admin', {
    host: 'DESKTOP-N4J6VRI',
    dialect: 'mssql',
    port: 1433,
    logging: false,
    dialectOptions: {
        options: {
            // MUDANÇA IMPORTANTE AQUI:
            encrypt: true, // Mude de false para true. O SQL Server geralmente exige isso.
            trustServerCertificate: true, // Isso aceita o certificado local do seu PC.
            enableArithAbort: true
        }
    }
});
// ==========================================
// 2. MODELOS (Mapeamento das Tabelas)
// ==========================================

// --- MODELO USUARIO (Tabela: Usuarios) ---
const Usuario = sequelize.define('Usuario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: { type: Sequelize.STRING(100), allowNull: true },
    senha: { type: Sequelize.STRING(20), allowNull: true },
    frequencia_visitas: { type: Sequelize.INTEGER, allowNull: true },
    telefone: { type: Sequelize.STRING(15), allowNull: true },
    cpf: { type: Sequelize.STRING(11), allowNull: true },
    pratos_preferidos: { type: Sequelize.STRING(50), allowNull: true },
    email: { type: Sequelize.STRING(50), allowNull: true },

    // IMPORTANTE: Definido como INTEGER (1 = Cliente, 2 = Admin)
    tipoUsuario: { type: Sequelize.INTEGER, defaultValue: 1 },

    // IMPORTANTE: Nome exato da coluna no SQL Server
    DataHoraCadastro: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('GETDATE()')
    }
}, {
    tableName: 'Usuarios', // <--- NOME CORRETO DA TABELA
    timestamps: false
});

// --- MODELO RESERVA (Tabela: Reservas) ---
const Reserva = sequelize.define('Reserva', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    data_reserva: { type: Sequelize.STRING(10), allowNull: false },
    horario: { type: Sequelize.STRING(5), allowNull: false },
    numero_pessoas: { type: Sequelize.STRING(10), allowNull: false },
    status: { type: Sequelize.STRING(20), defaultValue: 'Confirmada' },
    observacoes: { type: Sequelize.STRING(200), allowNull: true },
    usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: Usuario, key: 'id' }
    }
}, {
    tableName: 'Reservas',
    timestamps: false
});

// --- MODELO PRATOS (Tabela: Pratos) ---
const Pratos = sequelize.define('Pratos', {
    idPratos: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: { type: Sequelize.STRING(100), allowNull: false },
    modo_preparo: { type: Sequelize.STRING(500), allowNull: true },
    preco: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    descricao: { type: Sequelize.STRING(200), allowNull: true },
    promocao: { type: Sequelize.BOOLEAN, allowNull: true },
    tipo: { type: Sequelize.STRING, allowNull: true },
    imagem: { type: Sequelize.BLOB, allowNull: true }
}, {
    tableName: 'Pratos',
    timestamps: false
});

// --- RELACIONAMENTOS ---
Usuario.hasMany(Reserva, { foreignKey: 'usuarioId' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// ==========================================
// 3. CONFIGURAÇÃO DO SERVIDOR EXPRESS
// ==========================================
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ==========================================
// 4. ROTAS - DASHBOARD (CORRIGIDAS)
// ==========================================

// Total de Clientes (tipoUsuario = 1)
app.get("/dashboard/totalUsuarios", async (req, res) => {
    try {
        // Busca onde tipoUsuario é 1 (Cliente)
        const total = await Usuario.count({ where: { tipoUsuario: 1 } });
        res.json({ total });
    } catch (e) {
        console.error("Erro totalUsuarios:", e);
        res.status(500).json({ erro: e.message });
    }
});

// Total de Reservas
app.get("/dashboard/totalReservas", async (req, res) => {
    try {
        const total = await Reserva.count();
        res.json({ total });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Último Cliente Cadastrado (tipoUsuario = 1)
app.get("/dashboard/ultimoCliente", async (req, res) => {
    try {
        const ultimo = await Usuario.findOne({
            where: { tipoUsuario: 1 },
            order: [['id', 'DESC']] // Ordena pelo ID decrescente
        });
        // Se não tiver ninguém, retorna objeto vazio para não quebrar o front
        res.json(ultimo || {});
    } catch (e) {
        console.error("Erro ultimoCliente:", e);
        res.status(500).json({ erro: e.message });
    }
});

// Gráfico: Usuários por Mês (Baseado em DataHoraCadastro e tipoUsuario = 1)
app.get("/dashboard/usuariosPorMes/:ano", async (req, res) => {
    const ano = req.params.ano;
    try {
        const dados = await Usuario.findAll({
            attributes: [
                [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro")), "mes"],
                [sequelize.fn("COUNT", sequelize.col("id")), "total"]
            ],
            where: {
                tipoUsuario: 1, // Apenas Clientes
                [Op.and]: sequelize.where(sequelize.fn("YEAR", sequelize.col("DataHoraCadastro")), ano)
            },
            group: [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro"))],
            order: [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro"))]
        });
        res.json(dados);
    } catch (e) {
        console.error("Erro usuariosPorMes:", e);
        res.status(500).json({ erro: e.message });
    }
});

// Gráfico: Reservas por Mês
app.get("/dashboard/reservasPorMes/:ano", async (req, res) => {
    const ano = req.params.ano;
    try {
        // Tenta converter string data_reserva para DATE para pegar o MÊS
        const dados = await Reserva.findAll({
            attributes: [
                [sequelize.fn("MONTH", sequelize.col("data_reserva")), "mes"],
                [sequelize.fn("COUNT", sequelize.col("id")), "total"]
            ],
            // Filtra pelo ano (convertendo a string 'YYYY-MM-DD' para data)
            where: sequelize.where(sequelize.fn("YEAR", sequelize.cast(sequelize.col("data_reserva"), 'DATE')), ano),
            group: [sequelize.fn("MONTH", sequelize.col("data_reserva"))],
            order: [sequelize.fn("MONTH", sequelize.col("data_reserva"))]
        });
        res.json(dados);
    } catch (e) {
        console.error("Erro reservasPorMes (verifique formato da data no banco):", e);
        res.json([]); // Retorna vazio se der erro de conversão
    }
});

// ==========================================
// 5. ROTAS CRUD (USUÁRIOS, RESERVAS, PRATOS)
// ==========================================

// --- LOGIN ---
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) return res.status(404).json({ erro: 'Email não encontrado' });

        // CUIDADO: Senha em texto plano (ideal seria hash)
        if (usuario.senha !== senha) return res.status(401).json({ erro: 'Senha incorreta' });

        res.json({
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                tipoUsuario: usuario.tipoUsuario // Retorna 1 ou 2
            }
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- CRIAR USUÁRIO ---
app.post('/usuarios', async (req, res) => {
    try {
        if (!req.body.senha || req.body.senha.length < 6) {
            return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
        }

        // Prepara os dados. Se tipoUsuario vier como texto, converte ou define padrão.
        const dados = { ...req.body };

        // Lógica de segurança simples: Se não mandar nada, é Cliente (1).
        if (!dados.tipoUsuario) dados.tipoUsuario = 1;

        // Se o frontend mandar "admin" escrito, converte para 2
        if (dados.tipoUsuario === 'admin') dados.tipoUsuario = 2;
        if (dados.tipoUsuario === 'cliente') dados.tipoUsuario = 1;

        const novo = await Usuario.create(dados);
        res.status(201).json(novo);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

// Listar Usuários
app.get('/usuarios', async (req, res) => {
    try {
        const lista = await Usuario.findAll();
        res.json(lista);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Editar Usuário
app.put('/usuarios/:id', async (req, res) => {
    try {
        await Usuario.update(req.body, { where: { id: req.params.id } });
        res.json({ msg: "Atualizado" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Deletar Usuário
app.delete('/usuarios/:id', async (req, res) => {
    try {
        await Usuario.destroy({ where: { id: req.params.id } });
        res.json({ msg: "Deletado" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Buscar usuário por ID (necessário para a página de perfil)
app.get('/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`GET /usuarios/${id} - solicitacao de perfil`);
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            console.log(`Usuário id=${id} não encontrado.`);
            return res.status(404).json({ erro: 'User not found' });
        }
        console.log(`Usuário id=${id} encontrado:`, { id: usuario.id, nome: usuario.nome });
        res.json(usuario);
    } catch (e) {
        console.error('Erro ao buscar usuário:', e);
        res.status(500).json({ erro: e.message });
    }
});

// --- RESERVAS ---
app.post('/reservas', async (req, res) => {
    try {
        const nova = await Reserva.create(req.body);
        res.status(201).json({ mensagem: "Reservado!", id: nova.id });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/reservas/usuario/:idUsuario', async (req, res) => {
    const lista = await Reserva.findAll({
        where: { usuarioId: req.params.idUsuario },
        order: [['data_reserva', 'DESC']]
    });
    res.json(lista);
});

// --- PRATOS (CARDÁPIO) ---
app.get('/pratos', async (req, res) => {
    try {
        const lista = await Pratos.findAll();
        const resposta = lista.map(p => ({
            ...p.toJSON(),
            imagem: p.imagem ? `data:image/jpeg;base64,${Buffer.from(p.imagem).toString("base64")}` : null
        }));
        res.json(resposta);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/pratos', upload.single('imagem'), async (req, res) => {
    try {
        await Pratos.create({
            ...req.body,
            imagem: req.file ? req.file.buffer : null
        });
        res.status(201).json({ msg: "Criado" });
    } catch (e) { res.status(400).json({ erro: e.message }); }
});

app.put('/pratos/:id', upload.single('imagem'), async (req, res) => {
    try {
        let dados = { ...req.body };
        if (req.file) dados.imagem = req.file.buffer;
        await Pratos.update(dados, { where: { idPratos: req.params.id } });
        res.json({ msg: "Atualizado" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.delete('/pratos/:id', async (req, res) => {
    try {
        await Pratos.destroy({ where: { idPratos: req.params.id } });
        res.json({ msg: "Deletado" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ==========================================
// 6. INICIALIZAÇÃO
// ==========================================
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`---------------------------------------`);
        console.log(`✅ SERVIDOR RODANDO NA PORTA ${PORT}`);
        console.log(`📂 Tabela 'Usuarios' conectada`);
        console.log(`📂 Tabela 'Reservas' conectada`);
        console.log(`---------------------------------------`);
    });
}).catch(err => {
    console.error("❌ ERRO AO CONECTAR:", err);
});