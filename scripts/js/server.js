const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Sequelize = require('sequelize');

// ==========================================
// 1. CONFIGURAÇÃO DO BANCO
// ==========================================
const sequelize = new Sequelize('Sapori', 'admin', 'admin', {
    host: 'DESKTOP-N4J6VRI', 
    dialect: 'mssql',
    port: 1433,
    logging: false,
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    }
});

// ==========================================
// 2. MODELOS (TABELAS)
// ==========================================

// --- USUARIO ---
const Usuario = sequelize.define('Usuario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nome: { type: Sequelize.STRING(100), allowNull: true },
    senha: { type: Sequelize.STRING(20), allowNull: true },
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
}, { tableName: 'Usuarios', timestamps: false });

// --- RESERVA ---
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
}, { tableName: 'Reservas', timestamps: false });

// --- RELACIONAMENTOS ---
Usuario.hasMany(Reserva, { foreignKey: 'usuarioId' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// ==========================================
// 3. CONFIGURAÇÃO DO APP
// ==========================================
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// ==========================================
// 4. ROTAS
// ==========================================

// --- USUÁRIOS ---
app.post('/usuarios', async (req, res) => {
    try {
        // Validação de Senha no Backend
        if (!req.body.senha || req.body.senha.length < 6) {
            return res.status(400).json({ erro: "A senha deve ter no mínimo 6 caracteres." });
        }
        const novo = await Usuario.create(req.body);
        res.status(201).json(novo);
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

app.get('/usuarios', async (req, res) => {
    try {
        const lista = await Usuario.findAll();
        res.json(lista);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.get('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ erro: 'User not found' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ erro: 'Internal Server Error' });
    }
});

app.put('/usuarios/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { nome, email, telefone, pratos_preferidos } = req.body;
        await Usuario.update(
            { nome, email, telefone, pratos_preferidos },
            { where: { id: id } }
        );
        res.json({ mensagem: "Dados atualizados!" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.delete('/usuarios/:id', async (req, res) => {
    try {
        await Usuario.destroy({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- LOGIN & SENHA ---
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) return res.status(404).json({ erro: 'Email não encontrado' });
        if (usuario.senha !== senha) return res.status(401).json({ erro: 'Senha incorreta' });

        res.json({
            sucesso: true,
            usuario: { id: usuario.id, nome: usuario.nome, tipo: usuario.tipoUsuario }
        });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.post('/recuperar-senha', async (req, res) => {
    try {
        const { email, cpf, novaSenha } = req.body;

        if (!novaSenha || novaSenha.length < 6) {
            return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
        }

        const usuario = await Usuario.findOne({ where: { email: email, cpf: cpf } });

        if (!usuario) return res.status(404).json({ erro: 'Dados incorretos!' });

        usuario.senha = novaSenha;
        await usuario.save();
        res.json({ mensagem: 'Senha alterada com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- RESERVAS ---
app.post('/reservas', async (req, res) => {
    try {
        console.log("Nova reserva:", req.body);
        const novaReserva = await Reserva.create(req.body);
        res.status(201).json({ mensagem: "Mesa reservada!", id: novaReserva.id });
    } catch (error) {
        console.error("Erro reserva:", error);
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA: BUSCAR RESERVAS DE UM USUÁRIO ESPECÍFICO ---
app.get('/reservas/usuario/:idUsuario', async (req, res) => {
    try {
        const id = req.params.idUsuario;
        
        // Busca todas as reservas onde o usuarioId é igual ao ID que mandamos
        const reservas = await Reserva.findAll({ 
            where: { usuarioId: id },
            order: [['data_reserva', 'DESC']] // Mostra as mais novas primeiro
        });

        res.json(reservas);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA: ATUALIZAR RESERVA ---
app.put('/reservas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Atualiza apenas os campos permitidos
        const { data_reserva, horario, numero_pessoas } = req.body;

        await Reserva.update(
            { data_reserva, horario, numero_pessoas },
            { where: { id: id } }
        );

        res.json({ mensagem: "Reserva atualizada!" });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA: CANCELAR (DELETAR) RESERVA ---
app.delete('/reservas/:id', async (req, res) => {
    try {
        await Reserva.destroy({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});



// ==========================================
// 5. INICIALIZAÇÃO (O FINAL DE TUDO)
// ==========================================
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`---------------------------------------`);
        console.log(`✅ SERVIDOR RODANDO NA PORTA ${PORT}`);
        console.log(`📂 Tabelas: Usuarios & Reservas OK`);
        console.log(`---------------------------------------`);
    });
}).catch(err => {
    console.error("❌ FALHA NA CONEXÃO:", err);
});