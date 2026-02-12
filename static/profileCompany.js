import { apiRequest, API_URL, authHeadersFormData } from "./api.js";
import { logout, toggleMenuPerfil } from "./utils.js";

/* ================= DOM ================= */
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

const btnAlterarLogo = document.getElementById("btnAlterarLogo");
const companyLogoInput = document.getElementById("companyLogoInput");
const companyLogo = document.getElementById("companyLogo");

/* Empresa */
const nomeFantasia = document.getElementById("nomeFantasia");
const razaoSocial = document.getElementById("razaoSocial");
const cnpj = document.getElementById("cnpj");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");

/* Responsável */
const responsavelNome = document.getElementById("responsavelNome");
const responsavelCpf = document.getElementById("responsavelCpf");

/* Endereço */
const endRua = document.getElementById("endRua");
const endNumero = document.getElementById("endNumero");
const endBairro = document.getElementById("endBairro");
const endCidade = document.getElementById("endCidade");
const endEstado = document.getElementById("endEstado");
const endCep = document.getElementById("endCep");

/* ================= FOTO ================= */
btnAlterarLogo.addEventListener("click", () => companyLogoInput.click());

companyLogoInput.addEventListener("change", () => {
    const file = companyLogoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => companyLogo.src = e.target.result;
    reader.readAsDataURL(file);
});

/* ================= EDIT ================= */
function enableEdit() {
    nomeFantasia.disabled = false;
    razaoSocial.disabled = false;
    email.disabled = false;
    telefone.disabled = false;

    endRua.disabled = false;
    endNumero.disabled = false;
    endBairro.disabled = false;
    endCidade.disabled = false;
    endEstado.disabled = false;
    endCep.disabled = false;

    editBtn.classList.add("hidden");
    saveBtn.classList.remove("hidden");
    cancelBtn.classList.remove("hidden");
}

function disableEdit() {
    document
        .querySelectorAll("input")
        .forEach(i => i.disabled = true);

    editBtn.classList.remove("hidden");
    saveBtn.classList.add("hidden");
    cancelBtn.classList.add("hidden");
}

editBtn.addEventListener("click", enableEdit);
cancelBtn.addEventListener("click", disableEdit);

/* ================= SALVAR ================= */
saveBtn.addEventListener("click", async () => {
    const formData = new FormData();

    formData.append("nome_fantasia", nomeFantasia.value);
    formData.append("razao_social", razaoSocial.value);
    formData.append("email", email.value);
    formData.append("telefone", telefone.value);

    formData.append("rua", endRua.value);
    formData.append("numero", endNumero.value);
    formData.append("bairro", endBairro.value);
    formData.append("cidade", endCidade.value);
    formData.append("estado", endEstado.value);
    formData.append("cep", endCep.value);

    if (companyLogoInput.files[0]) {
        formData.append("logo", companyLogoInput.files[0]);
    }

    const res = await apiRequest("/auth/me/company", {
        method: "PUT",
        headers: authHeadersFormData(),
        body: formData
    });

    if (!res.ok) {
        alert(res.error || "Erro ao salvar perfil");
        return;
    }

    disableEdit();
    loadProfile();
});

/* ================= LOAD ================= */
async function loadProfile() {
    const res = await apiRequest("/auth/me/company");

    if (!res.ok) return logout();

    const d = res.data;

    nomeFantasia.value = d.nome_fantasia || "";
    razaoSocial.value = d.razao_social || "";
    cnpj.value = d.cnpj || "";

    email.value = d.email || "";
    telefone.value = d.telefone || "";

    responsavelNome.value = d.responsavel?.nome || "";
    responsavelCpf.value = d.responsavel?.cpf || "";

    if (d.endereco) {
        endRua.value = d.endereco.rua || "";
        endNumero.value = d.endereco.numero || "";
        endBairro.value = d.endereco.bairro || "";
        endCidade.value = d.endereco.cidade || "";
        endEstado.value = d.endereco.estado || "";
        endCep.value = d.endereco.cep || "";
    }

    if (d.url_logo) {
        companyLogo.src = `${API_URL}${d.url_logo}`;
    }

    disableEdit();
}

document.addEventListener("DOMContentLoaded", loadProfile);
