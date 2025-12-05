#!/usr/bin/env python3
"""
GCP Cloud Functions and Cloud Scheduler Inventory Script
Project: sunny-advantage-471523-b3
"""

import os
import csv
from datetime import datetime

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
OUTPUT_DIR = '/home/user/signalssheets/gcp_inventory'

def inventory_cloud_functions():
    """TAREA 3: Inventario Cloud Functions"""
    print("\n" + "="*60)
    print("TAREA 3: INVENTARIO CLOUD FUNCTIONS")
    print("="*60)

    try:
        from google.cloud import functions_v1
        from google.cloud.functions_v1 import ListFunctionsRequest

        client = functions_v1.CloudFunctionsServiceClient()

        # List all regions where Cloud Functions might exist
        regions = [
            'us-central1', 'us-east1', 'us-east4', 'us-west1', 'us-west2',
            'europe-west1', 'europe-west2', 'europe-west3', 'europe-west6',
            'asia-east1', 'asia-east2', 'asia-northeast1', 'asia-northeast2',
            'asia-southeast1', 'australia-southeast1', 'southamerica-east1'
        ]

        all_functions = []

        for region in regions:
            parent = f"projects/{PROJECT_ID}/locations/{region}"
            try:
                functions_list = client.list_functions(parent=parent)
                for func in functions_list:
                    all_functions.append({
                        'name': func.name.split('/')[-1],
                        'full_name': func.name,
                        'status': str(func.status).replace('Status.', ''),
                        'runtime': func.runtime,
                        'entry_point': func.entry_point,
                        'trigger': func.https_trigger.url if func.https_trigger else 'event-trigger',
                        'available_memory_mb': func.available_memory_mb,
                        'timeout': str(func.timeout.seconds) + 's' if func.timeout else 'N/A',
                        'update_time': str(func.update_time) if func.update_time else 'N/A',
                        'region': region
                    })
                    print(f"  ✓ Función encontrada: {func.name.split('/')[-1]} ({region})")
            except Exception as e:
                if 'not found' not in str(e).lower() and '404' not in str(e):
                    pass  # Region doesn't have functions or permission issue

        # Write to CSV
        output_file = f"{OUTPUT_DIR}/cloud_functions_inventory.csv"
        with open(output_file, 'w', newline='') as csvfile:
            fieldnames = ['name', 'status', 'trigger', 'runtime', 'update_time', 'available_memory_mb', 'timeout', 'region', 'full_name', 'entry_point']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for func in all_functions:
                writer.writerow(func)

        print(f"\n✅ Cloud Functions inventariadas: {len(all_functions)}")
        print(f"   Archivo: {output_file}")

        return all_functions

    except ImportError as e:
        print(f"⚠️ Librería google-cloud-functions no disponible: {e}")
        # Create empty file
        output_file = f"{OUTPUT_DIR}/cloud_functions_inventory.csv"
        with open(output_file, 'w', newline='') as csvfile:
            csvfile.write("name,status,trigger,runtime,update_time,available_memory_mb,timeout\n")
            csvfile.write("NO_API_ACCESS,N/A,N/A,N/A,N/A,N/A,N/A\n")
        return []
    except Exception as e:
        print(f"⚠️ Error al listar Cloud Functions: {e}")
        output_file = f"{OUTPUT_DIR}/cloud_functions_inventory.csv"
        with open(output_file, 'w', newline='') as csvfile:
            csvfile.write("name,status,trigger,runtime,update_time,available_memory_mb,timeout\n")
            csvfile.write(f"ERROR,{str(e)[:50]},N/A,N/A,N/A,N/A,N/A\n")
        return []


