<?php
/***********************
 * Plant Diary - PHP API (router + auth + plants + profiles)
 * Single file router for PHP built-in server.
 * Start server:  php -S 127.0.0.1:8000 api.php
 ***********************/

// Built-in server router prelude 
if (php_sapi_name() === 'cli-server') {
  $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
  $file = __DIR__ . $path;
  if ($path !== '/' && file_exists($file) && !is_dir($file)) {
    return false;
  }
}

error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('log_errors', '0');

// CORS
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
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  echo json_encode(['ok' => true, 'data' => 'preflight']);
  exit;
}

// Database files
$DB_DIR  = __DIR__ . '/data';
$ACCOUNTS_FILE = $DB_DIR . '/accounts.json';
$PLANTS_FILE = $DB_DIR . '/plants.json';
$PROFILES_FILE = $DB_DIR . '/profiles.json';

if (!is_dir($DB_DIR)) { mkdir($DB_DIR, 0777, true); }
if (!file_exists($ACCOUNTS_FILE)) { file_put_contents($ACCOUNTS_FILE, "{}"); }
if (!file_exists($PLANTS_FILE)) { file_put_contents($PLANTS_FILE, "{}"); }
if (!file_exists($PROFILES_FILE)) { file_put_contents($PROFILES_FILE, "{}"); }

// Helpers
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

function get_auth_email() {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
    $token = $m[1];
    $decoded = base64_decode($token, true);
    if ($decoded) {
      $parts = explode('|', $decoded);
      if (count($parts) === 2) {
        return $parts[0];
      }
    }
  }
  return null;
}

// Routing
$method = $_SERVER['REQUEST_METHOD'];
$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Health check
if ($method === 'GET' && $path === '/api/health') {
  ok(['status' => 'up']);
}

// ============ ACCOUNT ENDPOINTS ============

// Signup
if ($method === 'POST' && $path === '/api/signup') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $password = $b['password'] ?? '';
  if (!$email || !$password) err('email/password required');
  if (!valid_email($email)) err('invalid email');

  $db = read_json($GLOBALS['ACCOUNTS_FILE']);
  if (isset($db[$email])) err('account exists', 409);

  $db[$email] = [
    'hash' => password_hash($password, PASSWORD_DEFAULT),
    'createdAt' => time()
  ];
  if (!write_json($GLOBALS['ACCOUNTS_FILE'], $db)) err('write fail', 500);
  ok(['email' => $email]);
}

// Signin
if ($method === 'POST' && $path === '/api/signin') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $password = $b['password'] ?? '';
  if (!$email || !$password) err('email/password required');

  $db = read_json($GLOBALS['ACCOUNTS_FILE']);
  if (!isset($db[$email])) err('account not found', 404);
  if (!password_verify($password, $db[$email]['hash'])) err('incorrect password', 401);

  $token = base64_encode($email . '|' . time());
  ok(['email' => $email, 'token' => $token]);
}

// Change password
if ($method === 'POST' && $path === '/api/change-password') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $old = $b['oldPassword'] ?? '';
  $new = $b['newPassword'] ?? '';
  if (!$email || !$old || !$new) err('email/oldPassword/newPassword required');

  $db = read_json($GLOBALS['ACCOUNTS_FILE']);
  if (!isset($db[$email])) err('account not found', 404);
  if (!password_verify($old, $db[$email]['hash'])) err('incorrect password', 401);

  $db[$email]['hash'] = password_hash($new, PASSWORD_DEFAULT);
  $db[$email]['changedAt'] = time();
  if (!write_json($GLOBALS['ACCOUNTS_FILE'], $db)) err('write fail', 500);
  ok(['email' => $email]);
}

