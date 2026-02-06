import { apiRequest, authHeadersFormData, authHeadersJson } from "./api.js";
import { log, inicializarTopoEmpresa } from "./utils.js";

/* ======================================================
   DOM — FORMULÁRIO
====================================================== */
const produtoNome = document.getElementById("produtoNome");
const produtoDescricao = document.getElementById("produtoDescricao");
const produtoPreco = document.getElementById("produtoPreco");
const produtoEstoque = document.getElementById("produtoEstoque");
const produtoImagem = document.getElementById("produtoImagem");

const btnAdicionarProduto = document.getElementById("btnAdicionarProduto");
const listaProdutos = document.getElementById("listaProdutos");

const modalProduto = document.getElementById("modalProduto");
const btnAbrirModalProduto = document.getElementById("btnAbrirModalProduto");
const btnFecharModalProduto = document.getElementById("btnFecharModalProduto");

/* ======================================================
   CONTROLE DE ESTADO
====================================================== */
let produtoEditandoId = null;

/* ======================================================
   MODAL
====================================================== */
function abrirModalProduto() {
    modalProduto.classList.remove("hidden");
}

function fecharModalProduto() {
    modalProduto.classList.add("hidden");
    limparFormulario();
    produtoEditandoId = null;
}

btnFecharModalProduto.addEventListener("click", fecharModalProduto);

modalProduto.addEventListener("click", (e) => {
    if (e.target === modalProduto) {
        fecharModalProduto();
    }
});



/*MODAL p msgs */
const modalMensagem = document.getElementById("modalMensagem");
const modalMensagemTitulo = document.getElementById("modalMensagemTitulo");
const modalMensagemTexto = document.getElementById("modalMensagemTexto");

const fecharModalMensagem = document.getElementById("fecharModalMensagem");
const btnCancelarMensagem = document.getElementById("btnCancelarMensagem");
const btnConfirmarMensagem = document.getElementById("btnConfirmarMensagem");

function abrirModalMensagem(titulo, mensagem, tipo = "confirmacao") {
    return new Promise((resolve) => {

        modalMensagemTitulo.textContent = titulo;
        modalMensagemTexto.textContent = mensagem;

        btnCancelarMensagem.style.display = tipo === "alerta" ? "none" : "block";
        btnConfirmarMensagem.textContent = tipo === "alerta" ? "OK" : "Confirmar";

        modalMensagem.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        btnConfirmarMensagem.onclick = () => {
            fechar();
            resolve(true);
        };

        btnCancelarMensagem.onclick = () => {
            fechar();
            resolve(false);
        };

        fecharModalMensagem.onclick = () => {
            fechar();
            resolve(false);
        };

        function fechar() {
            modalMensagem.classList.add("hidden");
            document.body.style.overflow = "auto";
        }
    });
}

/* ======================================================
   FUNÇÕES AUXILIARES
====================================================== */
function limparFormulario() {
    produtoNome.value = "";
    produtoDescricao.value = "";
    produtoPreco.value = "";
    produtoEstoque.value = "";
    produtoImagem.value = "";
}

/* ======================================================
   RENDERIZAR PRODUTOS
====================================================== */
function renderizarProdutos(produtos) {
    if (!Array.isArray(produtos)) {
        console.error("Produtos inválidos:", produtos);
        listaProdutos.innerHTML = "<p class='info'>Erro ao carregar produtos.</p>";
        return;
    }    
    listaProdutos.innerHTML = "";

    if (produtos.length === 0) {
        listaProdutos.innerHTML = `<p class="info">Nenhum produto cadastrado ainda.</p>`;
        return;
    }

    produtos.forEach((p) => {
        listaProdutos.innerHTML += `
            <li class="produto-item">

                <div class="produto-img">
                    <img src="${p.url_imagem || '/static/img/sem-foto.png'}" alt="${p.nome}">
                </div>

                <div class="produto-info">
                    <h3>${p.nome}</h3>
                    <p>${p.descricao || "Sem descrição"}</p>

                    <span class="produto-preco">
                        R$ ${Number(p.preco_unidade).toFixed(2)}
                    </span>

                    <span class="produto-estoque">
                        Estoque: ${p.quantidade_estoque}
                    </span>
                </div>

                <div class="produto-acoes">
                    <button class="btn-secundary" onclick="editarProduto(${p.id})">
                        ✏️ Editar
                    </button>

                    <button class="btn-danger" onclick="excluirProduto(${p.id})">
                        🗑️ Excluir
                    </button>
                </div>

            </li>
        `;
    });
}

