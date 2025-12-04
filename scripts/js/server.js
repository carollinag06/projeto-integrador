// ===============================
// IMPORTAÇÕES
// ===============================
const express = require('express'); 
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs'); // Segurança

// Sequelize
const { Sequelize, DataTypes, Op } = require('sequelize');

const upload = multer({ storage: multer.memoryStorage() });


// ===============================
// 1. CONFIGURAÇÃO DO BANCO
// ===============================
const sequelize = new Sequelize('Sapori', 'admin', 'admin', {
    host: 'DESKTOP-N4J6VRI',
    dialect: 'mssql',
    port: 1433,
    logging: false,
    dialectOptions: {
        options: {
            encrypt: true,
            trustServerCertificate: true,
            enableArithAbort: true
        }
    }
});


// ===============================
// 2. FUNÇÕES DE VALIDAÇÃO
// ===============================
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto >= 10) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto >= 10) resto = 0;

    return resto === parseInt(cpf.substring(10, 11));
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}


// ===============================
// 3. MODELOS
// ===============================
const Usuario = sequelize.define('Usuario', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
    nome: Sequelize.STRING(100),
    senha: Sequelize.STRING(255),
    frequencia_visitas: Sequelize.INTEGER,
    telefone: Sequelize.STRING(15),
    cpf: Sequelize.STRING(14),
    pratos_preferidos: Sequelize.STRING(50),
    email: Sequelize.STRING(50),
    tipoUsuario: { type: Sequelize.INTEGER, defaultValue: 1 },
    DataHoraCadastro: { type: Sequelize.DATE, defaultValue: Sequelize.literal('GETDATE()') }
}, { tableName: 'Usuarios', timestamps: false });

const Reserva = sequelize.define('Reserva', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    data_reserva: Sequelize.STRING(10),
    horario: Sequelize.STRING(5),
    numero_pessoas: Sequelize.STRING(10),
    status: { type: Sequelize.STRING(20), defaultValue: 'Confirmada' },
    observacoes: Sequelize.STRING(200),
    usuarioId: { type: Sequelize.INTEGER, allowNull: false, references: { model: Usuario, key: 'id' } }
}, { tableName: 'Reservas', timestamps: false });

const Pratos = sequelize.define('Pratos', {
    idPratos: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: Sequelize.STRING(100),
    modo_preparo: Sequelize.STRING(500),
    preco: Sequelize.DECIMAL(10, 2),
    descricao: Sequelize.STRING(200),
    promocao: Sequelize.BOOLEAN,
    tipo: Sequelize.STRING,
    imagem: Sequelize.BLOB
}, { tableName: 'Pratos', timestamps: false });

Usuario.hasMany(Reserva, { foreignKey: 'usuarioId' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId' });


// ===============================
// 4. CONFIG APP
// ===============================
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());


// ===============================
// 5. ROTAS DE AUTENTICAÇÃO
// ===============================
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) return res.status(404).json({ erro: 'Email não cadastrado.' });

        let senhaValida;
        senhaValida = usuario.senha.startsWith('$2a$')
            ? await bcrypt.compare(senha, usuario.senha)
            : (usuario.senha === senha);

        if (!senhaValida) return res.status(401).json({ erro: 'Senha incorreta.' });

        res.json({ sucesso: true, usuario: { id: usuario.id, nome: usuario.nome, tipoUsuario: usuario.tipoUsuario } });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

app.post('/usuarios', async (req, res) => {
    try {
        const { nome, email, cpf, senha, telefone, tipoUsuario } = req.body;

        if (!validarEmail(email)) return res.status(400).json({ erro: "E-mail inválido." });
        if (!validarCPF(cpf)) return res.status(400).json({ erro: "CPF inválido." });
        if (!senha || senha.length < 6) return res.status(400).json({ erro: "Senha deve ter no mínimo 6 dígitos." });

        if (await Usuario.findOne({ where: { email } })) return res.status(400).json({ erro: "E-mail já em uso." });
        if (await Usuario.findOne({ where: { cpf } })) return res.status(400).json({ erro: "CPF já cadastrado." });

        const senhaHash = await bcrypt.hash(senha, await bcrypt.genSalt(10));
        const tipoFinal = (tipoUsuario === 'admin' || tipoUsuario == 2) ? 2 : 1;

        await Usuario.create({ nome, email, telefone, cpf, senha: senhaHash, tipoUsuario: tipoFinal });
        res.status(201).json({ msg: "Usuário cadastrado com sucesso!" });

    } catch (error) { res.status(400).json({ erro: error.message }); }
});


// ===============================
// 6. ROTAS GERAIS / CRUD
// ===============================

