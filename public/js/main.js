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

// ══════════════════════════════════════════════════════════════
//  TOAST — Sistema global de notificações não-bloqueantes
// ══════════════════════════════════════════════════════════════
(function () {
    const DURATION = 4000;

    const TYPES = {
        success: { icon: 'fa-circle-check',      color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', textColor: '#065f46' },
        error:   { icon: 'fa-circle-xmark',      color: '#ef4444', bg: '#fef2f2', border: '#fecaca', textColor: '#991b1b' },
        warning: { icon: 'fa-triangle-exclamation', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', textColor: '#92400e' },
        info:    { icon: 'fa-circle-info',        color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', textColor: '#1e40af' },
    };

    const DARK_TYPES = {
        success: { bg: '#052e16', border: '#166534', textColor: '#bbf7d0' },
        error:   { bg: '#450a0a', border: '#991b1b', textColor: '#fecaca' },
        warning: { bg: '#451a03', border: '#92400e', textColor: '#fde68a' },
        info:    { bg: '#0c1a3a', border: '#1e40af', textColor: '#bfdbfe' },
    };

    function getContainer() {
        let c = document.getElementById('cf-toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'cf-toast-container';
            c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:360px;width:calc(100% - 48px);pointer-events:none;';
            document.body.appendChild(c);
        }
        return c;
    }

    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    window.showToast = function (message, type = 'info') {
        const cfg  = TYPES[type]  || TYPES.info;
        const dark = isDark() ? (DARK_TYPES[type] || {}) : {};
        const bg     = dark.bg      || cfg.bg;
        const border = dark.border  || cfg.border;
        const txtCol = dark.textColor || cfg.textColor;

        const toast = document.createElement('div');
        toast.style.cssText = [
            `background:${bg}`,
            `border:1px solid ${border}`,
            `border-left:4px solid ${cfg.color}`,
            'border-radius:10px',
            'padding:14px 16px 10px',
            'box-shadow:0 8px 24px rgba(0,0,0,.12)',
            'pointer-events:all',
            'opacity:0',
            'transform:translateX(20px)',
            'transition:opacity .22s ease,transform .22s ease',
            'position:relative',
            'overflow:hidden',
        ].join(';');

        toast.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <i class="fa-solid ${cfg.icon}" style="color:${cfg.color};font-size:16px;margin-top:1px;flex-shrink:0;"></i>
                <span style="font-size:13.5px;font-weight:500;line-height:1.45;color:${txtCol};flex:1;">${message}</span>
                <button onclick="this.closest('[data-cf-toast]').remove()" style="border:none;background:none;padding:0;cursor:pointer;color:${cfg.color};opacity:.6;font-size:14px;line-height:1;flex-shrink:0;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div style="position:absolute;bottom:0;left:0;height:3px;background:${cfg.color};opacity:.35;width:100%;transform-origin:left;animation:cf-toast-progress ${DURATION}ms linear forwards;border-radius:0 0 10px 10px;"></div>
        `;
        toast.setAttribute('data-cf-toast', '');

        getContainer().appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 250);
        }, DURATION);
    };

    // Atalhos semânticos
    window.Toast = {
        success: (msg) => showToast(msg, 'success'),
        error:   (msg) => showToast(msg, 'error'),
        warning: (msg) => showToast(msg, 'warning'),
        info:    (msg) => showToast(msg, 'info'),
        show:    (msg, type) => showToast(msg, type),
    };

    // Injetar keyframe da barra de progresso
    if (!document.getElementById('cf-toast-style')) {
        const s = document.createElement('style');
        s.id = 'cf-toast-style';
        s.textContent = '@keyframes cf-toast-progress{from{transform:scaleX(1)}to{transform:scaleX(0)}}';
        document.head.appendChild(s);
    }
})();

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
