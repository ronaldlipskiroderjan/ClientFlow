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

document.addEventListener('DOMContentLoaded', () => {
    setupFileInputPreview();
    setupChatToggle();
});
