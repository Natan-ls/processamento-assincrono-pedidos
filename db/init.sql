CREATE TABLE endereco (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(2) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    bairro VARCHAR(100),
    rua VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    cep VARCHAR(10)
);

CREATE TABLE pessoa (  
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    endereco_id INTEGER NOT NULL,
    telefone VARCHAR(20),
    url_foto_perfil TEXT,

    CONSTRAINT fk_pessoa_endereco
        FOREIGN KEY (endereco_id)
        REFERENCES endereco(id)
        ON DELETE CASCADE
);

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    pessoa_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,        -- Email
    password_hash TEXT NOT NULL,                -- Senha do lclient (HASH, não criptrografado)
    tipo_usuario VARCHAR(50) NOT NULL,
    -- colunas p VIP
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    vip_until TIMESTAMP NULL,    
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
    endereco_id INTEGER NOT NULL,
    taxa_entrega INTEGER NOT NULL,
    url_logo TEXT, 
    url_banner TEXT,
    pessoa_id INTEGER NOT NULL,

    CONSTRAINT fk_pessoa_estabelecimento
        FOREIGN KEY (pessoa_id)
        REFERENCES pessoa(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_endereco_estabelecimento
        FOREIGN KEY (endereco_id)
        REFERENCES endereco(id)
        ON DELETE CASCADE
);

CREATE TABLE horario_funcionamento ( 
    id SERIAL PRIMARY KEY, 
    estabelecimento_id INTEGER NOT NULL, 
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    ativo BOOLEAN, 
    hora_inicio TIME NOT NULL, 
    hora_fim TIME NOT NULL, 
    
    CONSTRAINT fk_horario_estabelecimento 
        FOREIGN KEY (estabelecimento_id) 
        REFERENCES estabelecimento(id) 
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
    endereco_entrega VARCHAR(255) NOT NULL,
    pagamento_timer TIMESTAMP,
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
    observacao TEXT, 

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
    metodo VARCHAR(20),
    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);


------ INSERT INTOS p/ TESTEs ------------------
INSERT INTO endereco(estado, cidade, rua, numero, cep) VALUES
    ('MG', 'Januária', 'Avenida João', '456', '39480000'),
    ('MG', 'Januária', 'Avenida Marcos','1442', '39480000'),
    ('MG', 'Januária', 'Rua Central', '548', '39480000'),
    ('MG', 'Januária', 'Cônego Ramiro', '5414', '39480000'),
    ('MG', 'Januária', 'Barão de São Romaão', '1973', '39480000'),
    ('MG', 'Januária', 'Gaspar Dutra', '52', '39480000');


INSERT INTO pessoa(endereco_id, nome, cpf, telefone) VALUES 
    (1, 'João', '97242721091', '(38)12344321'),
    (2, 'Marcos', '36636846011', '(38)45677654'),
    (3, 'Mateus', '36436876031', '(37)36217594'),
    (4, 'Andre', '30436936095', '(31)36267993');


INSERT INTO usuario(pessoa_id, email, password_hash, tipo_usuario) VALUES 
    (1, 'joao@gmail.com', 'teste', 'empresa'),
    (2, 'marcospizza@gmail.com', 'teste', 'empresa'),
    (3, 'mateus@gmail.com', 'teste', 'empresa'),
    (4, 'andre@gmail.com', 'teste', 'empresa');


INSERT INTO estabelecimento (pessoa_id, endereco_id, nome_fantasia, cnpj, categoria, taxa_entrega, url_logo, url_banner) VALUES 
    (1, 3, 'Pizzaria do João', '12345678000190', 'FAST_FOOD', 5, '/static/uploads/logos/pizzamarcos.png', '/static/uploads/logos/pizzamarcosbanner.jpeg'),
    (2, 4,'Pizzaria do Marcos', '17345677000290', 'FAST_FOOD', 7, '/static/uploads/logos/pizzajoao.png', '/static/uploads/logos/pizzajoaobanner.jpeg'),
    (3, 5,'Pimenta Mineira', '00398308000137', 'RESTAURANTE', 10, '/static/uploads/logos/pimentamineira.png', '/static/uploads/logos/pimentamineirabanner.jpeg'),
    (4, 6,'Drogaria Santo Antonio', '23565792000147', 'FARMACIA', 0, '/static/uploads/logos/farmacia.png', '/static/uploads/logos/farmaciabanner.jpeg');


INSERT INTO produto (estabelecimento_id, nome_item, preco_unidade, quantidade_estoque) VALUES
    (1, 'Pizza Calabresa', 45.00, 50),
    (1, 'Pizza Marguerita', 42.00, 40),
    (2, 'Pizza Marguerita', 35.12, 60),
    (1, 'Coca-Cola 2L', 13.00, 100),
    (2, 'Coca-Cola 2L', 12.00, 100),
    (4, 'Benegripe  12Caps', 19.00, 200),
    (4, 'Creatina  1KG', 70.00, 150),
    (4, 'Amoxilina', 33.00, 50),
    (4, 'Nimesulida', 08.00, 0);
    


INSERT INTO horario_funcionamento (estabelecimento_id, dia_semana, ativo, hora_inicio, hora_fim) VALUES
    (1, 0, TRUE, '18:00', '03:00'), -- Domingo
    (1, 1, TRUE, '18:00', '03:00'), -- Segunda
    (1, 2, TRUE, '18:00', '03:00'), -- Terça
    (1, 3, TRUE, '18:00', '03:00'), -- Quarta
    (1, 4, TRUE, '18:00', '03:00'), -- Quinta
    (1, 5, TRUE, '18:00', '03:00'), -- Sexta
    (1, 6, TRUE, '18:00', '03:00'), -- Sábado
    (2, 0, TRUE, '17:30', '02:30'),
    (2, 1, TRUE, '17:30', '02:30'),
    (2, 2, TRUE, '17:30', '02:30'),
    (2, 3, TRUE, '17:30', '02:30'),
    (2, 4, TRUE, '17:30', '02:30'),
    (2, 5, TRUE, '17:30', '02:30'),
    (2, 6, TRUE, '17:30', '02:30'),
    (3, 0, TRUE, '09:30', '22:30'),--PIMENTA MINEIRA Dom
    (3, 1, TRUE, '09:30', '22:30'),-- Seg
    (3, 2, TRUE, '09:30', '22:30'),-- Terc
    (3, 3, TRUE, '09:30', '22:30'),-- Quarta
    (3, 4, TRUE, '09:30', '22:30'),--Quinta
    (3, 5, TRUE, '09:30', '22:30'),--Setxa
    (3, 6, TRUE, '09:30', '22:30'),--Sab
    (4, 0, TRUE, '07:30', '22:30'),--DROGARIA SANTO ANTONIO --dom
    (4, 1, TRUE, '07:30', '22:30'),--Seg
    (4, 2, TRUE, '07:30', '22:30'),--terc
    (4, 3, TRUE, '07:30', '22:30'),--quart
    (4, 4, TRUE, '07:30', '22:30'),--quint
    (4, 5, TRUE, '07:30', '22:30'),--setx
    (4, 6, TRUE, '07:30', '22:30');--sab


