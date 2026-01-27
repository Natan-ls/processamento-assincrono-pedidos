CREATE TABLE pessoa (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    endereco TEXT,
    telefone VARCHAR(20),
    url_foto_perfil TEXT
);

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    pessoa_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,        -- Email
    password_hash TEXT NOT NULL,                -- Senha do lclient (HASH, não criptrografado)
    tipo_usuario VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_pessoa
        FOREIGN KEY (pessoa_id)
        REFERENCES pessoa(id)
        ON DELETE CASCADE
);

CREATE TABLE estabelecimento (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    categoria VARCHAR(100),
    endereco TEXT,
    url_logo TEXT, 
    url_banner TEXT,
    pessoa_id INTEGER NOT NULL,

    CONSTRAINT fk_pessoa_estabelecimento
        FOREIGN KEY (pessoa_id)
        REFERENCES pessoa(id)
        ON DELETE CASCADE
);

CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    estabelecimento_id INTEGER NOT NULL,    
    nome_item VARCHAR(255) NOT NULL,
    preco_unidade NUMERIC(10,2) NOT NULL CHECK (preco_unidade >= 0),
    quantidade_estoque INTEGER NOT NULL CHECK (quantidade_estoque >= 0),
    url_imagem TEXT,

    CONSTRAINT fk_produto_estabelecimento
        FOREIGN KEY (estabelecimento_id)
        REFERENCES estabelecimento(id)
        ON DELETE CASCADE
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    estabelecimento_id INTEGER NOT NULL,
    pessoa_id INTEGER NOT NULL,                -- Cliente que realizou o pedido
    status VARCHAR(50) NOT NULL,                -- Status atual do pedido
    valor_total NUMERIC(10,2),                  -- Valor total do pedido    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (pessoa_id)
        REFERENCES pessoa(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pedidos_estabelecimento
        FOREIGN KEY (estabelecimento_id)
        REFERENCES estabelecimento(id)
        ON DELETE CASCADE
);

CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,                 -- Pedido ao qual o item pertence
    produto_id INTEGER NOT NULL,                -- Produto do pedido
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),

    CONSTRAINT fk_itens_pedido_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_itens_pedido_produto
        FOREIGN KEY (produto_id)
        REFERENCES produto(id)
        ON DELETE CASCADE
);

CREATE TABLE ordem_dos_eventos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,                 -- Pedido relacionado ao evento
    tipo_evento VARCHAR(100) NOT NULL,           -- Exempl: pagamento_aprovado
    criador_evento VARCHAR(100) NOT NULL,        -- Exemplo: kafka, worker, api
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_eventos_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);

CREATE TABLE pagamento (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,                 -- Pedido ao qual o pagamento pertence
    status VARCHAR(50) NOT NULL,                -- Exemplo: aprovado, falha, pendente
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    processed_at TIMESTAMP,

    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);





------ INSERT INTOS p/ TESTEs ------------------
INSERT INTO pessoa(nome, cpf, endereco, telefone)
VALUES ('João', '97242721091', 'Avenida João', '(38)12344321'),
('Marcos', '36636846011', 'Avenida Marcos', '(38)45677654');

INSERT INTO usuario(pessoa_id, email, password_hash, tipo_usuario)
VALUES (1, 'joao@gmail.com', 'teste', 'Colaborador'),
(2, 'marcospizza@gmail.com', 'teste', 'Colaborador');

INSERT INTO estabelecimento (pessoa_id, nome_fantasia, cnpj, categoria, endereco)
VALUES (1, 'Pizzaria do João', '12345678000190', 'Alimentação', 'Rua Central, 100'),
(2, 'Pizzaria do Marcos', '17345677000290', 'Alimentação', 'Rua João, 55');

INSERT INTO produto (estabelecimento_id, nome_item, preco_unidade, quantidade_estoque)
VALUES
(1, 'Pizza Calabresa', 45.00, 50),
(1, 'Pizza Marguerita', 42.00, 40),
(2, 'Pizza Marguerita', 35.12, 60),
(1, 'Coca-Cola 2L', 13.00, 100),
(2, 'Coca-Cola 2L', 12.00, 100);
