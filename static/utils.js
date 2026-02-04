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
    btnVip?.addEventListener("click", async () => {
        try {
            const res = await apiRequest("/auth/me", {
                method: "GET",
                headers: authHeadersJson()
            });

            if (res.ok && res.data?.is_vip) {
                abrirModalVipAtivo(res.data?.vip_until);
                return;
            }


            abrirModalVip();
        } catch {
            abrirModalVip();
        }
    });

    btnLogout?.addEventListener("click", logout);
}

/* ======== VIP ======== */

export function abrirModalVip() {
    let modal = document.getElementById("modalVip");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalVip";
        modal.className = "modal";

        modal.innerHTML = `
            <div class="modal-conteudo vip-modal">
                <div class="modal-header">
                    <h3>⭐ Escolha seu plano VIP</h3>
                    <button class="fechar-modal" id="fecharVip">&times;</button>
                </div>

                <div class="modal-body vip-planos">

                    <div class="vip-card" data-plano="1_mes">
                        <h4>VIP 1 Mês</h4>
                        <p class="vip-preco">R$ 30,00</p>
                        <span class="vip-desc">Acesso VIP por 30 dias</span>
                        <button class="vip-btn">Escolher</button>
                    </div>

                    <div class="vip-card destaque" data-plano="1_ano">
                        <div class="vip-badge">Mais popular</div>
                        <h4>VIP 1 Ano</h4>
                        <p class="vip-preco">R$ 300,00</p>
                        <span class="vip-desc">Economize 2 meses</span>
                        <button class="vip-btn">Escolher</button>
                    </div>

                    <div class="vip-card" data-plano="eterno">
                        <h4>VIP Eterno</h4>
                        <p class="vip-preco">R$ 990,00</p>
                        <span class="vip-desc">Pagamento único</span>
                        <button class="vip-btn">Escolher</button>
                    </div>

                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#fecharVip").onclick = () =>
            modal.classList.add("hidden");

        modal.querySelectorAll(".vip-card").forEach(card => {
            card.querySelector(".vip-btn").onclick = () => {
                const plano = card.dataset.plano;
                modal.classList.add("hidden");
                virarVip(plano);
            };
        });
    }

    modal.classList.remove("hidden");
}

export function abrirModalVipAtivo(vipUntil = null) {
    let modal = document.getElementById("modalVipAtivo");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalVipAtivo";
        modal.className = "modal";

        modal.innerHTML = `
            <div class="modal-conteudo vip-modal ativo">
                <div class="modal-header">
                    <h3>⭐ VIP Ativo</h3>
                    <button class="fechar-modal" id="fecharVipAtivo">&times;</button>
                </div>

                <div class="modal-body vip-ativo-body">
                    <div class="vip-icone">👑</div>

                    <p class="vip-msg">
                        Você faz parte do <strong>Clube VIP</strong> 🎉
                    </p>

                    <ul class="vip-beneficios">
                        <li>✔ Descontos exclusivos</li>
                        <li>✔ Promoções antecipadas</li>
                        <li>✔ Prioridade nos pedidos</li>
                    </ul>

                    <p class="vip-validade">
                        ${vipUntil
                ? `Válido até <strong>${formatarDataVip(vipUntil)}</strong>`
                : "VIP sem data de expiração"
            }
                    </p>

                    <button class="vip-btn fechar">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#fecharVipAtivo").onclick =
            modal.querySelector(".vip-btn.fechar").onclick =
            () => modal.classList.add("hidden");
    }

    modal.classList.remove("hidden");
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

        abrirModalVipAtivo(res.data?.vip_until);
        log("Usuário virou VIP");

    } catch (err) {
        console.error(err);
        alert("Erro de conexão ao virar VIP");
    }
}

export function formatarDataVip(data) {
    if (!data) return null;

    // força leitura correta sem timezone bug
    const [ano, mes, dia] = data.split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
}
