// orders.js
import { apiRequest, authHeadersJson } from "./api.js";
import { log, formatarTaxaEntrega, getMenuElements, setupMenuEventos, setupFecharMenuFora, abrirModalVip } from "./utils.js";
import { logout } from "./auth.js";

// ================= PEDIDOS =================
async function carregarPedidos() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/";
            return;
        }

        const res = await apiRequest("/orders/", {headers: authHeadersJson()});
        const data = res.data;
        const listaPedidos = document.getElementById("listaPedidos");

        if (!res.ok || !res.data.length) {
            listaPedidos.innerHTML = "<p>Você ainda não fez nenhum pedido.</p>";
            return;
        }
        const pedidosHtml = await Promise.all(
            data.map(async (pedido) => {
                const status = pedido.status || "CRIADO";
                const dataPedido = formatarData(pedido.created_at);

                const taxaEntrega = await buscarTaxaEntrega(
                    pedido.estabelecimento_id
                );
                return `
                    <div class="pedido-card">
                        <h3>Pedido #${pedido.id}</h3>
                        <p><strong>Data:</strong> ${dataPedido}</p>
                        <p>
                            <strong>Status:</strong>
                            <span class="status" style="background:${getCorStatus(status)}">
                                ${formatarStatus(status)}
                            </span>
                        </p>
                        ${
                            status === "AGUARDANDO_PAGAMENTO" && pedido.pagamento_timer
                                ? `<p class="timer-info">⏳ Expira em: ${formatarTempoRestante(pedido.pagamento_timer)}</p>`
                                : ""
                        }                        
                        <p><strong>Taxa de entrega:</strong> ${formatarTaxaEntrega(taxaEntrega)}</p>
                        <p><strong>Total:</strong> R$ ${Number(pedido.valor_total || 0).toFixed(2)}</p>

                        <div class="button-group">
                            <button class="btn-detalhes" data-id="${pedido.id}">
                                🔍 Detalhes
                            </button>
                            ${
                                status === "AGUARDANDO_PAGAMENTO"
                                    ? `<button class="btn-pagar" data-id="${pedido.id}">💳 Pagar Agora</button>`
                                    : ""
                            }
                        </div>
                    </div>
                `;

            })
        );

        listaPedidos.innerHTML = `
            <div class="pedidos-lista">
                ${pedidosHtml.join("")}
            </div>
        `;

        // Eventos dos botões "Detalhes"
        document.querySelectorAll(".btn-detalhes").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                window.location.href = `/client/order?id=${id}`;
            });
        });
        // Eventos dos botões "Pagar Agora"
        document.querySelectorAll(".btn-pagar").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                // Redireciona para a página de pagamento
                window.location.href = `/client/pagamento?pedidoId=${id}`;
            });
        });

        
    } catch (err) {
        console.error(err);
        document.getElementById("listaPedidos").innerHTML =
            "<p>Erro ao carregar pedidos.</p>";
    }
}

// ================= NAVEGAÇÃO EXTRA =================
function configurarNavegacaoExtra() {
    document.getElementById("btnVoltarHome")?.addEventListener("click", () => {
        window.location.href = "/client/home";
    });
}


function formatarData(data) {
    if (!data) return new Date().toLocaleString("pt-BR");
    if (!data.endsWith("Z")) data += "Z";
    const d = new Date(data);
    return isNaN(d) ? new Date().toLocaleString("pt-BR") : d.toLocaleString("pt-BR");
}

// ================= Funct p/ Retornar o tempo p TIMER do PAGAMENTO acabar =================
function formatarTempoRestante(expiraEm) {
    if (!expiraEm) return "—";

    if (!expiraEm.endsWith("Z")) expiraEm += "Z";
    const agora = new Date();
    const expira = new Date(expiraEm);
 
    const diffMs = expira - agora;

    if (diffMs <= 0) {
        return "EXPIRADO";
    }

    const totalSegundos = Math.floor(diffMs / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    if (minutos < 2)
        return `⚠️ ${minutos}m ${segundos}s`;
    return `${minutos}m ${segundos}s`;
}


function getCorStatus(status) {
    return {
        CRIADO: "#2196f3",
        AGUARDANDO_PAGAMENTO: "#ff9800",
        VALIDANDO: "#ffc107",
        PROCESSANDO: "#03a9f4",
        FINALIZADO: "#4caf50",
        CANCELADO: "#f44336"
    }[status] || "#9e9e9e";
}


function formatarStatus(status) {
    return {
        CRIADO: "Criado",
        AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
        VALIDANDO: "Validando Pagamento",
        PROCESSANDO: "Pedido em Preparo",
        FINALIZADO: "Pedido Finalizado",
        CANCELADO: "Cancelado"
    }[status] || status;
}


async function buscarTaxaEntrega(estabelecimentoId, token) {
    try {
        const res = await apiRequest(
            `/estabelecimentos/${estabelecimentoId}`,
            {
                method: "GET",
                headers: authHeadersJson()
            }
        );

        if (!res.ok) return 0;

        //const data = await res.json();
        const data = res.data;
        return Number(data.taxa_entrega || 0);
    } catch (e) {
        console.warn("Erro ao buscar taxa de entrega:", e);
        return 0;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // ===================== MENU DO PERFIL =====================
    // Pega elementos do menu do utils
    const menuElements = getMenuElements();

    // Configura os eventos do menu
    setupMenuEventos(menuElements, { abrirModalVip, logout });

    // Fecha menu ao clicar fora
    setupFecharMenuFora(menuElements.menuPerfil, menuElements.perfilIcon);

    configurarNavegacaoExtra();
    carregarPedidos();
    setInterval(() => { //a cada 30segs ele atualiza a lista d epedidos
        carregarPedidos();
    }, 30000);

});