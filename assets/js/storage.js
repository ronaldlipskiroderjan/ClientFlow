// ---- Arquivo provisório para simular backend usando localStorage --- será substituído por API real posteriormente ---
const StorageManager = {
    // Keys for localStorage
    KEYS: {
        USERS: 'cf_users',
        CURRENT_USER: 'cf_auth_user',
        CLIENTS: 'cf_clients',
        CHECKLISTS: 'cf_checklists',
        FIELDS: 'cf_fields'
    },

    // --- INITIALIZATION ---
    init() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            localStorage.setItem(this.KEYS.USERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.CLIENTS)) {
            localStorage.setItem(this.KEYS.CLIENTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.CHECKLISTS)) {
            localStorage.setItem(this.KEYS.CHECKLISTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.FIELDS)) {
            localStorage.setItem(this.KEYS.FIELDS, JSON.stringify([]));
        }
    },

    // --- AUTHENTICATION ---
    register(userData) {
        const users = this.getData(this.KEYS.USERS);
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        this.saveData(this.KEYS.USERS, users);
        return this.login(userData.email, userData.password);
    },

    sanitizeAuthUser(user) {
        if (!user) {
            return null;
        }

        const { password, ...safeUser } = user;
        return safeUser;
    },

    login(email, password) {
        const users = this.getData(this.KEYS.USERS);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const authUser = this.sanitizeAuthUser(user);
            localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(authUser));
            return user;
        }
        return null;
    },

    logout() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
        window.location.href = '/index.html';
    },

    getAuthUser() {
        const user = localStorage.getItem(this.KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    // --- DATA HELPER ---
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // --- CLIENTS ---
    getClients(agencyId) {
        return this.getData(this.KEYS.CLIENTS).filter(c => c.agency_id === agencyId);
    },

    addClient(clientData) {
        const clients = this.getData(this.KEYS.CLIENTS);
        const newClient = {
            id: Date.now().toString(),
            ...clientData,
            created_at: new Date().toISOString()
        };
        clients.push(newClient);
        this.saveData(this.KEYS.CLIENTS, clients);
        return newClient;
    },

    // --- CHECKLISTS & FIELDS ---
    getChecklists(agencyId) {
        return this.getData(this.KEYS.CHECKLISTS).filter(c => c.agency_id === agencyId);
    },

    getChecklistsForClient(clientId) {
        return this.getData(this.KEYS.CHECKLISTS).filter(c => c.client_id === clientId);
    },

    saveChecklist(checklist, fields) {
        const checklists = this.getData(this.KEYS.CHECKLISTS);
        const allFields = this.getData(this.KEYS.FIELDS);

        const checklistId = Date.now().toString();
        const newChecklist = {
            id: checklistId,
            ...checklist,
            status: 'active',
            progress: 0,
            created_at: new Date().toISOString()
        };

        const newFields = fields.map((f, index) => ({
            id: checklistId + '_' + index,
            checklist_id: checklistId,
            ...f,
            status: 'pending',
            value: null,
            feedback: null
        }));

        checklists.push(newChecklist);
        allFields.push(...newFields);

        this.saveData(this.KEYS.CHECKLISTS, checklists);
        this.saveData(this.KEYS.FIELDS, allFields);
        return newChecklist;
    },

    getFields(checklistId) {
        return this.getData(this.KEYS.FIELDS).filter(f => f.checklist_id === checklistId);
    },

    updateField(fieldId, updateData) {
        const fields = this.getData(this.KEYS.FIELDS);
        const index = fields.findIndex(f => f.id === fieldId);
        if (index !== -1) {
            fields[index] = { ...fields[index], ...updateData };
            this.saveData(this.KEYS.FIELDS, fields);
            this.updateChecklistProgress(fields[index].checklist_id);
            return fields[index];
        }
        return null;
    },

    updateChecklistProgress(checklistId) {
        const fields = this.getFields(checklistId);
        const total = fields.length;
        if (total === 0) return;

        const approved = fields.filter(f => f.status === 'approved').length;
        const progress = Math.round((approved / total) * 100);

        const checklists = this.getData(this.KEYS.CHECKLISTS);
        const index = checklists.findIndex(c => c.id === checklistId);
        if (index !== -1) {
            checklists[index].progress = progress;
            this.saveData(this.KEYS.CHECKLISTS, checklists);
        }
    }
};

// Initialize on load
StorageManager.init();
