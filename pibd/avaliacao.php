<?php
header("Content-Type: application/json; charset=UTF-8");

include "conexao.php"; // conecta ao banco

$data = json_decode(file_get_contents("php://input"), true);

$id_usuario = $data["id_usuario"];
$id_jogo = $data["id_jogo"];
$nota = $data["nota"];
$comentario = $data["comentario"];

// Insere avaliação no banco
$sql = "INSERT INTO avaliacoes (id_usuario, id_jogo, nota, comentario) 
        VALUES ('$id_usuario', '$id_jogo', '$nota', '$comentario')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}

$conn->close();
?>
