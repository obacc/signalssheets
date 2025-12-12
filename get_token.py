#!/usr/bin/env python3
"""
Genera un access token de GCP usando openssl para firmar
"""
import json
import base64
import subprocess
import time
import urllib.request
import urllib.parse

CREDENTIALS_FILE = "/home/user/signalssheets/credentials/gcp-service-account.json"

def base64url_encode(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def get_access_token():
    # Leer credenciales
    with open(CREDENTIALS_FILE) as f:
        creds = json.load(f)

    client_email = creds['client_email']
    private_key = creds['private_key']

    # Guardar private key
    with open('/tmp/pk.pem', 'w') as f:
        f.write(private_key)

    # JWT Header
    header = {"alg": "RS256", "typ": "JWT"}
    header_b64 = base64url_encode(json.dumps(header, separators=(',', ':')))

    # JWT Payload
    now = int(time.time())
    payload = {
        "iss": client_email,
        "sub": client_email,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now,
        "exp": now + 3600,
        "scope": "https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/cloud-platform"
    }
    payload_b64 = base64url_encode(json.dumps(payload, separators=(',', ':')))

    # Mensaje a firmar
    message = f"{header_b64}.{payload_b64}"

    # Firmar con openssl
    proc = subprocess.run(
        ['openssl', 'dgst', '-sha256', '-sign', '/tmp/pk.pem'],
        input=message.encode(),
        capture_output=True
    )

    if proc.returncode != 0:
        raise Exception(f"Error signing: {proc.stderr.decode()}")

    signature = base64url_encode(proc.stdout)

    # JWT completo
    jwt_token = f"{message}.{signature}"

    # Intercambiar por access token
    data = urllib.parse.urlencode({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt_token
    }).encode()

    req = urllib.request.Request(
        'https://oauth2.googleapis.com/token',
        data=data,
        method='POST'
    )

    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())

    return result.get('access_token')

if __name__ == "__main__":
    token = get_access_token()
    print(token)
