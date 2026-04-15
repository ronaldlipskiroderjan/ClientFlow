const ApiClientFlow = {
    BASE_URL: '../../api/',

    async post(endpoint, dados = {}) {
        let body;
        
        if (dados instanceof URLSearchParams || dados instanceof FormData) {
            body = dados;
        } else {
            body = new URLSearchParams();
            Object.entries(dados).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    body.append(key, String(value));
                }
            });
        }

        const opts = {
            method: 'POST',
            body: body,
            credentials: 'same-origin'
        };

        if (dados instanceof URLSearchParams) {
             opts.headers = {
                 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
             };
        } else if (!(dados instanceof FormData)) {
             opts.headers = {
                 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
             };
             opts.body = body.toString();
        }

        const resposta = await fetch(this.BASE_URL + endpoint, opts);
        return resposta.json();
    },

    async get(endpoint) {
        const resposta = await fetch(this.BASE_URL + endpoint, {
            method: 'GET',
            credentials: 'same-origin'
        });

        return resposta.json();
    },

    async postForm(endpoint, formData) {
        const resposta = await fetch(this.BASE_URL + endpoint, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        return resposta.json();
    }
};

// Map ApiClientFlow to API globally for the new modules
window.API = ApiClientFlow;

// Modulo de Auth
const Auth = {
    userSess: null,

    async validateSession() {
        if(this.userSess) return this.userSess;

        try {
            const res = await API.get('valida_sessao_logado.php');
            if(res && res.status === 'ok') {
                this.userSess = res.data;
                return this.userSess;
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    get(key) {
        return this.userSess ? this.userSess[key] : null;
    },

    getTipo() {
        return this.get('tipo'); // client, freelancer, agency_member, admin
    },

    hasAccess(permKey) {
        if (!this.userSess) return false;
        if (this.userSess.tipo === 'admin') return true;
        if (this.userSess.tipo === 'freelancer') return true;
        if (this.userSess.tipo === 'agency' || this.userSess.tipo === 'agency_member') {
            if (this.userSess.papel_agencia === 'admin_agencia') return true;
            return Boolean(this.userSess.permissoes && this.userSess.permissoes[permKey]);
        }
        return false;
    },

    async logout() {
        await API.post("usuario_logoff.php");
        window.location.href = "../../index.html";
    }
}

// ensure validation on load
Auth.validateSession();
window.Auth = Auth;
