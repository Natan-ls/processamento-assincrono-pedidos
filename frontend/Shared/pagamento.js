import { apiRequest, authHeadersJson } from "../Shared/api.js";

const metodoSelect = document.getElementById("metodoPagamento");
const btnConfirmar = document.getElementById("btnConfirmarPagamento");
const output = document.getElementById("output");

// pega o pedidoId da URL
const params = new URLSearchParams(window.location.search);
const pedidoId = params.get("pedidoId");

if (!pedidoId) {output.innerText = "❌ Pedido não encontrado na URL.";}

// confirmar pagamento
btnConfirmar.addEventListener("click", async () => {

    const metodo = metodoSelect.value;

    if (!metodo) {
        alert("Selecione um método de pagamento.");
        return;
    }

    output.innerText = "⏳ Processando pagamento...";

    const res = await apiRequest(`/pagamentos/${pedidoId}`, {
        method: "POST",
        headers: authHeadersJson(),
        body: JSON.stringify({
            metodo: metodo
        })
    });

    if (!res.ok) {
        output.innerText = "❌ Erro: " + res.error;
        return;
    }

    output.innerText =
        "✅ Pagamento registrado com sucesso!\n\n" +
        JSON.stringify(res.data, null, 2);

    setTimeout(() => {window.location.href = "orders.html";}, 2000);
});
