const ApiClientFlow = {
    BASE_URL: '../../api/',

    async post(endpoint, dados = {}) {
        const body = new URLSearchParams();

        Object.entries(dados).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                body.append(key, String(value));
            }
        });

        const resposta = await fetch(this.BASE_URL + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: body.toString(),
            credentials: 'same-origin'
        });

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