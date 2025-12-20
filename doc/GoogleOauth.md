ddd

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="https://accounts.google.com/gsi/client"></script>
  </head>
  <body>
    <button id="googleLogin">Login Google</button>
  </body>
</html>
```

xx

```javascript
let tokenClient;

window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: "GOOGLE_CLIENT_ID",
    scope: "email profile",
    callback: (res) => {
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: "Bearer " + res.access_token,
        },
      })
        .then((r) => r.json())
        .then((user) => {
          // Kirim ke Backend (server)
          fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          });
        });
    },
  });
};

document.getElementById("googleLogin").onclick = () => {
  tokenClient.requestAccessToken(); // 🔥 INI YANG MEMUNCULKAN POPUP
};
```

```php
public function google()
{
    $data = json_decode(file_get_contents('php://input'), true);

    // cari / buat user
    $user = User::firstOrCreate(
        ['google_id' => $data['sub']],
        ['email' => $data['email'], 'name' => $data['name']]
    );

    $jwt = JWT::encode([
        'uid' => $user->id,
        'iat' => time(),
        'exp' => time() + 86400
    ], config('SECRET_KEY'), 'HS256');

    return response()->json([
        'token' => $jwt,
        'user' => $user
    ]);
}

```

atau

```javascript
tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: "GOOGLE_CLIENT_ID",
  scope: "email profile",
  callback: (res) => {
    fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: res.access_token,
      }),
    });
  },
});

document.getElementById("googleLogin").onclick = () => {
  tokenClient.requestAccessToken();
};
```

```php
public function google()
{
    $input = json_decode(file_get_contents('php://input'), true);
    $accessToken = $input['access_token'] ?? null;

    if (!$accessToken) {
        return response()->json(['error' => 'No access token'], 400);
    }

    // Ambil user info dari Google (SERVER → GOOGLE)
    $ch = curl_init('https://www.googleapis.com/oauth2/v3/userinfo');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken
        ]
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $user = json_decode($response, true);

    if (!isset($user['sub'])) {
        return response()->json(['error' => 'Invalid Google token'], 401);
    }

    // Cari / buat user
    $account = User::firstOrCreate(
        ['google_id' => $user['sub']],
        ['email' => $user['email'], 'name' => $user['name']]
    );

    // Buat JWT aplikasi
    $jwt = JWT::encode([
        'uid' => $account->id,
        'iat' => time(),
        'exp' => time() + 86400
    ], config('SECRET_KEY'), 'HS256');

    return response()->json([
        'token' => $jwt,
        'user' => $account
    ]);
}

```
