<?php
/***********************
 * Plant Diary - PHP API (router + auth)
 * Single file router for PHP built-in server.
 * Start server:  php -S 127.0.0.1:8000 api.php
 ***********************/

// Built-in server router prelude 
if (php_sapi_name() === 'cli-server') {
  $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
  $file = __DIR__ . $path;
  // If a real static file exists (e.g., /login.html /styles.css /login.js), let server serve it.
  if ($path !== '/' && file_exists($file) && !is_dir($file)) {
    return false; // critical: hand off to the static file
  }
}

//Debug: show errors in terminal 
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '0');

// CORS (allow local dev origins)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
];
if ($origin && in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  echo json_encode(['ok' => true, 'data' => 'preflight']);
  exit;
}

// Simple file DB 
$DB_DIR  = __DIR__ . '/data';
$DB_FILE = $DB_DIR . '/accounts.json';
if (!is_dir($DB_DIR)) { mkdir($DB_DIR, 0777, true); }
if (!file_exists($DB_FILE)) { file_put_contents($DB_FILE, "{}"); }

// helpers
function read_json($file) {
  $fp = fopen($file, 'r');
  if (!$fp) return [];
  flock($fp, LOCK_SH);
  $txt = stream_get_contents($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  $data = json_decode($txt ?: "{}", true);
  return is_array($data) ? $data : [];
}
function write_json($file, $arr) {
  $fp = fopen($file, 'c+');
  if (!$fp) return false;
  flock($fp, LOCK_EX);
  ftruncate($fp, 0);
  fwrite($fp, json_encode($arr, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
  return true;
}
function jbody() {
  $raw = file_get_contents('php://input');
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}
function ok($data = null) {
  echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
  exit;
}
function err($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}
function valid_email($e) {
  return filter_var($e, FILTER_VALIDATE_EMAIL);
}

// routing
$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// health
if ($method === 'GET' && $path === '/api/health') {
  ok(['status' => 'up']);
}

// signup
if ($method === 'POST' && $path === '/api/signup') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $password = $b['password'] ?? '';
  if (!$email || !$password) err('email/password required');
  if (!valid_email($email)) err('invalid email');

  $db = read_json($GLOBALS['DB_FILE']);
  if (isset($db[$email])) err('account exists', 409);

  $db[$email] = [
    'hash' => password_hash($password, PASSWORD_DEFAULT),
    'createdAt' => time()
  ];
  if (!write_json($GLOBALS['DB_FILE'], $db)) err('write fail', 500);
  ok(['email' => $email]);
}

// signin
if ($method === 'POST' && $path === '/api/signin') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $password = $b['password'] ?? '';
  if (!$email || !$password) err('email/password required');

  $db = read_json($GLOBALS['DB_FILE']);
  if (!isset($db[$email])) err('account not found', 404);
  if (!password_verify($password, $db[$email]['hash'])) err('incorrect password', 401);

  $token = base64_encode($email . '|' . time());
  ok(['email' => $email, 'token' => $token]);
}

// change password
if ($method === 'POST' && $path === '/api/change-password') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $old = $b['oldPassword'] ?? '';
  $new = $b['newPassword'] ?? '';
  if (!$email || !$old || !$new) err('email/oldPassword/newPassword required');

  $db = read_json($GLOBALS['DB_FILE']);
  if (!isset($db[$email])) err('account not found', 404);
  if (!password_verify($old, $db[$email]['hash'])) err('incorrect password', 401);

  $db[$email]['hash'] = password_hash($new, PASSWORD_DEFAULT);
  $db[$email]['changedAt'] = time();
  if (!write_json($GLOBALS['DB_FILE'], $db)) err('write fail', 500);
  ok(['email' => $email]);
}

// delete account
if ($method === 'POST' && $path === '/api/delete-account') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $password = $b['password'] ?? '';
  if (!$email || !$password) err('email/password required');

  $db = read_json($GLOBALS['DB_FILE']);
  if (!isset($db[$email])) err('account not found', 404);
  if (!password_verify($password, $db[$email]['hash'])) err('incorrect password', 401);

  unset($db[$email]);
  if (!write_json($GLOBALS['DB_FILE'], $db)) err('write fail', 500);
  ok(['email' => $email]);
}

// 404 fallback
err('not found', 404);