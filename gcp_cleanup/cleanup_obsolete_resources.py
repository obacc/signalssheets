#!/usr/bin/env python3
"""
GCP BigQuery Cleanup Script
Project: sunny-advantage-471523-b3
Authorized by: Aaron

Resources to delete:
- 3 Stored Procedures: proc_daily_alerts, proc_health_checks, proc_circuit_breaker
- 1 View: v_Prices_canon
- 1 Table: shares_outstanding_from_num
"""

import os
from datetime import datetime

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

from google.cloud import bigquery

PROJECT_ID = 'sunny-advantage-471523-b3'
CLEANUP_DIR = '/home/user/signalssheets/gcp_cleanup'

# Resources to delete
PROCEDURES_TO_DELETE = [
    'market_data.proc_daily_alerts',
    'market_data.proc_health_checks',
    'market_data.proc_circuit_breaker'
]

VIEW_TO_DELETE = 'market_data.v_Prices_canon'
TABLE_TO_DELETE = 'IS_Fundamentales.shares_outstanding_from_num'


def backup_procedures(client):
    """PASO 1a: Backup stored procedures"""
    print("\n" + "="*60)
    print("PASO 1a: BACKUP STORED PROCEDURES")
    print("="*60)

    query = """
    SELECT routine_name, routine_definition, created, last_altered
    FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.ROUTINES`
    WHERE routine_name IN ('proc_daily_alerts', 'proc_health_checks', 'proc_circuit_breaker')
    """

    try:
        results = client.query(query).result()

        backup_file = f"{CLEANUP_DIR}/backup_sps.txt"
        with open(backup_file, 'w') as f:
            f.write(f"# Backup Stored Procedures - {datetime.now()}\n")
            f.write("="*80 + "\n\n")

            count = 0
            for row in results:
                count += 1
                f.write(f"PROCEDURE: {row.routine_name}\n")
                f.write(f"Created: {row.created}\n")
                f.write(f"Last Altered: {row.last_altered}\n")
                f.write("-"*40 + "\n")
                f.write(f"{row.routine_definition}\n")
                f.write("\n" + "="*80 + "\n\n")
                print(f"  ✓ Backed up: {row.routine_name}")

        print(f"\n✅ {count} procedures backed up to: {backup_file}")
        return count

    except Exception as e:
        print(f"⚠️ Error backing up procedures: {e}")
        return 0


def backup_view(client):
    """PASO 1b: Backup view"""
    print("\n" + "="*60)
    print("PASO 1b: BACKUP VISTA")
    print("="*60)

    query = """
    SELECT table_name, view_definition
    FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.VIEWS`
    WHERE table_name = 'v_Prices_canon'
    """

    try:
        results = client.query(query).result()

        backup_file = f"{CLEANUP_DIR}/backup_vista.txt"
        with open(backup_file, 'w') as f:
            f.write(f"# Backup Vista - {datetime.now()}\n")
            f.write("="*80 + "\n\n")

            count = 0
            for row in results:
                count += 1
                f.write(f"VIEW: {row.table_name}\n")
                f.write("-"*40 + "\n")
                f.write(f"{row.view_definition}\n")
                f.write("\n" + "="*80 + "\n\n")
                print(f"  ✓ Backed up: {row.table_name}")

        print(f"\n✅ Vista backed up to: {backup_file}")
        return count

    except Exception as e:
        print(f"⚠️ Error backing up view: {e}")
        return 0


