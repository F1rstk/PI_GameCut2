<?php
header('Content-Type: application/json');
require_once 'conexao.php';

if (!isset($_GET['jogo_id'])) {
    echo json_encode([]);
    exit;
}

$jogo_id = intval($_GET['jogo_id']);

$sql = "SELECT a.notaAvaliacao, a.descricaoAvaliacao, u.nomeUsuario
        FROM Avaliacao a
        JOIN Usuario u ON a.idUsuario = u.idUsuario
        WHERE a.idJogo = ? 
        ORDER BY a.idAvaliacao DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $jogo_id);
$stmt->execute();
$result = $stmt->get_result();

$avaliacoes = [];
while ($row = $result->fetch_assoc()) {
    $avaliacoes[] = $row;
}

echo json_encode($avaliacoes);
?>
