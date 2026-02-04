import { apiRequest, authHeadersJson } from "./api.js";
import { log, formatarTaxaEntrega, getMenuElements, setupMenuEventos, setupFecharMenuFora, abrirModalVip } from "./utils.js";
import { logout } from "./auth.js";

// ============================= Components da INTERFACE dom =============================

// ======= elementos da page principal
const lista = document.getElementById("listaEstabelecimentos");
const buscaInput = document.getElementById("buscaInput");
const categoriaBtns = document.querySelectorAll(".cat-btn");

// ============================= VARIÁVEIS DE ESTADO =============================
let estabelecimentos = [];
let categoriaFiltro = "";

// ============================= ESTABELECIMENTOS =============================
// ======= carregar estabelecimentos
async function carregarEstabelecimentos() {
    try {
        lista.innerHTML = "<div class='carregando'>Carregando...</div>";

        const res = await apiRequest("/estabelecimentos", {
            method: "GET"
        });

        if (!res.ok) {
            lista.innerHTML = "<div class='erro'>Erro ao carregar</div>";
            return;
        }

        estabelecimentos = res.data.data || [];
        renderizarEstabelecimentos(estabelecimentos);


        console.log("RES COMPLETO:", res);
        console.log("RES.DATA:", res.data);
        

    } catch (err) {
        console.error(err);
        lista.innerHTML = "<div class='erro'>Erro de conexão</div>";
    }
}

// ======= renderizar estabelecimentos
function renderizarEstabelecimentos(listaDados) {
    lista.innerHTML = "";

    if (listaDados.length === 0) {
        lista.innerHTML = "<div class='sem-resultados'>Nenhum encontrado</div>";
        return;
    }

    listaDados.forEach(est => {
        const card = document.createElement("div");
        card.className = "card-estabelecimento";
        console.log(est.nome_fantasia, est.url_banner);//Log p testar se a img ta carregando ou vai carregar
        card.innerHTML = `
            <div class="banner">
                <img src="${est.url_banner}" alt="Banner ${est.nome_fantasia}">
            </div>
            <h3>${est.nome_fantasia}</h3>
            <p>${obterNomeCategoria(est.categoria)}</p>
            <p class="taxa-entrega">Taxa de Entrega: ${formatarTaxaEntrega(est.taxa_entrega)}</p>    
            <div class="status ${est.aberto ? "aberto" : "fechado"}">
                ${est.aberto ? "✅ Aberto" : "🔒 Fechado"}
            </div>
        `;

        if (est.aberto) {
            card.addEventListener("click", () => {
                window.location.href = `/client/produtos?estabelecimentoId=${est.id}`;
            });
        }

        lista.appendChild(card);
    });
}

// ============================= Event ao Clicar nos Botões de Categoria =============================
function setupCategorias() {
    categoriaBtns.forEach(btn => {
        btn.addEventListener("click", () => {

            // remove active de todos
            categoriaBtns.forEach(b => b.classList.remove("active"));

            // ativa o clicado
            btn.classList.add("active");

            // atualiza filtro
            categoriaFiltro = btn.dataset.categoria || "";

            // aplica filtro
            aplicarFiltros();
        });
    });
}


// ============================= FILTROS =============================
function aplicarFiltros() {
    const texto = buscaInput.value.toLowerCase();

    let filtrados = estabelecimentos;

    if (categoriaFiltro) {
        filtrados = filtrados.filter(e => e.categoria === categoriaFiltro);
    }

    if (texto) {
        filtrados = filtrados.filter(e =>
            e.nome_fantasia.toLowerCase().includes(texto)
        );
    }

    renderizarEstabelecimentos(filtrados);
}

// ============================= AUXILIARES =============================
function obterNomeCategoria(cat) {
    const mapa = {
        RESTAURANTE: "Restaurante",
        FAST_FOOD: "Fast Food",
        MERCADO: "Mercado",
        FARMACIA: "Farmácia"
    };
    return mapa[cat] || cat;
}

// ============================= INICIALIZAÇÃO =============================
function inicializar() {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Você precisa estar logado");
        logout();
        return;
    }

    // ===================== MENU DO PERFIL =====================
    // Pega elementos do menu do utils
    const menuElements = getMenuElements();

    // Configura os eventos do menu
    setupMenuEventos(menuElements, { abrirModalVip, logout });

    // Fecha menu ao clicar fora
    setupFecharMenuFora(menuElements.menuPerfil, menuElements.perfilIcon);

    setupCategorias();

    if (buscaInput) {buscaInput.addEventListener("input", aplicarFiltros);}

    carregarEstabelecimentos();
}

document.addEventListener("DOMContentLoaded", inicializar);