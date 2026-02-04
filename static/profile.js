import { apiRequest, API_URL, authHeadersFormData } from '/static/api.js';
import { logout } from './auth.js';
import { log, toggleMenuPerfil, formatarTaxaEntrega, getMenuElements, setupMenuEventos, setupFecharMenuFora, abrirModalVip } from "./utils.js";

/* ================= DOM ================= */
const perfilIcon = document.getElementById('perfilIcon');
const menuPerfil = document.getElementById('menuPerfil');
const btnVoltarHome = document.getElementById('btnVoltarHome');

const btnInicio = document.getElementById('btnInicio');
const btnPedidos = document.getElementById('btnPedidos');
const btnLogout = document.getElementById('btnLogout');

const btnAlterarFoto = document.getElementById('btnAlterarFoto');
const profileFotoInput = document.getElementById('profileFotoInput');
const profileAvatar = document.getElementById('profileAvatar');

const editBtn = document.getElementById('editProfileBtn');
const saveBtn = document.getElementById('saveProfileBtn');
const cancelBtn = document.getElementById('cancelEditBtn');

/* ===== Dados pessoais ===== */
const profileNome = document.getElementById('profileNome');
const profileEmail = document.getElementById('profileEmail');
const profileTelefone = document.getElementById('profileTelefone');
const profileCpf = document.getElementById('profileCpf');

/* ===== Endereço ===== */
const endRua = document.getElementById('endRua');
const endNumero = document.getElementById('endNumero');
const endBairro = document.getElementById('endBairro');
const endCidade = document.getElementById('endCidade');
const endEstado = document.getElementById('endEstado');
const endCep = document.getElementById('endCep');

/* ================= MODAL ================= */
const modalMensagem = document.getElementById("modalMensagem");
const modalMensagemTitulo = document.getElementById("modalMensagemTitulo");
const modalMensagemTexto = document.getElementById("modalMensagemTexto");
const btnCancelarMensagem = document.getElementById("btnCancelarMensagem");
const btnConfirmarMensagem = document.getElementById("btnConfirmarMensagem");
const fecharModalMensagem = document.getElementById("fecharModalMensagem");

function abrirModalMensagem(titulo, mensagem) {
    return new Promise((resolve) => {
        modalMensagemTitulo.textContent = titulo;
        modalMensagemTexto.textContent = mensagem;
        modalMensagem.classList.remove("hidden");

        function fechar() {
            modalMensagem.classList.add("hidden");
            btnConfirmarMensagem.removeEventListener("click", fechar);
            btnCancelarMensagem.removeEventListener("click", fechar);
            fecharModalMensagem.removeEventListener("click", fechar);
            resolve();
        }

        btnConfirmarMensagem.addEventListener("click", fechar);
        btnCancelarMensagem.addEventListener("click", fechar);
        fecharModalMensagem.addEventListener("click", fechar);
    });
}

/* ================= MENU DO PERFIL ===================== */
document.addEventListener('DOMContentLoaded', () => {
    // Pega elementos do menu do utils
    const menuElements = getMenuElements();

    // Configura os eventos do menu
    setupMenuEventos(menuElements, { abrirModalVip, logout });

    // Fecha menu ao clicar fora
    setupFecharMenuFora(menuElements.menuPerfil, menuElements.perfilIcon);

    // Carrega o perfil
    loadProfile();
});

/* ================= NAVEGAÇÃO ================= */
btnInicio.addEventListener('click', () => location.href = '/client/home');
btnPedidos.addEventListener('click', () => location.href = '/client/orders');
btnLogout.addEventListener('click', logout);
saveBtn.addEventListener('click', salvarPerfil);
/*btnVoltarHome.addEventListener('click', () => {
    window.location.href = '/client/home';
});*/
//Além de Voltar home volta p page anterios
btnVoltarHome.addEventListener('click', () => {
    window.history.back();
});

/* ================= FOTO ================= */
btnAlterarFoto.addEventListener('click', () => profileFotoInput.click());

profileFotoInput.addEventListener('change', () => {
    const file = profileFotoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => profileAvatar.src = e.target.result;
    reader.readAsDataURL(file);
});

/* ================= SALVAR ================= */
async function salvarPerfil() {
    const token = localStorage.getItem('token');
    if (!token) return logout();

    const formData = new FormData();
    formData.append("email", profileEmail.value.trim());
    formData.append("telefone", profileTelefone.value.trim());

    formData.append("rua", endRua.value.trim());
    formData.append("numero", endNumero.value.trim());
    formData.append("bairro", endBairro.value.trim());
    formData.append("cidade", endCidade.value.trim());
    formData.append("estado", endEstado.value.trim());
    formData.append("cep", endCep.value.trim());

    const res = await apiRequest('/auth/me', {
        method: 'PUT',
        headers: authHeadersFormData(),
        body: formData
    });

    if (!res.ok) {
        return abrirModalMensagem("Erro ❌", res.error || "Erro ao salvar");
    }

    await abrirModalMensagem("Perfil atualizado ✅", "Dados salvos com sucesso.");
    disableEdit();
    loadProfile();
}

/* ================= EDIÇÃO ================= */
function enableEdit() {
    profileEmail.disabled = false;
    profileTelefone.disabled = false;

    endRua.disabled = false;
    endNumero.disabled = false;
    endBairro.disabled = false;
    endCidade.disabled = false;
    endEstado.disabled = false;
    endCep.disabled = false;

    editBtn.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
}

function disableEdit() {
    profileNome.disabled = true;
    profileCpf.disabled = true;
    profileEmail.disabled = true;
    profileTelefone.disabled = true;

    endRua.disabled = true;
    endNumero.disabled = true;
    endBairro.disabled = true;
    endCidade.disabled = true;
    endEstado.disabled = true;
    endCep.disabled = true;

    editBtn.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
}

editBtn.addEventListener('click', enableEdit);
cancelBtn.addEventListener('click', disableEdit);

/* ================= LOAD ================= */
async function loadProfile() {
    const res = await apiRequest('/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res.ok) return logout();

    const data = res.data;

    profileNome.value = data.nome || '';
    profileEmail.value = data.email || '';
    profileTelefone.value = data.telefone || '';
    profileCpf.value = data.cpf || '';

    if (data.endereco) {
        endRua.value = data.endereco.rua || '';
        endNumero.value = data.endereco.numero || '';
        endBairro.value = data.endereco.bairro || '';
        endCidade.value = data.endereco.cidade || '';
        endEstado.value = data.endereco.estado || '';
        endCep.value = data.endereco.cep || '';
    }

    if (data.url_foto) {
        profileAvatar.src = `${API_URL}${data.url_foto}`;
    }

    disableEdit();
}

document.addEventListener('DOMContentLoaded', loadProfile);
