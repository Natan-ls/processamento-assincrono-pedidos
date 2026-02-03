//produtos.js
import { apiRequest, authHeadersJson } from "./api.js";
import { log, toggleMenuPerfil, formatarTaxaEntrega } from "./utils.js";
import { logout } from "./auth.js";
 
// ======================= COMPONENTS da INTERFACE dom =======================
// elementos principais
const listaProdutos = document.getElementById("listaProdutos");
const tituloProdutos = document.getElementById("tituloProdutos");
const infoEstabelecimento = document.getElementById("infoEstabelecimento");
const btnVoltar = document.getElementById("btnVoltar");

// Modal
const modalProduto = document.getElementById("modalProduto");
const modalTitulo = document.getElementById("modalTitulo");
const modalImagem = document.getElementById("modalImagem");
const modalNome = document.getElementById("modalNome");
const modalPreco = document.getElementById("modalPreco");
const modalEstoque = document.getElementById("modalEstoque");
const modalDescricao = document.getElementById("modalDescricao");
const fecharModal = document.getElementById("fecharModal");
const observacaoInput = document.getElementById("observacaoInput");
const quantidadeModal = document.getElementById("quantidadeModal");
const diminuirQtde = document.getElementById("diminuirQtde");
const aumentarQtde = document.getElementById("aumentarQtde");
const btnAdicionarModal = document.getElementById("btnAdicionarModal");

// Carrinho
const carrinhoItens = document.getElementById("carrinhoItens");
const contadorCarrinho = document.getElementById("contadorCarrinho");
const subtotalValor = document.getElementById("subtotalValor");
const taxaEntrega = document.getElementById("taxaEntrega");
const totalValor = document.getElementById("totalValor");
const totalCarrinho = document.getElementById("totalCarrinho");
const btnFinalizarPedido = document.getElementById("btnFinalizarPedido");

// Menu perfil
const perfilIcon = document.getElementById("perfilIcon");
const menuPerfil = document.getElementById("menuPerfil");
const btnPerfil = document.getElementById("btnPerfil");
const btnPagamento = document.getElementById("btnPagamento");
const btnPedidos = document.getElementById("btnPedidos");
const btnLogout = document.getElementById("btnLogout");

// ======================= MODAL do ENDEREÇO de ENTREGA =======================
const modalEndereco = document.getElementById("modalEndereco");
const fecharModalEndereco = document.getElementById("fecharModalEndereco");
const enderecoEntregaInput = document.getElementById("enderecoEntregaInput");
const btnConfirmarEndereco = document.getElementById("btnConfirmarEndereco");
const btnUsarEnderecoCadastrado = document.getElementById("btnUsarEnderecoCadastrado");

// ======================= MODAL UNIVERSAL p/ MENSAGENS, CONFIRMAÇÃO de SUCESO OU FALKHA =======================
const modalMensagem = document.getElementById("modalMensagem");
const modalMensagemTitulo = document.getElementById("modalMensagemTitulo");
const modalMensagemTexto = document.getElementById("modalMensagemTexto");

const fecharModalMensagem = document.getElementById("fecharModalMensagem");
const btnCancelarMensagem = document.getElementById("btnCancelarMensagem");
const btnConfirmarMensagem = document.getElementById("btnConfirmarMensagem");


// ======================= VARIÁVEIS DE ESTADO =======================
let estabelecimentoId = null;
let estabelecimentoNome = null;
let estabelecimentoInfo = null;
let produtos = [];
let carrinho = [];
let produtoSelecionado = null;
let taxaEntregaValor = 0;

// ======================= FUNÇÕES DO MENU DO PERFIL =======================
//function toggleMenuPerfil() {if (menuPerfil) {menuPerfil.classList.toggle("hidden");}}

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

