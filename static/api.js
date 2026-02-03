// api.js -> Configuração central da API
//export const API_URL = "http://foodjanu.ddns.net:5000";
export const API_URL = "http://localhost:5000";

// Função padrão para fazer requisições
export async function apiRequest(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        
        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok) {
            return {
                ok: false,
                error: data?.error || "Erro na requisição",
                status: res.status
            };
        }

        return { ok: true, data, status: res.status };

    } catch (err) {
        console.error("Erro de conexão:", err);
        return { 
            ok: false, 
            error: "Servidor indisponível" 
        };
    }
}

// Headers com token JWT para JSON
export function authHeadersJson() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// Headers com token JWT para FormData (sem Content-Type)
export function authHeadersFormData() {
    const token = localStorage.getItem("token");
    return {
        "Authorization": `Bearer ${token}`
    };
}