import { apiRequest, authHeadersJson, authHeadersFormData } from "./api.js";
import { log } from "./utils.js";

let currentStep = 1;

// ================== CONTROLE DE STEPS ==================
function showStep(step) {
    document.querySelectorAll(".step-content").forEach(el => el.classList.add("hidden"));
    document.getElementById(`step-${step}`).classList.remove("hidden");

    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.querySelector(`.step[data-step="${step}"]`).classList.add("active");

    currentStep = step;
}

window.nextStep = () => showStep(currentStep + 1);
window.prevStep = () => showStep(currentStep - 1);

// ================== STEP 1 – TAXA ENTREGA ==================
async function saveTaxaEntrega() {
    const taxa = document.getElementById("taxaEntrega").value;

    if (!taxa) {
        log("Informe a taxa de entrega.");
        return false;
    }

    const res = await apiRequest("/empresa/configuracao", {
        method: "PUT",
        headers: authHeadersJson(),
        body: JSON.stringify({ taxa_entrega: taxa })
    });

    return res.ok;
}

window.nextStep = async () => {
    if (currentStep === 1) {
        const ok = await saveTaxaEntrega();
        if (!ok) return;
    }
    showStep(currentStep + 1);
};

// ================== STEP 2 – HORÁRIOS ==================
const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const horariosContainer = document.getElementById("horariosContainer");

dias.forEach((dia, index) => {
    horariosContainer.innerHTML += `
        <div>
            <strong>${dia}</strong>
            <input type="time" id="inicio-${index}">
            <input type="time" id="fim-${index}">
        </div>
    `;
});

window.saveHorarios = async () => {
    const horarios = [];

    dias.forEach((_, i) => {
        const inicio = document.getElementById(`inicio-${i}`).value;
        const fim = document.getElementById(`fim-${i}`).value;

        if (inicio && fim) {
            horarios.push({
                dia_semana: i,
                hora_inicio: inicio,
                hora_fim: fim
            });
        }
    });

    if (!horarios.length) {
        log("Informe pelo menos um horário.");
        return;
    }

    const res = await apiRequest("/empresa/horarios", {
        method: "POST",
        headers: authHeadersJson(),
        body: JSON.stringify(horarios)
    });

    if (res.ok) nextStep();
};

// ================== STEP 3 – PRODUTOS ==================
window.addProduto = async () => {
    const form = new FormData();
    form.append("nome", produtoNome.value);
    form.append("descricao", produtoDescricao.value);
    form.append("preco_unidade", produtoPreco.value);
    form.append("quantidade_estoque", produtoEstoque.value);
    form.append("imagem", produtoImagem.files[0]);

    const res = await apiRequest("/empresa/produtos", {
        method: "POST",
        headers: authHeadersFormData(),
        body: form
    });

    if (res.ok) {
        listaProdutos.innerHTML += `<li>${produtoNome.value}</li>`;
        produtoNome.value = "";
        produtoDescricao.value = "";
        produtoPreco.value = "";
        produtoEstoque.value = "";
        produtoImagem.value = "";
    }
};

// ================== STEP 4 – FINALIZAÇÃO ==================
window.finalizarOnboarding = async () => {
    const res = await apiRequest("/empresa/configuracao", {
        method: "PUT",
        headers: authHeadersJson(),
        body: JSON.stringify({ configurado: true })
    });

    if (res.ok) {
        window.location.href = "/company/dashboard";
    }
};