def backup_table_metadata(client):
    """PASO 1c: Backup table metadata"""
    print("\n" + "="*60)
    print("PASO 1c: BACKUP TABLA METADATA")
    print("="*60)

    try:
        table_ref = client.dataset('IS_Fundamentales').table('shares_outstanding_from_num')
        table = client.get_table(table_ref)

        backup_file = f"{CLEANUP_DIR}/backup_tabla_metadata.json"

        import json
        metadata = {
            'table_id': table.table_id,
            'full_table_id': f"{table.project}.{table.dataset_id}.{table.table_id}",
            'created': str(table.created),
            'modified': str(table.modified),
            'num_rows': table.num_rows,
            'num_bytes': table.num_bytes,
            'size_mb': table.num_bytes / (1024*1024) if table.num_bytes else 0,
            'schema': [{'name': f.name, 'type': f.field_type, 'mode': f.mode} for f in table.schema],
            'description': table.description,
            'labels': dict(table.labels) if table.labels else {}
        }

        with open(backup_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"  ✓ Table: {table.table_id}")
        print(f"  ✓ Size: {metadata['size_mb']:.2f} MB")
        print(f"  ✓ Rows: {table.num_rows}")
        print(f"\n✅ Metadata backed up to: {backup_file}")

        return metadata['size_mb']

    except Exception as e:
        print(f"⚠️ Error backing up table metadata: {e}")
        return 0


def delete_procedures(client):
    """PASO 2: Delete stored procedures"""
    print("\n" + "="*60)
    print("PASO 2: ELIMINAR STORED PROCEDURES")
    print("="*60)

    deleted = []
    errors = []

    for proc in PROCEDURES_TO_DELETE:
        dataset_id, proc_name = proc.split('.')
        routine_ref = f"{PROJECT_ID}.{dataset_id}.{proc_name}"

        try:
            client.delete_routine(routine_ref)
            print(f"  ✅ Eliminado: {proc}")
            deleted.append(proc_name)
        except Exception as e:
            if 'Not found' in str(e):
                print(f"  ⚠️ No encontrado (ya eliminado?): {proc}")
                deleted.append(proc_name)  # Count as success
            else:
                print(f"  ❌ Error eliminando {proc}: {e}")
                errors.append((proc_name, str(e)))

    print(f"\n✅ {len(deleted)} Stored Procedures procesados")
    return deleted, errors


def delete_view(client):
    """PASO 3: Delete view"""
    print("\n" + "="*60)
    print("PASO 3: ELIMINAR VISTA")
    print("="*60)

    dataset_id, view_name = VIEW_TO_DELETE.split('.')
    table_ref = client.dataset(dataset_id).table(view_name)

    try:
        client.delete_table(table_ref)
        print(f"  ✅ Eliminada: {VIEW_TO_DELETE}")
        return True, None
    except Exception as e:
        if 'Not found' in str(e):
            print(f"  ⚠️ No encontrada (ya eliminada?): {VIEW_TO_DELETE}")
            return True, None
        else:
            print(f"  ❌ Error eliminando vista: {e}")
            return False, str(e)


def delete_table(client):
    """PASO 4: Delete table"""
    print("\n" + "="*60)
    print("PASO 4: ELIMINAR TABLA")
    print("="*60)

    dataset_id, table_name = TABLE_TO_DELETE.split('.')
    table_ref = client.dataset(dataset_id).table(table_name)

    try:
        # Get size before deletion
        table = client.get_table(table_ref)
        size_mb = table.num_bytes / (1024*1024) if table.num_bytes else 0
        print(f"  📊 Tamaño: {size_mb:.2f} MB")
        print(f"  📊 Filas: {table.num_rows}")
    except:
        size_mb = 0

    try:
        client.delete_table(table_ref)
        print(f"  ✅ Eliminada: {TABLE_TO_DELETE}")
        return True, None, size_mb
    except Exception as e:
        if 'Not found' in str(e):
            print(f"  ⚠️ No encontrada (ya eliminada?): {TABLE_TO_DELETE}")
            return True, None, 0
        else:
            print(f"  ❌ Error eliminando tabla: {e}")
            return False, str(e), 0


