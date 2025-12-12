#!/usr/bin/env python3
"""
Auditoria completa de BigQuery y GCP
Proyecto: sunny-advantage-471523-b3
"""
import json
import base64
import subprocess
import time
import urllib.request
import urllib.parse
import os

CREDENTIALS_FILE = "/home/user/signalssheets/credentials/gcp-service-account.json"
PROJECT_ID = "sunny-advantage-471523-b3"
OUTPUT_DIR = "/home/user/signalssheets/audit_2024"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def base64url_encode(data):
    if isinstance(data, str):
        data = data.encode('utf-8')
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

class GCPAuditor:
    def __init__(self):
        with open(CREDENTIALS_FILE) as f:
            self.creds = json.load(f)
        self.token = None

    def get_token(self):
        if self.token:
            return self.token

        client_email = self.creds['client_email']
        private_key = self.creds['private_key']

        with open('/tmp/pk.pem', 'w') as f:
            f.write(private_key)

        header = {"alg": "RS256", "typ": "JWT"}
        header_b64 = base64url_encode(json.dumps(header, separators=(',', ':')))

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

        message = f"{header_b64}.{payload_b64}"

        proc = subprocess.run(
            ['openssl', 'dgst', '-sha256', '-sign', '/tmp/pk.pem'],
            input=message.encode(),
            capture_output=True
        )
        signature = base64url_encode(proc.stdout)
        jwt_token = f"{message}.{signature}"

        data = urllib.parse.urlencode({
            'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion': jwt_token
        }).encode()

        req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data, method='POST')
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())

        self.token = result.get('access_token')
        return self.token

    def api_get(self, url):
        token = self.get_token()
        req = urllib.request.Request(url, headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return {'error': {'code': e.code, 'message': e.read().decode()}}

    def api_post(self, url, data):
        token = self.get_token()
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }, method='POST')
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return {'error': {'code': e.code, 'message': e.read().decode()}}

    def bq_query(self, query):
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/queries"
        return self.api_post(url, {"query": query, "useLegacySql": False, "maxResults": 10000})

    def save(self, filename, data):
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        return filepath