// Delete account
if ($method === 'POST' && $path === '/api/delete-account') {
  $b = jbody();
  $email = trim($b['email'] ?? '');
  $password = $b['password'] ?? '';
  if (!$email || !$password) err('email/password required');

  $db = read_json($GLOBALS['ACCOUNTS_FILE']);
  if (!isset($db[$email])) err('account not found', 404);
  if (!password_verify($password, $db[$email]['hash'])) err('incorrect password', 401);

  unset($db[$email]);
  if (!write_json($GLOBALS['ACCOUNTS_FILE'], $db)) err('write fail', 500);
  
  // Delete user's plants
  $plants = read_json($GLOBALS['PLANTS_FILE']);
  if (isset($plants[$email])) {
    unset($plants[$email]);
    write_json($GLOBALS['PLANTS_FILE'], $plants);
  }
  
  // Delete user's profile
  $profiles = read_json($GLOBALS['PROFILES_FILE']);
  if (isset($profiles[$email])) {
    unset($profiles[$email]);
    write_json($GLOBALS['PROFILES_FILE'], $profiles);
  }
  
  ok(['email' => $email]);
}

<<<<<<< Updated upstream
// ============ PROFILE ENDPOINTS ============

// Get user profile
if ($method === 'GET' && $path === '/api/profile') {
  $email = get_auth_email();
  if (!$email) err('unauthorized', 401);

  $profiles = read_json($GLOBALS['PROFILES_FILE']);
  $profile = $profiles[$email] ?? null;
  
  if (!$profile) {
    // Return default profile
    ok([
      'name' => explode('@', $email)[0],
      'image' => null
    ]);
  } else {
    ok($profile);
  }
}

