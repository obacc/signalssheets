#!/usr/bin/env python3
"""
GCP BigQuery Inventory Script
Project: sunny-advantage-471523-b3
"""

import os
import sys
from datetime import datetime, timedelta

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

from google.cloud import bigquery
import pandas as pd

PROJECT_ID = 'sunny-advantage-471523-b3'
OUTPUT_DIR = '/home/user/signalssheets/gcp_inventory'

def inventory_datasets_tables(client):
    """TAREA 1: Inventario de datasets y tablas"""
    print("\n" + "="*60)
    print("TAREA 1: INVENTARIO DATASETS Y TABLAS BIGQUERY")
    print("="*60)

    datasets = list(client.list_datasets())
    inventario = []

    print(f"Encontrados {len(datasets)} datasets")

    for dataset in datasets:
        dataset_id = dataset.dataset_id
        dataset_ref = client.dataset(dataset_id)
        print(f"\n  Procesando dataset: {dataset_id}")

        try:
            tables = list(client.list_tables(dataset_ref))
            print(f"    -> {len(tables)} tablas/vistas")

            for table in tables:
                try:
                    table_ref = dataset_ref.table(table.table_id)
                    table_obj = client.get_table(table_ref)

                    inventario.append({
                        'dataset': dataset_id,
                        'table_name': table.table_id,
                        'table_type': table.table_type,
                        'created': table_obj.created,
                        'modified': table_obj.modified,
                        'num_rows': table_obj.num_rows if table_obj.num_rows else 0,
                        'size_mb': (table_obj.num_bytes or 0) / (1024*1024),
                        'partition_type': str(table_obj.time_partitioning.type_) if table_obj.time_partitioning else 'NONE',
                        'partition_field': table_obj.time_partitioning.field if table_obj.time_partitioning else 'NONE',
                        'clustering_fields': ','.join(table_obj.clustering_fields) if table_obj.clustering_fields else 'NONE',
                        'description': table_obj.description or 'NO DESCRIPTION',
                        'labels': str(table_obj.labels) if table_obj.labels else 'NONE'
                    })
                except Exception as e:
                    print(f"      ⚠️ Error en tabla {table.table_id}: {e}")
        except Exception as e:
            print(f"    ⚠️ Error listando tablas: {e}")

    df = pd.DataFrame(inventario)
    if not df.empty:
        df = df.sort_values(['dataset', 'modified'], ascending=[True, False])

    output_file = f"{OUTPUT_DIR}/bigquery_inventory_full.csv"
    df.to_csv(output_file, index=False)

    print(f"\n✅ Inventario guardado: {output_file}")
    print(f"📊 Total recursos: {len(df)}")
    if not df.empty:
        print(f"\n📁 Datasets encontrados: {df['dataset'].nunique()}")
        print(df.groupby('dataset')['table_name'].count())

    return df


def inventory_procedures(client):
    """TAREA 2: Inventario de Stored Procedures"""
    print("\n" + "="*60)
    print("TAREA 2: INVENTARIO STORED PROCEDURES")
    print("="*60)

    all_procedures = []

    # Get all datasets first
    datasets = list(client.list_datasets())

    for dataset in datasets:
        dataset_id = dataset.dataset_id
        print(f"  Buscando procedures en: {dataset_id}")

        query = f"""
        SELECT
          routine_catalog as project,
          routine_schema as dataset,
          routine_name as procedure_name,
          routine_type,
          created as created_date,
          last_altered as modified_date,
          routine_definition as definition
        FROM `{PROJECT_ID}.{dataset_id}.INFORMATION_SCHEMA.ROUTINES`
        WHERE routine_type = 'PROCEDURE'
        ORDER BY last_altered DESC
        """

        try:
            procedures = client.query(query).to_dataframe()
            if not procedures.empty:
                all_procedures.append(procedures)
                print(f"    -> Encontrados {len(procedures)} procedures")
        except Exception as e:
            print(f"    -> Sin procedures o error: {str(e)[:50]}")

    if all_procedures:
        df_procedures = pd.concat(all_procedures, ignore_index=True)
    else:
        df_procedures = pd.DataFrame(columns=['project', 'dataset', 'procedure_name', 'routine_type', 'created_date', 'modified_date', 'definition'])

    output_file = f"{OUTPUT_DIR}/bigquery_procedures_inventory.csv"
    df_procedures.to_csv(output_file, index=False)

    print(f"\n✅ Procedures inventariados: {len(df_procedures)}")
    print(f"   Archivo: {output_file}")

    return df_procedures


