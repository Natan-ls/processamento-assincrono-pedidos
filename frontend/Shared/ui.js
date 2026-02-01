import { log } from './utils.js';

// Elementos das telas
const loginBox = document.getElementById("loginBox");
const registerTypeBox = document.getElementById("registerTypeBox");
const registerClienteBox = document.getElementById("registerClienteBox");
const registerEmpresaBox = document.getElementById("registerEmpresaBox");
const orderBox = document.getElementById("orderBox");
const profileBox = document.getElementById("profileBox");

// Esconde todas as telas 
export function hideAllScreens() {
    loginBox.classList.add("hidden");
    registerTypeBox.classList.add("hidden");
    registerClienteBox.classList.add("hidden");
    registerEmpresaBox.classList.add("hidden");
    orderBox.classList.add("hidden");
    profileBox.classList.add("hidden");
}

// Mostra Tela De Login
export function showLogin() {
    hideAllScreens();
    loginBox.classList.remove("hidden");
}

// Mostra Tela De Escolha do Tipo De Registro
export function showRegister() {
    hideAllScreens();
    registerTypeBox.classList.remove("hidden");
}

// Tela De Registro de Cliente
export function showRegisterCliente() {
    hideAllScreens();
    registerClienteBox.classList.remove("hidden");
}

// Tela de registro de Empresa
export function showRegisterEmpresa() {
    hideAllScreens();
    registerEmpresaBox.classList.remove("hidden");
}

// Mostra Tela De Pedidos
export function showOrders() {
    hideAllScreens();
    orderBox.classList.remove("hidden");
}

// Mostra Tela do Perfil
export function showProfile() {
    hideAllScreens();
    profileBox.classList.remove("hidden");
}