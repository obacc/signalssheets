#!/usr/bin/env python3
"""
Auditoria completa de BigQuery y GCP
Proyecto: sunny-advantage-471523-b3
"""
import json
import time
import jwt
import requests
from datetime import datetime, timedelta

# Configuracion
CREDENTIALS_FILE = "/home/user/signalssheets/credentials/gcp-service-account.json"
PROJECT_ID = "sunny-advantage-471523-b3"

class GCPAuditor:
    def __init__(self, credentials_file):
        with open(credentials_file) as f:
            self.credentials = json.load(f)
        self.project_id = self.credentials['project_id']
        self.token = None
        self.token_expiry = None

    def get_access_token(self):
        """Genera un token de acceso usando JWT"""
        if self.token and self.token_expiry and datetime.utcnow() < self.token_expiry:
            return self.token

        now = datetime.utcnow()
        expiry = now + timedelta(hours=1)

        payload = {
            'iss': self.credentials['client_email'],
            'sub': self.credentials['client_email'],
            'aud': 'https://oauth2.googleapis.com/token',
            'iat': int(now.timestamp()),
            'exp': int(expiry.timestamp()),
            'scope': 'https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/cloud-platform'
        }

        # Firmar con la private key
        signed_jwt = jwt.encode(
            payload,
            self.credentials['private_key'],
            algorithm='RS256'
        )

        # Intercambiar por access token
        response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion': signed_jwt
            }
        )

        if response.status_code != 200:
            raise Exception(f"Error getting token: {response.text}")

        token_data = response.json()
        self.token = token_data['access_token']
        self.token_expiry = expiry - timedelta(minutes=5)
        return self.token

    def api_request(self, url, method='GET', data=None):
        """Hace una request autenticada a la API"""
        token = self.get_access_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)

        return response.json() if response.text else {}

    def bq_query(self, query):
        """Ejecuta una query en BigQuery"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/queries"
        data = {
            "query": query,
            "useLegacySql": False,
            "maxResults": 10000
        }
        result = self.api_request(url, 'POST', data)
        return result

    # ==================== DATASETS ====================
    def list_datasets(self):
        """Lista todos los datasets"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/datasets"
        return self.api_request(url)

    def get_dataset_info(self, dataset_id):
        """Obtiene info detallada de un dataset"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/datasets/{dataset_id}"
        return self.api_request(url)

    # ==================== TABLAS ====================
    def list_tables(self, dataset_id):
        """Lista todas las tablas de un dataset"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/datasets/{dataset_id}/tables"
        return self.api_request(url)

    def get_table_info(self, dataset_id, table_id):
        """Obtiene info detallada de una tabla"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/datasets/{dataset_id}/tables/{table_id}"
        return self.api_request(url)

    # ==================== RUTINAS ====================
    def list_routines(self, dataset_id):
        """Lista todas las rutinas (SPs, funciones) de un dataset"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/datasets/{dataset_id}/routines"
        return self.api_request(url)

    def get_routine_info(self, dataset_id, routine_id):
        """Obtiene info detallada de una rutina"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/datasets/{dataset_id}/routines/{routine_id}"
        return self.api_request(url)

    # ==================== JOBS ====================
    def list_jobs(self, max_results=100):
        """Lista los jobs recientes"""
        url = f"https://bigquery.googleapis.com/bigquery/v2/projects/{self.project_id}/jobs?maxResults={max_results}&allUsers=true"
        return self.api_request(url)

    # ==================== DATA TRANSFER (Scheduled Queries) ====================
    def list_transfer_configs(self):
        """Lista las configuraciones de transferencia (scheduled queries)"""
        url = f"https://bigquerydatatransfer.googleapis.com/v1/projects/{self.project_id}/locations/-/transferConfigs"
        return self.api_request(url)

    def get_transfer_runs(self, config_name, max_results=20):
        """Lista las ejecuciones de una configuracion de transferencia"""
        url = f"https://bigquerydatatransfer.googleapis.com/v1/{config_name}/runs?pageSize={max_results}"
        return self.api_request(url)

    # ==================== CLOUD FUNCTIONS ====================
    def list_cloud_functions(self):
        """Lista las Cloud Functions"""
        url = f"https://cloudfunctions.googleapis.com/v1/projects/{self.project_id}/locations/-/functions"
        return self.api_request(url)

    def get_function_info(self, function_name):
        """Obtiene info de una Cloud Function"""
        url = f"https://cloudfunctions.googleapis.com/v1/{function_name}"
        return self.api_request(url)

    # ==================== CLOUD SCHEDULER ====================
    def list_scheduler_jobs(self):
        """Lista los jobs de Cloud Scheduler"""
        # Intentar varias regiones comunes
        regions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1']
        all_jobs = []
        for region in regions:
            url = f"https://cloudscheduler.googleapis.com/v1/projects/{self.project_id}/locations/{region}/jobs"
            result = self.api_request(url)
            if 'jobs' in result:
                all_jobs.extend(result['jobs'])
        return {'jobs': all_jobs}

    # ==================== IAM ====================
    def get_project_iam_policy(self):
        """Obtiene la politica IAM del proyecto"""
        url = f"https://cloudresourcemanager.googleapis.com/v1/projects/{self.project_id}:getIamPolicy"
        return self.api_request(url, 'POST', {})


def main():
    print("=" * 60)
    print("AUDITORIA BIGQUERY - sunny-advantage-471523-b3")
    print("=" * 60)
    print()

    auditor = GCPAuditor(CREDENTIALS_FILE)
    results = {}

    # 1. DATASETS
    print("[1/8] Obteniendo datasets...")
    datasets = auditor.list_datasets()
    results['datasets'] = datasets
    print(json.dumps(datasets, indent=2))
    print()

    # 2. TABLAS Y VISTAS
    print("[2/8] Obteniendo tablas y vistas...")
    results['tables'] = {}
    if 'datasets' in datasets:
        for ds in datasets.get('datasets', []):
            ds_id = ds['datasetReference']['datasetId']
            print(f"  Dataset: {ds_id}")
            tables = auditor.list_tables(ds_id)
            results['tables'][ds_id] = tables

            # Info detallada de cada tabla
            if 'tables' in tables:
                for tbl in tables.get('tables', []):
                    tbl_id = tbl['tableReference']['tableId']
                    tbl_info = auditor.get_table_info(ds_id, tbl_id)
                    tbl['details'] = tbl_info
                    print(f"    - {tbl_id} ({tbl.get('type', 'TABLE')})")
    print()

    # 3. RUTINAS (Stored Procedures, Functions)
    print("[3/8] Obteniendo rutinas (SPs, funciones)...")
    results['routines'] = {}
    if 'datasets' in datasets:
        for ds in datasets.get('datasets', []):
            ds_id = ds['datasetReference']['datasetId']
            routines = auditor.list_routines(ds_id)
            results['routines'][ds_id] = routines

            if 'routines' in routines:
                for routine in routines.get('routines', []):
                    r_id = routine['routineReference']['routineId']
                    r_info = auditor.get_routine_info(ds_id, r_id)
                    routine['details'] = r_info
                    print(f"  {ds_id}.{r_id}")
    print()

    # 4. SCHEDULED QUERIES
    print("[4/8] Obteniendo Scheduled Queries...")
    transfer_configs = auditor.list_transfer_configs()
    results['scheduled_queries'] = transfer_configs

    if 'transferConfigs' in transfer_configs:
        for config in transfer_configs.get('transferConfigs', []):
            name = config.get('displayName', config.get('name', 'Unknown'))
            print(f"  - {name}")
            # Obtener runs recientes
            runs = auditor.get_transfer_runs(config['name'])
            config['recentRuns'] = runs
    print()

    # 5. JOBS RECIENTES
    print("[5/8] Obteniendo jobs recientes de BigQuery...")
    jobs = auditor.list_jobs(50)
    results['jobs'] = jobs
    if 'jobs' in jobs:
        print(f"  Total jobs encontrados: {len(jobs['jobs'])}")
        # Mostrar ultimos 10
        for job in jobs['jobs'][:10]:
            status = job.get('status', {}).get('state', 'UNKNOWN')
            job_type = job.get('configuration', {}).keys()
            print(f"  - {list(job_type)} | {status}")
    print()

    # 6. CLOUD FUNCTIONS
    print("[6/8] Obteniendo Cloud Functions...")
    functions = auditor.list_cloud_functions()
    results['cloud_functions'] = functions

    if 'functions' in functions:
        for func in functions.get('functions', []):
            name = func.get('name', '').split('/')[-1]
            print(f"  - {name}")
            func_info = auditor.get_function_info(func['name'])
            func['details'] = func_info
    elif 'error' in functions:
        print(f"  Error: {functions.get('error', {}).get('message', 'Unknown')}")
    else:
        print("  No se encontraron Cloud Functions")
    print()

    # 7. CLOUD SCHEDULER
    print("[7/8] Obteniendo Cloud Scheduler jobs...")
    scheduler_jobs = auditor.list_scheduler_jobs()
    results['scheduler_jobs'] = scheduler_jobs

    if scheduler_jobs.get('jobs'):
        for job in scheduler_jobs['jobs']:
            name = job.get('name', '').split('/')[-1]
            schedule = job.get('schedule', 'N/A')
            print(f"  - {name} | {schedule}")
    else:
        print("  No se encontraron jobs de Cloud Scheduler")
    print()

    # 8. ROW COUNTS Y ESTADISTICAS
    print("[8/8] Obteniendo estadisticas de tablas principales...")
    stats_queries = [
        ("Rows en stg_prices_polygon_raw", """
            SELECT COUNT(*) as total_rows,
                   MIN(date) as min_date,
                   MAX(date) as max_date,
                   COUNT(DISTINCT date) as distinct_dates
            FROM `sunny-advantage-471523-b3.market_data.stg_prices_polygon_raw`
        """),
        ("Rows en Prices", """
            SELECT COUNT(*) as total_rows,
                   MIN(date) as min_date,
                   MAX(date) as max_date,
                   COUNT(DISTINCT date) as distinct_dates
            FROM `sunny-advantage-471523-b3.market_data.Prices`
        """),
        ("Particiones en staging", """
            SELECT partition_id, total_rows
            FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.PARTITIONS`
            WHERE table_name = 'stg_prices_polygon_raw'
            ORDER BY partition_id DESC
            LIMIT 30
        """),
    ]

    results['statistics'] = {}
    for name, query in stats_queries:
        print(f"  {name}...")
        try:
            result = auditor.bq_query(query)
            results['statistics'][name] = result
            if 'rows' in result:
                for row in result['rows'][:5]:
                    values = [f['v'] for f in row['f']]
                    print(f"    {values}")
        except Exception as e:
            print(f"    Error: {e}")
            results['statistics'][name] = {'error': str(e)}
    print()

    # Guardar resultados
    output_file = "/home/user/signalssheets/audit_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print("=" * 60)
    print(f"Auditoria completada. Resultados en: {output_file}")
    print("=" * 60)

    return results


if __name__ == "__main__":
    main()
