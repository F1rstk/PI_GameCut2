<?php
header('Content-Type: application/json');
require_once 'conexao.php';

$idUsuario = $_POST['idUsuario'] ?? null;
$idJogo = $_POST['idJogo'] ?? null;
$notaAvaliacao = $_POST['notaAvaliacao'] ?? null;
$descricaoAvaliacao = $_POST['descricaoAvaliacao'] ?? null;

if (!$idUsuario || !$idJogo || $notaAvaliacao === null || !$descricaoAvaliacao) {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit;
}

// Garantir que a nota esteja entre 0 e 5
$notaAvaliacao = intval($notaAvaliacao);
if ($notaAvaliacao < 0 || $notaAvaliacao > 5) {
    echo json_encode(['success' => false, 'message' => 'Nota inválida']);
    exit;
}

$sql = "INSERT INTO Avaliacao (idUsuario, idJogo, notaAvaliacao, descricaoAvaliacao)
        VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iiis", $idUsuario, $idJogo, $notaAvaliacao, $descricaoAvaliacao);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar avaliação']);
}
?>
