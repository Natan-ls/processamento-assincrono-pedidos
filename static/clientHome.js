import { apiRequest, authHeadersJson } from "./api.js";
import { log } from "./utils.js";
import { logout } from "./auth.js";
// ============================= Components da INTERFACE dom =============================
// ======= elementos da page principal
const lista = document.getElementById("listaEstabelecimentos");
const produtosSection = document.getElementById("produtosSection");
const produtosGrid = document.getElementById("produtosGrid");
const formPedido = document.getElementById("formPedido");
const produtoSelect = document.getElementById("produtoSelect");
const quantidadeInput = document.getElementById("quantidadeInput");
const carrinhoSection = document.getElementById("carrinhoSection");
const carrinhoItens = document.getElementById("carrinhoItens");
const totalCarrinho = document.getElementById("totalCarrinho");
const totalValor = document.getElementById("totalValor");
const buscaInput = document.getElementById("buscaInput");
const tituloProdutos = document.getElementById("tituloProdutos");

// ======= Elementos do menu do perfil
const perfilIcon = document.getElementById("perfilIcon");
const menuPerfil = document.getElementById("menuPerfil");
const btnPerfil = document.getElementById("btnPerfil");
const btnPagamento = document.getElementById("btnPagamento");
const btnPedidos = document.getElementById("btnPedidos");
const btnLogout = document.getElementById("btnLogout");
const btnVoltar = document.getElementById("btnVoltar");
const btnAdicionarCarrinho = document.getElementById("btnAdicionarCarrinho");
const btnFinalizarPedido = document.getElementById("btnFinalizarPedido");

// ============================= VARIÁVEIS DE ESTADO =============================
let estabelecimentos = [];
let produtos = [];
let carrinho = [];
let categoriaFiltro = '';
let estabelecimentoSelecionado = null;

// ============================= FUNÇÕES DO MENU DO PERFIL =============================
// ======= Funct alternar visibilidade do menu do perfil
function toggleMenuPerfil() {if (menuPerfil) {menuPerfil.classList.toggle("hidden");}}

// ======= Fechar menu ao clicar fora
function setupFecharMenuFora() {
    document.addEventListener('click', function(event) {
        if (menuPerfil && perfilIcon && 
            !perfilIcon.contains(event.target) && 
            !menuPerfil.contains(event.target) && 
            !menuPerfil.classList.contains('hidden')) {
            menuPerfil.classList.add('hidden');
        }
    });
}

// ======= Configurar eventos do menu
function setupMenuEventos() {
    // Evento para o ícone do perfil
    if (perfilIcon) {
        perfilIcon.addEventListener('click', toggleMenuPerfil);
    }
    
    // Eventos para os botões do menu
    if (btnPerfil) {
        btnPerfil.addEventListener('click', () => {
            window.location.href = '/client/profile';
        });
    }
    
    if (btnPedidos) {
        btnPedidos.addEventListener('click', () => {
            window.location.href = '/client/orders';
        });
    }
    
    if (btnPagamento) {
        btnPagamento.addEventListener('click', () => {
            alert('Página de pagamento em desenvolvimento!');
        });
    }
    
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
}

// ============================= FUNÇÕES DA PÁGINA PRINCIPAL =============================
// ======= carregar estabelecimentos
async function carregarEstabelecimentos() {
    try {
        if (lista) {
            lista.innerHTML = '<div class="carregando">Carregando estabelecimentos...</div>';
        }
        
        const res = await apiRequest("/estabelecimentos", {
            method: "GET"
        });

        if (!res.ok) {
            log("Erro ao carregar estabelecimentos: " + (res.error || "Erro desconhecido"));
            if (lista) {
                lista.innerHTML = '<div class="erro">Erro ao carregar estabelecimentos. Tente novamente.</div>';
            }
            return;
        }

        estabelecimentos = res.data || [];
        renderizarEstabelecimentos(estabelecimentos);
        
    } catch (error) {
        console.error("Erro:", error);
        log("Erro de conexão com o servidor.");
        if (lista) {
            lista.innerHTML = '<div class="erro">Erro de conexão. Verifique sua internet.</div>';
        }
    }
}

