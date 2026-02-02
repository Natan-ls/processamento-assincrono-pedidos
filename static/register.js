// register.js -> Funções De Registro De Cliente/Empresa

import { apiRequest } from './api.js';
import { disableButton, enableButton, log, isValidEmail } from './utils.js';
import { isStrongPassword, isValidCNPJ, isValidCEP, isValidEstado } from './validators.js';
import { showLogin } from './ui.js';

// Elementos do formulário de cliente
const regNome = document.getElementById("regNome");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regCpf = document.getElementById("regCpf");
const regEstado = document.getElementById("regEstado");
const regCidade = document.getElementById("regCidade");
const regBairro = document.getElementById("regBairro");
const regRua = document.getElementById("regRua");
const regNumero = document.getElementById("regNumero");
const regComplemento = document.getElementById("regComplemento");
const regCep = document.getElementById("regCep");
const regTelefone = document.getElementById("regTelefone");
const regFoto = document.getElementById("regFoto");

// Elementos do formulário de empresa
const empNome = document.getElementById("empNome");
const empCpf = document.getElementById("empCpf");
const empTelefone = document.getElementById("empTelefone");
const empEmail = document.getElementById("empEmail");
const empPassword = document.getElementById("empPassword");
const empRespEstado = document.getElementById("empRespEstado");
const empRespCidade = document.getElementById("empRespCidade");
const empRespBairro = document.getElementById("empRespBairro");
const empRespRua = document.getElementById("empRespRua");
const empRespNumero = document.getElementById("empRespNumero");
const empRespComplemento = document.getElementById("empRespComplemento");
const empRespCep = document.getElementById("empRespCep");
const empNomeFantasia = document.getElementById("empNomeFantasia");
const empCnpj = document.getElementById("empCnpj");
const empCategoria = document.getElementById("empCategoria");
const empEstado = document.getElementById("empEstado");
const empCidade = document.getElementById("empCidade");
const empBairro = document.getElementById("empBairro");
const empRua = document.getElementById("empRua");
const empNumero = document.getElementById("empNumero");
const empComplemento = document.getElementById("empComplemento");
const empCep = document.getElementById("empCep");
const empLogo = document.getElementById("empLogo");

// Mapa de estados para conversão
const MAPA_ESTADOS = {
    "Minas Gerais": "MG", "São Paulo": "SP", "Rio de Janeiro": "RJ",
    "Bahia": "BA", "Paraná": "PR", "Rio Grande do Sul": "RS",
    "Pernambuco": "PE", "Ceará": "CE", "Pará": "PA",
    "Santa Catarina": "SC", "Goiás": "GO", "Maranhão": "MA",
    "Amazonas": "AM", "Espírito Santo": "ES", "Paraíba": "PB",
    "Rio Grande do Norte": "RN", "Mato Grosso": "MT", "Alagoas": "AL",
    "Piauí": "PI", "Distrito Federal": "DF", "Mato Grosso do Sul": "MS",
    "Sergipe": "SE", "Rondônia": "RO", "Tocantins": "TO",
    "Acre": "AC", "Amapá": "AP", "Roraima": "RR"
};

function converterNomeParaSigla(nomeEstado) {
    return MAPA_ESTADOS[nomeEstado] || nomeEstado.substring(0, 2).toUpperCase();
}

// Função de registro de cliente
export async function registerCliente(btn) {
    // Validação de campos obrigatórios
    if (!regNome.value || !regEmail.value || !regPassword.value || 
        !regCpf.value || !regEstado.value || !regCidade.value || 
        !regBairro.value || !regRua.value || !regNumero.value || 
        !regCep.value || !regTelefone.value) {
        log("Preencha todos os Campos Obrigatórios.");
        return;
    }

    // Validações específicas
    if (!isValidEmail(regEmail.value)) {
        log("Email inválido.");
        return;
    }

    /*if (!isValidCPF(regCpf.value)) {
        log("CPF inválido.");
        return;
    }*/

    if (!isValidEstado(regEstado.value)) {
        log("Estado inválido. Use a sigla (ex: MG, SP).");
        return;
    }

    if (!isValidCEP(regCep.value)) {
        log("CEP inválido. Deve conter 8 dígitos.");
        return;
    }

    if (!isStrongPassword(regPassword.value)) {
        log("Senha fraca: mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.");
        return;
    }

    disableButton(btn);

    try {
        const formData = new FormData();

        formData.append("nome", regNome.value.trim());
        formData.append("email", regEmail.value.trim().toLowerCase());
        formData.append("password", regPassword.value);
        formData.append("cpf", regCpf.value.trim());
        formData.append("telefone", regTelefone.value.trim());
        formData.append("estado", regEstado.value.trim().toUpperCase());
        formData.append("cidade", regCidade.value.trim());
        formData.append("bairro", regBairro.value.trim());
        formData.append("rua", regRua.value.trim());
        formData.append("numero", regNumero.value.trim());
        formData.append("complemento", regComplemento.value.trim());
        formData.append("cep", regCep.value.trim());

        if (regFoto.files.length > 0) {
            formData.append("foto", regFoto.files[0]);
        }

        const res = await apiRequest("/auth/register/cliente", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            log(res.error || "Erro ao realizar cadastro.");
            return;
        }

        log("Cadastro realizado com sucesso!");
        
        // Limpar campos
        regNome.value = regEmail.value = regPassword.value = regCpf.value = "";
        regEstado.value = regCidade.value = regBairro.value = regRua.value = "";
        regNumero.value = regComplemento.value = regCep.value = regTelefone.value = "";
        regFoto.value = "";
        
        showLogin();

    } catch (error) {
        log("Erro de conexão com o servidor.");
        console.error(error);
    } finally {
        enableButton(btn);
    }
}

