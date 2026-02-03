import { apiRequest, authHeadersJson } from "./api.js";
import { log } from "./utils.js";
import { logout } from "./auth.js";
import { formatarTaxaEntrega } from "./utils.js";
// ============================= Components da INTERFACE dom =============================

// ======= elementos da page principal
const lista = document.getElementById("listaEstabelecimentos");
const buscaInput = document.getElementById("buscaInput");
const categoriaBtns = document.querySelectorAll(".cat-btn");

// ======= Elementos do menu do perfil
const perfilIcon = document.getElementById("perfilIcon");
const menuPerfil = document.getElementById("menuPerfil");
const btnPerfil = document.getElementById("btnPerfil");
const btnPagamento = document.getElementById("btnPagamento");
const btnPedidos = document.getElementById("btnPedidos");
const btnVip = document.getElementById("btnVip"); // VIP
const btnLogout = document.getElementById("btnLogout");

// ============================= VARIÁVEIS DE ESTADO =============================
let estabelecimentos = [];
let categoriaFiltro = "";

// ============================= FUNÇÕES DO MENU DO PERFIL =============================

// ======= alternar menu do perfil
function toggleMenuPerfil() {
    if (menuPerfil) {
        menuPerfil.classList.toggle("hidden");
    }
}

// ======= fechar menu ao clicar fora
function setupFecharMenuFora() {
    document.addEventListener("click", function (event) {
        if (
            menuPerfil &&
            perfilIcon &&
            !perfilIcon.contains(event.target) &&
            !menuPerfil.contains(event.target)
        ) {
            menuPerfil.classList.add("hidden");
        }
    });
}

// ======= configurar eventos do menu
function setupMenuEventos() {
    if (perfilIcon) {
        perfilIcon.addEventListener("click", toggleMenuPerfil);
    }

    if (btnPerfil) {
        btnPerfil.addEventListener("click", () => {
            window.location.href = "/client/profile";
        });
    }

    if (btnPedidos) {
        btnPedidos.addEventListener("click", () => {
            window.location.href = "/client/orders";
        });
    }

    if (btnPagamento) {
        btnPagamento.addEventListener("click", () => {
            alert("Página de pagamento em desenvolvimento!");
        });
    }

    // ⭐ VIP — botão virar VIP
    if (btnVip) {
        btnVip.addEventListener("click", abrirModalVip);
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", logout);
    }
}

// ============================= VIP =============================

// ⭐ Abrir modal simples de VIP
function abrirModalVip() {
    const escolha = prompt(
        "Escolha o plano VIP:\n\n1 - VIP 1 mês\n2 - VIP 1 ano\n3 - VIP eterno"
    );

    if (!escolha) return;

    let plano = null;

    if (escolha === "1") plano = "1_mes";
    if (escolha === "2") plano = "1_ano";
    if (escolha === "3") plano = "eterno";

    if (!plano) {
        alert("Opção inválida.");
        return;
    }

    virarVip(plano);
}

// ⭐ Chamada para o backend virar VIP
async function virarVip(plano) {
    try {
        const res = await apiRequest("/users/vip", {
            method: "POST",
            headers: authHeadersJson(),
            body: JSON.stringify({ plano })
        });

        if (!res.ok) {
            const errorMsg = res.error || res.data?.error || "Erro ao virar VIP";
            alert(`${errorMsg}`);
            return;
        } 
        const data = res.data || res;
        console.log("VIP ativado:", data);
        alert("🎉 Parabéns! Você agora é VIP!");
        log("Usuário virou VIP");

    } catch (err) {
        console.error(err);
        alert("Erro de conexão ao virar VIP");
    }
}

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

        card.innerHTML = `
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

    setupMenuEventos();
    setupFecharMenuFora();
    setupCategorias();

    if (buscaInput) {
        buscaInput.addEventListener("input", aplicarFiltros);
    }

    carregarEstabelecimentos();
}

document.addEventListener("DOMContentLoaded", inicializar);