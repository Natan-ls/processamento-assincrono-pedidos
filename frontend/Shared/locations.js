// locations.js -> Funções De GeoLocalização
import { log } from './utils.js';
import { converterNomeParaSigla } from './register.js';

// Referências aos campos de endereço
const regEstado = document.getElementById("regEstado");
const regCidade = document.getElementById("regCidade");
const regBairro = document.getElementById("regBairro");
const regRua = document.getElementById("regRua");
const regNumero = document.getElementById("regNumero");
const regCep = document.getElementById("regCep");

const empRespEstado = document.getElementById("empRespEstado");
const empRespCidade = document.getElementById("empRespCidade");
const empRespBairro = document.getElementById("empRespBairro");
const empRespRua = document.getElementById("empRespRua");
const empRespNumero = document.getElementById("empRespNumero");
const empRespCep = document.getElementById("empRespCep");

const empEstado = document.getElementById("empEstado");
const empCidade = document.getElementById("empCidade");
const empBairro = document.getElementById("empBairro");
const empRua = document.getElementById("empRua");
const empNumero = document.getElementById("empNumero");
const empCep = document.getElementById("empCep");

// Função para usar localização atual
export async function usarLocalizacao(tipoUser) {
    if (!navigator.geolocation) {
        log("Geolocalização não é suportada neste navegador.");
        return;
    }

    log("Obtendo localização...");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`
                );

                const data = await res.json();

                if (data && data.address) {
                    const addr = data.address;
                    const estadoNome = addr.state || "";
                    const siglaEstado = converterNomeParaSigla(estadoNome);

                    switch(tipoUser) {
                        case "cliente":
                            if (regEstado) regEstado.value = siglaEstado;
                            if (regCidade) regCidade.value = addr.city || addr.town || addr.village || "";
                            if (regBairro) regBairro.value = addr.suburb || addr.neighbourhood || "";
                            if (regRua) regRua.value = addr.road || "";
                            if (regNumero) regNumero.value = addr.house_number || "";
                            if (regCep) regCep.value = addr.postcode || "";
                            break;
                            
                        case "empresa":
                            if (empEstado) empEstado.value = siglaEstado;
                            if (empCidade) empCidade.value = addr.city || addr.town || addr.village || "";
                            if (empBairro) empBairro.value = addr.suburb || addr.neighbourhood || "";
                            if (empRua) empRua.value = addr.road || "";
                            if (empNumero) empNumero.value = addr.house_number || "";
                            if (empCep) empCep.value = addr.postcode || "";
                            break;
                            
                        case "empresa_responsavel":
                            if (empRespEstado) empRespEstado.value = siglaEstado;
                            if (empRespCidade) empRespCidade.value = addr.city || addr.town || addr.village || "";
                            if (empRespBairro) empRespBairro.value = addr.suburb || addr.neighbourhood || "";
                            if (empRespRua) empRespRua.value = addr.road || "";
                            if (empRespNumero) empRespNumero.value = addr.house_number || "";
                            if (empRespCep) empRespCep.value = addr.postcode || "";
                            break;
                    }
                    
                    log("Endereço obtido com sucesso!");
                } else {
                    log("Não foi possível identificar o endereço.");
                }
            } catch (err) {
                console.error(err);
                log("Erro ao converter localização em endereço.");
            }
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    log("Permissão de localização negada.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    log("Localização indisponível.");
                    break;
                case error.TIMEOUT:
                    log("Tempo esgotado ao obter localização.");
                    break;
                default:
                    log("Erro ao obter localização.");
            }
        }
    );
}