const Sequelize = require('sequelize');
const database = require('../js/bd');

const Usuario = database.define('Usuario', {
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
        defaultValue: Sequelize.NOW
    }
}, {
    tableName: 'Usuarios', // <--- MUDADO AQUI
    timestamps: false
});

module.exports = Usuario;