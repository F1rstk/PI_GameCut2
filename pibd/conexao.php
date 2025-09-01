<?php
// Configurações do banco
$servidor = "localhost";   // ou o IP do servidor MySQL
$usuario  = "root";        // usuário do MySQL
$senha    = "";            // senha do MySQL (em branco no XAMPP por padrão)
$banco    = "pibd";     // nome do banco de dados que você criou

// Criar conexão
$conn = new mysqli($servidor, $usuario, $senha, $banco);

// Checar conexão
if ($conn->connect_error) {
    die("Falha na conexão: " . $conn->connect_error);
}

// Para UTF-8 (acentos e caracteres especiais)
$conn->set_charset("utf8");
?>
