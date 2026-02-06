import { apiRequest, authHeadersJson } from "./api.js";
import { log, formatarTaxaEntrega, getMenuElements, setupMenuEventos, setupFecharMenuFora, abrirModalVip } from "./utils.js";
import { logout } from "./auth.js";
const metodoSelect = document.getElementById("metodoPagamento");
const btnConfirmar = document.getElementById("btnConfirmarPagamento");
const output = document.getElementById("output");
const timerEl = document.getElementById("timerPagamento");

// Pega o pedidoId da URL
const params = new URLSearchParams(window.location.search);
const pedidoId = params.get("pedidoId");

let pagamentoExpiresAt = null;
let timerInterval = null;
let statusInterval = null;
let modalValidandoAberto = false;

if (!pedidoId) {
    output.innerText = "❌ Pedido não encontrado na URL.";
}

function abrirModal(mensagem) {
    const modal = document.createElement("div");
    modal.className = "modal-notificacao";
    modal.innerHTML = `
        <div class="modal-conteudo">
            <p>${mensagem}</p>
            <button id="fecharModal">OK</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("fecharModal").addEventListener("click", () => {
        modal.remove();
    });
}


// Função para atualizar o status do pedido em tempo real
async function atualizarStatusPedido() {
    try {
        const res = await apiRequest(`/orders/${pedidoId}`, {
            headers: authHeadersJson()
        });

        if (!res.ok) {
            output.innerText = "❌ Erro ao atualizar pedido.";
            clearInterval(statusInterval);
            return;
        }

        const pedido = res.data;
        let mensagemStatus = `Status do pedido: ${pedido.status}`;

        switch (pedido.status) {
            case "AGUARDANDO_PAGAMENTO":
                // Timer do pagamento
                if (!pagamentoExpiresAt) {
                    pagamentoExpiresAt = new Date(pedido.pagamento_expires_at);
                    iniciarTimer();
                }
                btnConfirmar.disabled = false;
                metodoSelect.disabled = false;
                break;

            case "VALIDANDO":
                mensagemStatus += "\n⚠️ Pagamento recebido. Aguardando validação do estabelecimento.";
                btnConfirmar.disabled = true;
                metodoSelect.disabled = true;
                clearInterval(timerInterval);

                if (!modalValidandoAberto) {
                    abrirModal("⏳ Pagamento confirmado! Aguardando o estabelecimento aceitar o pedido...");
                    modalValidandoAberto = true;
                }
                break;

            case "PROCESSANDO":
                mensagemStatus += "\n✅ Pedido em Preparo pelo estabelecimento!";
                btnConfirmar.disabled = true;
                metodoSelect.disabled = true;
                clearInterval(timerInterval);
                //clearInterval(statusInterval);
                //abrirModal(`✅ Pedido #${pedidoId} confirmado pelo estabelecimento!`);
                break;

            case "FINALIZADO":
                mensagemStatus += "\n✅ Pedido finalizado.";
                btnConfirmar.disabled = true;
                metodoSelect.disabled = true;
                clearInterval(timerInterval);
                clearInterval(statusInterval);
                abrirModal(`🎉 Pedido #${pedidoId} finalizado!`);
                break;

            case "CANCELADO":
                mensagemStatus += "\n❌ Pedido cancelado.";
                btnConfirmar.disabled = true;
                metodoSelect.disabled = true;
                clearInterval(timerInterval);
                clearInterval(statusInterval);
                abrirModal(`❌ Pedido #${pedidoId} foi cancelado.`);
                break;

            default:
                btnConfirmar.disabled = true;
                metodoSelect.disabled = true;
                break;
        }

        // Atualiza output da página
        output.innerText = mensagemStatus;

    } catch (err) {
        console.error("Erro ao atualizar status do pedido:", err);
        output.innerText = "❌ Falha ao atualizar status do pedido.";
        clearInterval(statusInterval);
    }
}

// Carrega o pedido inicialmente e inicia o polling
async function carregarPedido() {
    await atualizarStatusPedido();

    // Atualiza status a cada 5 segundos
    statusInterval = setInterval(atualizarStatusPedido, 5000);
}

//carregarPedido();

// Timer de pagamento
function iniciarTimer() {
    if (!pagamentoExpiresAt) return;

    timerInterval = setInterval(() => {
        const agora = new Date();
        const diff = pagamentoExpiresAt - agora;

        if (diff <= 0) {
            clearInterval(timerInterval);
            timerEl.innerText = "⏰ Tempo para pagamento expirado.";
            btnConfirmar.disabled = true;
            btnConfirmar.innerText = "Pagamento Expirado";
            return;
        }

        const minutos = Math.floor(diff / 1000 / 60);
        const segundos = Math.floor((diff / 1000) % 60);

        timerEl.innerText = `⏳ Tempo restante: ${minutos}m ${segundos.toString().padStart(2, "0")}s`;
    }, 1000);
}


// ============================= INICIALIZAÇÃO =============================
function inicializar() {
    // ======= Menu do Perfil =======
    const menuElements = getMenuElements();
    setupMenuEventos(menuElements, { abrirModalVip, logout });
    setupFecharMenuFora(menuElements.menuPerfil, menuElements.perfilIcon);

    // ======= Carrega pedido e status =======
    carregarPedido();

    // ======= Evento do botão Confirmar Pagamento =======
    btnConfirmar.addEventListener("click", async () => {
        const metodo = metodoSelect.value;
        if (!metodo) {
            alert("Selecione um método de pagamento.");
            return;
        }

        output.innerText = "⏳ Processando pagamento...";

        try {
            const res = await apiRequest(`/pagamentos/${pedidoId}`, {
                method: "POST",
                headers: authHeadersJson(),
                body: JSON.stringify({ metodo })
            });

            if (!res.ok) {
                output.innerText = "❌ Erro: " + res.error;
                return;
            }

            const data = res.data;

            btnConfirmar.disabled = true;
            metodoSelect.disabled = true;
            clearInterval(timerInterval);

            output.innerText = `✅ Pagamento registrado!\nPedido Status: ${data.pedido_status}\nPagamento Status: ${data.pagamento_status}`;

        } catch (err) {
            console.error(err);
            output.innerText = "❌ Falha ao processar pagamento.";
        }
    });
}

document.addEventListener("DOMContentLoaded", inicializar);