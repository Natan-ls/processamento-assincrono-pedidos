from email_validator import validate_email, EmailNotValidError
import re

# ======== FUNCT p/ VALIDAÇÃO DO EMAIL ========
def is_valid_email(email: str) -> bool:
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


# ======== FUNCT p/ VERIFICAÇÃO E VALIDAÇÃO DE SENHA FORTE (maiuscula,minuscula,caracter especial e numero -> SEndo de Tamanho mínimo de 6 - DIGITOS) ========
def is_strong_password(password: str) -> bool:
    if len(password) < 6:
        return False

    if not re.search(r"[A-Z]", password):  # letra maiúscula
        return False

    if not re.search(r"[a-z]", password):  # letra minúscula
        return False

    if not re.search(r"\d", password):     # número
        return False

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=/\\[\]]", password):
        return False

    return True

# ======== FUNCT p/ VALIDAÇÃO DO TELEFONE ========
def is_valid_phone(phone: str) -> bool:
    """
    Aceita:
    (11) 91234-5678
    11912345678
    11 91234-5678
    """
    phone = re.sub(r"\D", "", phone)
    return len(phone) in (10, 11)

# ======== FUNCT p/ VALIDAÇÃO DE ENDEREÇO ========
def is_valid_address(address: str) -> bool:
    return len(address.strip()) >= 5

# ======== FUNCT p/ VALIDAÇÃO DE CPF ========
def is_valid_cpf(cpf: str) -> bool:
    
    cpf = re.sub(r"\D", "", cpf)#apaga caracteres qn são numeros

    if len(cpf) != 11:#verificação de qtd
        return False

    
    if cpf == cpf[0] * 11:#não deixa ter nnumero sequenciais tipo 999 999 999 99 
        return False

    #faz os calcs dos digitos verificadores
    for i in range(9, 11):
        # O peso inicial é 10 para o primeiro dígito por isso (i=9) e 11 para o segundo dígito (i=10)
        peso = i + 1
        soma = 0
        
        for j in range(i):
            soma += int(cpf[j]) * peso
            peso -= 1
            
        digito = (soma * 10) % 11
        if digito == 10:
            digito = 0
            
        if int(cpf[i]) != digito:
            return False

    return True

# ======== FUNCT p/ VALIDAÇÃO DE CNPJ ========
def is_valid_cnpj(cnpj: str) -> bool:
    cnpj = re.sub(r"\D", "", cnpj)

    # Deve ter 14 dígitos
    if len(cnpj) != 14:
        return False

    # Não pode ser sequência tipo 00000000000000
    if cnpj == cnpj[0] * 14:
        return False

    # Pesos oficiais do cálculo
    pesos_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    # ======= Cálculo do primeiro dígito =======
    soma = sum(int(cnpj[i]) * pesos_1[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto

    if int(cnpj[12]) != digito1:
        return False

    # ======= Cálculo do segundo dígito =======
    soma = sum(int(cnpj[i]) * pesos_2[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto

    if int(cnpj[13]) != digito2:
        return False

    return True
