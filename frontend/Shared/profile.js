// profile.js -> Funções De /auth/me e update_me
import { apiRequest, authHeadersFormData } from './api.js';
import { log } from './utils.js';

// ======================= Funct auxiliar p pegar os elementos do dom =======================
function getProfileElements() {
    return {
        profileEmail: document.getElementById('profileEmail'),
        profileTelefone: document.getElementById('profileTelefone'),
        profileEstado: document.getElementById('profileEstado'),
        profileCidade: document.getElementById('profileCidade'),
        profileBairro: document.getElementById('profileBairro'),
        profileRua: document.getElementById('profileRua'),
        profileNumero: document.getElementById('profileNumero'),
        profileComplemento: document.getElementById('profileComplemento'),
        profileCep: document.getElementById('profileCep'),
        profileFotoInput: document.getElementById('profileFotoInput'),
        profileAvatar: document.getElementById('profileAvatar'),
        empresaNomeFantasia: document.getElementById('empresaNomeFantasia'),
        empresaCategoria: document.getElementById('empresaCategoria'),
        empresaEstado: document.getElementById('empresaEstado'),
        empresaCidade: document.getElementById('empresaCidade'),
        empresaBairro: document.getElementById('empresaBairro'),
        empresaRua: document.getElementById('empresaRua'),
        empresaNumero: document.getElementById('empresaNumero'),
        empresaComplemento: document.getElementById('empresaComplemento'),
        empresaCep: document.getElementById('empresaCep'),
        empresaLogoInput: document.getElementById('empresaLogoInput'),
        empresaLogoImg: document.getElementById('empresaLogoImg'),
        editProfileBtn: document.getElementById('editProfileBtn'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        cancelEditBtn: document.getElementById('cancelEditBtn')
    };
}

// ======================= Funct p Carregar perfil =======================
export async function loadProfile() {
    try {
        const res = await apiRequest("/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!res.ok) {
            log(res.error || "Erro ao carregar perfil.");
            return;
        }

        const data = res.data;

        // Dados comuns
        const elements = getProfileElements();
        if (elements.profileNome) elements.profileNome.value = data.nome || "";
        if (elements.profileEmail) elements.profileEmail.value = data.email || "";
        if (elements.profileTelefone) elements.profileTelefone.value = data.telefone || "";

        // Endereço
        if (data.endereco) {
            if (elements.profileEstado) elements.profileEstado.value = data.endereco.estado || "";
            if (elements.profileCidade) elements.profileCidade.value = data.endereco.cidade || "";
            if (elements.profileBairro) elements.profileBairro.value = data.endereco.bairro || "";
            if (elements.profileRua) elements.profileRua.value = data.endereco.rua || "";
            if (elements.profileNumero) elements.profileNumero.value = data.endereco.numero || "";
            if (elements.profileComplemento) elements.profileComplemento.value = data.endereco.complemento || "";
            if (elements.profileCep) elements.profileCep.value = data.endereco.cep || "";
        }

        // Foto de perfil
        if (data.url_foto && elements.profileAvatar) {
            elements.profileAvatar.src = `http://localhost:5000${data.url_foto}`;
        }

        // Se for empresa
        if (data.tipo_usuario === "empresa" && data.empresa && elements.empresaNomeFantasia) {
            if (elements.empresaNomeFantasia) elements.empresaNomeFantasia.value = data.empresa.nome_fantasia || "";
            if (elements.empresaCategoria) elements.empresaCategoria.value = data.empresa.categoria || "";
            
            if (data.empresa.endereco_empresa) {
                if (elements.empresaEstado) elements.empresaEstado.value = data.empresa.endereco_empresa.estado || "";
                if (elements.empresaCidade) elements.empresaCidade.value = data.empresa.endereco_empresa.cidade || "";
                if (elements.empresaBairro) elements.empresaBairro.value = data.empresa.endereco_empresa.bairro || "";
                if (elements.empresaRua) elements.empresaRua.value = data.empresa.endereco_empresa.rua || "";
                if (elements.empresaNumero) elements.empresaNumero.value = data.empresa.endereco_empresa.numero || "";
                if (elements.empresaComplemento) elements.empresaComplemento.value = data.empresa.endereco_empresa.complemento || "";
                if (elements.empresaCep) elements.empresaCep.value = data.empresa.endereco_empresa.cep || "";
            }

            if (data.empresa.url_logo && elements.empresaLogoImg) {
                elements.empresaLogoImg.src = `http://localhost:5000${data.empresa.url_logo}`;
            }
        }

        // Desabilitar edição
        disableEdit();

    } catch (err) {
        console.error(err);
        log("Erro ao buscar dados do perfil.");
    }
}

// ======================= Funct p carregar perfil
export async function loadSimpleProfile() {
    const perfilContent = document.getElementById("perfilContent");
    if (!perfilContent) return;

    try {
        const res = await apiRequest("/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!res.ok) {
            perfilContent.innerHTML = `<p class="error">Erro ao carregar perfil: ${res.error || "Erro desconhecido"}</p>`;
            return;
        }

        const data = res.data;

        let html = `
            <form id="profileForm">
                <div class="avatar">
                    <img id="profileAvatar" src="${data.url_foto ? `http://localhost:5000${data.url_foto}` : 'default-avatar.png'}" alt="Foto de perfil">
                    <input type="file" id="profileFotoInput" accept="image/*">
                </div>
                <div class="form-group">
                    <label for="profileNome">Nome</label>
                    <input type="text" id="profileNome" value="${data.nome || ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileEmail">Email</label>
                    <input type="email" id="profileEmail" value="${data.email || ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileTelefone">Telefone</label>
                    <input type="text" id="profileTelefone" value="${data.telefone || ""}" disabled>
                </div>
                <h4>Endereço</h4>
                <div class="form-group">
                    <label for="profileEstado">Estado</label>
                    <input type="text" id="profileEstado" value="${data.endereco ? data.endereco.estado : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileCidade">Cidade</label>
                    <input type="text" id="profileCidade" value="${data.endereco ? data.endereco.cidade : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileBairro">Bairro</label>
                    <input type="text" id="profileBairro" value="${data.endereco ? data.endereco.bairro : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileRua">Rua</label>
                    <input type="text" id="profileRua" value="${data.endereco ? data.endereco.rua : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileNumero">Número</label>
                    <input type="text" id="profileNumero" value="${data.endereco ? data.endereco.numero : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileComplemento">Complemento</label>
                    <input type="text" id="profileComplemento" value="${data.endereco ? data.endereco.complemento : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="profileCep">CEP</label>
                    <input type="text" id="profileCep" value="${data.endereco ? data.endereco.cep : ""}" disabled>
                </div>
        `;

        // Se for empresa, adicionar campos da empresa
        if (data.tipo_usuario === "empresa" && data.empresa) {
            html += `
                <h4>Dados da Empresa</h4>
                <div class="form-group">
                    <label for="empresaNomeFantasia">Nome Fantasia</label>
                    <input type="text" id="empresaNomeFantasia" value="${data.empresa.nome_fantasia || ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaCategoria">Categoria</label>
                    <input type="text" id="empresaCategoria" value="${data.empresa.categoria || ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaLogo">Logo</label>
                    <img id="empresaLogoImg" src="${data.empresa.url_logo ? `http://localhost:5000${data.empresa.url_logo}` : 'default-logo.png'}" alt="Logo da empresa" style="max-width:100px; display:block;">
                    <input type="file" id="empresaLogoInput" accept="image/*">
                </div>
                <h5>Endereço da Empresa</h5>
                <div class="form-group">
                    <label for="empresaEstado">Estado</label>
                    <input type="text" id="empresaEstado" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.estado : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaCidade">Cidade</label>
                    <input type="text" id="empresaCidade" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.cidade : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaBairro">Bairro</label>
                    <input type="text" id="empresaBairro" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.bairro : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaRua">Rua</label>
                    <input type="text" id="empresaRua" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.rua : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaNumero">Número</label>
                    <input type="text" id="empresaNumero" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.numero : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaComplemento">Complemento</label>
                    <input type="text" id="empresaComplemento" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.complemento : ""}" disabled>
                </div>
                <div class="form-group">
                    <label for="empresaCep">CEP</label>
                    <input type="text" id="empresaCep" value="${data.empresa.endereco_empresa ? data.empresa.endereco_empresa.cep : ""}" disabled>
                </div>
            `;
        }

        html += `
                <div class="button-group">
                    <button type="button" onclick="window.enableEditMode()" id="editProfileBtn">Editar</button>
                    <button type="button" onclick="window.saveProfile()" id="saveProfileBtn" style="display:none;">Salvar</button>
                    <button type="button" onclick="window.cancelEdit()" id="cancelEditBtn" style="display:none;">Cancelar</button>
                </div>
            </form>
        `;

        perfilContent.innerHTML = html;

        // Agora, adicionamos os event listeners para as imagens (preview)
        const profileFotoInput = document.getElementById('profileFotoInput');
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileFotoInput && profileAvatar) {
            profileFotoInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        profileAvatar.src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }

        const empresaLogoInput = document.getElementById('empresaLogoInput');
        const empresaLogoImg = document.getElementById('empresaLogoImg');
        if (empresaLogoInput && empresaLogoImg) {
            empresaLogoInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        empresaLogoImg.src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                }
            });
        }

    } catch (err) {
        console.error(err);
        perfilContent.innerHTML = `<p class="error">Erro ao carregar perfil. Tente novamente mais tarde.</p>`;
    }
}

// ======================= Funct p Habilitar o modo de edição =======================
export function enableEditMode() {
    const elements = getProfileElements();
    
    const campos = [
        elements.profileEmail, elements.profileTelefone, elements.profileEstado, elements.profileCidade,
        elements.profileBairro, elements.profileRua, elements.profileNumero, elements.profileComplemento, elements.profileCep
    ];
    
    campos.forEach(campo => {
        if (campo) {
            campo.disabled = false;
            campo.classList.add("editable");
        }
    });

    // Verificar se é empresa (se existem campos de empresa)
    if (elements.empresaNomeFantasia) {
        const camposEmpresa = [
            elements.empresaNomeFantasia, elements.empresaCategoria, elements.empresaEstado,
            elements.empresaCidade, elements.empresaBairro, elements.empresaRua, elements.empresaNumero,
            elements.empresaComplemento, elements.empresaCep
        ];
        
        camposEmpresa.forEach(campo => {
            if (campo) {
                campo.disabled = false;
                campo.classList.add("editable");
            }
        });
    }

    if (elements.editProfileBtn) elements.editProfileBtn.style.display = 'none';
    if (elements.saveProfileBtn) elements.saveProfileBtn.style.display = 'inline-block';
    if (elements.cancelEditBtn) elements.cancelEditBtn.style.display = 'inline-block';
}

// ======================= Funct p Desabilitar o modo de edição
function disableEdit() {
    const elements = getProfileElements();
    
    const campos = [
        elements.profileEmail, elements.profileTelefone, elements.profileEstado, elements.profileCidade,
        elements.profileBairro, elements.profileRua, elements.profileNumero, elements.profileComplemento, elements.profileCep,
        elements.empresaNomeFantasia, elements.empresaCategoria, elements.empresaEstado, elements.empresaCidade,
        elements.empresaBairro, elements.empresaRua, elements.empresaNumero, elements.empresaComplemento, elements.empresaCep
    ];
    
    campos.forEach(campo => {
        if (campo) {
            campo.disabled = true;
            campo.classList.remove("editable");
        }
    });

    if (elements.editProfileBtn) elements.editProfileBtn.style.display = 'inline-block';
    if (elements.saveProfileBtn) elements.saveProfileBtn.style.display = 'none';
    if (elements.cancelEditBtn) elements.cancelEditBtn.style.display = 'none';
}

// ======================= Funct p Cancelar edição
export function cancelEdit() {
    if (document.getElementById("perfilContent")) {
        loadSimpleProfile();
    } else {
        loadProfile();
    }
}

// ======================= Funct p Salvar o perfil
export async function saveProfile() {
    const elements = getProfileElements();
    
    const formData = new FormData();

    // Campos da pessoa
    if (elements.profileEmail) formData.append("email", elements.profileEmail.value);
    if (elements.profileTelefone) formData.append("telefone", elements.profileTelefone.value);
    if (elements.profileEstado) formData.append("estado", elements.profileEstado.value);
    if (elements.profileCidade) formData.append("cidade", elements.profileCidade.value);
    if (elements.profileBairro) formData.append("bairro", elements.profileBairro.value);
    if (elements.profileRua) formData.append("rua", elements.profileRua.value);
    if (elements.profileNumero) formData.append("numero", elements.profileNumero.value);
    if (elements.profileComplemento) formData.append("complemento", elements.profileComplemento.value);
    if (elements.profileCep) formData.append("cep", elements.profileCep.value);

    if (elements.profileFotoInput && elements.profileFotoInput.files[0]) {
        formData.append("foto", elements.profileFotoInput.files[0]);
    }

    // Se for empresa (verifica se existe o campo empresaNomeFantasia)
    if (elements.empresaNomeFantasia) {
        if (elements.empresaNomeFantasia) formData.append("nome_fantasia", elements.empresaNomeFantasia.value);
        if (elements.empresaCategoria) formData.append("categoria", elements.empresaCategoria.value);
        if (elements.empresaEstado) formData.append("emp_estado", elements.empresaEstado.value);
        if (elements.empresaCidade) formData.append("emp_cidade", elements.empresaCidade.value);
        if (elements.empresaBairro) formData.append("emp_bairro", elements.empresaBairro.value);
        if (elements.empresaRua) formData.append("emp_rua", elements.empresaRua.value);
        if (elements.empresaNumero) formData.append("emp_numero", elements.empresaNumero.value);
        if (elements.empresaComplemento) formData.append("emp_complemento", elements.empresaComplemento.value);
        if (elements.empresaCep) formData.append("emp_cep", elements.empresaCep.value);

        if (elements.empresaLogoInput && elements.empresaLogoInput.files[0]) {
            formData.append("logo", elements.empresaLogoInput.files[0]);
        }
    }

    try {
        const res = await apiRequest("/auth/me", {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: formData
        });

        if (!res.ok) {
            log(res.error || "Erro ao atualizar perfil.");
            return;
        }

        log("Perfil atualizado com sucesso!");
        // se estiver na página profile.html, recarrega o form
        if (document.getElementById("perfilContent")) {loadSimpleProfile();} else {loadProfile();}
 
    } catch (error) {
        console.error(error);
        log("Erro de conexão com o servidor.");
    }
}