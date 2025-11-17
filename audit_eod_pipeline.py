#!/usr/bin/env python3
"""
AUDITORÍA EOD PIPELINE - SignalsSheets
Objetivo: Mapear el flujo completo y determinar horario óptimo del CRON Worker
Proyecto: sunny-advantage-471523-b3
"""

import os
import sys
import json
from datetime import datetime, timezone, timedelta
from google.cloud import bigquery, storage, logging as cloud_logging
from collections import defaultdict
import pytz

PROJECT_ID = "sunny-advantage-471523-b3"
BUCKET_NAME = "ss-bucket-polygon-incremental"
BUCKET_PREFIX = "polygon/daily/"

# Timezones
UTC = pytz.UTC
CT = pytz.timezone('America/Chicago')  # Central Time

def format_dual_tz(ts):
    """Formatea timestamp mostrando UTC y CT"""
    if ts is None:
        return "N/A"

    if not hasattr(ts, 'tzinfo') or ts.tzinfo is None:
        ts = UTC.localize(ts)

    utc_str = ts.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    ct_str = ts.astimezone(CT).strftime("%Y-%m-%d %H:%M:%S CT")

    return f"{utc_str} | {ct_str}"


class EODPipelineAuditor:
    """Auditor del pipeline EOD completo"""

    def __init__(self):
        print("🔧 Inicializando clientes de Google Cloud...")
        self.bq_client = bigquery.Client(project=PROJECT_ID)
        self.gcs_client = storage.Client(project=PROJECT_ID)
        self.log_client = cloud_logging.Client(project=PROJECT_ID)
        print("✅ Clientes inicializados\n")

        self.results = {
            "execution_time": datetime.now(UTC).isoformat(),
            "project_id": PROJECT_ID,
            "phases": {}
        }

    # ========================================
    # FASE 1: BIGQUERY - TIEMPOS DE ACTUALIZACIÓN
    # ========================================

    def phase_1_bigquery_timing(self):
        """FASE 1: Analizar tiempos de actualización en BigQuery"""
        print("="*80)
        print("🔍 FASE 1: BIGQUERY - ANÁLISIS DE TIEMPOS DE ACTUALIZACIÓN")
        print("="*80 + "\n")

        phase_results = {}

        # 1.1 Última actualización de prices
        print("📊 1.1 - Analizando tabla market_data.prices...")
        query_prices = """
        SELECT
          MAX(date) as last_price_date,
          MAX(updated_at) as last_updated_timestamp,
          COUNT(*) as total_records_last_7d,
          COUNT(DISTINCT ticker) as unique_tickers,
          MIN(updated_at) as first_update_last_7d
        FROM `sunny-advantage-471523-b3.market_data.prices`
        WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)
        """

        try:
            results_prices = self.bq_client.query(query_prices).result()
            row = list(results_prices)[0]

            phase_results['prices_table'] = {
                'last_price_date': str(row.last_price_date),
                'last_updated_timestamp': row.last_updated_timestamp.isoformat() if row.last_updated_timestamp else None,
                'last_updated_formatted': format_dual_tz(row.last_updated_timestamp) if row.last_updated_timestamp else None,
                'total_records_last_7d': row.total_records_last_7d,
                'unique_tickers': row.unique_tickers,
                'first_update_last_7d': row.first_update_last_7d.isoformat() if row.first_update_last_7d else None
            }

            print(f"  ✅ Última fecha de precios: {row.last_price_date}")
            print(f"  ✅ Última actualización: {format_dual_tz(row.last_updated_timestamp)}")
            print(f"  📈 Registros (últimos 7 días): {row.total_records_last_7d:,}")
            print(f"  🎯 Tickers únicos: {row.unique_tickers}\n")

        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            phase_results['prices_table'] = {"error": str(e)}

        # 1.2 Última actualización de señales
        print("🎯 1.2 - Analizando vista analytics.v_api_free_signals...")
        query_signals = """
        SELECT
          MAX(signal_date) as last_signal_date,
          COUNT(*) as total_signals,
          COUNT(DISTINCT ticker) as unique_tickers,
          MIN(signal_date) as first_signal_date
        FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`
        """

        try:
            results_signals = self.bq_client.query(query_signals).result()
            row = list(results_signals)[0]

            phase_results['signals_view'] = {
                'last_signal_date': str(row.last_signal_date),
                'total_signals': row.total_signals,
                'unique_tickers': row.unique_tickers,
                'first_signal_date': str(row.first_signal_date)
            }

            print(f"  ✅ Última fecha de señales: {row.last_signal_date}")
            print(f"  📊 Total de señales: {row.total_signals:,}")
            print(f"  🎯 Tickers únicos: {row.unique_tickers}\n")

        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            phase_results['signals_view'] = {"error": str(e)}

        # 1.3 Distribución horaria de updates
        print("⏰ 1.3 - Distribución horaria de actualizaciones (últimos 7 días)...")
        query_hourly = """
        SELECT
          EXTRACT(HOUR FROM updated_at) as hour_utc,
          DATE(updated_at) as update_date,
          COUNT(*) as update_count,
          MIN(updated_at) as first_update,
          MAX(updated_at) as last_update
        FROM `sunny-advantage-471523-b3.market_data.prices`
        WHERE DATE(updated_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)
        GROUP BY hour_utc, update_date
        ORDER BY update_date DESC, hour_utc
        LIMIT 50
        """

        try:
            results_hourly = self.bq_client.query(query_hourly).result()
            hourly_dist = []

            print("\n  📅 Últimas actualizaciones por hora (UTC):")
            print("  " + "-"*76)
            print(f"  {'Fecha':<12} {'Hora UTC':<10} {'Updates':<10} {'Primera':<20} {'Última':<20}")
            print("  " + "-"*76)

            for row in results_hourly:
                hourly_dist.append({
                    'date': str(row.update_date),
                    'hour_utc': int(row.hour_utc),
                    'update_count': row.update_count,
                    'first_update': row.first_update.isoformat(),
                    'last_update': row.last_update.isoformat()
                })

                print(f"  {row.update_date} {row.hour_utc:02d}:00     {row.update_count:<10} "
                      f"{row.first_update.strftime('%H:%M:%S'):<20} "
                      f"{row.last_update.strftime('%H:%M:%S'):<20}")

            print()
            phase_results['hourly_distribution'] = hourly_dist

        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            phase_results['hourly_distribution'] = {"error": str(e)}

        self.results['phases']['phase_1_bigquery'] = phase_results
        return phase_results

    # ========================================
    # FASE 2: GCS - ARCHIVOS RECIENTES
    # ========================================

    def phase_2_gcs_files(self):
        """FASE 2: Auditar archivos recientes en GCS"""
        print("="*80)
        print("📦 FASE 2: GOOGLE CLOUD STORAGE - ARCHIVOS RECIENTES")
        print("="*80 + "\n")

        phase_results = {}

        print("🔍 Analizando bucket: gs://" + BUCKET_NAME + "/" + BUCKET_PREFIX + "...")

        try:
            bucket = self.gcs_client.bucket(BUCKET_NAME)
            blobs = bucket.list_blobs(prefix=BUCKET_PREFIX, max_results=100)

            dates_info = defaultdict(lambda: {"file_count": 0, "total_bytes": 0, "files": []})

            for blob in blobs:
                if "date=" in blob.name:
                    date_str = blob.name.split("date=")[1].split("/")[0]
                    try:
                        datetime.strptime(date_str, "%Y-%m-%d")
                        dates_info[date_str]["file_count"] += 1
                        dates_info[date_str]["total_bytes"] += blob.size
                        dates_info[date_str]["files"].append({
                            "name": blob.name.split("/")[-1],
                            "size_mb": round(blob.size / (1024*1024), 2),
                            "updated": blob.updated.isoformat() if blob.updated else None
                        })
                    except ValueError:
                        continue

            # Ordenar por fecha descendente
            sorted_dates = sorted(dates_info.items(), reverse=True)[:10]

            print(f"\n  📊 Últimas 10 fechas con datos en GCS:")
            print("  " + "-"*70)
            print(f"  {'Fecha':<15} {'Archivos':<10} {'Tamaño (MB)':<15} {'Última actualización'}")
            print("  " + "-"*70)

            recent_files = []
            for date_str, info in sorted_dates:
                total_mb = round(info['total_bytes'] / (1024*1024), 2)
                last_updated = max([f['updated'] for f in info['files'] if f['updated']])

                print(f"  {date_str:<15} {info['file_count']:<10} {total_mb:<15.2f} {last_updated}")

                recent_files.append({
                    'date': date_str,
                    'file_count': info['file_count'],
                    'total_mb': total_mb,
                    'last_updated': last_updated,
                    'files': info['files'][:5]  # Primeros 5 archivos
                })

            print()
            phase_results['recent_files'] = recent_files
            phase_results['total_dates_found'] = len(dates_info)

            print(f"  ✅ Total de fechas encontradas: {len(dates_info)}\n")

        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            phase_results['error'] = str(e)

        self.results['phases']['phase_2_gcs'] = phase_results
        return phase_results

    # ========================================
    # FASE 3: SCHEDULED QUERIES
    # ========================================

    def phase_3_scheduled_queries(self):
        """FASE 3: Listar scheduled queries y transfer configs"""
        print("="*80)
        print("📅 FASE 3: SCHEDULED QUERIES & DATA TRANSFERS")
        print("="*80 + "\n")

        phase_results = {}

        print("🔍 Buscando scheduled queries y data transfers...")
        print("⚠️  Nota: Esta funcionalidad requiere la API de Data Transfer Service\n")

        # Nota: Para listar scheduled queries necesitamos usar la API de Data Transfer
        # que requiere permisos adicionales. Por ahora documentamos que debe hacerse
        # manualmente con gcloud o la consola.

        phase_results['note'] = "Use 'gcloud beta transfer configs list' para listar scheduled queries"
        phase_results['manual_command'] = "bq ls --transfer_config --project_id=sunny-advantage-471523-b3"

        print("  ℹ️  Para listar scheduled queries manualmente:")
        print("     bq ls --transfer_config --project_id=sunny-advantage-471523-b3\n")

        self.results['phases']['phase_3_scheduled'] = phase_results
        return phase_results

    # ========================================
    # FASE 4: GAP ANALYSIS
    # ========================================

    def phase_4_gap_analysis(self):
        """FASE 4: Calcular gaps temporales entre actualizaciones"""
        print("="*80)
        print("⏱️  FASE 4: ANÁLISIS DE GAPS TEMPORALES")
        print("="*80 + "\n")

        phase_results = {}

        print("🔍 Calculando diferencia temporal entre prices y señales...")

        query_gap = """
        WITH prices_latest AS (
          SELECT
            MAX(date) as last_date,
            MAX(updated_at) as prices_updated
          FROM `sunny-advantage-471523-b3.market_data.prices`
        ),
        signals_latest AS (
          SELECT
            MAX(signal_date) as last_date
          FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`
        )
        SELECT
          p.last_date as prices_last_date,
          p.prices_updated,
          s.last_date as signals_last_date,
          DATE_DIFF(s.last_date, p.last_date, DAY) as date_gap_days
        FROM prices_latest p, signals_latest s
        """

        try:
            results = self.bq_client.query(query_gap).result()
            row = list(results)[0]

            phase_results['gap_analysis'] = {
                'prices_last_date': str(row.prices_last_date),
                'prices_updated': row.prices_updated.isoformat() if row.prices_updated else None,
                'prices_updated_formatted': format_dual_tz(row.prices_updated) if row.prices_updated else None,
                'signals_last_date': str(row.signals_last_date),
                'date_gap_days': row.date_gap_days
            }

            print(f"  📊 Última fecha en prices: {row.prices_last_date}")
            print(f"  📅 Última actualización de prices: {format_dual_tz(row.prices_updated)}")
            print(f"  🎯 Última fecha en signals: {row.signals_last_date}")
            print(f"  ⏰ Gap en días: {row.date_gap_days} días\n")

            if row.date_gap_days < 0:
                print("  ⚠️  ADVERTENCIA: Las señales están más antiguas que los precios!")
            elif row.date_gap_days == 0:
                print("  ✅ Señales y precios están sincronizados (misma fecha)")
            else:
                print(f"  ⚠️  Las señales están {row.date_gap_days} días atrás")

            print()

        except Exception as e:
            print(f"  ❌ Error: {e}\n")
            phase_results['error'] = str(e)

        self.results['phases']['phase_4_gaps'] = phase_results
        return phase_results

    # ========================================
    # GENERAR REPORTE
    # ========================================

    def generate_report(self):
        """Genera el reporte final en JSON y Markdown"""
        print("="*80)
        print("📝 GENERANDO REPORTES FINALES")
        print("="*80 + "\n")

        # Guardar JSON
        json_file = "/home/user/signalssheets/eod_pipeline_audit_results.json"
        with open(json_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        print(f"✅ Resultados JSON guardados en: {json_file}\n")

        return self.results

    # ========================================
    # RUN ALL
    # ========================================

    def run_full_audit(self):
        """Ejecuta todas las fases de la auditoría"""
        print("\n" + "="*80)
        print("🚀 AUDITORÍA COMPLETA - PIPELINE EOD SIGNALSSHEETS")
        print("="*80)
        print(f"📅 Fecha de ejecución: {datetime.now(UTC).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"🔧 Proyecto: {PROJECT_ID}")
        print("="*80 + "\n")

        try:
            # Ejecutar todas las fases
            self.phase_1_bigquery_timing()
            self.phase_2_gcs_files()
            self.phase_3_scheduled_queries()
            self.phase_4_gap_analysis()

            # Generar reporte
            results = self.generate_report()

            print("="*80)
            print("✅ AUDITORÍA COMPLETADA EXITOSAMENTE")
            print("="*80)

            return results

        except Exception as e:
            print(f"\n❌ Error general en la auditoría: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


def main():
    """Punto de entrada principal"""
    try:
        auditor = EODPipelineAuditor()
        auditor.run_full_audit()

    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