function setupMenuEventos() {
    if (perfilIcon) {perfilIcon.addEventListener('click', toggleMenuPerfil);}
    
    if (btnPerfil) {btnPerfil.addEventListener('click', () => {window.location.href = '/client/profile';});}
    
    if (btnPedidos) {btnPedidos.addEventListener('click', () => {window.location.href = '/client/orders';});}
    
    if (btnPagamento) {btnPagamento.addEventListener('click', () => {alert('Página de pagamento em desenvolvimento!');});}
    
    if (btnLogout) {btnLogout.addEventListener('click', logout);}
}

function abrirModalMensagem(titulo, mensagem, tipo = "info") {
    return new Promise((resolve) => {

        modalMensagemTitulo.textContent = titulo;
        modalMensagemTexto.textContent = mensagem;

        // Mostrar ou esconder botão cancelar dependendo do tipo
        if (tipo === "alerta") {
            btnCancelarMensagem.style.display = "none";
            btnConfirmarMensagem.textContent = "OK";
        } else {
            btnCancelarMensagem.style.display = "block";
            btnConfirmarMensagem.textContent = "Confirmar";
        }

        // Abrir modal
        modalMensagem.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        // Confirmar
        btnConfirmarMensagem.onclick = () => {
            fecharModal();
            resolve(true);
        };

        // Cancelar
        btnCancelarMensagem.onclick = () => {
            fecharModal();
            resolve(false);
        };

        // Fechar no X
        fecharModalMensagem.onclick = () => {
            fecharModal();
            resolve(false);
        };

        function fecharModal() {
            modalMensagem.classList.add("hidden");
            document.body.style.overflow = "auto";
        }
    });
}


