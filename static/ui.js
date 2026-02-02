// ui.js

// Elementos das telas existentes no index.html
const loginBox = document.getElementById("loginBox");
const registerTypeBox = document.getElementById("registerTypeBox");
const registerClienteBox = document.getElementById("registerClienteBox");
const registerEmpresaBox = document.getElementById("registerEmpresaBox");

// Esconde todas as telas
export function hideAllScreens() {

    if (loginBox) loginBox.classList.add("hidden");
    if (registerTypeBox) registerTypeBox.classList.add("hidden");
    if (registerClienteBox) registerClienteBox.classList.add("hidden");
    if (registerEmpresaBox) registerEmpresaBox.classList.add("hidden");
}

// Mostrar Login
export function showLogin() {
    hideAllScreens();
    if (loginBox) loginBox.classList.remove("hidden");
}

// Mostrar escolha do tipo de registro
export function showRegister() {
    hideAllScreens();
    if (registerTypeBox) registerTypeBox.classList.remove("hidden");
}

// Mostrar registro Cliente
export function showRegisterCliente() {
    hideAllScreens();
    if (registerClienteBox) registerClienteBox.classList.remove("hidden");
}

// Mostrar registro Empresa
export function showRegisterEmpresa() {
    hideAllScreens();
    if (registerEmpresaBox) registerEmpresaBox.classList.remove("hidden");
}
