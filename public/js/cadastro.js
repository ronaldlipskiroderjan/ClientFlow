function onlyDigits(value) {
    return (value || '').replace(/\D/g, '');
}

function isRepeatedDigits(value) {
    return /^([0-9])\1+$/.test(value);
}

function formatCPF(value) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length <= 9) return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6);

    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9);
}

function formatCNPJ(value) {
    const digits = onlyDigits(value).slice(0, 14);

    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length <= 8) return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
    if (digits.length <= 12) return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '/' + digits.slice(8);

    return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '/' + digits.slice(8, 12) + '-' + digits.slice(12);
}

function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 2) return digits.length ? '(' + digits : '';
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);

    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
}

function formatDateBR(value) {
    const digits = onlyDigits(value).slice(0, 8);

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);

    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
}

function isValidCPF(value) {
    const cpf = onlyDigits(value);

    if (cpf.length !== 11 || isRepeatedDigits(cpf)) {
        return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
        sum += Number(cpf[i]) * (10 - i);
    }

    let checkDigit = (sum * 10) % 11;
    if (checkDigit === 10) checkDigit = 0;
    if (checkDigit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i += 1) {
        sum += Number(cpf[i]) * (11 - i);
    }

    checkDigit = (sum * 10) % 11;
    if (checkDigit === 10) checkDigit = 0;

    return checkDigit === Number(cpf[10]);
}

function isValidCNPJ(value) {
    const cnpj = onlyDigits(value);

    if (cnpj.length !== 14 || isRepeatedDigits(cnpj)) {
        return false;
    }

    function calculateDigit(base, factors) {
        let sum = 0;
        for (let i = 0; i < factors.length; i += 1) {
            sum += Number(base[i]) * factors[i];
        }

        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    const base = cnpj.slice(0, 12);
    const firstDigit = calculateDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const secondDigit = calculateDigit(base + firstDigit, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return cnpj === base + firstDigit + secondDigit;
}

function isValidPhone(value) {
    const digits = onlyDigits(value);
    return digits.length === 10 || digits.length === 11;
}

function isAdultBirthDate(value) {
    if (!value) return false;

    const parts = value.split('/');
    if (parts.length !== 3) return false;

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
        return false;
    }

    const birthDate = new Date(year, month - 1, day);
    if (Number.isNaN(birthDate.getTime())) return false;

    if (birthDate.getDate() !== day || birthDate.getMonth() !== (month - 1) || birthDate.getFullYear() !== year) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) return false;

    let age = today.getFullYear() - year;
    const monthDiff = today.getMonth() - (month - 1);
    const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < day);

    if (beforeBirthday) {
        age -= 1;
    }

    return age >= 18;
}

function toISODateFromBR(value) {
    if (!value) return '';

    const parts = value.split('/');
    if (parts.length !== 3) return '';

    const day = String(parts[0]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = String(parts[2]);

    return `${year}-${month}-${day}`;
}

function setupInputMasks() {
    document.querySelectorAll('input[name="birth_date"]').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = formatDateBR(input.value);
        });
    });

    document.querySelectorAll('input[name="cpf"]').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = formatCPF(input.value);
        });
    });

    document.querySelectorAll('input[name="cpf_cnpj"]').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = formatCNPJ(input.value);
        });
    });

    document.querySelectorAll('input[name="phone"]').forEach((input) => {
        input.addEventListener('input', () => {
            input.value = formatPhone(input.value);
        });
    });
}

function buildRegisterData(tabId, raw) {
    if (tabId === 'pf') {
        return {
            name: raw.full_name,
            full_name: raw.full_name,
            cpf: raw.cpf,
            cpf_cnpj: onlyDigits(raw.cpf),
            birth_date: raw.birth_date,
            phone: raw.phone,
            email: raw.email,
            password: raw.password,
            role: raw.role
        };
    }

    return {
        name: raw.corporate_name,
        corporate_name: raw.corporate_name,
        legal_contact: raw.legal_contact,
        cnpj: raw.cpf_cnpj,
        cpf_cnpj: onlyDigits(raw.cpf_cnpj),
        phone: raw.phone,
        email: raw.email,
        password: raw.password,
        role: raw.role
    };
}

function validateFormByTab(tabId, raw) {
    const isPersonTab = tabId === 'pf';

    if (isPersonTab && !isValidCPF(raw.cpf)) {
        alert('CPF invalido. Verifique e tente novamente.');
        return false;
    }

    if (!isValidPhone(raw.phone)) {
        alert('Telefone invalido. Use DDD + numero (10 ou 11 digitos).');
        return false;
    }

    if (isPersonTab && !isAdultBirthDate(raw.birth_date)) {
        alert('Data de nascimento invalida. O cadastro PF exige idade minima de 18 anos.');
        return false;
    }

    if (tabId === 'pj' && !isValidCNPJ(raw.cpf_cnpj)) {
        alert('CNPJ invalido. Verifique e tente novamente.');
        return false;
    }

    if (!raw.role || !['client', 'freelancer', 'agency'].includes(raw.role)) {
        alert('Perfil de cadastro invalido.');
        return false;
    }

    return true;
}

function getRedirectByRole(role) {
    if (role === 'client') {
        return 'dashboard_client.html';
    }

    return 'dashboard_agency.html';
}

function formToObject(form) {
    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
        data[key] = String(value).trim();
    });

    return data;
}

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const tabPane = form.closest('.tab-pane');
    const tabId = tabPane.id;
    const rawData = formToObject(form);

    const token = params.get('token');

    if (!validateFormByTab(tabId, rawData)) return;

    const userData = buildRegisterData(tabId, rawData);

    try {
        const retorno = await ApiClientFlow.post('usuario_cadastrar.php', {
            nome: userData.name,
            email: userData.email,
            senha: userData.password,
            tipo: userData.role,
            telefone: userData.phone,
            documento: userData.cpf_cnpj,
            data_nascimento: toISODateFromBR(userData.birth_date || ''),
            nome_empresa: userData.corporate_name || '',
            nome_responsavel: userData.legal_contact || ''
        });

        if (retorno.status !== 'ok') {
            alert(retorno.mensagem || 'Erro ao criar conta.');
            return;
        }

        if (userData.role === 'client') {
            const loginRetorno = await ApiClientFlow.post('usuario_login.php', {
                email: userData.email,
                senha: userData.password
            });

            if (loginRetorno.status !== 'ok') {
                alert(loginRetorno.mensagem || 'Cadastro realizado, mas falhou o login automatico.');
                window.location.href = 'login.html' + (token ? ('?token=' + encodeURIComponent(token)) : '');
                return;
            }

            if (token) {
                const vinculo = await ApiClientFlow.post('checklist_vincular_cliente.php', { token });
                if (vinculo.status !== 'ok') {
                    alert(vinculo.mensagem || 'Cadastro realizado, mas nao foi possivel vincular o formulario.');
                    return;
                }
            }
        }

        alert('Cadastro realizado com sucesso.');
        window.location.href = getRedirectByRole(userData.role);
    } catch (error) {
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('.tab-pane form');

    setupInputMasks();

    forms.forEach((form) => {
        form.addEventListener('submit', handleRegisterSubmit);
    });
});