// ======================= FUNÇÕES DA PÁGINA DE PRODUTOS =======================
// ======= Fn=unct de Carregar os Produtos do estabelecimento
async function carregarEstabelecimentoEProdutos() {
    try {
        console.log("Iniciando carregamento de produtos...");
        
        // pega o ID da URL
        const urlParams = new URLSearchParams(window.location.search);
        estabelecimentoId = urlParams.get('estabelecimentoId');
        
        if (!estabelecimentoId) {
            console.error("Erro: ID do estabelecimento não encontrado na URL");
            listaProdutos.innerHTML = '<div class="erro">❌ Erro: Estabelecimento não encontrado.</div>';
            return;
        }

        // carregar produtos 
        const resProdutos = await apiRequest(`/estabelecimentos/${estabelecimentoId}/produtos`, {
            method: "GET"
        });

        if (resProdutos.ok) {
            // Sucesso na rota
            produtos = resProdutos.data || [];
            console.log("Produtos carregados via rota direta:", produtos);
        } else {
            //  Se a rota falhar, busca todos e filtra
            console.warn("Rota direta falhou, tentando fallback local...");
            const todosProdutos = await apiRequest(`/produtos`, { method: "GET" });
            
            if (todosProdutos.ok && Array.isArray(todosProdutos.data)) {
                produtos = todosProdutos.data.filter(p => p.estabelecimento_id == estabelecimentoId);
                console.log(`Filtrados ${produtos.length} produtos localmente.`);
            } else {
                // Se tudo falhar, a gente usa o mock para não quebrar a tela, mas temos q ver psoteriomente se mantem ou tira
                console.error("Todas as tentativas de API falharam. Usando dados Mock.");
                produtos = criarDadosMock();
            }
        }

        // Carrega tds informações do estabelecimento para o cabeçalho
        const resEst = await apiRequest(`/estabelecimentos/${estabelecimentoId}`, { method: "GET" });
        if (resEst.ok) {
            estabelecimentoInfo = resEst.data;
            estabelecimentoNome = estabelecimentoInfo.nome_fantasia || "Estabelecimento";
            taxaEntregaValor = Number(estabelecimentoInfo.taxa_entrega) || 0;    
            tituloProdutos.textContent = `🛒 ${estabelecimentoNome}`;
            infoEstabelecimento.textContent = estabelecimentoInfo.descricao || "Bem-vindo!";
        } else {
            tituloProdutos.textContent = `🛒 Produtos`;
        }

        //Mostrar na tela
        renderizarProdutos(produtos);
        
    } catch (error) {
        console.error("Erro crítico:", error);
        listaProdutos.innerHTML = `
            <div class="erro">
                <h3>❌ Erro ao carregar página</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ======= Verificar se a funct  do mock tem mesmo q existir ou n
function criarDadosMock() {
    console.log("Criando dados mock para demonstração...");
    return [
        {
            id: 1,
            nome: "Pizza Calabresa",
            preco: 45.00,
            descricao: "Pizza de calabresa com queijo, molho de tomate e orégano",
            quantidade_estoque: 50,
            imagem: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop"
        },
        {
            id: 2,
            nome: "Pizza Marguerita",
            preco: 42.00,
            descricao: "Pizza com queijo mussarela, tomate fresco e manjericão",
            quantidade_estoque: 40,
            imagem: "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?w=300&h=300&fit=crop"
        },
        {
            id: 3,
            nome: "Coca-Cola 2L",
            preco: 13.00,
            descricao: "Refrigerante Coca-Cola 2 litros",
            quantidade_estoque: 100,
            imagem: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop"
        }
    ];
}

// ======================= Funct aux VERIFICAR STATUS DO ESTOQUE =======================
function getStatusEstoque(estoque) {
    const estoqueNum = parseInt(estoque) || 0;
    if (estoqueNum > 0) {
        return { 
            texto: `Disponível`,
            cor: '#2e7d32',
            disponivel: true 
        };
    } else {
        return { 
            texto: 'Esgotado',
            cor: '#f44336',
            disponivel: false 
        };
    }
}

// ======================= Funct renderizarProdutos
function renderizarProdutos(produtosLista) {
    if (!listaProdutos) {
        console.error("Elemento listaProdutos não encontrado!");
        return;
    }
    
    console.log(`Renderizando ${produtosLista.length} produtos`);
    
    if (produtosLista.length === 0) {
        listaProdutos.innerHTML = `
            <div class="sem-resultados">
                <i class="fas fa-box-open" style="font-size: 50px; color: #e1e5eb; margin-bottom: 15px;"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Este estabelecimento ainda não cadastrou produtos.</p>
            </div>
        `;
        return;
    }

    listaProdutos.innerHTML = "";
    
    produtosLista.forEach(produto => {
        console.log("Processando produto:", produto);
        const item = document.createElement("div");
        item.className = "produto-item";
        item.dataset.id = produto.id;
        
        // Verificar campos do produto
        const nomeProduto = produto.nome || produto.nome_item || "Produto sem nome";
        const precoProduto = produto.preco || produto.preco_unidade || 0;
        const descricaoProduto = produto.descricao || `Produto de ${estabelecimentoNome || "estabelecimento"}`;
        
        // Verificar se há imagem, senão usar placeholder
        let imagemUrl = produto.imagem || produto.url_imagem;
        if (!imagemUrl || imagemUrl === "") {
            imagemUrl = `https://via.placeholder.com/100/e9ecef/6c757d?text=${encodeURIComponent(nomeProduto.substring(0, 10))}`;
        }
                
        const estoqueProduto = produto.quantidade_estoque !== undefined ? produto.quantidade_estoque : 0;
        const statusEstoque = getStatusEstoque(estoqueProduto);
        
        // Determinar se o botão deve estar habilitado
        const botaoDesabilitado = !statusEstoque.disponivel;
        
        item.innerHTML = `
            <img src="${imagemUrl}" alt="${nomeProduto}" class="produto-imagem" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/100/e9ecef/6c757d?text=Produto'">
            <div class="produto-conteudo">
                <h4>${nomeProduto}</h4>
                <div class="produto-preco">R$ ${parseFloat(precoProduto).toFixed(2)}</div>
                <div class="produto-descricao">${descricaoProduto}</div>
                <div class="produto-estoque" style="font-size: 12px; color: ${statusEstoque.cor}; margin: 5px 0;">
                    <i class="fas fa-box"></i> ${statusEstoque.texto}
                </div>
                <div class="produto-acoes">
                    <button class="btn-ver-detalhes" data-id="${produto.id}">
                        <i class="fas fa-eye"></i> Ver Detalhes
                    </button>
                    <button class="btn-adicionar-rapido" data-id="${produto.id}" 
                            ${botaoDesabilitado ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        `;
        
        listaProdutos.appendChild(item);
    });
    
    // Adicionar eventos aos botões
    setTimeout(() => {
        document.querySelectorAll('.btn-ver-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const produtoId = e.target.closest('button').dataset.id;
                console.log("Abrindo modal para produto ID:", produtoId);
                abrirModalProduto(produtoId);
            });
        });
        
        document.querySelectorAll('.btn-adicionar-rapido').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const produtoId = e.target.closest('button').dataset.id;
                console.log("Adicionando rapidamente produto ID:", produtoId);
                adicionarProdutoRapido(produtoId);
            });
        });
        
        // Clicar no item do produto também abre o modal
        document.querySelectorAll('.produto-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const produtoId = item.dataset.id;
                    console.log("Clicou no item, produto ID:", produtoId);
                    abrirModalProduto(produtoId);
                }
            });
        });
    }, 100);
}

