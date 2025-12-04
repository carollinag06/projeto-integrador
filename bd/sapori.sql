/* =========================================================
   TABELA USUARIOS
========================================================= */
CREATE TABLE Usuarios (
    id INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(100) NULL,
    senha VARCHAR(20) NULL,
    frequencia_visitas INT NULL,
    telefone VARCHAR(15) NULL,
    cpf VARCHAR(11) NULL,
    pratos_preferidos VARCHAR(50) NULL,
    email VARCHAR(100) NULL,
    tipoUsuario INT NULL,
    DataHoraCadastro DATETIME NULL
);
GO

/* =========================================================
   TABELA FORNECEDOR
========================================================= */
CREATE TABLE Fornecedor (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(100) NULL,
    contato VARCHAR(20) NULL,
    cnpj VARCHAR(14) NULL
);
GO

/* =========================================================
   TABELA INGREDIENTES
========================================================= */
CREATE TABLE Ingredientes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(100) NULL,
    valor DECIMAL(10,2) NULL,
    validade DATE NULL,
    ponto_reposicao INT NULL,
    quantidade INT NULL,
    marca VARCHAR(50) NULL
);
GO

/* =========================================================
   TABELA PRATOS
========================================================= */
CREATE TABLE Pratos (
    idPratos INT IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    modo_preparo VARCHAR(MAX) NULL,
    preco DECIMAL(10,2) NOT NULL,
    descricao VARCHAR(MAX) NULL,
    imagem VARBINARY(MAX) NULL,
    promocao BIT NULL,
    tipo VARCHAR(100) NULL
);
GO

/* =========================================================
   TABELA ASSOCIATIVA ENTRE PRATOS E INGREDIENTES
========================================================= */
CREATE TABLE Tabela (
    idPratos INT NOT NULL,
    idIngredientes INT NOT NULL,
    quantidade INT NULL,
    CONSTRAINT PK_Tabela PRIMARY KEY (idPratos, idIngredientes),
    CONSTRAINT FK_Tabela_Pratos FOREIGN KEY (idPratos) REFERENCES Pratos(idPratos),
    CONSTRAINT FK_Tabela_Ingredientes FOREIGN KEY (idIngredientes) REFERENCES Ingredientes(id)
);
GO

/* =========================================================
   TABELA PEDIDO
========================================================= */
CREATE TABLE Pedido (
    id INT IDENTITY(1,1) PRIMARY KEY,
    data DATE NULL,
    hora TIME NULL,
    id_cliente INT NOT NULL,
    id_pratos INT NOT NULL,
    CONSTRAINT FK_Pedido_Cliente FOREIGN KEY (id_cliente) REFERENCES Usuarios(id),
    CONSTRAINT FK_Pedido_Pratos FOREIGN KEY (id_pratos) REFERENCES Pratos(idPratos)
);
GO

/* =========================================================
   TABELA RESERVA
========================================================= */
CREATE TABLE Reserva (
    id INT IDENTITY(1,1) PRIMARY KEY,
    horario TIME NULL,
    data DATE NULL,
    mesa INT NULL,
    quantidade_pessoas INT NULL,
    id_cliente INT NOT NULL,
    CONSTRAINT FK_Reserva_Cliente FOREIGN KEY (id_cliente) REFERENCES Usuarios(id)
);
GO

/* =========================================================
   TABELA FUNCIONARIO
========================================================= */
CREATE TABLE Funcionario (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(100) NULL,
    uniforme VARCHAR(50) NULL,
    data_contratacao DATE NULL,
    salario DECIMAL(10,2) NULL,
    beneficios VARCHAR(255) NULL,
    escala_trabalho VARCHAR(50) NULL,
    cargo VARCHAR(50) NULL,
    setor VARCHAR(50) NULL
);
GO

/* =========================================================
   TABELA FORNECE (INGREDIENTES X FORNECEDOR)
========================================================= */
CREATE TABLE Fornece (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idEstoque INT NOT NULL,       -- referencia INGREDIENTES
    idFornecedor INT NOT NULL,
    quantidade INT NULL,
    data_compra DATE NULL,
    CONSTRAINT FK_Fornece_Ingredientes FOREIGN KEY (idEstoque) REFERENCES Ingredientes(id),
    CONSTRAINT FK_Fornece_Fornecedor FOREIGN KEY (idFornecedor) REFERENCES Fornecedor(id)
);
GO


select * from usuarios