// orders.js
import { formatarTaxaEntrega } from "./utils.js";
import { apiRequest, authHeadersJson } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    configurarMenuPerfil();
    configurarNavegacaoExtra();
    carregarPedidos();
});

// ================= PEDIDOS =================
async function carregarPedidos() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/";
            return;
        }

        /*const res = await fetch("/orders/", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });*/
        const res = await apiRequest("/orders/", {
            headers: authHeadersJson()
        });


        const data = res.data;
        const listaPedidos = document.getElementById("listaPedidos");

        if (!res.ok || !res.data.length) {
            listaPedidos.innerHTML = "<p>Você ainda não fez nenhum pedido.</p>";
            return;
        }

        /*let html = '<div class="pedidos-lista">';

        data.forEach(pedido => {
            const status = pedido.status || "CRIADO";
            const dataPedido = formatarData(pedido.created_at);
            const taxaEntrega = await buscarTaxaEntrega(
                pedido.estabelecimento_id
            );
            html += `
                <div class="pedido-card">
                    <h3>Pedido #${pedido.id}</h3>
                    <p><strong>Data:</strong> ${dataPedido}</p>
                    <p>
                        <strong>Status:</strong>
                        <span class="status" style="background:${getCorStatus(status)}">
                            ${formatarStatus(status)}
                        </span>
                    </p>
                    <p><strong>Taxa de entrega:</strong> ${formatarTaxaEntrega(taxaEntrega)}</p>
                    <p><strong>Total:</strong> R$ ${Number(pedido.valor_total || 0).toFixed(2)}</p>

                    <button class="btn-detalhes" data-id="${pedido.id}">
                        🔍 Detalhes
                    </button>
                </div>
            `;
        });

        html += "</div>";
        listaPedidos.innerHTML = html;*/
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
                        <p><strong>Taxa de entrega:</strong> ${formatarTaxaEntrega(taxaEntrega)}</p>
                        <p><strong>Total:</strong> R$ ${Number(pedido.valor_total || 0).toFixed(2)}</p>

                        <button class="btn-detalhes" data-id="${pedido.id}">
                            🔍 Detalhes
                        </button>
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

    } catch (err) {
        console.error(err);
        document.getElementById("listaPedidos").innerHTML =
            "<p>Erro ao carregar pedidos.</p>";
    }
}

// ================= MENU PERFIL =================
function configurarMenuPerfil() {
    const perfilIcon = document.getElementById("perfilIcon");
    const menuPerfil = document.getElementById("menuPerfil");

    perfilIcon?.addEventListener("click", () => {
        menuPerfil.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
        if (
            menuPerfil &&
            !menuPerfil.contains(e.target) &&
            !perfilIcon.contains(e.target)
        ) {
            menuPerfil.classList.add("hidden");
        }
    });

    document.getElementById("btnInicio")?.addEventListener("click", () => {
        window.location.href = "/client/home";
    });

    document.getElementById("btnPerfil")?.addEventListener("click", () => {
        window.location.href = "/client/profile";
    });

    document.getElementById("btnLogout")?.addEventListener("click", logout);
}


// ================= NAVEGAÇÃO EXTRA =================
function configurarNavegacaoExtra() {
    document.getElementById("btnVoltarHome")?.addEventListener("click", () => {
        window.location.href = "/client/home";
    });
}


// ================= HELPERS =================
function logout() {
    localStorage.clear();
    window.location.href = "/";
}

function formatarData(data) {
    if (!data) return new Date().toLocaleString("pt-BR");
    if (!data.endsWith("Z")) data += "Z";
    const d = new Date(data);
    return isNaN(d) ? new Date().toLocaleString("pt-BR") : d.toLocaleString("pt-BR");
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
    }[status.toUpperCase()] || "#9e9e9e";
}

function formatarStatus(status) {
    return {
        CRIADO: "CRIADO",
        EM_PREPARO: "EM PREPARO",
        PREPARANDO: "EM PREPARO",
        PRONTO: "PRONTO PARA ENTREGA",
        EM_TRANSITO: "EM ROTA",
        EM_ROTA: "EM ROTA",
        ENTREGUE: "ENTREGUE",
        CANCELADO: "CANCELADO"
    }[status.toUpperCase()] || status;
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

        const data = await res.json();
        return Number(data.taxa_entrega || 0);
    } catch (e) {
        console.warn("Erro ao buscar taxa de entrega:", e);
        return 0;
    }
}