// ======================= Funct abrirModalProduto =======================
function abrirModalProduto(produtoId) {
    console.log("Abrindo modal para produto ID:", produtoId);
    
    // Converter para número se necessário
    const idNum = parseInt(produtoId);
    produtoSelecionado = produtos.find(p => p.id === idNum || p.id.toString() === produtoId);
    
    if (!produtoSelecionado) {
        console.error("Produto não encontrado para ID:", produtoId);
        return;
    }
    
    console.log("Produto selecionado:", produtoSelecionado);
    // Preencher modal com informações do produto
    const nomeProduto = produtoSelecionado.nome || produtoSelecionado.nome_item || "Produto sem nome";
    const precoProduto = produtoSelecionado.preco || produtoSelecionado.preco_unidade || 0;
    const descricaoProduto = produtoSelecionado.descricao || `Produto de ${estabelecimentoNome || "estabelecimento"}`;
    const estoqueProduto = (produtoSelecionado.quantidade_estoque !== undefined) ? produtoSelecionado.quantidade_estoque : 0;
    
    // Obter status do estoque
    const statusEstoque = getStatusEstoque(estoqueProduto);
    
    modalTitulo.textContent = nomeProduto;
    modalNome.textContent = nomeProduto;
    modalPreco.textContent = `R$ ${parseFloat(precoProduto).toFixed(2)}`;
    
    // Atualizar exibição do estoque com status
    modalEstoque.textContent = statusEstoque.texto;
    modalEstoque.style.color = statusEstoque.cor;
    
    modalDescricao.textContent = descricaoProduto;
    
    // Controlar botão de adicionar no modal
    if (btnAdicionarModal) {
        if (!statusEstoque.disponivel) {
            btnAdicionarModal.disabled = true;
            btnAdicionarModal.style.opacity = '0.5';
            btnAdicionarModal.style.cursor = 'not-allowed';
            btnAdicionarModal.textContent = 'Produto Esgotado';
        } else {
            btnAdicionarModal.disabled = false;
            btnAdicionarModal.style.opacity = '1';
            btnAdicionarModal.style.cursor = 'pointer';
            btnAdicionarModal.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
        }
    }
    
    // Definir imagem (usar placeholder se não houver)
    let imagemUrl = produtoSelecionado.imagem || produtoSelecionado.url_imagem;
    if (!imagemUrl || imagemUrl === "") {
        imagemUrl = `https://via.placeholder.com/300/e9ecef/6c757d?text=${encodeURIComponent(nomeProduto)}`;
    }
    
    modalImagem.innerHTML = `<img src="${imagemUrl}" alt="${nomeProduto}" 
        style="width:100%; height:100%; border-radius:12px; object-fit:cover;"
        onerror="this.onerror=null; this.src='https://via.placeholder.com/300/e9ecef/6c757d?text=Produto'">`;
    
    // Resetar campos
    observacaoInput.value = '';
    quantidadeModal.value = '1';
    
    // Abrir modal
    modalProduto.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    console.log("Modal aberto com sucesso");
}

