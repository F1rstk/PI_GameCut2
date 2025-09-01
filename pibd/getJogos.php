<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); // permite acesso do app

// Configurações do banco
$host = "localhost";
$user = "root";      // seu usuário do banco
$password = "";      // sua senha do banco (normalmente vazio no XAMPP)
$dbname = "pibd";

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro na conexão: " . $conn->connect_error]);
    exit;
}

// Query para trazer os dados dos jogos
$sql = "SELECT idJogo AS id, nomeJogo AS nome, generoJogo AS genero, desenvolvedoraJogo AS desenvolvedora, descricaoJogo AS descricao FROM jogo";

$result = $conn->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro na consulta: " . $conn->error]);
    exit;
}

$jogos = [];
while ($row = $result->fetch_assoc()) {
    $jogos[] = $row;
}

echo json_encode($jogos);
$conn->close();
?>
