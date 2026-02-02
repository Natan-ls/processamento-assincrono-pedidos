// utils.js -> Funções De reutilizaveis de log/helpersShared
/* ======== Função PADRÃO de LOG (MSGs) ======== */
export function log(msg) {
    const output = document.getElementById("output");
    if (!output) {
        console.warn("Elemento #output não encontrado.");
        return;
    }
    output.textContent = msg;
    output.style.display = "block";
}

/* ======== Função p/ LIMPAR CAMPOS de um FORM ======== */
export function clearFields(...fields) {
    fields.forEach((field) => {
        if (field) field.value = "";
    });
}

/* ======== Função p/ DESABILITAR Botão durante uma REQUISIÇÃO ======== */
export function disableButton(btn, loadingText = "Aguarde...") {
    if (!btn) return;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
}

/* ======== Função p/ REABILITAR Botão após uma REQUISIÇÃO ======== */
export function enableButton(btn) {
    if (!btn) return;
    btn.textContent = btn.dataset.originalText || "Enviar";
    btn.disabled = false;
}

/* ======== Função p/ FORMATAR um TELEFONE ======== */
export function formatPhone(phone) {
    return phone.replace(/\D/g, "");
}

/* ======== Função p/ VALIDAR se o CAMPO está VAZIO ======== */
export function isEmpty(value) {
    return !value || value.trim() === "";
}

/* ======== Função p/ VALIDAR EMAIL ======== */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/* ======== Função p/ VALIDAR CPF ======== */
export function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let digit1 = remainder >= 10 ? 0 : remainder;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    let digit2 = remainder >= 10 ? 0 : remainder;
    
    return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
}


/*function toggleMenuPerfil() {
    menuPerfil.classList.toggle("hidden");
}*/

// ======== Funct p/ alternar menu do perfil 
export function toggleMenuPerfil() {
    const menu = document.getElementById('menuPerfil');
    if (menu) {menu.classList.toggle('hidden');}
}