function fecharModalProduto() {
    modalProduto.classList.add('hidden');
    document.body.style.overflow = 'auto';
    produtoSelecionado = null;
    console.log("Modal fechado");
}

// ======================= Funct adicionarProdutoRapido =======================
function adicionarProdutoRapido(produtoId) {
    console.log("Adicionando produto rápido ID:", produtoId);
    
    // Converter para número se necessário
    const idNum = parseInt(produtoId);
    const produto = produtos.find(p => p.id === idNum || p.id.toString() === produtoId);
    
    if (!produto) {
        console.error("Produto não encontrado para adição rápida:", produtoId);
        return;
    }
    
    // Verificar se há estoque disponível
    const estoqueProduto = produto.quantidade_estoque !== undefined ? produto.quantidade_estoque : 0;
    if (estoqueProduto <= 0) {
        mostrarNotificacao(`${produto.nome || produto.nome_item} está esgotado!`, 'warning');
        return;
    }
    
    const nomeProduto = produto.nome || produto.nome_item || "Produto sem nome";
    const precoProduto = produto.preco || produto.preco_unidade || 0;
    const imagemProduto = produto.imagem || produto.url_imagem || '';
    
    // Adicionar ao carrinho sem observação
    carrinho.push({
        produto_id: produto.id,
        nome: nomeProduto,
        preco: precoProduto,
        quantidade: 1,
        observacao: '',
        imagem: imagemProduto
    });
    
    atualizarCarrinho();
    mostrarNotificacao(`${nomeProduto} adicionado ao carrinho!`);
    console.log("Produto adicionado ao carrinho:", nomeProduto);
}

// ======================= adicionarDoModal =======================
function adicionarDoModal() {
    if (!produtoSelecionado) {
        console.error("Nenhum produto selecionado no modal");
        return;
    }
    
    // Verificar se há estoque disponível
    const estoqueProduto = produtoSelecionado.quantidade_estoque !== undefined ? produtoSelecionado.quantidade_estoque : 0;
    if (estoqueProduto <= 0) {
        mostrarNotificacao(`${produtoSelecionado.nome || produtoSelecionado.nome_item} está esgotado!`, 'warning');
        return;
    }
    
    const observacao = observacaoInput.value.trim();
    const quantidade = parseInt(quantidadeModal.value) || 1;
    
    console.log("Adicionando do modal:", produtoSelecionado.nome, "Quantidade:", quantidade);
    
    // Validar quantidade
    if (quantidade < 1 || quantidade > 20) {
        alert('Quantidade deve ser entre 1 e 20');
        return;
    }
    
    // Verificar se a quantidade solicitada não excede o estoque
    if (quantidade > estoqueProduto) {
        alert(`Quantidade solicitada (${quantidade}) excede o estoque disponível (${estoqueProduto})!`);
        return;
    }
    
    const nomeProduto = produtoSelecionado.nome || produtoSelecionado.nome_item || "Produto sem nome";
    const precoProduto = produtoSelecionado.preco || produtoSelecionado.preco_unidade || 0;
    const imagemProduto = produtoSelecionado.imagem || produtoSelecionado.url_imagem || '';
    
    // Adicionar ao carrinho
    carrinho.push({
        produto_id: produtoSelecionado.id,
        nome: nomeProduto,
        preco: precoProduto,
        quantidade: quantidade,
        observacao: observacao,
        imagem: imagemProduto
    });
    
    atualizarCarrinho();
    fecharModalProduto();
    mostrarNotificacao(`${quantidade}x ${nomeProduto} adicionado ao carrinho!`);
    console.log("Produto adicionado do modal:", nomeProduto);
}

