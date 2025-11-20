const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Sequelize = require('sequelize');

// ==========================================
// 1. DATABASE CONFIGURATION
// ==========================================
const sequelize = new Sequelize('Sapori', 'admin', 'admin', {
    host: 'DESKTOP-N4J6VRI', // Verifique se o host se mantém este
    dialect: 'mssql',
    port: 1433,
    logging: false, // Desliguei o log do SQL no console pra limpar sua visão (ligue se precisar debugar query)
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    }
});

// ==========================================
// 2. MODELS (DOMAIN LAYER)
// ==========================================
const Usuario = sequelize.define('Usuario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: { type: Sequelize.STRING(100), allowNull: true },
    senha: { type: Sequelize.STRING(20), allowNull: true }, // Cuidado: Em prod, hash isso aqui (bcrypt)
    frequencia_visitas: { type: Sequelize.INTEGER, allowNull: true },
    telefone: { type: Sequelize.STRING(15), allowNull: true },
    cpf: { type: Sequelize.STRING(11), allowNull: true },
    pratos_preferidos: { type: Sequelize.STRING(50), allowNull: true },
    email: { type: Sequelize.STRING(50), allowNull: true },
    tipoUsuario: { type: Sequelize.INTEGER, allowNull: true },
    DataHoraCadastro: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('GETDATE()')
    }
}, {
    tableName: 'Usuarios',
    timestamps: false
});

// ==========================================
// 3. APP MIDDLEWARES
// ==========================================
const app = express();
const PORT = 3000;

app.use(cors()); // Em produção, restrinja a origin aqui
app.use(bodyParser.json());

// ==========================================
// 4. ROUTES (API ENDPOINTS)
// ==========================================

// [POST] Criar Usuário
app.post('/usuarios', async (req, res) => {
    try {
        const novo = await Usuario.create(req.body);
        res.status(201).json(novo);
    } catch (error) {
        console.error("[POST Error]", error.message);
        res.status(400).json({ erro: error.message });
    }
});

// [GET] Listar Todos (Admin use only, idealmente)
app.get('/usuarios', async (req, res) => {
    try {
        const lista = await Usuario.findAll({
            attributes: { exclude: ['senha'] } // Security Best Practice: Nunca retorne senhas em listas
        });
        res.json(lista);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// [GET] Buscar Usuário por ID (Profile Data)
// 🔥 AQUI ESTAVA FALTANDO A ROTA QUE QUEBRAVA SEU FRONT 🔥
app.get('/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Endpoint Hit: GET /usuarios/${id}`); // Log para debug

        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['senha'] } // Sanitização: Remove senha do payload
        });

        if (!usuario) {
            return res.status(404).json({ erro: 'User not found' });
        }

        return res.json(usuario);

    } catch (error) {
        console.error("[GET ID Error]", error);
        return res.status(500).json({ erro: 'Internal Server Error' });
    }
});

// [DELETE] Remover Usuário
app.delete('/usuarios/:id', async (req, res) => {
    try {
        const rows = await Usuario.destroy({ where: { id: req.params.id } });
        if (rows > 0) res.json({ ok: true });
        else res.status(404).json({ erro: 'Not found' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// [POST] Auth Login
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        // Nota: FindOne é mais performático que filter no array
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) return res.status(404).json({ erro: 'Email inválido' });
        
        // Nota: Comparação de string direta (Inseguro para Prod, ok para MVP)
        if (usuario.senha !== senha) return res.status(401).json({ erro: 'Senha incorreta' });

        res.json({
            sucesso: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                tipo: usuario.tipoUsuario
            }
        });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ==========================================
// 5. SERVER INIT
// ==========================================

sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`---------------------------------------`);
        console.log(`✅ SERVIDOR RODANDO NA PORTA ${PORT}`);
        console.log(`📂 Tabela 'Usuarios' conectada!`);
        console.log(`---------------------------------------`);
    });
}).catch(err => {
    console.error("❌ FALHA NA CONEXÃO:", err);
});