def analyze_view_dependencies(client, df_tables):
    """TAREA 5: Dependencias entre tablas/vistas"""
    print("\n" + "="*60)
    print("TAREA 5: DEPENDENCIAS ENTRE TABLAS/VISTAS")
    print("="*60)

    dependencies = []

    if df_tables.empty:
        print("  No hay tablas para analizar")
        df_deps = pd.DataFrame(columns=['view_name', 'view_query', 'depends_on'])
        output_file = f"{OUTPUT_DIR}/bigquery_view_dependencies.csv"
        df_deps.to_csv(output_file, index=False)
        return df_deps

    views = df_tables[df_tables['table_type'] == 'VIEW']
    print(f"  Analizando {len(views)} vistas...")

    for _, row in views.iterrows():
        try:
            view_ref = client.dataset(row['dataset']).table(row['table_name'])
            view_obj = client.get_table(view_ref)

            if view_obj.view_query:
                # Extract potential table references from query
                query = view_obj.view_query
                potential_deps = []

                # Simple regex-like extraction of table references
                import re
                # Match patterns like `project.dataset.table` or dataset.table
                matches = re.findall(r'`([^`]+)`|FROM\s+(\w+\.\w+)', query, re.IGNORECASE)
                for m in matches:
                    dep = m[0] or m[1]
                    if dep and '.' in dep:
                        potential_deps.append(dep)

                dependencies.append({
                    'view_name': f"{row['dataset']}.{row['table_name']}",
                    'view_query': view_obj.view_query[:500],  # Truncate long queries
                    'depends_on': ', '.join(set(potential_deps)) if potential_deps else 'PARSE MANUALLY'
                })
                print(f"    ✓ {row['dataset']}.{row['table_name']}")
        except Exception as e:
            print(f"    ⚠️ Error en {row['dataset']}.{row['table_name']}: {e}")

    df_deps = pd.DataFrame(dependencies)
    output_file = f"{OUTPUT_DIR}/bigquery_view_dependencies.csv"
    df_deps.to_csv(output_file, index=False)

    print(f"\n✅ Dependencias analizadas: {len(df_deps)}")
    print(f"   Archivo: {output_file}")

    return df_deps


def analyze_unused_resources(df_tables):
    """TAREA 6: Análisis de última actividad"""
    print("\n" + "="*60)
    print("TAREA 6: ANÁLISIS DE ÚLTIMA ACTIVIDAD")
    print("="*60)

    if df_tables.empty:
        print("  No hay tablas para analizar")
        df_unused = pd.DataFrame()
        output_file = f"{OUTPUT_DIR}/bigquery_unused_resources.csv"
        df_unused.to_csv(output_file, index=False)
        return df_unused

    # Make a copy to avoid modifying original
    df = df_tables.copy()

    # Convert modified to datetime if it's not already
    if df['modified'].dtype == 'object':
        df['modified'] = pd.to_datetime(df['modified'])

    # Make cutoff timezone-aware if modified is timezone-aware
    now = datetime.now()
    if df['modified'].dt.tz is not None:
        now = pd.Timestamp.now(tz=df['modified'].dt.tz)

    cutoff_date = now - timedelta(days=90)

    df['days_since_modified'] = (now - df['modified']).dt.days
    unused = df[df['days_since_modified'] > 90].sort_values('days_since_modified', ascending=False)

    output_file = f"{OUTPUT_DIR}/bigquery_unused_resources.csv"
    unused.to_csv(output_file, index=False)

    print(f"\n⚠️ Recursos sin modificar en 90+ días: {len(unused)}")
    print(f"💾 Espacio ocupado: {unused['size_mb'].sum():.2f} MB")
    print(f"   Archivo: {output_file}")

    return unused


