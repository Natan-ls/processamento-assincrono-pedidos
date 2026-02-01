// main.js
import { createOrder, listOrders, getOrderById, loadEstabelecimentos, loadProdutos } from "./orders.js";
import { login, logout } from "./auth.js";
import { showLogin, showRegister, showRegisterCliente, showRegisterEmpresa, showOrders, showProfile } from "./ui.js";
import { log } from "./utils.js";
import { usarLocalizacao } from "./locations.js";
import {registerCliente, registerEmpresa} from "./register.js"
// Função para configurar todos os event listeners
function setupEventListeners() {
    // Login
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', function() {
            login(this); // Passa o botão como argumento
        });
    }

    const linkShowRegister = document.getElementById('linkShowRegister');
    if (linkShowRegister) {
        linkShowRegister.addEventListener('click', showRegister);
    }

    // Register Type
    const btnShowRegisterCliente = document.getElementById('btnShowRegisterCliente');
    if (btnShowRegisterCliente) {
        btnShowRegisterCliente.addEventListener('click', showRegisterCliente);
    }

    const btnShowRegisterEmpresa = document.getElementById('btnShowRegisterEmpresa');
    if (btnShowRegisterEmpresa) {
        btnShowRegisterEmpresa.addEventListener('click', showRegisterEmpresa);
    }

    const linkShowLoginFromType = document.getElementById('linkShowLoginFromType');
    if (linkShowLoginFromType) {
        linkShowLoginFromType.addEventListener('click', showLogin);
    }

    // Registro do Cliente
    const btnRegisterCliente = document.getElementById('btnRegisterCliente');
    if (btnRegisterCliente) {btnRegisterCliente.addEventListener('click', function() {registerCliente(this);});}

    const btnVoltarCliente = document.getElementById('btnVoltarCliente');
    if (btnVoltarCliente) {btnVoltarCliente.addEventListener('click', showLogin);}

    const linkShowLoginFromCliente = document.getElementById('linkShowLoginFromCliente');
    if (linkShowLoginFromCliente) {
        linkShowLoginFromCliente.addEventListener('click', showLogin);
    }

    const btnLocalizacaoCliente = document.getElementById('btnLocalizacaoCliente');
    if (btnLocalizacaoCliente) {
        btnLocalizacaoCliente.addEventListener('click', function() {
            usarLocalizacao('cliente');
        });
    }

    // Registro Empresa
    const btnRegisterEmpresa = document.getElementById('btnRegisterEmpresa');
    if (btnRegisterEmpresa) {btnRegisterEmpresa.addEventListener('click', function() {registerEmpresa(this);});}

    const btnVoltarEmpresa = document.getElementById('btnVoltarEmpresa');
    if (btnVoltarEmpresa) {btnVoltarEmpresa.addEventListener('click', showLogin);}

    const linkShowLoginFromEmpresa = document.getElementById('linkShowLoginFromEmpresa');
    if (linkShowLoginFromEmpresa) {linkShowLoginFromEmpresa.addEventListener('click', showLogin);}

    const btnLocalizacaoEmpresaResp = document.getElementById('btnLocalizacaoEmpresaResp');
    if (btnLocalizacaoEmpresaResp) {btnLocalizacaoEmpresaResp.addEventListener('click', function() {usarLocalizacao('empresa_responsavel');});}

    const btnLocalizacaoEmpresa = document.getElementById('btnLocalizacaoEmpresa');
    if (btnLocalizacaoEmpresa) {btnLocalizacaoEmpresa.addEventListener('click', function() {usarLocalizacao('empresa');});}

    // Pedidos (orderBox)
    const btnLoadProdutos = document.getElementById('btnLoadProdutos');
    if (btnLoadProdutos) {btnLoadProdutos.addEventListener('click', loadProdutos);}

    const estabelecimentoSelect = document.getElementById('estabelecimentoSelect');
    if (estabelecimentoSelect) {estabelecimentoSelect.addEventListener('change', loadProdutos);}

    const btnCreateOrder = document.getElementById('btnCreateOrder');
    if (btnCreateOrder) {btnCreateOrder.addEventListener('click', createOrder);}

    const btnListOrders = document.getElementById('btnListOrders');
    if (btnListOrders) {btnListOrders.addEventListener('click', listOrders);}

    const btnGetOrderById = document.getElementById('btnGetOrderById');
    if (btnGetOrderById) {btnGetOrderById.addEventListener('click', getOrderById);}

    const btnShowProfile = document.getElementById('btnShowProfile');
    if (btnShowProfile) {btnShowProfile.addEventListener('click', showProfile);}

    const btnLogoutOrderBox = document.getElementById('btnLogoutOrderBox');
    if (btnLogoutOrderBox) {btnLogoutOrderBox.addEventListener('click', logout);}

    // Perfil (profileBox)
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        // Aqui vai ser para fazer o import dio enableEditMode 
        // editProfileBtn.addEventListener('click', enableEditMode);
    }

    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        // saveProfileBtn.addEventListener('click', saveProfile);
    }

    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        // cancelEditBtn.addEventListener('click', cancelEdit);
    }

    const btnBackToOrders = document.getElementById('btnBackToOrders');
    if (btnBackToOrders) {
        btnBackToOrders.addEventListener('click', showOrders);
    }

    const linkLogoutProfile = document.getElementById('linkLogoutProfile');
    if (linkLogoutProfile) {
        linkLogoutProfile.addEventListener('click', logout);
    }

    // Preview da foto no registro de cliente
    const regFotoInput = document.getElementById("regFoto");
    const avatarPreview = document.getElementById("avatarPreview");

    if (regFotoInput) {
        regFotoInput.addEventListener("change", () => {
            const file = regFotoInput.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                log("Selecione apenas imagens.");
                regFotoInput.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = () => { avatarPreview.src = reader.result; };
            reader.readAsDataURL(file);
        });
    }
}

// Quando o DOM estiver carregado, configuramos os event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    // Se já tiver o token, mostra a tela de pedidos
    if (localStorage.getItem("token")) {showOrders();}
});

// Log para debug
console.log("main.js carregado");