#!/usr/bin/env bash
set -euo pipefail

SRC="/home/juniorplaster/ClientFlow"
DST="/opt/lampp/htdocs/ClientFlow"

resolve_web_owner() {
  local detected_user
  detected_user="$(ps -eo user,comm | awk '$2 ~ /httpd|apache2/ && $1 != "root" {print $1; exit}')"

  if [[ -n "$detected_user" ]] && getent passwd "$detected_user" >/dev/null 2>&1; then
    echo "$detected_user"
    return
  fi

  for candidate in daemon www-data nobody nfsnobody; do
    if getent passwd "$candidate" >/dev/null 2>&1; then
      echo "$candidate"
      return
    fi
  done

  echo "root"
}

if [[ $EUID -ne 0 ]]; then
  echo "Execute como root: su -"
  echo "Depois rode: /home/juniorplaster/ClientFlow/sync-xampp.sh"
  exit 1
fi

echo "[1/4] Sincronizando arquivos do projeto para o XAMPP..."
rsync -av --delete --exclude '.git' --exclude 'node_modules' "$SRC/" "$DST/"

echo "[2/4] Ajustando permissões para o Apache do XAMPP..."
WEB_USER="$(resolve_web_owner)"
WEB_GROUP="$(id -gn "$WEB_USER" 2>/dev/null || echo "$WEB_USER")"
echo "Usando dono: ${WEB_USER}:${WEB_GROUP}"
chown -R "${WEB_USER}:${WEB_GROUP}" "$DST"
find "$DST" -type d -exec chmod 755 {} \;
find "$DST" -type f -exec chmod 644 {} \;

echo "[3/4] Reimportando schema do banco clientflow..."
/opt/lampp/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS clientflow CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
/opt/lampp/bin/mysql -u root clientflow < "$DST/database/init.sql"

echo "[4/4] Reiniciando serviços XAMPP..."
/opt/lampp/lampp restart || true

echo
echo "Sincronizacao concluida."
echo "Abra: http://localhost/ClientFlow/"