// Função de registro de empresa
export async function registerEmpresa(btn) {
    // Validação de campos obrigatórios
    const camposObrigatorios = [
        empNome, empCpf, empTelefone, empEmail, empPassword,
        empNomeFantasia, empCnpj, empCategoria, empLogo
    ];
    
    for (const campo of camposObrigatorios) {
        if (!campo.value && campo !== empLogo) {
            log("Preencha todos os campos obrigatórios.");
            return;
        }
        if (campo === empLogo && campo.files.length === 0) {
            log("A logo da empresa é obrigatória.");
            return;
        }
    }

    // Validações específicas
    if (!isValidEmail(empEmail.value)) {
        log("Email inválido.");
        return;
    }

    /*if (!isValidCPF(empCpf.value)) {
        log("CPF inválido.");
        return;
    }*/

    if (!isValidCNPJ(empCnpj.value)) {
        log("CNPJ inválido.");
        return;
    }

    if (!isValidEstado(empEstado.value) || !isValidEstado(empRespEstado.value)) {
        log("Estado inválido. Use a sigla (ex: MG, SP).");
        return;
    }

    if (!isValidCEP(empCep.value) || !isValidCEP(empRespCep.value)) {
        log("CEP inválido. Deve conter 8 dígitos.");
        return;
    }

    if (!isStrongPassword(empPassword.value)) {
        log("Senha fraca: mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.");
        return;
    }

    disableButton(btn);

    try {
        const formData = new FormData();

        // Dados do responsável
        formData.append("nome", empNome.value.trim());
        formData.append("cpf", empCpf.value.trim());
        formData.append("telefone", empTelefone.value.trim());
        formData.append("email", empEmail.value.trim().toLowerCase());
        formData.append("password", empPassword.value);

        // Endereço do responsável
        formData.append("resp_estado", empRespEstado.value.trim().toUpperCase());
        formData.append("resp_cidade", empRespCidade.value.trim());
        formData.append("resp_bairro", empRespBairro.value.trim());
        formData.append("resp_rua", empRespRua.value.trim());
        formData.append("resp_numero", empRespNumero.value.trim());
        formData.append("resp_complemento", empRespComplemento.value.trim());
        formData.append("resp_cep", empRespCep.value.trim());

        // Dados da empresa
        formData.append("nome_fantasia", empNomeFantasia.value.trim());
        formData.append("cnpj", empCnpj.value.trim());
        formData.append("categoria", empCategoria.value);

        // Endereço da empresa
        formData.append("emp_estado", empEstado.value.trim().toUpperCase());
        formData.append("emp_cidade", empCidade.value.trim());
        formData.append("emp_bairro", empBairro.value.trim());
        formData.append("emp_rua", empRua.value.trim());
        formData.append("emp_numero", empNumero.value.trim());
        formData.append("emp_complemento", empComplemento.value.trim());
        formData.append("emp_cep", empCep.value.trim());

        formData.append("logo", empLogo.files[0]);

        const res = await apiRequest("/auth/register/empresa", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            log(res.error || "Erro ao cadastrar empresa.");
            return;
        }

        log("Empresa cadastrada com sucesso!");

        // Limpar campos
        empNome.value = empCpf.value = empTelefone.value = empEmail.value = empPassword.value = "";
        empRespEstado.value = empRespCidade.value = empRespBairro.value = empRespRua.value = "";
        empRespNumero.value = empRespComplemento.value = empRespCep.value = "";
        empNomeFantasia.value = empCnpj.value = empCategoria.value = "";
        empEstado.value = empCidade.value = empBairro.value = empRua.value = "";
        empNumero.value = empComplemento.value = empCep.value = "";
        empLogo.value = "";

        showLogin();

    } catch (error) {
        log("Erro de conexão com o servidor.");
        console.error(error);
    } finally {enableButton(btn);}
}

export { converterNomeParaSigla, MAPA_ESTADOS };