// auth.js -> Funções de Login/Logout/Token

import { apiRequest, authHeadersJson } from './api.js';
import { disableButton, enableButton, log } from './utils.js';

// elementos de login
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

// Função de login do usuário
export async function login(btn) {
    if (!loginEmail.value || !loginPassword.value) {
        log("Email e senha são obrigatórios.");
        return;
    }

    disableButton(btn);
    try {
        const res = await apiRequest("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: loginEmail.value.trim().toLowerCase(),
                password: loginPassword.value
            })
        });

        if (!res.ok) {
            log(res.error || "Email ou senha inválidos.");
            return;
        }

        const data = res.data;
        const token = data.access_token;

        if (!token) {
            log("Token não recebido.");
            return;
        }

        // Salva o token primeiro
        localStorage.setItem("token", token);

        // busca o perfil
        await redirectByUserType();     
        loginEmail.value = "";
        loginPassword.value = "";
    } catch (error) {
        log("Erro de conexão com o servidor.");
        console.error(error);
    } finally {
        enableButton(btn);
    }
}

// Função de logout
export function logout() {
    // Remove token do Usuario
    localStorage.removeItem("token");
    // Log p Debug
    log("Logout realizado.");
    //Redireciona para a tela inicial
    window.location.href = "/";
}

//  função para buscar o tipo de usuário e redirecionar
async function redirectByUserType() {
    try {
        // Chamada para a rota /me que você já criou no Flask
        const res = await apiRequest("/auth/me", {
            method: "GET",
            headers: authHeadersJson() // Certifique-se que envia o token no Bearer
        });

        if (!res.ok) {
            log("Erro ao identificar perfil.");
            return;
        }

        const perfil = res.data;
        //const tipo = perfil.tipo_usuario;
        // Redirecionamento baseado no tipo retornado pelo /me
        /*if (tipo === "cliente") {
            window.location.href = "/client/home";
        } else if (tipo === "empresa") {
            window.location.href = "/company/dashboard";
        } else {
            log("Tipo de usuário inválido: " + tipo);
        }*/

        if (perfil.tipo_usuario === "cliente") {
            window.location.href = "/client/home";
            return;
        }

        const path = window.location.pathname;

        if (perfil.tipo_usuario === "empresa") {
            if (!perfil.empresa_configurada && path !== "/company/onboarding") {
                window.location.href = "/company/onboarding";
            } else if (perfil.empresa_configurada && path !== "/company/dashboard") {
                window.location.href = "/company/dashboard";
            }
        }        

        log("Tipo de usuário inválido.");            
    } catch (error) {
        console.error("Erro no redirecionamento:", error);
        log("Erro ao carregar perfil.");
    }
}