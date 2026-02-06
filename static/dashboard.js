//dashboard.js
import { apiRequest, authHeadersJson } from "./api.js";
import { log } from "./utils.js";

const listaPedidos = document.getElementById("listaPedidos");
const totalPedidosEl = document.getElementById("totalPedidos");
const totalEmPreparoEl = document.getElementById("totalEmPreparo");
const totalFinalizadosEl = document.getElementById("totalFinalizados");
const statusFuncionamentoEl = document.getElementById("statusFuncionamento");

// =============================
// CARREGAR DASHBOARD
// =============================
document.addEventListener("DOMContentLoaded", () => {
    carregarPedidosDashboard();
});

// =============================
// BUSCAR PEDIDOS DO DIA
// =============================
async function carregarPedidosDashboard() {

    const { ok, data, error } = await apiRequest(
        "/orders/dashboard",
        { headers: authHeadersJson() }
    );

    if (!ok) {
        log(error || "Erro ao carregar pedidos");
        return;
    }

    renderDashboard(data);
}

// =============================
// RENDERIZAÇÃO
// =============================
function renderDashboard(dashboard) {

    listaPedidos.innerHTML = "";

    const pedidos = dashboard.pedidos || [];

    totalPedidosEl.textContent = `${pedidos.length} pedidos`;
    totalEmPreparoEl.textContent =
        pedidos.filter(p => p.status === "PROCESSANDO").length + " em preparo";

    totalFinalizadosEl.textContent =
        pedidos.filter(p => p.status === "FINALIZADO").length + " finalizados";

    // Status do estabelecimento
    if (dashboard.aberto) {
        statusFuncionamentoEl.textContent = "🟢 Aberto";
        statusFuncionamentoEl.classList.add("aberto");
    } else {
        statusFuncionamentoEl.textContent = "🔴 Fechado";
        statusFuncionamentoEl.classList.remove("aberto");
    }

    if (pedidos.length === 0) {
        listaPedidos.innerHTML = `
            <li class="empty">Nenhum pedido no horário de funcionamento de hoje</li>
        `;
        return;
    }

    pedidos.forEach(pedido => {
        listaPedidos.appendChild(criarPedidoItem(pedido));
    });
}

// =============================
// ITEM DE PEDIDO
// =============================
function criarPedidoItem(pedido) {

    const li = document.createElement("li");
    li.className = "pedido-item";

    const podeCancelar =
        pedido.status === "VALIDANDO" ||
        pedido.status === "PROCESSANDO";

    /*li.innerHTML = `
        <div class="pedido-header">
            <strong>Pedido #${pedido.id}</strong>
            <span class="status ${pedido.status}">
                ${formatarStatus(pedido.status)}
            </span>
        </div>

        <div class="pedido-info">
            <span>👤 ${pedido.cliente_nome}</span>
            <span>🕒 ${pedido.hora}</span>
            <span>💰 R$ ${pedido.total.toFixed(2)}</span>
        </div>

        ${
            podeCancelar
                ? `<button class="btn-danger btn-cancelar"
                        onclick="cancelarPedido(${pedido.id})">
                        ❌ Cancelar pedido
                   </button>`
                : ""
        }
    `;*/
    li.innerHTML = `
        <div class="pedido-conteudo">

            <div class="pedido-header">
                <strong>Pedido #${pedido.id}</strong>
                <span class="status ${pedido.status}">
                    ${formatarStatus(pedido.status)}
                </span>
            </div>

            <div class="pedido-info">
                <span>👤 ${pedido.cliente_nome}</span>
                <span>🕒 ${pedido.hora}</span>
                <span>💰 R$ ${pedido.total.toFixed(2)}</span>
            </div>

        </div>

        ${
            podeCancelar
                ? `<div class="pedido-acoes">
                        <button class="btn-cancelar"
                            onclick="cancelarPedido(${pedido.id})">
                            Cancelar
                        </button>
                </div>`
                : ""
        }
    `;


    return li;
}

window.cancelarPedido = async function (pedidoId) {

    const confirmar = confirm(
        "Tem certeza que deseja cancelar este pedido?"
    );

    if (!confirmar) return;

    const { ok, error } = await apiRequest(
        `/orders/${pedidoId}/cancelar`,
        {
            method: "POST",
            headers: authHeadersJson()
        }
    );

    if (!ok) {
        alert(error || "Erro ao cancelar pedido");
        return;
    }

    alert("Pedido cancelado com sucesso!");
    carregarPedidosDashboard(); // 🔄 atualiza a tela
};


// =============================
// UTILS
// =============================
function formatarStatus(status) {
    const map = {
        CRIADO: "🟡 Criado",
        AGUARDANDO_PAGAMENTO: "💳 Aguardando pagamento",
        VALIDANDO: "⏳ Validando pagamento",
        PROCESSANDO: "🍳 Em preparo",
        FINALIZADO: "✅ Finalizado",
        CANCELADO: "❌ Cancelado"
    };
    return map[status] || status;
}
