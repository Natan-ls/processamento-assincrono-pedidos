import { apiRequest, authHeadersJson } from "./api.js";

async function protegerRotasEmpresa() {
    const res = await apiRequest("/auth/me", {
        method: "GET",
        headers: authHeadersJson()
    });

    if (!res.ok) {
        window.location.href = "/";
        return;
    }

    const perfil = res.data;
    const path = window.location.pathname;

    if (perfil.tipo_usuario !== "empresa") {
        window.location.href = "/";
        return;
    }

    // Empresa NÃO configurada
    if (!perfil.empresa_configurada && path !== "/company/onboarding") {
        window.location.href = "/company/onboarding";
        return;
    }

    // Empresa JÁ configurada
    if (perfil.empresa_configurada && path === "/company/onboarding") {
        window.location.href = "/company/dashboard";
        return;
    }
}

document.addEventListener("DOMContentLoaded", protegerRotasEmpresa);