// ======= Renderizar estabelecimentos
function renderizarEstabelecimentos(estabelecimentosParaRenderizar) {
    if (!lista) return;
    
    lista.innerHTML = "";
    
    if (estabelecimentosParaRenderizar.length === 0) {
        lista.innerHTML = '<div class="sem-resultados">Nenhum estabelecimento encontrado.</div>';
        return;
    }

    estabelecimentosParaRenderizar.forEach(estabelecimento => {
        const card = document.createElement("div");
        card.className = `card-estabelecimento ${estabelecimento.aberto ? '' : 'fechado'}`;
        
        const logoUrl = estabelecimento.url_logo
            ? `${API_URL}${estabelecimento.url_logo}`
            : `https://via.placeholder.com/300x160/e9ecef/6c757d?text=${encodeURIComponent(estabelecimento.nome_fantasia)}`;

        /*card.innerHTML = `
            <img src="${estabelecimento.url_logo ? 'http://foodjanu.ddns.net:5000' + estabelecimento.url_logo : 'https://via.placeholder.com/300x160/e9ecef/6c757d?text=' + encodeURIComponent(estabelecimento.nome_fantasia)}" 
                 alt="${estabelecimento.nome_fantasia}" 
                 class="card-estabelecimento-img">
            <div class="card-estabelecimento-content">
                <h3>${estabelecimento.nome_fantasia}</h3>
                <p>${estabelecimento.categoria || 'Sem descrição'}</p>
                <p><strong>Categoria:</strong> ${obterNomeCategoria(estabelecimento.categoria)}</p>
                <div class="categoria">${obterIconeCategoria(estabelecimento.categoria)} ${obterNomeCategoria(estabelecimento.categoria)}</div>
                <div class="status ${estabelecimento.aberto ? 'aberto' : 'fechado'}">
                    ${estabelecimento.aberto ? '✅ Aberto agora' : '🔒 Fechado'}
                </div>
            </div>
        `;*/
        card.innerHTML = `
            <img src="${logoUrl}" 
                alt="${estabelecimento.nome_fantasia}" 
                class="card-estabelecimento-img">

            <div class="card-estabelecimento-content">
                <h3>${estabelecimento.nome_fantasia}</h3>
                <p>${estabelecimento.categoria || 'Sem descrição'}</p>

                <p>
                    <strong>Categoria:</strong>
                    ${obterNomeCategoria(estabelecimento.categoria)}
                </p>

                <div class="categoria">
                    ${obterIconeCategoria(estabelecimento.categoria)}
                    ${obterNomeCategoria(estabelecimento.categoria)}
                </div>

                <div class="status ${estabelecimento.aberto ? 'aberto' : 'fechado'}">
                    ${estabelecimento.aberto ? '✅ Aberto agora' : '🔒 Fechado'}
                </div>
            </div>
        `;

        // Só adiciona clique se estiver aberto
        if (estabelecimento.aberto) {
            card.addEventListener('click', () => selecionarEstabelecimento(estabelecimento));
        }

        lista.appendChild(card);
    });
}

// ======= Filtrar por categoria
function filtrarCategoria(categoria) {
    // Atualizar botões ativos
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    categoriaFiltro = categoria;
    aplicarFiltros();
}

// ======= Aplicar filtros
function aplicarFiltros() {
    const buscaTexto = buscaInput ? buscaInput.value.toLowerCase().trim() : '';
    
    let filtrados = estabelecimentos;
    
    // Filtrar por categoria
    if (categoriaFiltro) {
        filtrados = filtrados.filter(e => e.categoria === categoriaFiltro);
    }
    
    // Filtrar por busca
    if (buscaTexto) {
        filtrados = filtrados.filter(e => 
            e.nome_fantasia.toLowerCase().includes(buscaTexto) ||
            e.descricao?.toLowerCase().includes(buscaTexto) ||
            obterNomeCategoria(e.categoria).toLowerCase().includes(buscaTexto)
        );
    }
    
    renderizarEstabelecimentos(filtrados);
}

// ======= Selecionar estabelecimento (redireciona p page de produtos do estabelecimento selecionado)
async function selecionarEstabelecimento(estabelecimento) {window.location.href = `/client/produtos?estabelecimentoId=${estabelecimento.id}`;}

// ============================= FUNÇÕES AUXILIARES =============================
function obterNomeCategoria(categoria) {
    const categorias = {
        'RESTAURANTE': 'Restaurante',
        'FAST_FOOD': 'Fast Food',
        'MERCADO': 'Mercado',
        'FARMACIA': 'Farmácia'
    };
    return categorias[categoria] || categoria;
}

function obterIconeCategoria(categoria) {
    const icones = {
        'RESTAURANTE': '👨🏽‍🍳',
        'FAST_FOOD': '🍔',
        'MERCADO': '🛒',
        'FARMACIA': '💊'
    };
    return icones[categoria] || '🏪';
}

// ============================= inicalização do Sistema =============================
function inicializar() {
    // Verificar se está logado
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Você precisa estar logado para acessar esta página!");
        return logout();
    }
    
    // Configurar menu do perfil
    setupMenuEventos();
    setupFecharMenuFora();
    
    // Configurar eventos da página principal
    if (buscaInput) {
        buscaInput.addEventListener('input', aplicarFiltros);
    }
    
    // Configurar botões de categoria
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoria = this.getAttribute('data-categoria');
            filtrarCategoria(categoria);
        });
    });
    
    // Configurar eventos dos botões
    if (btnVoltar) {btnVoltar.addEventListener('click', voltarParaEstabelecimentos);}
    if (btnAdicionarCarrinho) {btnAdicionarCarrinho.addEventListener('click', adicionarAoCarrinho);}   
    if (btnFinalizarPedido) {btnFinalizarPedido.addEventListener('click', finalizarPedido);}
    if (quantidadeInput) {
        quantidadeInput.addEventListener('change', () => {
            if (quantidadeInput.value < 1) quantidadeInput.value = 1;
            if (quantidadeInput.value > 20) quantidadeInput.value = 20;
        });
    }
    
    // carrega os estabelecimentos
    carregarEstabelecimentos();
}
// ============================= executa a funct de inciiar =============================
document.addEventListener('DOMContentLoaded', inicializar);