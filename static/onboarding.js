import { apiRequest, authHeadersJson } from "./api.js";
import { log, inicializarTopoEmpresa } from "./utils.js";

const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const horariosContainer = document.getElementById("horariosContainer");
const btnSalvar = document.getElementById("btnContinuarStep1");

/* ====================================================== HORÁRIOS ====================================================== */
function renderHorarios() {
    horariosContainer.innerHTML = "";

    dias.forEach((dia, index) => {
        const row = document.createElement("div");
        row.classList.add("linha-horario");

        row.innerHTML = `
            <div class="dia-checkbox">
                <input type="checkbox" id="ativo-${index}">
                <span>${dia}</span>
            </div>

            <div class="hora-group">
                <label>Abertura</label>
                <input type="time" id="inicio-${index}" disabled>
            </div>

            <div class="hora-group">
                <label>Fechamento</label>
                <input type="time" id="fim-${index}" disabled>
            </div>
        `;

        horariosContainer.appendChild(row);

        const checkbox = document.getElementById(`ativo-${index}`);
        const inicio = document.getElementById(`inicio-${index}`);
        const fim = document.getElementById(`fim-${index}`);

        checkbox.addEventListener("change", () => {
            const ativo = checkbox.checked;
            inicio.disabled = !ativo;
            fim.disabled = !ativo;

            if (!ativo) {
                inicio.value = "";
                fim.value = "";
            }
        });
    });
}

/* ======================================================
   SALVAR CONFIGURAÇÕES
====================================================== */
async function salvarConfiguracoesEmpresa() {
    const taxa = parseInt(document.getElementById("taxaEntrega").value);

    if (isNaN(taxa) || taxa < 0) {
        log("Informe uma taxa válida.");
        return;
    }

    const horarios = [];
    let possuiDiaAtivo = false;

    dias.forEach((_, i) => {
        const ativo = document.getElementById(`ativo-${i}`).checked;
        const inicio = document.getElementById(`inicio-${i}`).value;
        const fim = document.getElementById(`fim-${i}`).value;

        if (ativo) {
            possuiDiaAtivo = true;

            if (!inicio || !fim) {
                throw new Error("Preencha os horários dos dias ativos.");
            }

            horarios.push({
                dia_semana: i,
                ativo: true,
                hora_inicio: inicio,
                hora_fim: fim
            });
        }
    });

    if (!possuiDiaAtivo) {
        log("Marque pelo menos um dia de funcionamento.");
        return;
    }

    // Salvar taxa
    const resConfig = await apiRequest("/estabelecimentos/configuracao", {
        method: "PUT",
        headers: authHeadersJson(),
        body: JSON.stringify({ taxa_entrega: taxa })
    });

    if (!resConfig.ok) {
        log("Erro ao salvar taxa.");
        return;
    }

    // Salvar horários
    const resHorarios = await apiRequest("/empresa/horarios", {
        method: "POST",
        headers: authHeadersJson(),
        body: JSON.stringify(horarios)
    });

    if (!resHorarios.ok) {
        log("Erro ao salvar horários.");
        return;
    }

    // Marcar empresa como configurada
    await apiRequest("/estabelecimentos/configuracao", {
        method: "PUT",
        headers: authHeadersJson(),
        body: JSON.stringify({ configurado: true })
    });

    log("Configuração salva com sucesso!");

    // Redireciona para dashboard ou produtos
    window.location.href = "/company/dashboard";
}

/* ======================================================
   INIT
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
    inicializarTopoEmpresa({
        rotaUpdateDados: "/company/onboarding",
        rotaDashboard: "/company/dashboard",
        rotaProdutos: "/company/produtos"
    });

    renderHorarios();

    btnSalvar.addEventListener("click", salvarConfiguracoesEmpresa);
});