//======================= Funct de Atualizar o carrinho =======================
function atualizarCarrinho() {
    if (!carrinhoItens || !contadorCarrinho || !totalValor) {
        console.error("Elementos do carrinho não encontrados!");
        return;
    }
    
    console.log("Atualizando carrinho com", carrinho.length, "itens");
    
    // Atualizar contador
    const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    contadorCarrinho.textContent = totalItens;
    
    // Limpar carrinho
    carrinhoItens.innerHTML = "";
    
    if (carrinho.length === 0) {
        carrinhoItens.innerHTML = `
            <div class="carrinho-vazio">
                <i class="fas fa-shopping-basket"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        totalCarrinho.classList.add('hidden');
        return;
    }
    
    // Mostrar itens do carrinho
    let subtotal = 0;
    
    carrinho.forEach((item, index) => {
        const itemTotal = item.preco * item.quantidade;
        subtotal += itemTotal;
        
        const div = document.createElement("div");
        div.className = "carrinho-item";
        
        div.innerHTML = `
            <div class="carrinho-item-info">
                <div class="carrinho-item-nome">${item.nome}</div>
                ${item.observacao ? `<div class="carrinho-item-observacao">${item.observacao}</div>` : ''}
                <div class="carrinho-item-detalhes">
                    <span>R$ ${parseFloat(item.preco).toFixed(2)}</span>
                    <span>× ${item.quantidade}</span>
                    <span>= R$ ${itemTotal.toFixed(2)}</span>
                </div>
            </div>
            <div class="carrinho-item-acoes">
                <button class="btn-remover-item" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        carrinhoItens.appendChild(div);
    });
    
    // Adicionar eventos aos botões de remover
    document.querySelectorAll('.btn-remover-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('button').dataset.index);
            removerDoCarrinho(index);
        });
    });
    
    // Calcular totais
    const taxa = taxaEntregaValor; // Taxa de entrega
    const total = subtotal + taxa;
    
    subtotalValor.textContent = subtotal.toFixed(2);
    taxaEntrega.textContent = formatarTaxaEntrega(taxa);
    totalValor.textContent = total.toFixed(2);
    
    // Mostrar seção de total
    totalCarrinho.classList.remove('hidden');
    console.log("Carrinho atualizado. Subtotal:", subtotal, "Total:", total);
}

function removerDoCarrinho(index) {
    if (index >= 0 && index < carrinho.length) {
        const itemRemovido = carrinho[index].nome;
        carrinho.splice(index, 1);
        atualizarCarrinho();
        mostrarNotificacao(`${itemRemovido} removido do carrinho.`, 'warning');
        console.log("Item removido do carrinho:", itemRemovido);
    }
}


// ======================= Funct p buscar o endereço cadastradi =======================
async function buscarEnderecoCadastrado() {

    const token = localStorage.getItem("token");

    if (!token) {throw new Error("Usuário não está logado.");}

    //ROTA DO SEU BACKEND
    const res = await apiRequest("/auth/me", {
        method: "GET",
        headers: authHeadersJson()
    });

    if (!res.ok) {throw new Error(res.error || "Erro ao buscar perfil.");}
    const data = res.data;
    if (!data.endereco) {throw new Error("Usuário não possui endereço cadastrado.");}

    //monta o endereço completo
    const e = data.endereco;

    return `${e.rua}, Nº ${e.numero} - ${e.bairro}, ${e.cidade} - ${e.estado}, CEP: ${e.cep}`;
}