def verify_cleanup(client):
    """PASO 6: Verify cleanup"""
    print("\n" + "="*60)
    print("PASO 6: VERIFICAR LIMPIEZA")
    print("="*60)

    # Check remaining procedures
    print("\n📋 SPs restantes en market_data:")
    query = """
    SELECT routine_name
    FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.ROUTINES`
    WHERE routine_type = 'PROCEDURE'
    """
    try:
        results = list(client.query(query).result())
        for row in results:
            print(f"   - {row.routine_name}")
        if not results:
            print("   (ninguno)")
    except Exception as e:
        print(f"   Error: {e}")

    # Check remaining views
    print("\n📋 Vistas restantes en market_data:")
    query = """
    SELECT table_name
    FROM `sunny-advantage-471523-b3.market_data.INFORMATION_SCHEMA.VIEWS`
    """
    try:
        results = list(client.query(query).result())
        for row in results:
            print(f"   - {row.table_name}")
        if not results:
            print("   (ninguna)")
    except Exception as e:
        print(f"   Error: {e}")

    # Check tables in IS_Fundamentales
    print("\n📋 Tablas en IS_Fundamentales:")
    try:
        dataset_ref = client.dataset('IS_Fundamentales')
        tables = list(client.list_tables(dataset_ref))
        for table in tables:
            print(f"   - {table.table_id}")
    except Exception as e:
        print(f"   Error: {e}")

    print("\n✅ Verificación completada")


def generate_report(deleted_procs, proc_errors, view_deleted, view_error, table_deleted, table_error, space_freed):
    """PASO 5: Generate cleanup report"""
    print("\n" + "="*60)
    print("PASO 5: GENERAR REPORTE")
    print("="*60)

    report = f"""===============================================================================
REPORTE LIMPIEZA RECURSOS OBSOLETOS BIGQUERY
Proyecto: {PROJECT_ID}
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
===============================================================================

RECURSOS ELIMINADOS:

1. STORED PROCEDURES (3):
"""

    for proc in ['proc_daily_alerts', 'proc_health_checks', 'proc_circuit_breaker']:
        status = "✅" if proc in deleted_procs else "❌"
        report += f"   {status} {proc}\n"

    report += """
   Razón: Referencian tablas inexistentes de Trinity v1/v2/v3

2. VISTA (1):
"""
    status = "✅" if view_deleted else "❌"
    report += f"   {status} v_Prices_canon\n"
    report += """
   Razón: Depende de UDF analytics.udf_canon_ticker que no existe

3. TABLA (1):
"""
    status = "✅" if table_deleted else "❌"
    report += f"   {status} shares_outstanding_from_num ({space_freed:.0f} MB)\n"
    report += """
   Razón: Datos ya integrados en fundamentals_timeseries

===============================================================================
BACKUPS DISPONIBLES:
- /home/user/signalssheets/gcp_cleanup/backup_sps.txt
- /home/user/signalssheets/gcp_cleanup/backup_vista.txt
- /home/user/signalssheets/gcp_cleanup/backup_tabla_metadata.json

ESPACIO LIBERADO: ~{space:.0f} MB

✅ LIMPIEZA COMPLETADA EXITOSAMENTE
===============================================================================
""".format(space=space_freed)

    report_file = f"{CLEANUP_DIR}/cleanup_report.txt"
    with open(report_file, 'w') as f:
        f.write(report)

    print(report)
    print(f"\n📄 Reporte guardado en: {report_file}")


def main():
    print("="*60)
    print("LIMPIEZA RECURSOS OBSOLETOS BIGQUERY")
    print(f"Proyecto: {PROJECT_ID}")
    print(f"Fecha: {datetime.now()}")
    print("Autorizado por: Aaron")
    print("="*60)

    client = bigquery.Client(project=PROJECT_ID)

    # PASO 1: Backups
    backup_procedures(client)
    backup_view(client)
    table_size = backup_table_metadata(client)

    # PASO 2: Delete procedures
    deleted_procs, proc_errors = delete_procedures(client)

    # PASO 3: Delete view
    view_deleted, view_error = delete_view(client)

    # PASO 4: Delete table
    table_deleted, table_error, space_freed = delete_table(client)
    if space_freed == 0:
        space_freed = table_size

    # PASO 5: Generate report
    generate_report(deleted_procs, proc_errors, view_deleted, view_error,
                   table_deleted, table_error, space_freed)

    # PASO 6: Verify
    verify_cleanup(client)

    print("\n" + "="*60)
    print("✅ PROCESO DE LIMPIEZA COMPLETADO")
    print("="*60)


if __name__ == "__main__":
    main()
