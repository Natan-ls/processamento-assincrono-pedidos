CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,        -- Email ou outro meio de login
    password_hash TEXT NOT NULL,                -- Senha do usuário (HASH, não criptografia)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,                -- Usuário que realizou o pedido
    status VARCHAR(50) NOT NULL,                -- Status atual do pedido
    valor_total NUMERIC(10,2),                  -- Valor total do pedido
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pedidos_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE
);

CREATE TABLE itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,                 -- Pedido ao qual o item pertence
    nome_item VARCHAR(255) NOT NULL,             -- Nome do item
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),

    CONSTRAINT fk_itens_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);

CREATE TABLE ordem_dos_eventos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,                 -- Pedido relacionado ao evento
    tipo_evento VARCHAR(100) NOT NULL,           -- Ex: pagamento_aprovado
    criador_evento VARCHAR(100) NOT NULL,        -- Ex: kafka, worker, api
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_eventos_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);

CREATE TABLE pagamento (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,                 -- Pedido ao qual o pagamento pertence
    status VARCHAR(50) NOT NULL,                -- Ex: aprovado, falha, pendente
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    processed_at TIMESTAMP,

    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (pedido_id)
        REFERENCES pedidos(id)
        ON DELETE CASCADE
);


