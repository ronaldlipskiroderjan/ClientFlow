function setupFileInputPreview() {
    const fileInputs = document.querySelectorAll('input[type="file"]');

    fileInputs.forEach((input) => {
        input.addEventListener('change', (event) => {
            const label = input.nextElementSibling;
            const isCustomLabel = label && label.classList.contains('custom-file-label');

            if (!isCustomLabel) {
                return;
            }

            const selectedFile = event.target.files[0];
            label.innerText = selectedFile ? selectedFile.name : 'Nenhum arquivo';
        });
    });
}

function setupChatToggle() {
    const toggleButtons = document.querySelectorAll('.chat-toggler-btn');
    const chatPanel = document.getElementById('chat-panel');

    if (!toggleButtons.length || !chatPanel) {
        return;
    }

    toggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            chatPanel.classList.toggle('active');
        });
    });
}

function showToast(message, type = 'success') {
    console.log('[Toast ' + type.toUpperCase() + '] ' + message);
}

function getClientFlowDisplayName(userData) {
    if (!userData) {
        return 'Usuário';
    }

    const nomeEmpresa = (userData.nome_empresa || '').trim();
    const nomeResponsavel = (userData.nome_responsavel || '').trim();
    const nome = (userData.nome || '').trim();

    return nomeEmpresa || nomeResponsavel || nome || 'Usuário';
}

function getClientFlowAvatarUrl(userData, backgroundColor = '0D8ABC') {
    const displayName = getClientFlowDisplayName(userData);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${backgroundColor}&color=fff`;
}

function applyClientFlowIdentity(userData, options = {}) {
    const displayName = getClientFlowDisplayName(userData);
    const nameSelector = options.nameSelector || '[data-user-display-name]';
    const greetingSelector = options.greetingSelector || '[data-user-greeting]';
    const avatarSelector = options.avatarSelector || '[data-user-avatar]';
    const backgroundColor = options.avatarBackground || '0D8ABC';

    document.querySelectorAll(nameSelector).forEach((element) => {
        element.textContent = displayName;
    });

    document.querySelectorAll(greetingSelector).forEach((element) => {
        element.innerHTML = `Olá, <span class="fw-bold text-navy-blue">${displayName}</span>`;
    });

    document.querySelectorAll(avatarSelector).forEach((element) => {
        element.src = getClientFlowAvatarUrl(userData, backgroundColor);
    });
}

window.ClientFlowIdentity = {
    getDisplayName: getClientFlowDisplayName,
    getAvatarUrl: getClientFlowAvatarUrl,
    apply: applyClientFlowIdentity
};

document.addEventListener('DOMContentLoaded', () => {
    setupFileInputPreview();
    setupChatToggle();
});
