# Plataforma Distribuída de Processamento Assíncrono de Pedidos

Projeto Final da disciplina **Sistemas Distribuídos**. Ministrada pelo Professor Msc [Adriano Antunes](https://github.com/adrianoifnmg)

## Visão Geral

Este projeto consiste no desenvolvimento de uma **plataforma distribuída de processamento assíncrono de pedidos**, inspirada em sistemas reais como plataformas de delivery e marketplaces digitais (ex.: iFood), com fins **exclusivamente didáticos**.

O objetivo principal é demonstrar, de forma prática, a aplicação dos **conceitos fundamentais de Sistemas Distribuídos**, incluindo comunicação assíncrona, desacoplamento de serviços, escalabilidade, tolerância a falhas e arquitetura orientada a eventos.

A aplicação expõe uma **API REST** que permite a autenticação de usuários e a criação de pedidos. Cada pedido passa por múltiplas etapas de processamento assíncrono, não sendo adequado o processamento síncrono durante a requisição HTTP.

Após a criação de um pedido, um evento é publicado em um sistema de mensageria baseado em **Apache Kafka**, que atua como intermediário entre a API e os serviços de processamento. Os pedidos são então consumidos por **workers distribuídos**, que executam tarefas assíncronas utilizando o **Celery**, tais como validação de dados, simulação de disponibilidade, processamento de pagamento e atualização do status do pedido.  

O usuário pode consultar posteriormente o status do pedido, garantindo uma experiência responsiva mesmo sob alta carga de requisições.

---

## Arquitetura do Sistema

O sistema segue uma **arquitetura distribuída e orientada a eventos**, composta pelos seguintes componentes:

- **API REST (Flask)**: ponto de entrada do sistema
- **Apache Kafka**: mensageria e comunicação assíncrona entre serviços
- **Celery Workers**: processamento assíncrono e concorrente
- **Broker de Mensagens (Redis ou RabbitMQ)**: suporte ao Celery
- **PostgreSQL**: persistência dos dados
- **Docker & Docker Compose**: containerização e orquestração local

Todos os componentes são executados de forma isolada e integrada por meio de containers Docker.

---

## Tecnologias Utilizadas

### Linguagens
- **Python** (linguagem principal)
- **SQL** (modelagem e consultas)
- **YAML** (configurações de infraestrutura)
- **Shell Script (Bash)** (automação)

### Frameworks e Bibliotecas
- **Flask** – API REST
- **Celery** – processamento assíncrono
- **Kafka-Python** – integração com Apache Kafka
- **SQLAlchemy** – ORM e acesso ao banco de dados
- **PyJWT** – autenticação e autorização via JWT

### Infraestrutura
- **Apache Kafka**
- **Redis ou RabbitMQ**
- **PostgreSQL**
- **Docker**
- **Docker Compose**
- **Git & GitHub**

### Protocolos
- HTTPS  
- TCP/IP  

---

## 🎯 Objetivos Acadêmicos

Este projeto está fortemente alinhado aos conteúdos abordados na disciplina de **Sistemas Distribuídos**, permitindo a aplicação prática dos seguintes conceitos:

- Comunicação assíncrona entre processos distribuídos
- Arquitetura orientada a eventos
- Processamento concorrente e paralelo
- Escalabilidade horizontal
- Tolerância a falhas
- Segurança em sistemas distribuídos (JWT)
- Separação de responsabilidades e baixo acoplamento

---

## 👥 Equipe e Responsabilidades

### Arquitetura e Coordenação Técnica
**[Clebson Santos](https://github.com/ClebTech)**  
**[Wallan Melo](https://github.com/WallanMelo)**
- Definição da arquitetura geral
- Integração entre serviços
- Padronização de código
- Suporte técnico à equipe

### API REST
**[João Marcos](https://github.com/jmarcosgc)**
- Implementação dos endpoints
- Lógica de negócio
- Validação de dados
- Integração com Kafka
- Documentação da API (Swagger/OpenAPI)

### Autenticação e Segurança
**[Clebson Santos](https://github.com/ClebTech)**  
- Implementação de autenticação JWT
- Fluxo de login
- Proteção de endpoints
- Middlewares de segurança

### Mensageria e Eventos
**[Natan](https://github.com/Natan-ls)**  
**[Wallan Melo](https://github.com/WallanMelo)**
- Configuração do Apache Kafka
- Criação de tópicos
- Implementação de produtores e consumidores

### Processamento Assíncrono
**[Rafael Lima](https://github.com/rafaguedes03)**
- Configuração do Celery
- Implementação das tarefas assíncronas
- Integração Kafka + Celery
- Monitoramento básico

### Infraestrutura, Banco de Dados e Testes
**[Clebson Santos](https://github.com/ClebTech)**  
**[Wallan Melo](https://github.com/WallanMelo)**
- Modelagem do banco de dados
- Scripts SQL
- Docker e Docker Compose
- Testes de integração
- Documentação técnica

---

### Passo a Passo para a Execução Da Aplicação
```bash

