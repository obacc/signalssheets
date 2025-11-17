#!/usr/bin/env python3
"""
Generador de Reporte EOD Pipeline - Formato Markdown
Lee los resultados JSON de la auditoría y genera un reporte completo
"""

import json
import sys
from datetime import datetime
import os

def load_results(json_file):
    """Carga los resultados JSON de la auditoría"""
    if not os.path.exists(json_file):
        print(f"❌ Error: No se encontró el archivo {json_file}")
        print("   Ejecuta primero: python3 audit_eod_pipeline.py")
        sys.exit(1)

    with open(json_file, 'r') as f:
        return json.load(f)


def generate_markdown_report(results):
    """Genera el reporte en formato Markdown"""

    report = []

    # Header
    report.append("# REPORTE DE AUDITORÍA - PIPELINE EOD SIGNALSSHEETS")
    report.append("")
    report.append(f"**Proyecto:** `{results['project_id']}`")
    report.append(f"**Fecha de Auditoría:** {results['execution_time']}")
    report.append(f"**Auditor:** Claude Code")
    report.append("")
    report.append("---")
    report.append("")

    # Executive Summary
    report.append("## 1. EXECUTIVE SUMMARY")
    report.append("")

    # Extract key findings
    phase_1 = results['phases'].get('phase_1_bigquery', {})
    phase_2 = results['phases'].get('phase_2_gcs', {})
    phase_4 = results['phases'].get('phase_4_gaps', {})

    prices_table = phase_1.get('prices_table', {})
    signals_view = phase_1.get('signals_view', {})
    gap_analysis = phase_4.get('gap_analysis', {})

    # Estado actual
    report.append("### Estado Actual del Pipeline")
    report.append("")

    if prices_table and not prices_table.get('error'):
        report.append(f"- **Última fecha de precios:** {prices_table.get('last_price_date', 'N/A')}")
        report.append(f"- **Última actualización de prices:** {prices_table.get('last_updated_formatted', 'N/A')}")
        report.append(f"- **Registros (últimos 7 días):** {prices_table.get('total_records_last_7d', 'N/A'):,}")
    else:
        report.append("- ⚠️ No se pudo obtener información de la tabla prices")

    report.append("")

    if signals_view and not signals_view.get('error'):
        report.append(f"- **Última fecha de señales:** {signals_view.get('last_signal_date', 'N/A')}")
        report.append(f"- **Total de señales:** {signals_view.get('total_signals', 'N/A'):,}")
        report.append(f"- **Tickers con señales:** {signals_view.get('unique_tickers', 'N/A')}")
    else:
        report.append("- ⚠️ No se pudo obtener información de la vista de señales")

    report.append("")

    # Gap Analysis
    if gap_analysis and not gap_analysis.get('error'):
        gap_days = gap_analysis.get('date_gap_days', None)
        report.append(f"- **Gap entre prices y signals:** {gap_days} días")

        if gap_days is not None:
            if gap_days < 0:
                report.append("  - ⚠️ **ADVERTENCIA:** Las señales están más antiguas que los precios")
            elif gap_days == 0:
                report.append("  - ✅ Señales y precios están sincronizados")
            else:
                report.append(f"  - ⚠️ Las señales están {gap_days} días desactualizadas")

    report.append("")
    report.append("---")
    report.append("")

    # Tiempos Actuales
    report.append("## 2. TIEMPOS ACTUALES (con timestamps reales)")
    report.append("")
    report.append("```")
    report.append("┌─────────────────────────────────────────────────┐")
    report.append("│ PIPELINE EOD - TIEMPOS DETECTADOS              │")
    report.append("├─────────────────────────────────────────────────┤")

    # Parse hourly distribution to find patterns
    hourly_dist = phase_1.get('hourly_distribution', [])

    if hourly_dist and isinstance(hourly_dist, list) and len(hourly_dist) > 0:
        # Encontrar la hora más común de actualización
        hour_counts = {}
        for entry in hourly_dist:
            hour = entry.get('hour_utc')
            if hour is not None:
                hour_counts[hour] = hour_counts.get(hour, 0) + 1

        if hour_counts:
            most_common_hour = max(hour_counts, key=hour_counts.get)
            report.append(f"│ Hora más común de actualización: {most_common_hour:02d}:00 UTC │")
        else:
            report.append("│ No se detectó patrón horario                   │")
    else:
        report.append("│ No hay datos de distribución horaria           │")

    report.append("│                                                 │")
    report.append("│ 00:00 CT → Descarga datos (GCS)   [ASUMIDO]   │")
    report.append("│ 01:00 CT → Carga a prices         [ASUMIDO]   │")

    if prices_table and prices_table.get('last_updated_formatted'):
        report.append(f"│ Última actualización de prices:                │")
        report.append(f"│   {prices_table['last_updated_formatted']:<47}│")

    report.append("│ XX:XX CT → Vista v_api_free_signals lista     │")
    report.append("│ ACTUAL   → Worker refresh cada 10 min ❌      │")
    report.append("└─────────────────────────────────────────────────┘")
    report.append("```")
    report.append("")
    report.append("---")
    report.append("")

    # Datos Encontrados - FASE 1
    report.append("## 3. DATOS ENCONTRADOS - BIGQUERY")
    report.append("")

    if prices_table and not prices_table.get('error'):
        report.append("### 3.1 Tabla `market_data.prices`")
        report.append("")
        report.append(f"- **Última fecha de datos:** {prices_table.get('last_price_date', 'N/A')}")
        report.append(f"- **Timestamp de actualización:** {prices_table.get('last_updated_formatted', 'N/A')}")
        report.append(f"- **Registros (últimos 7 días):** {prices_table.get('total_records_last_7d', 0):,}")
        report.append(f"- **Tickers únicos:** {prices_table.get('unique_tickers', 0)}")
        report.append("")
    else:
        report.append("### 3.1 Tabla `market_data.prices`")
        report.append("")
        report.append(f"❌ Error: {prices_table.get('error', 'Desconocido')}")
        report.append("")

    if signals_view and not signals_view.get('error'):
        report.append("### 3.2 Vista `analytics.v_api_free_signals`")
        report.append("")
        report.append(f"- **Última fecha de señales:** {signals_view.get('last_signal_date', 'N/A')}")
        report.append(f"- **Total de señales:** {signals_view.get('total_signals', 0):,}")
        report.append(f"- **Tickers únicos:** {signals_view.get('unique_tickers', 0)}")
        report.append(f"- **Primera señal:** {signals_view.get('first_signal_date', 'N/A')}")
        report.append("")
    else:
        report.append("### 3.2 Vista `analytics.v_api_free_signals`")
        report.append("")
        report.append(f"❌ Error: {signals_view.get('error', 'Desconocido')}")
        report.append("")

    # Distribución Horaria
    if hourly_dist and isinstance(hourly_dist, list):
        report.append("### 3.3 Distribución Horaria de Actualizaciones")
        report.append("")
        report.append("| Fecha | Hora UTC | Updates | Primera | Última |")
        report.append("|-------|----------|---------|---------|--------|")

        for entry in hourly_dist[:20]:  # Primeras 20 entradas
            report.append(f"| {entry.get('date', 'N/A')} | {entry.get('hour_utc', 0):02d}:00 | "
                        f"{entry.get('update_count', 0)} | "
                        f"{entry.get('first_update', 'N/A')[:19]} | "
                        f"{entry.get('last_update', 'N/A')[:19]} |")

        report.append("")

    report.append("---")
    report.append("")

    # Datos GCS - FASE 2
    report.append("## 4. DATOS ENCONTRADOS - GOOGLE CLOUD STORAGE")
    report.append("")

    recent_files = phase_2.get('recent_files', [])

    if recent_files:
        report.append(f"**Total de fechas encontradas en GCS:** {phase_2.get('total_dates_found', 0)}")
        report.append("")
        report.append("### Últimas 10 fechas con datos:")
        report.append("")
        report.append("| Fecha | Archivos | Tamaño (MB) | Última Actualización |")
        report.append("|-------|----------|-------------|----------------------|")

        for file_info in recent_files[:10]:
            report.append(f"| {file_info.get('date', 'N/A')} | "
                        f"{file_info.get('file_count', 0)} | "
                        f"{file_info.get('total_mb', 0):.2f} | "
                        f"{file_info.get('last_updated', 'N/A')[:19]} |")

        report.append("")
    else:
        report.append("⚠️ No se encontraron archivos recientes en GCS o hubo un error")
        if phase_2.get('error'):
            report.append(f"Error: {phase_2['error']}")
        report.append("")

    report.append("---")
    report.append("")

    # Gap Analysis - FASE 4
    report.append("## 5. ANÁLISIS DE GAPS TEMPORALES")
    report.append("")

    if gap_analysis and not gap_analysis.get('error'):
        report.append("### Sincronización entre Prices y Signals")
        report.append("")
        report.append(f"- **Última fecha en prices:** {gap_analysis.get('prices_last_date', 'N/A')}")
        report.append(f"- **Última actualización de prices:** {gap_analysis.get('prices_updated_formatted', 'N/A')}")
        report.append(f"- **Última fecha en signals:** {gap_analysis.get('signals_last_date', 'N/A')}")
        report.append(f"- **Gap temporal:** {gap_analysis.get('date_gap_days', 'N/A')} días")
        report.append("")

        gap_days = gap_analysis.get('date_gap_days')
        if gap_days is not None:
            if gap_days < 0:
                report.append("⚠️ **CRÍTICO:** Las señales están desactualizadas respecto a los precios")
            elif gap_days == 0:
                report.append("✅ **BUENO:** Señales y precios están sincronizados")
            elif gap_days > 0 and gap_days <= 1:
                report.append("✅ **ACEPTABLE:** Gap de 1 día es normal para procesamiento EOD")
            else:
                report.append(f"⚠️ **ATENCIÓN:** Gap de {gap_days} días puede indicar un problema")

        report.append("")
    else:
        report.append("❌ No se pudo calcular el gap temporal")
        if gap_analysis.get('error'):
            report.append(f"Error: {gap_analysis['error']}")
        report.append("")

    report.append("---")
    report.append("")

    # Recomendaciones
    report.append("## 6. RECOMENDACIÓN FINAL")
    report.append("")
    report.append("### Análisis del Pipeline")
    report.append("")

    # Basado en los datos encontrados
    if hourly_dist and isinstance(hourly_dist, list) and len(hourly_dist) > 0:
        hour_counts = {}
        for entry in hourly_dist:
            hour = entry.get('hour_utc')
            if hour is not None:
                hour_counts[hour] = hour_counts.get(hour, 0) + 1

        if hour_counts:
            most_common_hour_utc = max(hour_counts, key=hour_counts.get)

            # Convertir UTC a CT (UTC-6 para CST o UTC-5 para CDT)
            # Asumimos CST (UTC-6)
            most_common_hour_ct = (most_common_hour_utc - 6) % 24

            report.append(f"Basado en el análisis de las últimas actualizaciones:")
            report.append("")
            report.append(f"- **Hora más común de actualización:** {most_common_hour_utc:02d}:00 UTC ({most_common_hour_ct:02d}:00 CT)")
            report.append(f"- **Frecuencia observada:** {hour_counts[most_common_hour_utc]} actualizaciones en esa hora")
            report.append("")

            # Calcular hora recomendada para el cron (1-2 horas después)
            recommended_hour_utc = (most_common_hour_utc + 2) % 24
            recommended_hour_ct = (most_common_hour_ct + 2) % 24

            report.append("### Nuevo CRON Schedule Recomendado:")
            report.append("")
            report.append("```toml")
            report.append("[triggers]")
            report.append(f'crons = ["0 {recommended_hour_utc} * * 1-5"]  # {recommended_hour_utc:02d}:00 UTC = {recommended_hour_ct:02d}:00 CT (lunes a viernes)')
            report.append("```")
            report.append("")

            report.append("**Justificación:**")
            report.append(f"- Prices se actualizan alrededor de las {most_common_hour_utc:02d}:00 UTC")
            report.append(f"- Damos 2 horas de margen para que el procesamiento de señales complete")
            report.append(f"- Worker ejecutará a las {recommended_hour_utc:02d}:00 UTC ({recommended_hour_ct:02d}:00 CT)")
            report.append("")

    else:
        report.append("⚠️ **NOTA:** No se pudo determinar el patrón de actualización.")
        report.append("")
        report.append("Necesitas:")
        report.append("- Verificar scheduled queries en BigQuery")
        report.append("- Revisar logs de Cloud Functions/Scheduler")
        report.append("- Confirmar el horario de descarga de Polygon")
        report.append("")

    report.append("### Nuevo TTL Recomendado:")
    report.append("")
    report.append("```typescript")
    report.append("const ttl = 86400; // 24 horas (1 día)")
    report.append("// Las señales se actualizan 1 vez al día EOD")
    report.append("```")
    report.append("")

    report.append("---")
    report.append("")

    # Worker Configuration
    report.append("## 7. CONFIGURACIÓN DEL CLOUDFLARE WORKER")
    report.append("")
    report.append("⚠️ **PENDIENTE:** Se requiere acceso al código del Worker `free-api` para documentar:")
    report.append("")
    report.append("- Configuración actual del cron job")
    report.append("- Código de fetch a BigQuery")
    report.append("- Manejo del cache en KV")
    report.append("- TTL actual configurado")
    report.append("")

    report.append("---")
    report.append("")

    # Comandos Ejecutados
    report.append("## 8. COMANDOS EJECUTADOS (Documentación)")
    report.append("")
    report.append("### BigQuery Queries")
    report.append("")
    report.append("```sql")
    report.append("-- Última actualización de prices")
    report.append("SELECT")
    report.append("  MAX(date) as last_price_date,")
    report.append("  MAX(updated_at) as last_updated_timestamp,")
    report.append("  COUNT(*) as total_records,")
    report.append("  COUNT(DISTINCT ticker) as unique_tickers")
    report.append("FROM `sunny-advantage-471523-b3.market_data.prices`")
    report.append("WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS);")
    report.append("")
    report.append("-- Última actualización de señales")
    report.append("SELECT")
    report.append("  MAX(signal_date) as last_signal_date,")
    report.append("  COUNT(*) as total_signals,")
    report.append("  COUNT(DISTINCT ticker) as unique_tickers")
    report.append("FROM `sunny-advantage-471523-b3.analytics.v_api_free_signals`;")
    report.append("")
    report.append("-- Distribución horaria")
    report.append("SELECT")
    report.append("  EXTRACT(HOUR FROM updated_at) as hour_utc,")
    report.append("  COUNT(*) as update_count,")
    report.append("  MIN(updated_at) as first_update,")
    report.append("  MAX(updated_at) as last_update")
    report.append("FROM `sunny-advantage-471523-b3.market_data.prices`")
    report.append("WHERE DATE(updated_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAYS)")
    report.append("GROUP BY hour_utc")
    report.append("ORDER BY hour_utc;")
    report.append("```")
    report.append("")

    report.append("### Google Cloud Storage")
    report.append("")
    report.append("```bash")
    report.append("# Listar archivos recientes")
    report.append("gsutil ls -lh gs://ss-bucket-polygon-incremental/polygon/daily/ | tail -50")
    report.append("```")
    report.append("")

    report.append("---")
    report.append("")

    # Próximos Pasos
    report.append("## 9. PRÓXIMOS PASOS")
    report.append("")
    report.append("### Acciones Recomendadas:")
    report.append("")
    report.append("1. **Validar horarios con Scheduled Queries**")
    report.append("   ```bash")
    report.append("   bq ls --transfer_config --project_id=sunny-advantage-471523-b3")
    report.append("   ```")
    report.append("")
    report.append("2. **Actualizar Worker Configuration**")
    report.append("   - Modificar `wrangler.toml` con el nuevo cron schedule")
    report.append("   - Actualizar TTL en el código del worker")
    report.append("   - Desplegar cambios con `wrangler deploy`")
    report.append("")
    report.append("3. **Monitorear resultados**")
    report.append("   - Verificar logs del worker después del cambio")
    report.append("   - Confirmar que el cache se actualiza correctamente")
    report.append("   - Validar que no hay gaps en los datos")
    report.append("")
    report.append("4. **Configurar alertas** (opcional pero recomendado)")
    report.append("   - Alerta si las señales tienen más de 2 días de antigüedad")
    report.append("   - Alerta si el worker falla en actualizar el cache")
    report.append("")

    report.append("---")
    report.append("")
    report.append("## 📊 CONCLUSIÓN")
    report.append("")

    if gap_analysis and gap_analysis.get('date_gap_days') == 0:
        report.append("✅ **El pipeline está funcionando correctamente.** ")
        report.append("Los datos están sincronizados entre prices y signals.")
    elif gap_analysis and gap_analysis.get('date_gap_days', 0) <= 1:
        report.append("✅ **El pipeline está mayormente funcional.** ")
        report.append("Hay un pequeño gap que es normal para procesamiento EOD.")
    else:
        report.append("⚠️ **Atención requerida.** ")
        report.append("Se detectaron gaps que requieren investigación.")

    report.append("")
    report.append("La implementación del cron schedule recomendado optimizará el uso de recursos ")
    report.append("del Worker y asegurará que los datos estén disponibles cuando sean necesarios.")
    report.append("")

    report.append("---")
    report.append("")
    report.append("**Generado por:** Claude Code - EOD Pipeline Auditor")
    report.append(f"**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")

    return "\n".join(report)


def main():
    """Punto de entrada principal"""

    # Buscar archivo JSON
    json_file = "/home/user/signalssheets/eod_pipeline_audit_results.json"

    if len(sys.argv) > 1:
        json_file = sys.argv[1]

    print(f"📖 Leyendo resultados de: {json_file}")

    # Cargar resultados
    results = load_results(json_file)

    # Generar reporte
    markdown_content = generate_markdown_report(results)

    # Guardar reporte
    output_file = "/home/user/signalssheets/DATA_PIPELINE_AUDIT_REPORT.md"
    with open(output_file, 'w') as f:
        f.write(markdown_content)

    print(f"✅ Reporte generado: {output_file}")
    print("")
    print("Para ver el reporte:")
    print(f"  cat {output_file}")
    print("")


if __name__ == "__main__":
    main()
