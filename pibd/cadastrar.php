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

$data = json_decode(file_get_contents("php://input"), true);
$nome = $data["nome"] ?? "";
$email = $data["email"] ?? "";
$senha = $data["senha"] ?? "";
$confirmarSenha = $data["confirmarSenha"] ?? "";

if (empty($nome) || empty($email) || empty($senha) || empty($confirmarSenha)) {
    http_response_code(400);
    echo json_encode(["erro" => "Preencha todos os campos"]);
    exit;
}

if ($senha !== $confirmarSenha) {
    http_response_code(400);
    echo json_encode(["erro" => "As senhas não coincidem"]);
    exit;
}

// Verificar se email já existe
$sqlCheck = "SELECT idUsuario FROM usuario WHERE emailUsuario = ?";
$stmtCheck = $conn->prepare($sqlCheck);
$stmtCheck->bind_param("s", $email);
$stmtCheck->execute();
$stmtCheck->store_result();

if ($stmtCheck->num_rows > 0) {
    http_response_code(409);
    echo json_encode(["erro" => "Email já cadastrado"]);
    $stmtCheck->close();
    $conn->close();
    exit;
}
$stmtCheck->close();

// Inserir novo usuário
$sqlInsert = "INSERT INTO usuario (nomeUsuario, emailUsuario, senhaUsuario) VALUES (?, ?, ?)";
$stmtInsert = $conn->prepare($sqlInsert);
$stmtInsert->bind_param("sss", $nome, $email, $senha);

if ($stmtInsert->execute()) {
    echo json_encode(["sucesso" => true, "mensagem" => "Usuário cadastrado com sucesso"]);
} else {
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao cadastrar usuário"]);
}

$stmtInsert->close();
$conn->close();
?>