def main():
    print("=" * 70)
    print("AUDITORIA COMPLETA GCP - BigQuery")
    print(f"Proyecto: {PROJECT_ID}")
    print("=" * 70)
    print()

    auditor = GCPAuditor()
    results = {}

    # 1. DATASETS
    print("[1/10] Datasets...")
    url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/datasets"
    datasets = auditor.api_get(url)
    auditor.save("01_datasets.json", datasets)
    results['datasets'] = datasets

    ds_list = [d['datasetReference']['datasetId'] for d in datasets.get('datasets', [])]
    print(f"       Encontrados: {ds_list}")

    # 2. TABLAS
    print("[2/10] Tablas...")
    results['tables'] = {}
    for ds in ds_list:
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/datasets/{ds}/tables"
        tables = auditor.api_get(url)
        results['tables'][ds] = tables
        auditor.save(f"02_tables_{ds}.json", tables)

        tbl_list = [t['tableReference']['tableId'] for t in tables.get('tables', [])]
        print(f"       {ds}: {tbl_list}")

        # Detalle de cada tabla
        for tbl in tbl_list:
            url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/datasets/{ds}/tables/{tbl}"
            tbl_info = auditor.api_get(url)
            auditor.save(f"02_table_{ds}_{tbl}.json", tbl_info)

    # 3. RUTINAS
    print("[3/10] Rutinas (SPs, funciones)...")
    results['routines'] = {}
    for ds in ds_list:
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/datasets/{ds}/routines"
        routines = auditor.api_get(url)
        results['routines'][ds] = routines
        auditor.save(f"03_routines_{ds}.json", routines)

        r_list = [r['routineReference']['routineId'] for r in routines.get('routines', [])]
        if r_list:
            print(f"       {ds}: {r_list}")

            for r in r_list:
                url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/datasets/{ds}/routines/{r}"
                r_info = auditor.api_get(url)
                auditor.save(f"03_routine_{ds}_{r}.json", r_info)

    # 4. SCHEDULED QUERIES
    print("[4/10] Scheduled Queries...")
    url = f"https://bigquerydatatransfer.googleapis.com/v1/projects/{PROJECT_ID}/locations/-/transferConfigs"
    sq = auditor.api_get(url)
    results['scheduled_queries'] = sq
    auditor.save("04_scheduled_queries.json", sq)

    configs = sq.get('transferConfigs', [])
    print(f"       Encontradas: {len(configs)}")
    for c in configs:
        name = c.get('displayName', c['name'].split('/')[-1])
        print(f"         - {name}")
        # Runs recientes
        url = f"https://bigquerydatatransfer.googleapis.com/v1/{c['name']}/runs?pageSize=20"
        runs = auditor.api_get(url)
        auditor.save(f"04_runs_{name.replace(' ', '_')}.json", runs)

    # 5. JOBS
    print("[5/10] Jobs recientes...")
    url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{PROJECT_ID}/jobs?maxResults=100&allUsers=true"
    jobs = auditor.api_get(url)
    results['jobs'] = jobs
    auditor.save("05_jobs.json", jobs)
    print(f"       Encontrados: {len(jobs.get('jobs', []))}")

    # 6. CLOUD FUNCTIONS
    print("[6/10] Cloud Functions...")
    url = f"https://cloudfunctions.googleapis.com/v1/projects/{PROJECT_ID}/locations/-/functions"
    funcs = auditor.api_get(url)
    results['cloud_functions'] = funcs
    auditor.save("06_cloud_functions.json", funcs)

    func_list = funcs.get('functions', [])
    print(f"       Encontradas: {len(func_list)}")
    for f in func_list:
        name = f['name'].split('/')[-1]
        print(f"         - {name}")

    # 7. CLOUD SCHEDULER
    print("[7/10] Cloud Scheduler...")
    all_jobs = []
    for region in ['us-central1', 'us-east1', 'europe-west1', 'us-west1']:
        url = f"https://cloudscheduler.googleapis.com/v1/projects/{PROJECT_ID}/locations/{region}/jobs"
        sched = auditor.api_get(url)
        all_jobs.extend(sched.get('jobs', []))
    results['scheduler'] = {'jobs': all_jobs}
    auditor.save("07_scheduler.json", results['scheduler'])
    print(f"       Encontrados: {len(all_jobs)}")
    for j in all_jobs:
        print(f"         - {j['name'].split('/')[-1]}")

    # 8. INFORMATION_SCHEMA
    print("[8/10] INFORMATION_SCHEMA...")

    # Tables
    q = f"SELECT * FROM `{PROJECT_ID}.market_data.INFORMATION_SCHEMA.TABLES`"
    info_tables = auditor.bq_query(q)
    auditor.save("08_info_tables.json", info_tables)

    # Columns
    q = f"SELECT * FROM `{PROJECT_ID}.market_data.INFORMATION_SCHEMA.COLUMNS` ORDER BY table_name, ordinal_position"
    info_cols = auditor.bq_query(q)
    auditor.save("08_info_columns.json", info_cols)

    # Routines
    q = f"SELECT * FROM `{PROJECT_ID}.market_data.INFORMATION_SCHEMA.ROUTINES`"
    info_routines = auditor.bq_query(q)
    auditor.save("08_info_routines.json", info_routines)

    # Partitions
    q = f"SELECT * FROM `{PROJECT_ID}.market_data.INFORMATION_SCHEMA.PARTITIONS` ORDER BY table_name, partition_id DESC"
    info_parts = auditor.bq_query(q)
    auditor.save("08_info_partitions.json", info_parts)

    print("       Metadata guardada")

    # 9. ESTADISTICAS
    print("[9/10] Estadisticas de tablas...")

    queries = {
        'staging_stats': f"SELECT COUNT(*) as rows, MIN(date) as min_date, MAX(date) as max_date, COUNT(DISTINCT date) as dates FROM `{PROJECT_ID}.market_data.stg_prices_polygon_raw`",
        'prices_stats': f"SELECT COUNT(*) as rows, MIN(date) as min_date, MAX(date) as max_date, COUNT(DISTINCT date) as dates FROM `{PROJECT_ID}.market_data.Prices`",
        'staging_sample': f"SELECT * FROM `{PROJECT_ID}.market_data.stg_prices_polygon_raw` LIMIT 5",
        'prices_sample': f"SELECT * FROM `{PROJECT_ID}.market_data.Prices` LIMIT 5",
    }

    results['statistics'] = {}
    for name, q in queries.items():
        print(f"       {name}...")
        result = auditor.bq_query(q)
        results['statistics'][name] = result
        auditor.save(f"09_{name}.json", result)

    # 10. IAM
    print("[10/10] IAM Policy...")
    url = f"https://cloudresourcemanager.googleapis.com/v1/projects/{PROJECT_ID}:getIamPolicy"
    iam = auditor.api_post(url, {})
    results['iam'] = iam
    auditor.save("10_iam_policy.json", iam)
    print(f"       Bindings: {len(iam.get('bindings', []))}")

    # Guardar todo
    auditor.save("_full_audit.json", results)

    print()
    print("=" * 70)
    print(f"AUDITORIA COMPLETADA")
    print(f"Resultados en: {OUTPUT_DIR}")
    print("=" * 70)

    # Listar archivos
    print("\nArchivos generados:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.json'):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            print(f"  {f} ({size} bytes)")

    return results


if __name__ == "__main__":
    main()
