const CLIENTFLOW_THEME_STORAGE_KEY = "clientflow-theme";

function normalizeClientFlowTheme(theme) {
    return theme === "dark" ? "dark" : "light";
}

function getStoredClientFlowTheme() {
    try {
        const savedTheme = localStorage.getItem(CLIENTFLOW_THEME_STORAGE_KEY);
        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }
    } catch (_) { }

    return null;
}

function getPreferredClientFlowTheme() {
    const savedTheme = getStoredClientFlowTheme();
    if (savedTheme) {
        return savedTheme;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }

    return "light";
}

function getCurrentClientFlowTheme() {
    const appliedTheme = document.documentElement.getAttribute("data-theme")
        || (document.body ? document.body.getAttribute("data-theme") : null);

    if (appliedTheme === "dark" || appliedTheme === "light") {
        return appliedTheme;
    }

    return getPreferredClientFlowTheme();
}

function updateThemeToggleButton(button, theme) {
    if (!button) return;

    const normalizedTheme = normalizeClientFlowTheme(theme);
    const shouldShowSun = normalizedTheme === "dark";
    const actionLabel = shouldShowSun ? "Ativar modo claro" : "Ativar modo escuro";
    const iconClass = shouldShowSun ? "fa-sun" : "fa-moon";
    const labelText = shouldShowSun ? "Modo Claro" : "Modo Escuro";

    button.setAttribute("title", actionLabel);
    button.setAttribute("aria-label", actionLabel);
    button.dataset.themeState = normalizedTheme;

    const icon = button.querySelector("i");
    if (icon) {
        icon.className = `fa-solid ${iconClass} fs-6`;
    }

    const labelSpan = button.querySelector("span");
    if (labelSpan) {
        labelSpan.textContent = labelText;
    }
}

function updateAllThemeToggleButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        updateThemeToggleButton(button, theme);
    });
}

function bindThemeToggleButtons(root = document) {
    const buttons = root.querySelectorAll("[data-theme-toggle]");
    const currentTheme = getCurrentClientFlowTheme();

    buttons.forEach((button) => {
        if (button.dataset.themeBound !== "1") {
            button.addEventListener("click", () => {
                toggleClientFlowTheme();
            });
            button.dataset.themeBound = "1";
        }
        updateThemeToggleButton(button, currentTheme);
    });
}

function applyClientFlowTheme(theme, options = {}) {
    const { persist = true, emitChange = true } = options;
    const nextTheme = normalizeClientFlowTheme(theme);
    const previousTheme = getCurrentClientFlowTheme();

    document.documentElement.setAttribute("data-theme", nextTheme);
    if (document.body) {
        document.body.setAttribute("data-theme", nextTheme);
    }

    if (persist) {
        try {
            localStorage.setItem(CLIENTFLOW_THEME_STORAGE_KEY, nextTheme);
        } catch (_) { }
    }

    updateAllThemeToggleButtons(nextTheme);

    if (emitChange && previousTheme !== nextTheme) {
        window.dispatchEvent(new CustomEvent("clientflow:themechange", {
            detail: { theme: nextTheme }
        }));
    }

    return nextTheme;
}

function toggleClientFlowTheme() {
    const currentTheme = getCurrentClientFlowTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    return applyClientFlowTheme(nextTheme, { persist: true, emitChange: true });
}

function mountFloatingThemeToggle() {
    if (document.getElementById("clientflowThemeFab")) {
        bindThemeToggleButtons();
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "clientflowThemeFab";
    button.className = "btn btn-icon-soft theme-fab";
    button.setAttribute("data-theme-toggle", "floating");
    button.innerHTML = '<i class="fa-solid fa-moon fs-6"></i>';
    document.body.appendChild(button);

    bindThemeToggleButtons();
}

function ensureThemeTogglePresence() {
    bindThemeToggleButtons();

    if (document.querySelector("[data-theme-toggle]")) {
        return;
    }

    if (window.SidebarManager) {
        return;
    }

    mountFloatingThemeToggle();
}

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

window.ClientFlowTheme = {
    storageKey: CLIENTFLOW_THEME_STORAGE_KEY,
    getCurrentTheme: getCurrentClientFlowTheme,
    applyTheme: applyClientFlowTheme,
    toggleTheme: toggleClientFlowTheme,
    bindToggles: bindThemeToggleButtons,
    ensureTogglePresence: ensureThemeTogglePresence
};

document.addEventListener('DOMContentLoaded', () => {
    applyClientFlowTheme(getPreferredClientFlowTheme(), { persist: false, emitChange: false });
    ensureThemeTogglePresence();

    setupFileInputPreview();
    setupChatToggle();
});