/* ======================================================
   LISTAR PRODUTOS
====================================================== */
async function carregarProdutos() {
    const { ok, data, error } = await apiRequest("/produto/listar", {
        method: "GET",
        headers: authHeadersJson()
    });

    if (!ok) {
        log(error || "Erro ao carregar produtos.");
        return;
    }

    renderizarProdutos(data.data);
}

/* ======================================================
   ADICIONAR / EDITAR PRODUTO
====================================================== */
async function salvarProduto() {
    if (!produtoNome.value || !produtoPreco.value || !produtoEstoque.value) {
        log("Preencha nome, preço e estoque.");
        return;
    }

    const form = new FormData();
    form.append("nome", produtoNome.value);
    form.append("descricao", produtoDescricao.value);
    form.append("preco_unidade", produtoPreco.value);
    form.append("quantidade_estoque", produtoEstoque.value);

    if (produtoImagem.files[0]) {
        form.append("imagem", produtoImagem.files[0]);
    }

    const endpoint = produtoEditandoId
        ? `/produto/editar/${produtoEditandoId}`
        : "/produto/criar_produto";

    const res = await apiRequest(endpoint, {
        method: "POST",
        headers: authHeadersFormData(),
        body: form
    });

    if (!res.ok) {
        log(res.error || "Erro ao salvar produto.");
        return;
    }

    log(produtoEditandoId
        ? "✏️ Produto atualizado com sucesso!"
        : "✅ Produto adicionado com sucesso!"
    );

    fecharModalProduto();
    carregarProdutos();
}

/* ======================================================
   EDITAR PRODUTO
====================================================== */
window.editarProduto = async function (produtoId) {
    const { ok, data } = await apiRequest("/produto/listar", {
        method: "GET",
        headers: authHeadersJson()
    });

    if (!ok) return;

    const produto = data.data.find(p => p.id === produtoId);
    if (!produto) return;

    produtoEditandoId = produtoId;

    produtoNome.value = produto.nome;
    produtoDescricao.value = produto.descricao || "";
    produtoPreco.value = produto.preco_unidade;
    produtoEstoque.value = produto.quantidade_estoque;

    abrirModalProduto();
};

/* ======================================================
   EXCLUIR PRODUTO
====================================================== */
window.excluirProduto = async function (produtoId) {

    const confirmado = await abrirModalMensagem(
        "Confirmar exclusão",
        "Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita."
    );

    if (!confirmado) return;

    const res = await apiRequest(`/produto/excluir/${produtoId}`, {
        method: "DELETE",
        headers: authHeadersJson()
    });

    if (!res.ok) {
        await abrirModalMensagem(
            "Erro",
            "Não foi possível excluir o produto.",
            "alerta"
        );
        return;
    }

    await abrirModalMensagem(
        "Sucesso",
        "🗑️ Produto excluído com sucesso!",
        "alerta"
    );

    carregarProdutos();
};


/* ======================================================
   EVENTOS
====================================================== */
document.addEventListener("DOMContentLoaded", () => {

    inicializarTopoEmpresa({
        categoria: window.empresaCategoria || "Empresa",
        aberto: window.empresaAberta ?? false,
        rotaProdutos: "/company/produtos"
    });

    btnAbrirModalProduto.addEventListener("click", () => {
        produtoEditandoId = null;
        limparFormulario();
        abrirModalProduto();
    });

    btnAdicionarProduto.addEventListener("click", salvarProduto);

    carregarProdutos();
});
