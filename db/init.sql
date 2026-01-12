
"tabela p autenticação"
Create Table usuario (
    id serial primary key,
    "email ou outro meio de login" varchar(255) unique not null, ""
    password_hash text not null, "Senha do Usuario Hasheada e Criptografada"
    created_at timestamp default CURRENT_TIMESTAMP "Data e hora q o User foi criado"
);

"Tabela da ordem dos pedidos, e o seu STATUS é atualizado ao longo do tempo"

create Table pedidos (
    id serial primary key
    usuario_id integer not null,
    status varchar(50) not null,
    valor_total numeric(10,2),"verificar a necessidade de ter a variavel ou não"
    created_at timestamp default CURRENT_TIMESTAMP, "Armazena Data e hora da Realização do Pedido"
    updated_at timestamp default CURRENT_TIMESTAMP, "Armazena a ultima vez q o pedido foi atualizado, mas a variavel é OPCIONAL pode ser TIRADO"
    constraint fk_usuario 
        foreign key(usuario_id) 
        references usuario(id)
);

"Tabela p armazer os Items do Pedido"
create table items_pedido (
    id serial primary key,
    pedido_id integer not null, "armazena a  qual pedido os items peterce"
    nome_item varchar(255) not null,"Nome do item"
    quantidade integer not null, "quantiade de itens"
    preco_unidade numeric(10,2) not null, "preço da unidade do item pedido"

    constraint fk_pedido
        foreign key(pedido_id)
        references pedidos(id)
);

"Tabela p armazenar a ordem dos eventos de um pedido"
create table ordem_dos_eventos (
    id serial primary key,
    pedido_id integer not null, "variavel p armazenar o pedido ao qual o evento pertence"
    tipo_evento varchar(100) not null, "tipo de evento q aconteceu por ex: pagamento aprovado"
    criador_evento varchar(100) not null, "Armazena qm gerou o evento, por ex: kafka, celery e etc"
    created_at timestamp default CURRENT_TIMESTAMP, "Horario q o evento aconteceu"

    constraint fk_event_order
        foreign key(pedido_id)
        references pedidos(id)
);


"Tabela de pagamento"
create table pagamento (
    id serial primary key,
    pedido_id integer not null, "armazena qual pedido o pagamentoi pertence "
    status varchar(50) not null, "satus do pagamento, por ex: aprovado, falha e tals"
    valor numeric(10,2) not null, "Valor do pagamento"
    processed_at timestamp, "horario q o pagamento foi feito"

    constraint fk_payment_order
        foreign key(pedido_id)
        references pedidos(id)
);


