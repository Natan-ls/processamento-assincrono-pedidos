// utils.js -> Funções e constantes compartilhadas

import { apiRequest, authHeadersJson } from "./api.js";
import { logout } from "./auth.js";
/* ======== LOG e Helpers ======== */
export function log(msg) {
    const output = document.getElementById("output");
    if (!output) {
        console.warn("Elemento #output não encontrado.");
        return;
    }
    output.textContent = msg;
    output.style.display = "block";
}

export function clearFields(...fields) {
    fields.forEach(field => field && (field.value = ""));
}

export function disableButton(btn, loadingText = "Aguarde...") {
    if (!btn) return;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
}

export function enableButton(btn) {
    if (!btn) return;
    btn.textContent = btn.dataset.originalText || "Enviar";
    btn.disabled = false;
}

export function formatPhone(phone) { return phone.replace(/\D/g, ""); }
export function isEmpty(value) { return !value || value.trim() === ""; }
export function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// CPF
export function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let remainder = 11 - (sum % 11);
    let digit1 = remainder >= 10 ? 0 : remainder;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    remainder = 11 - (sum % 11);
    let digit2 = remainder >= 10 ? 0 : remainder;

    return digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10));
}

// Taxa de entrega
export function formatarTaxaEntrega(valor) {
    return valor === 0 ? "Grátis" : `R$ ${valor.toFixed(2)}`;
}

/* ======== MENU PERFIL ======== */

// Retorna elementos do menu do perfil
export function getMenuElements() {
    return {
        perfilIcon: document.getElementById("perfilIcon"),
        menuPerfil: document.getElementById("menuPerfil"),
        btnPerfil: document.getElementById("btnPerfil"),
        btnPagamento: document.getElementById("btnPagamento"),
        btnPedidos: document.getElementById("btnPedidos"),
        btnVip: document.getElementById("btnVip"),
        btnLogout: document.getElementById("btnLogout"),
    };
}

// Alterna menu do perfil
export function toggleMenuPerfil(menuPerfil) {
    if (menuPerfil) menuPerfil.classList.toggle("hidden");
}

// Fecha menu ao clicar fora
export function setupFecharMenuFora(menuPerfil, perfilIcon) {
    document.addEventListener("click", event => {
        if (menuPerfil && perfilIcon &&
            !perfilIcon.contains(event.target) &&
            !menuPerfil.contains(event.target)) {
            menuPerfil.classList.add("hidden");
        }
    });
}

// Configura eventos do menu
export function setupMenuEventos(elements) {
    const { perfilIcon, menuPerfil, btnPerfil, btnPagamento, btnPedidos, btnVip, btnLogout } = elements;

    perfilIcon?.addEventListener("click", () => toggleMenuPerfil(menuPerfil));

    btnPerfil?.addEventListener("click", () => window.location.href = "/client/profile");
    btnPedidos?.addEventListener("click", () => window.location.href = "/client/orders");
    btnPagamento?.addEventListener("click", () => alert("Página de pagamento em desenvolvimento!"));
    btnVip?.addEventListener("click", abrirModalVip);
    btnLogout?.addEventListener("click", logout);
}

/* ======== VIP ======== */

export function abrirModalVip() {
    const escolha = prompt(
        "Escolha o plano VIP:\n\n1 - VIP 1 mês\n2 - VIP 1 ano\n3 - VIP eterno"
    );
    if (!escolha) return;

    let plano = escolha === "1" ? "1_mes" : escolha === "2" ? "1_ano" : escolha === "3" ? "eterno" : null;
    if (!plano) return alert("Opção inválida.");

    virarVip(plano);
}

export async function virarVip(plano) {
    try {
        const res = await apiRequest("/users/vip", {
            method: "POST",
            headers: authHeadersJson(),
            body: JSON.stringify({ plano })
        });

        if (!res.ok) {
            const errorMsg = res.error || res.data?.error || "Erro ao virar VIP";
            return alert(errorMsg);
        }

        alert("🎉 Parabéns! Você agora é VIP!");
        log("Usuário virou VIP");
    } catch (err) {
        console.error(err);
        alert("Erro de conexão ao virar VIP");
    }
}