def inventory_cloud_scheduler():
    """TAREA 4: Inventario Cloud Scheduler Jobs"""
    print("\n" + "="*60)
    print("TAREA 4: INVENTARIO CLOUD SCHEDULER JOBS")
    print("="*60)

    try:
        from google.cloud import scheduler_v1

        client = scheduler_v1.CloudSchedulerClient()

        # List common regions
        regions = [
            'us-central1', 'us-east1', 'us-east4', 'us-west1', 'us-west2',
            'europe-west1', 'europe-west2', 'europe-west3', 'europe-west6',
            'asia-east1', 'asia-east2', 'asia-northeast1', 'asia-northeast2',
            'asia-southeast1', 'australia-southeast1', 'southamerica-east1'
        ]

        all_jobs = []

        for region in regions:
            parent = f"projects/{PROJECT_ID}/locations/{region}"
            try:
                jobs_list = client.list_jobs(parent=parent)
                for job in jobs_list:
                    target_type = 'unknown'
                    target_uri = 'N/A'

                    if job.http_target:
                        target_type = 'HTTP'
                        target_uri = job.http_target.uri
                    elif job.pubsub_target:
                        target_type = 'PUBSUB'
                        target_uri = job.pubsub_target.topic_name
                    elif job.app_engine_http_target:
                        target_type = 'APP_ENGINE'
                        target_uri = job.app_engine_http_target.relative_uri

                    all_jobs.append({
                        'name': job.name.split('/')[-1],
                        'schedule': job.schedule,
                        'state': str(job.state).replace('State.', ''),
                        'time_zone': job.time_zone,
                        'target_type': target_type,
                        'target_uri': target_uri,
                        'last_attempt_time': str(job.last_attempt_time) if job.last_attempt_time else 'N/A',
                        'region': region
                    })
                    print(f"  ✓ Job encontrado: {job.name.split('/')[-1]} ({region})")
            except Exception as e:
                if 'not found' not in str(e).lower() and '404' not in str(e):
                    pass

        # Write to CSV
        output_file = f"{OUTPUT_DIR}/cloud_scheduler_inventory.csv"
        with open(output_file, 'w', newline='') as csvfile:
            fieldnames = ['name', 'schedule', 'state', 'time_zone', 'last_attempt_time', 'target_type', 'target_uri', 'region']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for job in all_jobs:
                writer.writerow(job)

        print(f"\n✅ Cloud Scheduler jobs inventariados: {len(all_jobs)}")
        print(f"   Archivo: {output_file}")

        return all_jobs

    except ImportError as e:
        print(f"⚠️ Librería google-cloud-scheduler no disponible: {e}")
        output_file = f"{OUTPUT_DIR}/cloud_scheduler_inventory.csv"
        with open(output_file, 'w', newline='') as csvfile:
            csvfile.write("name,schedule,state,time_zone,last_attempt_time\n")
            csvfile.write("NO_API_ACCESS,N/A,N/A,N/A,N/A\n")
        return []
    except Exception as e:
        print(f"⚠️ Error al listar Cloud Scheduler jobs: {e}")
        output_file = f"{OUTPUT_DIR}/cloud_scheduler_inventory.csv"
        with open(output_file, 'w', newline='') as csvfile:
            csvfile.write("name,schedule,state,time_zone,last_attempt_time\n")
            csvfile.write(f"ERROR,{str(e)[:50]},N/A,N/A,N/A\n")
        return []


def update_summary(functions, scheduler_jobs):
    """Update summary report with Cloud Functions and Scheduler info"""
    print("\n" + "="*60)
    print("ACTUALIZANDO SUMMARY REPORT")
    print("="*60)

    # Read existing summary
    summary_file = f"{OUTPUT_DIR}/summary_report.txt"
    with open(summary_file, 'r') as f:
        summary = f.read()

    # Calculate stats
    cf_total = len(functions)
    cf_active = len([f for f in functions if f.get('status') == 'ACTIVE'])
    cf_inactive = cf_total - cf_active

    sj_total = len(scheduler_jobs)
    sj_enabled = len([j for j in scheduler_jobs if j.get('state') == 'ENABLED'])
    sj_paused = sj_total - sj_enabled

    # Update the placeholders
    new_cf_section = f"""CLOUD FUNCTIONS:
- Total functions: {cf_total}
- Activas: {cf_active}
- Inactivas: {cf_inactive}"""

    new_sj_section = f"""CLOUD SCHEDULER:
- Total jobs: {sj_total}
- Enabled: {sj_enabled}
- Paused: {sj_paused}"""

    # Replace sections
    summary = summary.replace(
        "CLOUD FUNCTIONS:\n- (Ver archivo cloud_functions_inventory.csv)",
        new_cf_section
    )
    summary = summary.replace(
        "CLOUD SCHEDULER:\n- (Ver archivo cloud_scheduler_inventory.csv)",
        new_sj_section
    )

    # Write updated summary
    with open(summary_file, 'w') as f:
        f.write(summary)

    print(f"✅ Summary actualizado: {summary_file}")


def main():
    print("="*60)
    print(f"INVENTARIO CLOUD SERVICES - PROYECTO: {PROJECT_ID}")
    print(f"Fecha: {datetime.now()}")
    print("="*60)

    # Tarea 3: Cloud Functions
    functions = inventory_cloud_functions()

    # Tarea 4: Cloud Scheduler
    scheduler_jobs = inventory_cloud_scheduler()

    # Update summary
    update_summary(functions, scheduler_jobs)

    print("\n" + "="*60)
    print("✅ INVENTARIO CLOUD SERVICES COMPLETADO")
    print("="*60)


if __name__ == "__main__":
    main()