async function finalizarPedido() {
    console.log("Iniciando finalização de pedido...");
    
    //Carrinho vazio
    if (carrinho.length === 0) {
        await abrirModalMensagem(
            "🛒 Carrinho vazio",
            "Adicione pelo menos um produto antes de finalizar o pedido.",
            "alerta"
        );
        return;
    }

    //Estabelecimento inválido
    if (!estabelecimentoId) {
        await abrirModalMensagem(
            "❌ Erro",
            "Nenhum estabelecimento foi selecionado.",
            "alerta"
        );
        return;
    }
    // Calcular total do PEDIDO
    const subtotal = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    const taxa = taxaEntregaValor;
    const total = subtotal + taxa;
    
    // Pergunta endereço de entrega
    let enderecoEntrega = "";

    try {
        enderecoEntrega = await pedirEnderecoEntrega();
    } catch (err) {
        mostrarNotificacao("Pedido cancelado.", "warning");
        return;
    }
    

    const confirmado = await abrirModalMensagem(
        "📦 Confirmar Pedido",
        `Você deseja confirmar o pedido no ${estabelecimentoNome}?\n\n` +
        `Subtotal: R$ ${subtotal.toFixed(2)}\n` +
        `Taxa: ${formatarTaxaEntrega(taxa)}\n` +
        `Total: R$ ${total.toFixed(2)}\n\n` +
        `Itens no carrinho: ${carrinho.length}`,
        "confirmacao"
    );

    if (!confirmado) return;
    
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            await abrirModalMensagem(
                "🔑 Login necessário",
                "Você precisa estar logado para finalizar o pedido.",
                "alerta"
            );

            window.location.href = "/";
            return;
        }
        
        // Prepara items p a API
        const items = carrinho.map(item => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco: parseFloat(item.preco),
            observacao: item.observacao || ''
        }));
        
        console.log("Enviando pedido para API...", items);

        // Envia pedido para a API
        /*const res = await apiRequest("/orders/", {
            method: "POST",
            headers: authHeadersJson(),
            body: JSON.stringify({
                estabelecimento_id: parseInt(estabelecimentoId),
                items,
                endereco_entrega: enderecoEntrega,
                //observacoes: observacaoInput.value.trim()
            })
        });*/

        const res = await apiRequest("/orders/", {
            method: "POST",
            headers: authHeadersJson(),
            body: JSON.stringify({
                estabelecimento_id: Number(estabelecimentoId),
                endereco_entrega: enderecoEntrega,

                subtotal: Number(subtotal.toFixed(2)),
                taxa_entrega: Number(taxa.toFixed(2)),
                valor_total: Number(total.toFixed(2)),

                items: items
            })
        });

        if (!res.ok) {throw new Error(res.error || "Erro ao criar pedido");}

        const data = res.data;            
        console.log("Resposta do backend:", data);

        // msg de sucesso
        await abrirModalMensagem(
            "✅ Pedido realizado!",
            `Seu pedido foi criado com sucesso!\n\nID: ${data.id}\nTotal: R$ ${total.toFixed(2)}`,
            "alerta"
        );

        // Limpar carrinho
        carrinho = [];
        atualizarCarrinho();
        
        // Redirecionar para a página de informar o pagamento
        const pedidoId = data.order_id || data.id || data.pedido_id || data.id_pedido;

        if (!pedidoId) {throw new Error("Backend não retornou o ID do pedido.");}

        window.location.href = `/client/pagamento?pedidoId=${pedidoId}`;

    } catch (error) {
        console.error("Erro ao finalizar pedido:", error);

        await abrirModalMensagem(
            "❌ Erro no Pedido",
            "Não foi possível criar o pedido:\n\n" + error.message,
            "alerta"
        );
    }
}

// ======================= Funct de Pedir dereço de entrega do pedido p user =======================
function pedirEnderecoEntrega() {
    return new Promise((resolve, reject) => {

        // Abrir modal
        modalEndereco.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        // Resetar o campo
        enderecoEntregaInput.value = "";

        // button p usar o endereço ja cadastrado
        btnUsarEnderecoCadastrado.onclick = async () => {
            try {
                mostrarNotificacao("Buscando endereço cadastrado...", "success");

                const endereco = await buscarEnderecoCadastrado();

                if (!endereco) {
                    await abrirModalMensagem(
                        "⚠️ Endereço não encontrado",
                        "Você ainda não cadastrou um endereço no seu perfil.",
                        "alerta"
                    );
                    return;
                }

                enderecoEntregaInput.value = endereco;
                mostrarNotificacao("📌 Endereço preenchido automaticamente!", "success");

            } catch (err) {
                await abrirModalMensagem(
                    "❌ Erro",
                    "Não foi possível carregar seu endereço.\n\n" + err.message,
                    "alerta"
                );
            }
        };

        // Confirmar endereço digitado/preenchido
        btnConfirmarEndereco.onclick = () => {
            const endereco = enderecoEntregaInput.value.trim();

            if (!endereco) {
                mostrarNotificacao("❌ Informe um endereço válido!", "warning");
                return;
            }

            fecharModalEnderecoFunc();
            resolve(endereco);
        };

        // Cancelar modal
        fecharModalEndereco.onclick = () => {
            fecharModalEnderecoFunc();
            reject("Usuário cancelou endereço");
        };

        function fecharModalEnderecoFunc() {
            modalEndereco.classList.add("hidden");
            document.body.style.overflow = "auto";
        }
    });
}


