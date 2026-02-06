// pedidoDetalhes.js

import { apiRequest, authHeadersJson } from "./api.js";
import { logout } from "./auth.js";
import { toggleMenuPerfil, getMenuElements, setupMenuEventos, setupFecharMenuFora, abrirModalVip } from "./utils.js";

/* ================= MENU DO PERFIL ===================== */
document.addEventListener("DOMContentLoaded", () => {
    // Inicializa menu do perfil usando utils.js
    const menuElements = getMenuElements(); // pega perfilIcon, menuPerfil, btnPerfil, btnPedidos, btnPagamento, btnVip, btnLogout

    setupMenuEventos(menuElements, { abrirModalVip, logout }); // configura todos os eventos do menu
    setupFecharMenuFora(menuElements.menuPerfil, menuElements.perfilIcon);

    // Carrega os detalhes do pedido
    carregarDetalhesPedido();
});


// ===== BOTÕES =====
document.getElementById("btnInicio")?.addEventListener("click", () => location.href = "/client/home");
document.getElementById("btnVoltar")?.addEventListener("click", () => history.back());

// ===== HELPERS =====
function obterIdPedido() {return new URLSearchParams(window.location.search).get("id");}

function formatarData(data) {
    if (!data) return "N/A";
    const d = new Date(data.endsWith("Z") ? data : data + "Z");
    return isNaN(d) ? "Inválida" : d.toLocaleString("pt-BR");
}

function getCorStatus(status) {
    return {
        CRIADO: "#2196f3",
        EM_PREPARO: "#ff9800",
        PREPARANDO: "#ff9800",
        PRONTO: "#4caf50",
        EM_TRANSITO: "#009688",
        EM_ROTA: "#009688",
        ENTREGUE: "#43a047",
        CANCELADO: "#f44336"
    }[status?.toUpperCase()] || "#9e9e9e";
}

// Funct de Normalizar os dados
function normalizarItem(item) {
    return {
        nome: item.nome ?? "Item",
        quantidade: Number(item.quantidade ?? 0),
        preco: Number(item.preco ?? item.preco_unitario ?? 0)
    };
}


// ===== API =====
async function carregarDetalhesPedido() {
    const pedidoId = obterIdPedido();
    if (!pedidoId) return mostrarErro("Pedido não encontrado.");

    try {
        const res = await apiRequest(`/orders/${pedidoId}`, {
            method: "GET",
            headers: authHeadersJson()
        });

        if (!res.ok) {
            throw new Error(res.error || "Erro ao buscar pedido");
        }

        const pedido = res.data;
        if (pedido.estabelecimento) {
            document.getElementById("estabelecimentoNome").textContent =
                pedido.estabelecimento.nome_fantasia || "—";

            document.getElementById("estabelecimentoEndereco").textContent =
                pedido.estabelecimento.endereco || "—";

            document.getElementById("estabelecimentoTelefone").textContent =
                pedido.estabelecimento.telefone || "—";
        }

        // ===== DADOS DO PEDIDO =====
        document.getElementById("pedidoId").textContent = pedido.id ?? pedido.order_id;
        document.getElementById("pedidoData").textContent = formatarData(pedido.created_at);

        const statusEl = document.getElementById("pedidoStatus");
        statusEl.textContent = pedido.status;
        statusEl.style.background = getCorStatus(pedido.status);

        document.getElementById("pedidoTotal").textContent =
            `R$ ${(Number(pedido.valor_total) || 0).toFixed(2)}`;

        document.getElementById("enderecoEntrega").textContent =
            pedido.endereco_entrega || "Não informado";

        // ===== ITENS =====
        const itensEl = document.getElementById("itensPedido");
        itensEl.innerHTML = "";

        let subtotal = 0;

        const itens = pedido.itens || pedido.items || [];

        itens.forEach(rawItem => {
            const nome = rawItem.nome || "Item";
            const quantidade = Number(rawItem.quantidade || 0);
            const preco = Number(rawItem.preco_unitario || 0);

            const sub = preco * quantidade;
            subtotal += sub;

            itensEl.innerHTML += `
                <div class="item-pedido">
                    <strong>${nome}</strong>
                    <span>${quantidade} x R$ ${preco.toFixed(2)}</span>
                    <!--<span>R$ ${sub.toFixed(2)}</span>-->
                </div>
            `;
        });

        // ===== RESUMO =====
        const taxaEntrega = Number(pedido.taxa_entrega || 0);

        document.getElementById("subtotal").textContent =
            `R$ ${subtotal.toFixed(2)}`;

        document.getElementById("taxaEntrega").textContent =
            `R$ ${taxaEntrega.toFixed(2)}`;

        document.getElementById("totalPedido").textContent =
            `R$ ${(subtotal + taxaEntrega).toFixed(2)}`;

        // ===== VISIBILIDADE =====
        document.getElementById("carregando").style.display = "none";
        document.getElementById("conteudoPedido").style.display = "block";

    } catch (err) {
        console.error(err);
        mostrarErro("Erro ao carregar pedido.");
    }
}


function mostrarErro(msg) {
    document.getElementById("carregando").style.display = "none";
    const erro = document.getElementById("erroPedido");
    erro.style.display = "block";
    erro.querySelector("p").textContent = msg;
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", carregarDetalhesPedido);
