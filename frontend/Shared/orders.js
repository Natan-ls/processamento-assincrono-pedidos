import { apiRequest, authHeadersJson } from './api.js';
import { log } from './utils.js';

// components dos pedidos
const estabelecimentoSelect = document.getElementById("estabelecimentoSelect");
const produtoSelect = document.getElementById("produtoSelect");
const quantidadeInput = document.getElementById("quantidadeInput");
const orderIdInput = document.getElementById("orderIdInput");

// ======= Funct p/ Carregar estabelecimentos
export async function loadEstabelecimentos() {
    if (!estabelecimentoSelect) return;
    
    try {
        const res = await apiRequest("/estabelecimentos", {
            method: "GET"
        });

        if (!res.ok) {
            log(res.error || "Erro ao carregar estabelecimentos.");
            return;
        }

        estabelecimentoSelect.innerHTML = "";

        res.data.forEach(e => {
            const opt = document.createElement("option");
            opt.value = e.id;
            opt.textContent = e.nome;
            estabelecimentoSelect.appendChild(opt);
        });

    } catch (error) {
        console.error(error);
        log("Erro ao carregar estabelecimentos.");
    }
}

// ======= Funct Carregar produtos
export async function loadProdutos() {
    if (!estabelecimentoSelect || !produtoSelect) return;
    
    const estabelecimentoId = estabelecimentoSelect.value;

    if (!estabelecimentoId) {
        log("Selecione um estabelecimento primeiro.");
        return;
    }

    try {
        const res = await apiRequest(
            `/estabelecimentos/${estabelecimentoId}/produtos`,
            { method: "GET" }
        );

        if (!res.ok) {
            log(res.error || "Erro ao carregar produtos.");
            return;
        }

        produtoSelect.innerHTML = "";

        res.data.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.nome} - R$ ${p.preco}`;
            opt.dataset.preco = p.preco;
            produtoSelect.appendChild(opt);
        });

        if (produtoSelect.options.length > 0) {produtoSelect.selectedIndex = 0;}

    } catch (error) {
        console.error(error);
        log("Erro ao carregar produtos.");
    }
}

// ======= Funct de Criar pedido
export async function createOrder() {
    if (!estabelecimentoSelect || !produtoSelect || !quantidadeInput) return;
    
    const estabelecimentoId = estabelecimentoSelect.value;
    const produtoOption = produtoSelect.selectedOptions[0];

    if (!produtoOption) {
        log("Selecione um produto antes de criar o pedido.");
        return;
    }

    const produtoId = produtoOption.value;
    const preco = produtoOption.dataset.preco;
    const quantidade = quantidadeInput.value;

    try {
        const res = await apiRequest("/orders/", {
            method: "POST",
            headers: authHeadersJson(),
            body: JSON.stringify({
                estabelecimento_id: estabelecimentoId,
                items: [{
                    produto_id: produtoId,
                    quantidade: parseInt(quantidade),
                    preco: parseFloat(preco)
                }]
            })
        });

        if (!res.ok) {
            log(res.error || "Erro ao criar pedido.");
            return;
        }

        log("Pedido criado com sucesso!");
        quantidadeInput.value = "1";

    } catch (error) {
        console.error(error);
        log("Erro ao criar pedido.");
    }
}

// ======= Funct de Listar pedidos
export async function listOrders() {
    try {
        const res = await apiRequest("/orders/", {
            method: "GET",
            headers: authHeadersJson()
        });

        if (!res.ok) {
            log(res.error || "Erro ao listar pedidos.");
            return;
        }

        log(JSON.stringify(res.data, null, 2));

    } catch (error) {
        console.error(error);
        log("Erro ao listar pedidos.");
    }
}

// ======= Funct de Buscar pedido por ID
export async function getOrderById() {
    if (!orderIdInput) return;
    
    const orderId = orderIdInput.value;

    if (!orderId) {
        log("Informe o ID do pedido.");
        return;
    }

    try {
        const res = await apiRequest(`/orders/${orderId}`, {
            method: "GET",
            headers: authHeadersJson()
        });

        if (!res.ok) {
            log(res.error || "Pedido não encontrado.");
            return;
        }

        log(JSON.stringify(res.data, null, 2));

    } catch (error) {
        console.error(error);
        log("Erro ao buscar pedido.");
    }
}