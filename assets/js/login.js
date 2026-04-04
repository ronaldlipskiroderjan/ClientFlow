function getDashboardByRole(role) {
    if (role === 'client') {
        return 'dashboard_client.html';
    }

    return 'dashboard_agency.html';
}

function handleLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const user = StorageManager.login(email, password);

    if (!user) {
        alert('E-mail ou senha incorretos.');
        return;
    }

    window.location.href = getDashboardByRole(user.role);
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', handleLoginSubmit);
});