// ======================= Funct p mostrar notificação =======================
function mostrarNotificacao(mensagem, tipo = 'success') {
    console.log("Mostrando notificação:", mensagem, "Tipo:", tipo);
    
    // Criar notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#43a047' : '#f44336'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notificacao.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 300);
    }, 3000);
}

// ======================= Funct p inciar o sistema =======================
function inicializar() {
    console.log("Inicializando página de produtos...");
    
    // Verificar se está logado
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Você precisa estar logado para acessar esta página!");
        window.location.href = "/";
        return;
    }
    
    console.log("Usuário logado, token:", token ? "Presente" : "Ausente");
    
    // Configurar menu do perfil
    setupMenuEventos();
    setupFecharMenuFora();
    
    // Configurar eventos do modal
    if (fecharModal) {
        fecharModal.addEventListener('click', fecharModalProduto);
    }
    
    // Fechar modal ao clicar fora
    if (modalProduto) {modalProduto.addEventListener('click', (e) => {if (e.target === modalProduto) {fecharModalProduto();}});}
    
    // Configurar controle de quantidade
    if (diminuirQtde) {
        diminuirQtde.addEventListener('click', () => {
            const valor = parseInt(quantidadeModal.value) || 1;
            if (valor > 1) quantidadeModal.value = valor - 1;
        });
    }
    
    if (aumentarQtde) {
        aumentarQtde.addEventListener('click', () => {
            const valor = parseInt(quantidadeModal.value) || 1;
            if (valor < 20) quantidadeModal.value = valor + 1;
        });
    }
    
    // Configurar botão de adicionar do modal
    if (btnAdicionarModal) {btnAdicionarModal.addEventListener('click', adicionarDoModal);}
    
    // Configurar botão de finalizar pedido
    if (btnFinalizarPedido) {btnFinalizarPedido.addEventListener('click', finalizarPedido);}
    
    // Configurar botão de voltar
    if (btnVoltar) {btnVoltar.addEventListener('click', () => {window.location.href = "/client/home";});}
    
    // Resetar estilo do botão quando o modal for fechado
    if (fecharModal) {
        fecharModal.addEventListener('click', () => {
            if (btnAdicionarModal) {
                btnAdicionarModal.disabled = false;
                btnAdicionarModal.style.opacity = '1';
                btnAdicionarModal.style.cursor = 'pointer';
                btnAdicionarModal.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
            }
        });
    }    
    // Carregar estabelecimento e produtos
    carregarEstabelecimentoEProdutos();
    
    // Adicionar estilos para animações de notificação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .erro {
            background: #ffebee;
            color: #c62828;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #ffcdd2;
            text-align: center;
            margin: 20px 0;
        }
        
        .sem-resultados {
            background: #f8f9fa;
            color: #6c757d;
            padding: 40px;
            border-radius: 10px;
            border: 1px solid #e9ecef;
            text-align: center;
            margin: 20px 0;
        }
        
        .carregando {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
    
    console.log("Inicialização completa!");
}
// ======================= executa a funct de iniciar o sistema =======================
document.addEventListener('DOMContentLoaded', inicializar);