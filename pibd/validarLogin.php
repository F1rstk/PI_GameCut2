<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$host = "localhost";
$user = "root";
$password = "";
$dbname = "pibd";

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro na conexão: " . $conn->connect_error]);
    exit;
}

// Recebe dados via POST
$data = json_decode(file_get_contents("php://input"));

$email = $data->email ?? "";
$senha = $data->senha ?? "";

// Verifica se passou email e senha
if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(["erro" => "Email e senha são obrigatórios"]);
    exit;
}

// Consulta para buscar usuário com email
$stmt = $conn->prepare("SELECT idUsuario, nomeUsuario, emailUsuario, senhaUsuario FROM Usuario WHERE emailUsuario = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Usuário não encontrado
    http_response_code(401);
    echo json_encode(["erro" => "Email ou senha incorretos"]);
    exit;
}

$user = $result->fetch_assoc();

// Para simplificar, comparando senha plain text (não seguro, ideal usar hash na prática)
if ($senha !== $user['senhaUsuario']) {
    http_response_code(401);
    echo json_encode(["erro" => "Email ou senha incorretos"]);
    exit;
}

// Login ok, retorna dados do usuário (sem senha)
unset($user['senhaUsuario']);
echo json_encode($user);

$conn->close();
?>
