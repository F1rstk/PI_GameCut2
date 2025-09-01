<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST");

// Config banco
$host = "localhost";
$user = "root";
$password = "";
$dbname = "pibd";

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro de conexão"]);
    exit;
}

// Pega dados enviados pelo app
$data = json_decode(file_get_contents("php://input"), true);
$email = $data["email"] ?? "";
$senha = $data["senha"] ?? "";

// Validação básica
if (empty($email) || empty($senha)) {
    http_response_code(400);
    echo json_encode(["erro" => "Preencha todos os campos"]);
    exit;
}

// Consulta
$sql = "SELECT idUsuario, nomeUsuario, emailUsuario 
        FROM usuario 
        WHERE emailUsuario = ? AND senhaUsuario = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $email, $senha);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $usuario = $result->fetch_assoc();
    echo json_encode(["sucesso" => true, "usuario" => $usuario]);
} else {
    http_response_code(401);
    echo json_encode(["erro" => "Email ou senha incorretos"]);
}

$stmt->close();
$conn->close();
?>
