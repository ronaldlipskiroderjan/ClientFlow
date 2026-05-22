<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuario não autenticado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== 'admin') {
    $retorno["mensagem"] = "Perfil sem permissão para acessar esta área.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$create_table = "CREATE TABLE IF NOT EXISTS planos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_plano VARCHAR(50) NOT NULL,
    limite_coletas INT NOT NULL,
    limite_armazenamento INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$conexao->query($create_table);

$sql_planos = "INSERT IGNORE INTO planos (id, nome_plano, limite_coletas, limite_armazenamento) VALUES 
    (1, 'Individual Grátis', 10, 5), (2, 'Básico', 25, 20), (3, 'Profissional', 100, 100), (4, 'Enterprise', 999999, 1000)";
$conexao->query($sql_planos);

$conexao->query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS plano_id INT NULL");
$conexao->query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_ultimo_acesso TIMESTAMP NULL");

$page          = isset($_GET['page'])     ? (int)$_GET['page']     : 1;
$limit         = isset($_GET['limit'])    ? (int)$_GET['limit']    : 10;
$offset        = ($page - 1) * $limit;
$status_filtro = isset($_GET['status'])   ? $_GET['status']        : '';
$plano_filtro  = isset($_GET['plano_id']) ? (int)$_GET['plano_id'] : 0;
$tipo_filtro   = isset($_GET['tipo'])     ? $_GET['tipo']          : '';
$tipo_prestador = isset($_GET['tipo_prestador']) ? $_GET['tipo_prestador'] : '';

$where_clauses = [];
$params = [];
$types  = "";

if ($status_filtro !== '') {
    $where_clauses[] = "u.status_conta = ?";
    $params[] = $status_filtro;
    $types   .= "s";
}

if ($plano_filtro > 0) {
    $where_clauses[] = "u.plano_id = ?";
    $params[] = $plano_filtro;
    $types   .= "i";
}

if ($tipo_filtro !== '') {
    $tipo_db = ($tipo_filtro === 'agency') ? 'agency_member' : $tipo_filtro;
    $where_clauses[] = "u.tipo = ?";
    $params[] = $tipo_db;
    $types   .= "s";
}

if ($tipo_prestador === 'pj') {
    $where_clauses[] = "(u.nome_empresa IS NOT NULL AND u.nome_empresa != '')";
} elseif ($tipo_prestador === 'pf') {
    $where_clauses[] = "(u.nome_empresa IS NULL OR u.nome_empresa = '')";
}

$where_sql = count($where_clauses) > 0 ? "WHERE " . implode(" AND ", $where_clauses) : "";

$count_query = "SELECT COUNT(*) as total FROM usuarios u $where_sql";
$stmt_count = $conexao->prepare($count_query);
if (count($params) > 0) {
    $stmt_count->bind_param($types, ...$params);
}
$stmt_count->execute();
$total_rows = $stmt_count->get_result()->fetch_assoc()['total'];
$stmt_count->close();

$query = "SELECT u.id, u.nome, u.nome_empresa, u.email, u.tipo, u.status_conta, u.criado_em, u.data_ultimo_acesso, u.plano_id, p.nome_plano
          FROM usuarios u
          LEFT JOIN planos p ON u.plano_id = p.id
          $where_sql
          ORDER BY u.criado_em DESC
          LIMIT ? OFFSET ?";

$stmt = $conexao->prepare($query);
if (!$stmt) {
    $retorno["mensagem"] = "Erro ao preparar consulta";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$params[] = $limit;
$params[] = $offset;
$types .= "ii";

$stmt->bind_param($types, ...$params);
$stmt->execute();
$resultado = $stmt->get_result();

$usuarios = [];
while ($linha = $resultado->fetch_assoc()) {
    $usuarios[] = [
        "id"                 => intval($linha['id']),
        "nome"               => $linha['nome'],
        "nome_empresa"       => $linha['nome_empresa'],
        "email"              => $linha['email'],
        "tipo"               => $linha['tipo'],
        "status_conta"       => $linha['status_conta'],
        "criado_em"          => $linha['criado_em'],
        "data_ultimo_acesso" => $linha['data_ultimo_acesso'],
        "plano_id"           => $linha['plano_id'],
        "nome_plano"         => $linha['nome_plano']
    ];
}

$retorno["pagination"] = [
    "total" => $total_rows,
    "pages" => ceil($total_rows / $limit),
    "page" => $page,
    "limit" => $limit
];

$retorno["status"] = "ok";
$retorno["mensagem"] = "Usuários carregados com sucesso";
$retorno["data"] = $usuarios;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
