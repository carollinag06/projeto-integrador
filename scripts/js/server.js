const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');

// Importamos o Sequelize apenas para pegar o operador 'Op' (usado nos filtros de data)
const { Op } = require('sequelize');

// IMPORTAÇÃO DO BANCO E MODELOS (Vindo do bd.js)
const { sequelize, Usuario, Reserva, Pratos } = require('./bd');

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(bodyParser.json());

// ==========================================
// ROTAS - DASHBOARD
// ==========================================

// Total de Clientes
app.get("/dashboard/totalUsuarios", async (req, res) => {
    try {
        const total = await Usuario.count({ where: { tipoUsuario: 1 } });
        res.json({ total });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Total de Reservas
app.get("/dashboard/totalReservas", async (req, res) => {
    try {
        const total = await Reserva.count();
        res.json({ total });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Último Cliente Cadastrado
app.get("/dashboard/ultimoCliente", async (req, res) => {
    try {
        const ultimo = await Usuario.findOne({
            where: { tipoUsuario: 1 },
            order: [['id', 'DESC']]
        });
        res.json(ultimo || {});
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Gráfico: Usuários por Mês
app.get("/dashboard/usuariosPorMes/:ano", async (req, res) => {
    const ano = req.params.ano;
    try {
        const dados = await Usuario.findAll({
            attributes: [
                [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro")), "mes"],
                [sequelize.fn("COUNT", sequelize.col("id")), "total"]
            ],
            where: {
                tipoUsuario: 1,
                [Op.and]: sequelize.where(sequelize.fn("YEAR", sequelize.col("DataHoraCadastro")), ano)
            },
            group: [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro"))],
            order: [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro"))]
        });
        res.json(dados);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Gráfico: Reservas por Mês
app.get("/dashboard/reservasPorMes/:ano", async (req, res) => {
    const ano = req.params.ano;
    try {
        const dados = await Reserva.findAll({
            attributes: [
                [sequelize.fn("MONTH", sequelize.col("data_reserva")), "mes"],
                [sequelize.fn("COUNT", sequelize.col("id")), "total"]
            ],
            where: sequelize.where(sequelize.fn("YEAR", sequelize.cast(sequelize.col("data_reserva"), 'DATE')), ano),
            group: [sequelize.fn("MONTH", sequelize.col("data_reserva"))],
            order: [sequelize.fn("MONTH", sequelize.col("data_reserva"))]
        });
        res.json(dados);
    } catch (e) {
        console.error("Erro reservasPorMes:", e);
        res.json([]);
    }
});

// ==========================================
// ROTAS CRUD
// ==========================================

// --- LOGIN ---
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) return res.status(404).json({ erro: 'Email não encontrado' });
        if (usuario.senha !== senha) return res.status(401).json({ erro: 'Senha incorreta' });

        res.json({
            sucesso: true,
            usuario: { id: usuario.id, nome: usuario.nome, tipoUsuario: usuario.tipoUsuario }
        });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

// --- USUÁRIOS ---
app.post('/usuarios', async (req, res) => {
    try {
        if (!req.body.senha || req.body.senha.length < 6) {
            return res.status(400).json({ erro: "Senha min 6 caracteres." });
        }
        let dados = { ...req.body };
        if (!dados.tipoUsuario) dados.tipoUsuario = 1;
        if (dados.tipoUsuario === 'admin') dados.tipoUsuario = 2;
        if (dados.tipoUsuario === 'cliente') dados.tipoUsuario = 1;

        const novo = await Usuario.create(dados);
        res.status(201).json(novo);
    } catch (error) { res.status(400).json({ erro: error.message }); }
});

app.get('/usuarios', async (req, res) => {
    try {
        const lista = await Usuario.findAll();
        res.json(lista);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/usuarios/:id', async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ erro: 'User not found' });
        res.json(usuario);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.put('/usuarios/:id', async (req, res) => {
    try {
        await Usuario.update(req.body, { where: { id: req.params.id } });
        res.json({ msg: "Atualizado" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.delete('/usuarios/:id', async (req, res) => {
    try {
        await Usuario.destroy({ where: { id: req.params.id } });
        res.json({ msg: "Deletado" });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// --- RESERVAS ---

// 1. Criar Reserva
app.post('/reservas', async (req, res) => {
    try {
        const nova = await Reserva.create(req.body);
        res.status(201).json({ mensagem: "Reservado!", id: nova.id });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// 2. Listar Reservas de um Usuário
app.get('/reservas/usuario/:idUsuario', async (req, res) => {
    try {
        const lista = await Reserva.findAll({
            where: { usuarioId: req.params.idUsuario },
            order: [['data_reserva', 'DESC']]
        });
        res.json(lista);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// 3. Editar Reserva (ESTA ERA A QUE FALTAVA)
app.put('/reservas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { data_reserva, horario, numero_pessoas } = req.body;

        // Atualiza apenas os campos permitidos
        await Reserva.update(
            { data_reserva, horario, numero_pessoas },
            { where: { id: id } }
        );

        res.json({ mensagem: "Reserva atualizada com sucesso!" });
    } catch (e) {
        console.error("Erro ao atualizar reserva:", e);
        res.status(500).json({ erro: e.message });
    }
});

// 4. Cancelar/Deletar Reserva (IMPORTANTE PARA O BOTÃO DE EXCLUIR)
app.delete('/reservas/:id', async (req, res) => {
    try {
        await Reserva.destroy({ where: { id: req.params.id } });
        res.json({ mensagem: "Reserva cancelada." });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
});

// --- PRATOS ---
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

// Rota para o ADMIN ver TODAS as reservas
app.get('/reservas', async (req, res) => {
    try {
        // Busca todas as reservas e inclui os dados do Usuário (nome, telefone)
        const lista = await Reserva.findAll({
            include: [{
                model: Usuario,
                attributes: ['nome', 'telefone'] // Traz apenas nome e telefone do cliente
            }],
            order: [['data_reserva', 'DESC']]
        });
        res.json(lista);
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ SERVIDOR RODANDO NA PORTA ${PORT}`);
        console.log(`📂 Banco de dados sincronizado via bd.js`);
    });
}).catch(err => {
    console.error("❌ ERRO AO CONECTAR:", err);
});