// Dashboard
app.get("/dashboard/totalUsuarios", async (req, res) => {
    try { res.json({ total: await Usuario.count({ where: { tipoUsuario: 1 } }) }); }
    catch (e) { res.status(500).json({ erro: e.message }); }
});
app.get("/dashboard/totalReservas", async (req, res) => {
    try { res.json({ total: await Reserva.count() }); }
    catch (e) { res.status(500).json({ erro: e.message }); }
});
app.get("/dashboard/ultimoCliente", async (req, res) => {
    try { res.json(await Usuario.findOne({ where: { tipoUsuario: 1 }, order: [['id', 'DESC']] }) || {}); }
    catch (e) { res.status(500).json({ erro: e.message }); }
});
app.get("/dashboard/usuariosPorMes/:ano", async (req, res) => {
    try {
        const dados = await Usuario.findAll({
            attributes: [
                [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro")), "mes"],
                [sequelize.fn("COUNT", sequelize.col("id")), "total"]
            ],
            where: {
                tipoUsuario: 1,
                [Op.and]: sequelize.where(sequelize.fn("YEAR", sequelize.col("DataHoraCadastro")), req.params.ano)
            },
            group: [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro"))],
            order: [sequelize.fn("MONTH", sequelize.col("DataHoraCadastro"))]
        });
        res.json(dados);
    } catch { res.json([]); }
});
app.get("/dashboard/reservasPorMes/:ano", async (req, res) => {
    try {
        const dados = await Reserva.findAll({
            attributes: [
                [sequelize.fn("MONTH", sequelize.col("data_reserva")), "mes"],
                [sequelize.fn("COUNT", sequelize.col("id")), "total"]
            ],
            where: sequelize.where(sequelize.fn("YEAR", sequelize.cast(sequelize.col("data_reserva"), 'DATE')), req.params.ano),
            group: [sequelize.fn("MONTH", sequelize.col("data_reserva"))],
            order: [sequelize.fn("MONTH", sequelize.col("data_reserva"))]
        });
        res.json(dados);
    } catch { res.json([]); }
});

// Usuários
app.get('/usuarios', async (_, res) => res.json(await Usuario.findAll()));
app.get('/usuarios/:id', async (req, res) => {
    const u = await Usuario.findByPk(req.params.id);
    if (!u) return res.status(404).json({ erro: '404' });
    res.json(u);
});
app.put('/usuarios/:id', async (req, res) => {
    await Usuario.update(req.body, { where: { id: req.params.id } });
    res.json({ msg: 'Ok' });
});
app.delete('/usuarios/:id', async (req, res) => {
    await Usuario.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Ok' });
});

// Reservas
app.post('/reservas', async (req, res) => {
    try { res.status(201).json({ id: (await Reserva.create(req.body)).id }); }
    catch (e) { res.status(500).json({ erro: e.message }); }
});
app.get('/reservas/usuario/:id', async (req, res) =>
    res.json(await Reserva.findAll({ where: { usuarioId: req.params.id }, order: [['data_reserva', 'DESC']] }))
);
app.put('/reservas/:id', async (req, res) => {
    await Reserva.update(req.body, { where: { id: req.params.id } });
    res.json({ msg: 'Ok' });
});
app.delete('/reservas/:id', async (req, res) => {
    await Reserva.destroy({ where: { id: req.params.id } });
    res.json({ ok: true });
});

// Pratos
app.get('/pratos', async (_, res) => {
    const l = await Pratos.findAll();
    res.json(l.map(p => ({
        ...p.toJSON(),
        imagem: p.imagem ? `data:image/jpeg;base64,${Buffer.from(p.imagem).toString("base64")}` : null
    })));
});
app.post('/pratos', upload.single('imagem'), async (req, res) =>
    res.status(201).json({ msg: await Pratos.create({ ...req.body, imagem: req.file?.buffer || null }) && 'Ok' })
);
app.put('/pratos/:id', upload.single('imagem'), async (req, res) => {
    const d = { ...req.body, ...(req.file && { imagem: req.file.buffer }) };
    await Pratos.update(d, { where: { idPratos: req.params.id } });
    res.json({ msg: 'Ok' });
});
app.delete('/pratos/:id', async (req, res) => {
    await Pratos.destroy({ where: { idPratos: req.params.id } });
    res.json({ msg: 'Ok' });
});


// ===============================
// START SERVER
// ===============================
sequelize.sync()
  .then(() => app.listen(PORT, () => console.log(`🔥 SERVIDOR RODANDO NA PORTA ${PORT}`)))
  .catch(err => console.error('❌ ERRO AO CONECTAR COM O BANCO:', err));
