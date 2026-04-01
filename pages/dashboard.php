<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - ClientFlow</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<div class="layout">

    <aside class="sidebar">
        <h2>ClientFlow</h2>
        <ul>
            <li><a href="index.php?page=dashboard">Dashboard</a></li>
            <li><a href="index.php?page=novo_checklist">Novo Checklist</a></li>
            <li><a href="index.php?page=area_cliente">Área do Cliente</a></li>
            <li><a href="#">Sair</a></li>
        </ul>
    </aside>

    <!-- CONTEÚDO -->
    <main class="content">
        <h1>Painel de Controle</h1>

        <div class="card">
            <h3>Cliente XPTO</h3>
            <div class="progress-bar">
                <div class="progress" style="width: 60%;"></div>
            </div>
            <p>60% concluído</p>
        </div>

        <div class="card">
            <h3>Cliente ABC</h3>
            <div class="progress-bar">
                <div class="progress" style="width: 30%;"></div>
            </div>
            <p>30% concluído</p>
        </div>

    </main>

</div>

</body>
</html>