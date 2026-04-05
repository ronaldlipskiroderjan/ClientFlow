class StorageManager {
    static login(email, password) {
        // Simple mock login - in real app, this would call API
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        return user || null;
    }

    static register(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
    }
}