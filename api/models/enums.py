from enum import Enum, IntEnum

# ======= ENUM Do STATUS DO PEDIDO ======= 
class OrderStatus(str, Enum):
    CRIADO = "CRIADO"
    VALIDANDO = "VALIDANDO"
    AGUARDANDO_PAGAMENTO = "AGUARDANDO_PAGAMENTO"
    #PENDENTE_PAGAMENTO = "PENDENTE_PAGAMENTO"
    #PAGAMENTO_APROVADO = "PAGAMENTO_APROVADO"
    #PAGAMENTO_FALHOU = "PAGAMENTO_FALHOU"
    PROCESSANDO = "PROCESSANDO"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"
    ERRO = "ERRO"

# ======= ENUM Status De Pagamento =======
class StatusPagamento(str, Enum):
    PENDENTE_PAGAMENTO = "PENDENTE_PAGAMENTO"
    PAGAMENTO_APROVADO = "PAGAMENTO_APROVADO"
    PAGAMENTO_FALHOU = "PAGAMENTO_FALHOU"
    EXPIRADO = "EXPIRADO"


# ======= FLUXO DO STATUS do PEDIDO e PAGAMENTO são DEPENDENTES ======= 
#Fluxo do pedido (OrderStatus) → controla a situação do pedido como um todo: 
#CRIADO → AGUARDANDO_PAGAMENTO → VALIDANDO → PROCESSANDO → EM_ROTA → FINALIZADO / CANCELADO / ERRO
#Fluxo do pagamento (StatusPagamento) → controla a situação do pagamento especificamente: 
#PENDENTE_PAGAMENTO → PAGAMENTO_APROVADO → PAGAMENTO_FALHOU
#Ou seja: o pedido depende do status do pagamento. Por exemplo:
#Quando o cliente paga → StatusPagamento = PAGAMENTO_APROVADO → automaticamente 
# OrderStatus = VALIDANDO.
#Se o pagamento falha → StatusPagamento = PAGAMENTO_FALHOU → OrderStatus = CANCELADO ou ERRO.
#Quando o pagamento está com STATUS aprovado o estabelecimento confirma → OrderStatus = PROCESSANDO.
#Depois o estabelecimento quando o epdido tiver ido para rota de entrega→ OrderStatus = EM_ROTA e depois  FINALIZADO quando o estabelecimento concluir o pedido.


# ======= ENUM Da CATEGORIA DO ESTABELECIMENTO ======= 
class CategoriaEstabelecimento(str, Enum):
    RESTAURANTE = "RESTAURANTE"
    FARMACIA = "FARMACIA"
    MERCADO = "MERCADO"
    FAST_FOOD = "FAST_FOOD"

# ======= ENUM Dos Dias da Semana ======= 
class DiaSemana(IntEnum):
    DOMINGO = 0
    SEGUNDA = 1
    TERCA = 2
    QUARTA = 3
    QUINTA = 4
    SEXTA = 5
    SABADO = 6