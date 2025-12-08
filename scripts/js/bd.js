const Sequelize = require('sequelize');

// ==========================================
// 1. CONFIGURAÇÃO DA CONEXÃO COM O BANCO
// ==========================================
// Pegamos a configuração que estava funcionando no server.js
const sequelize = new Sequelize('Sapori', 'admin', 'admin', {
    host: 'DESKTOP-N4J6VRI', // ou 'localhost'
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

// ==========================================
// 2. MODELOS (Mapeamento das Tabelas)
// ==========================================

// --- MODELO USUARIO ---
const Usuario = sequelize.define('Usuario', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(100), allowNull: true },
    senha: { type: Sequelize.STRING(20), allowNull: true },
    frequencia_visitas: { type: Sequelize.INTEGER, allowNull: true },
    telefone: { type: Sequelize.STRING(15), allowNull: true },
    cpf: { type: Sequelize.STRING(11), allowNull: true },
    pratos_preferidos: { type: Sequelize.STRING(50), allowNull: true },
    email: { type: Sequelize.STRING(50), allowNull: true },
    tipoUsuario: { type: Sequelize.INTEGER, defaultValue: 1 },
    DataHoraCadastro: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('GETDATE()')
    }
}, { tableName: 'Usuarios', timestamps: false });

// --- MODELO RESERVA ---
const Reserva = sequelize.define('Reserva', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
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

// --- MODELO PRATOS ---
const Pratos = sequelize.define('Pratos', {
    idPratos: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    nome: { type: Sequelize.STRING(100), allowNull: false },
    modo_preparo: { type: Sequelize.STRING(500), allowNull: true },
    preco: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    descricao: { type: Sequelize.STRING(200), allowNull: true },
    promocao: { type: Sequelize.BOOLEAN, allowNull: true },
    tipo: { type: Sequelize.STRING, allowNull: true },
    imagem: { type: Sequelize.BLOB, allowNull: true }
}, { tableName: 'Pratos', timestamps: false });

// --- RELACIONAMENTOS ---
Usuario.hasMany(Reserva, { foreignKey: 'usuarioId' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Exportamos a conexão (sequelize) e os modelos para usar no server.js
module.exports = { sequelize, Usuario, Reserva, Pratos };