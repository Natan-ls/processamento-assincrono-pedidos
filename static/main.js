import { login } from "./auth.js";

import {
    showLogin,
    showRegister,
    showRegisterCliente,
    showRegisterEmpresa
} from "./ui.js";

import { usarLocalizacao } from "./locations.js";
import { registerCliente, registerEmpresa } from "./register.js";

// Configurar listeners
function setupEventListeners() {

    // LOGIN
    const btnLogin = document.getElementById("btnLogin");
    if (btnLogin) {
        btnLogin.addEventListener("click", function () {
            login(this);
        });
    }

    const linkShowRegister = document.getElementById("linkShowRegister");
    if (linkShowRegister) {
        linkShowRegister.addEventListener("click", showRegister);
    }

    // ESCOLHA DE TIPO
    const btnShowRegisterCliente = document.getElementById("btnShowRegisterCliente");
    if (btnShowRegisterCliente) {
        btnShowRegisterCliente.addEventListener("click", showRegisterCliente);
    }

    const btnShowRegisterEmpresa = document.getElementById("btnShowRegisterEmpresa");
    if (btnShowRegisterEmpresa) {
        btnShowRegisterEmpresa.addEventListener("click", showRegisterEmpresa);
    }

    const linkShowLoginFromType = document.getElementById("linkShowLoginFromType");
    if (linkShowLoginFromType) {
        linkShowLoginFromType.addEventListener("click", showLogin);
    }

    // REGISTRO CLIENTE
    const btnRegisterCliente = document.getElementById("btnRegisterCliente");
    if (btnRegisterCliente) {
        btnRegisterCliente.addEventListener("click", function () {
            registerCliente(this);
        });
    }

    const btnVoltarCliente = document.getElementById("btnVoltarCliente");
    if (btnVoltarCliente) {
        btnVoltarCliente.addEventListener("click", showLogin);
    }

    const btnLocalizacaoCliente = document.getElementById("btnLocalizacaoCliente");
    if (btnLocalizacaoCliente) {
        btnLocalizacaoCliente.addEventListener("click", function () {
            usarLocalizacao("cliente");
        });
    }

    // REGISTRO EMPRESA
    const btnRegisterEmpresa = document.getElementById("btnRegisterEmpresa");
    if (btnRegisterEmpresa) {
        btnRegisterEmpresa.addEventListener("click", function () {
            registerEmpresa(this);
        });
    }

    const btnVoltarEmpresa = document.getElementById("btnVoltarEmpresa");
    if (btnVoltarEmpresa) {
        btnVoltarEmpresa.addEventListener("click", showLogin);
    }

    const btnLocalizacaoEmpresaResp = document.getElementById("btnLocalizacaoEmpresaResp");
    if (btnLocalizacaoEmpresaResp) {
        btnLocalizacaoEmpresaResp.addEventListener("click", function () {
            usarLocalizacao("empresa_responsavel");
        });
    }

    const btnLocalizacaoEmpresa = document.getElementById("btnLocalizacaoEmpresa");
    if (btnLocalizacaoEmpresa) {
        btnLocalizacaoEmpresa.addEventListener("click", function () {
            usarLocalizacao("empresa");
        });
    }
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    showLogin();
});

console.log("main.js carregado corretamente");
