#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/var/www/html/clientflow"
DB_NAME="clientflow"
DB_USER="clientflow_user"
DB_PASS="clientflow123"

if [[ $EUID -ne 0 ]]; then
    echo "Execute este script como root. Se nao tiver sudo, use: su -"
    echo "Depois rode: ./setup-localhost.sh"
    exit 1
fi

echo "[1/7] Instalando pacotes do servidor local..."
apt update
apt install -y apache2 mariadb-server php libapache2-mod-php php-mysql rsync

echo "[2/7] Habilitando e iniciando serviços..."
systemctl enable --now apache2
systemctl enable --now mariadb

echo "[3/7] Criando banco e usuário do ClientFlow..."
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"

echo "[4/7] Publicando projeto em ${TARGET_DIR}..."
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"
rsync -av --delete --exclude '.git' --exclude 'node_modules' --exclude 'setup-localhost.sh' "${PROJECT_ROOT}/" "${TARGET_DIR}/"
chown -R www-data:www-data "${TARGET_DIR}"
find "${TARGET_DIR}" -type d -exec chmod 755 {} \;
find "${TARGET_DIR}" -type f -exec chmod 644 {} \;

echo "[5/7] Importando schema do banco..."
mysql -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${TARGET_DIR}/database/init.sql"

echo "[6/7] Ajuste de configuração local..."
if [[ -f "${TARGET_DIR}/api/db_conexao.php" ]]; then
    sed -i "s/\$usuario  = \"root\";/\$usuario  = \"${DB_USER}\";/" "${TARGET_DIR}/api/db_conexao.php"
    sed -i "s/\$senha    = \"\";/\$senha    = \"${DB_PASS}\";/" "${TARGET_DIR}/api/db_conexao.php"
fi
if [[ -f "${TARGET_DIR}/api/config/database.php" ]]; then
    sed -i "s/\$usuario  = \"root\";/\$usuario  = \"${DB_USER}\";/" "${TARGET_DIR}/api/config/database.php"
    sed -i "s/\$senha    = \"\";/\$senha    = \"${DB_PASS}\";/" "${TARGET_DIR}/api/config/database.php"
fi

echo "[7/7] Reiniciando Apache..."
systemctl restart apache2

echo
 echo "Pronto. Acesse: http://localhost/clientflow/"
echo "Login admin padrão: admin@clientflow.com / 12345678"
echo "Banco: ${DB_NAME} | Usuário: ${DB_USER} | Senha: ${DB_PASS}"