// Save/Update user profile
if ($method === 'POST' && $path === '/api/profile') {
  $email = get_auth_email();
  if (!$email) err('unauthorized', 401);

=======
// ---- send reminder email (server-side) ----
// POST /api/send-reminder  { to, subject, body }
// if ($method === 'POST' && $path === '/api/send-reminder') {
//   $b = jbody();
//   $to = trim($b['to'] ?? '');
//   $subject = $b['subject'] ?? 'Plant Reminder';
//   $body = $b['body'] ?? '';

//   if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) err('invalid to');
//   if (!$body) err('empty body');

//   // method A：PHP  mail()(need SMTP
//   $headers = [];
//   $headers[] = 'From: Plant Diary <no-reply@localhost>';
//   $headers[] = 'Content-Type: text/plain; charset=UTF-8';
//   $ok = @mail($to, $subject, $body, implode("\r\n", $headers));

//   if (!$ok) err('mail() failed on this machine', 500);
//   ok(['sent' => true]);
// }

// ---- send reminder email (server-side, PHPMailer + Gmail SMTP) ----
// POST /api/send-reminder  { to, subject, body }
if ($method === 'POST' && $path === '/api/send-reminder') {
>>>>>>> Stashed changes
  $b = jbody();
  $name = trim($b['name'] ?? '');
  $image = $b['image'] ?? null;
  
  if (!$name) err('name required');

  $profiles = read_json($GLOBALS['PROFILES_FILE']);
  $profiles[$email] = [
    'name' => $name,
    'image' => $image,
    'updatedAt' => time()
  ];
  
  if (!write_json($GLOBALS['PROFILES_FILE'], $profiles)) err('write fail', 500);
  ok($profiles[$email]);
}

<<<<<<< Updated upstream
// ============ PLANT ENDPOINTS ============

// Get user's plants
if ($method === 'GET' && $path === '/api/plants') {
  $email = get_auth_email();
  if (!$email) err('unauthorized', 401);

  $plants = read_json($GLOBALS['PLANTS_FILE']);
  $userPlants = $plants[$email] ?? [];
  ok($userPlants);
}

// Add a plant
if ($method === 'POST' && $path === '/api/plants') {
  $email = get_auth_email();
  if (!$email) err('unauthorized', 401);

  $b = jbody();
  $plant = $b['plant'] ?? null;
  if (!$plant) err('plant data required');

  $plants = read_json($GLOBALS['PLANTS_FILE']);
  if (!isset($plants[$email])) {
    $plants[$email] = [];
  }
  
  $plant['id'] = uniqid('plant_', true);
  $plant['createdAt'] = time();
  $plants[$email][] = $plant;
  
  if (!write_json($GLOBALS['PLANTS_FILE'], $plants)) err('write fail', 500);
  ok($plant);
}

// Update a plant
if ($method === 'PUT' && $path === '/api/plants') {
  $email = get_auth_email();
  if (!$email) err('unauthorized', 401);

  $b = jbody();
  $index = $b['index'] ?? null;
  $plant = $b['plant'] ?? null;
  if ($index === null || !$plant) err('index and plant data required');

  $plants = read_json($GLOBALS['PLANTS_FILE']);
  if (!isset($plants[$email]) || !isset($plants[$email][$index])) {
    err('plant not found', 404);
  }
  
  $plant['id'] = $plants[$email][$index]['id'] ?? uniqid('plant_', true);
  $plant['createdAt'] = $plants[$email][$index]['createdAt'] ?? time();
  $plant['updatedAt'] = time();
  
  $plants[$email][$index] = $plant;
  
  if (!write_json($GLOBALS['PLANTS_FILE'], $plants)) err('write fail', 500);
  ok($plant);
}

// Delete a plant
if ($method === 'DELETE' && $path === '/api/plants') {
  $email = get_auth_email();
  if (!$email) err('unauthorized', 401);

  $b = jbody();
  $index = $b['index'] ?? null;
  if ($index === null) err('index required');

  $plants = read_json($GLOBALS['PLANTS_FILE']);
  if (!isset($plants[$email]) || !isset($plants[$email][$index])) {
    err('plant not found', 404);
  }
  
  array_splice($plants[$email], $index, 1);
  
  if (!write_json($GLOBALS['PLANTS_FILE'], $plants)) err('write fail', 500);
  ok(['deleted' => true]);
=======
  // 1) load PHPMailer（composer require phpmailer/phpmailer）
  $vendor = __DIR__ . '/vendor/autoload.php';
  if (!file_exists($vendor)) {
    err('PHPMailer not installed. Run `composer require phpmailer/phpmailer`', 500);
  }
  require_once $vendor;

  // 2) SMTP
  $SMTP_HOST = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
  $SMTP_PORT = (int)(getenv('SMTP_PORT') ?: 587);     // 587+tls,back up：465+ssl
  $SMTP_SECURE = getenv('SMTP_SECURE') ?: 'tls';      // 'tls' or 'ssl'
  $SMTP_USER = getenv('SMTP_USER') ?: '';             // my gmail
  $SMTP_PASS = getenv('SMTP_PASS') ?: '';             // 16 digit App Password
  $FROM_EMAIL = getenv('FROM_EMAIL') ?: $SMTP_USER;   // Gmail from the same account
  $FROM_NAME  = getenv('FROM_NAME') ?: 'Plant Diary';


  if (!$SMTP_USER || !$SMTP_PASS) {
    err('SMTP credentials missing. Set env: SMTP_USER / SMTP_PASS', 500);
  }


  $logDir = __DIR__ . '/data';
  if (!is_dir($logDir)) { mkdir($logDir, 0777, true); }

  try {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

 
    $mail->SMTPDebug = 2; 
    $debugStream = fopen($logDir . '/smtp-debug.log', 'a');
    $mail->Debugoutput = function($str, $level) use ($debugStream) {
      fwrite($debugStream, date('c') . " [L{$level}] " . $str . "\n");
    };

    // 4) SMTP connection
    $mail->isSMTP();
    $mail->Host       = $SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = $SMTP_USER;
    $mail->Password   = $SMTP_PASS;
    $mail->SMTPSecure = $SMTP_SECURE; // 'tls' or 'ssl'
    $mail->Port       = $SMTP_PORT;

    // 5) get email body
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($FROM_EMAIL, $FROM_NAME);
    $mail->addAddress($to);
    $mail->Subject = $subject;
    $mail->Body    = $body;      

    // 6) send
    $mail->send();

    if ($debugStream) fclose($debugStream);
    ok(['sent' => true]);
  } catch (Throwable $e) {
    if (isset($debugStream) && $debugStream) fclose($debugStream);
    err('SMTP send failed: ' . $e->getMessage(), 500);
  }
>>>>>>> Stashed changes
}

// 404 fallback
err('not found', 404);