def generate_summary(df_tables, df_procedures, df_unused):
    """Generate summary report"""
    print("\n" + "="*60)
    print("GENERANDO SUMMARY REPORT")
    print("="*60)

    # Calculate stats
    num_datasets = df_tables['dataset'].nunique() if not df_tables.empty else 0
    num_tables = len(df_tables[df_tables['table_type'] == 'TABLE']) if not df_tables.empty else 0
    num_views = len(df_tables[df_tables['table_type'] == 'VIEW']) if not df_tables.empty else 0
    num_mv = len(df_tables[df_tables['table_type'] == 'MATERIALIZED_VIEW']) if not df_tables.empty else 0
    total_size_gb = df_tables['size_mb'].sum() / 1024 if not df_tables.empty else 0

    unused_tables = len(df_unused[df_unused['table_type'] == 'TABLE']) if not df_unused.empty else 0
    unused_views = len(df_unused[df_unused['table_type'] == 'VIEW']) if not df_unused.empty else 0
    unused_size_mb = df_unused['size_mb'].sum() if not df_unused.empty else 0

    summary = f"""=== INVENTARIO GCP PROYECTO: {PROJECT_ID} ===
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

BIGQUERY:
- Datasets: {num_datasets}
- Tablas: {num_tables}
- Vistas: {num_views}
- Materialized Views: {num_mv}
- Stored Procedures: {len(df_procedures)}
- Espacio total: {total_size_gb:.2f} GB

CLOUD FUNCTIONS:
- (Ver archivo cloud_functions_inventory.csv)

CLOUD SCHEDULER:
- (Ver archivo cloud_scheduler_inventory.csv)

RECURSOS SIN USO (90+ días):
- Tablas: {unused_tables}
- Vistas: {unused_views}
- Espacio: {unused_size_mb:.2f} MB

DETALLE POR DATASET:
"""

    if not df_tables.empty:
        for dataset in df_tables['dataset'].unique():
            ds_data = df_tables[df_tables['dataset'] == dataset]
            ds_tables = len(ds_data[ds_data['table_type'] == 'TABLE'])
            ds_views = len(ds_data[ds_data['table_type'] == 'VIEW'])
            ds_size = ds_data['size_mb'].sum()
            summary += f"\n  {dataset}:\n    - Tablas: {ds_tables}, Vistas: {ds_views}\n    - Tamaño: {ds_size:.2f} MB\n"

    summary += """
RECOMENDACIONES:
[Pendiente de análisis manual después de revisar los CSVs generados]

ARCHIVOS GENERADOS:
1. bigquery_inventory_full.csv - Inventario completo tablas/vistas
2. bigquery_procedures_inventory.csv - Stored procedures
3. cloud_functions_inventory.csv - Cloud Functions activas
4. cloud_scheduler_inventory.csv - Jobs programados
5. bigquery_view_dependencies.csv - Dependencias de vistas
6. bigquery_unused_resources.csv - Recursos sin uso reciente
7. summary_report.txt - Este archivo
"""

    output_file = f"{OUTPUT_DIR}/summary_report.txt"
    with open(output_file, 'w') as f:
        f.write(summary)

    print(summary)
    print(f"\n✅ Summary guardado: {output_file}")

    return summary


def main():
    print("="*60)
    print(f"INVENTARIO GCP - PROYECTO: {PROJECT_ID}")
    print(f"Fecha: {datetime.now()}")
    print("="*60)

    client = bigquery.Client(project=PROJECT_ID)

    # Tarea 1: Inventario datasets y tablas
    df_tables = inventory_datasets_tables(client)

    # Tarea 2: Inventario procedures
    df_procedures = inventory_procedures(client)

    # Tarea 5: Dependencias de vistas
    df_deps = analyze_view_dependencies(client, df_tables)

    # Tarea 6: Recursos sin uso
    df_unused = analyze_unused_resources(df_tables)

    # Generate summary (partial - will be completed after gcloud commands)
    generate_summary(df_tables, df_procedures, df_unused)

    print("\n" + "="*60)
    print("✅ INVENTARIO BIGQUERY COMPLETADO")
    print("="*60)

    return df_tables, df_procedures


if __name__ == "__main__":
    main()
