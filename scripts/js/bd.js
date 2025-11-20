const Sequelize = require('sequelize');

// Conexão com SQL Server
// ATENÇÃO: Se o seu usuário for 'sa' em vez de 'adimin', troque aqui.
const sequelize = new Sequelize('Sapori', 'admin', 'admin', {
    host: 'localhost',
    dialect: 'mssql',
    port: 1433,
    logging: false,
    dialectOptions: {
        options: {
            encrypt: false, 
            trustServerCertificate: true
        }
    }
});

module.exports = sequelize;