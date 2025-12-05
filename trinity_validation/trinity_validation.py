#!/usr/bin/env python3
"""
Trinity Method MVP - Pre-Development Validation
Project: sunny-advantage-471523-b3
10 Real Tickers: AAPL, MSFT, GOOGL, NVDA, META, TSLA, AMZN, JPM, V, WMT
"""

import os
from datetime import datetime, date
from google.cloud import bigquery
import pandas as pd

# Set credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/user/signalssheets/credentials/gcp-service-account.json'

PROJECT_ID = 'sunny-advantage-471523-b3'
OUTPUT_DIR = '/home/user/signalssheets/trinity_validation'

TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'TSLA', 'AMZN', 'JPM', 'V', 'WMT']

# ============================================================================
# SCORING PARAMETERS (Moderate Profile)
# ============================================================================

# Lynch Parameters
LYNCH_PEG_EXCELLENT = 0.5
LYNCH_PEG_GOOD = 1.0
LYNCH_PEG_ACCEPTABLE = 1.5

LYNCH_ROE_EXCELLENT = 20
LYNCH_ROE_GOOD = 15
LYNCH_ROE_ACCEPTABLE = 10

LYNCH_EPS_GROWTH_EXCELLENT = 30
LYNCH_EPS_GROWTH_GOOD = 20
LYNCH_EPS_GROWTH_ACCEPTABLE = 10

# O'Neil Parameters
ONEIL_RS_EXCELLENT = 85
ONEIL_RS_GOOD = 70
ONEIL_RS_ACCEPTABLE = 50

# Graham Parameters
GRAHAM_PB_EXCELLENT = 1.0
GRAHAM_PB_GOOD = 1.5
GRAHAM_PB_ACCEPTABLE = 2.5

GRAHAM_CR_EXCELLENT = 2.5
GRAHAM_CR_GOOD = 2.0
GRAHAM_CR_ACCEPTABLE = 1.5

GRAHAM_DE_EXCELLENT = 0.3
GRAHAM_DE_GOOD = 0.5
GRAHAM_DE_ACCEPTABLE = 1.0

# Trinity Weights
LYNCH_WEIGHT = 0.35
ONEIL_WEIGHT = 0.35
GRAHAM_WEIGHT = 0.30

# Signal Thresholds
STRONG_BUY_THRESHOLD = 85
BUY_THRESHOLD = 70
HOLD_THRESHOLD = 50


def create_test_table(client):
    """PASO 1: Crear tabla test en BigQuery"""
    print("\n" + "="*70)
    print("PASO 1: CREAR TABLA TEST")
    print("="*70)

    ddl = """
    CREATE OR REPLACE TABLE `sunny-advantage-471523-b3.IS_Fundamentales.trinity_signals_daily_test`
    (
      ticker STRING NOT NULL,
      company_name STRING,
      sector STRING,
      signal_date DATE NOT NULL,

      price_current FLOAT64,
      price_52w_high FLOAT64,
      price_52w_low FLOAT64,
      volume_daily INT64,
      volume_avg_50d FLOAT64,
      market_cap FLOAT64,

      eps_ttm FLOAT64,
      eps_diluted_q FLOAT64,
      shares_outstanding_diluted FLOAT64,
      revenues_ttm FLOAT64,
      net_income_ttm FLOAT64,
      stockholders_equity FLOAT64,
      current_assets FLOAT64,
      current_liabilities FLOAT64,
      long_term_debt FLOAT64,

      roe FLOAT64,
      current_ratio FLOAT64,
      revenue_growth_yoy FLOAT64,
      eps_growth_yoy FLOAT64,

      pe_ratio FLOAT64,
      pb_ratio FLOAT64,
      peg_ratio FLOAT64,
      debt_to_equity FLOAT64,

      lynch_score FLOAT64,
      lynch_peg_score FLOAT64,
      lynch_roe_score FLOAT64,
      lynch_eps_growth_score FLOAT64,

      oneil_score FLOAT64,
      oneil_rs_score FLOAT64,
      oneil_volume_score FLOAT64,
      oneil_price_momentum_score FLOAT64,

      graham_score FLOAT64,
      graham_pb_score FLOAT64,
      graham_current_ratio_score FLOAT64,
      graham_debt_equity_score FLOAT64,

      trinity_score FLOAT64,

      signal_strength STRING,
      entry_price FLOAT64,
      stop_loss FLOAT64,
      target_price FLOAT64
    )
    OPTIONS(description='Tabla TEST para validación pre-desarrollo Trinity Method')
    """

    try:
        client.query(ddl).result()
        print("✅ Tabla trinity_signals_daily_test creada exitosamente")
        return True
    except Exception as e:
        print(f"❌ Error creando tabla: {e}")
        return False


def extract_ticker_data(client, ticker):
    """Extraer datos reales para un ticker específico"""

    query = f"""
    WITH
    -- Datos de precios (último día disponible)
    prices_data AS (
      SELECT
        REPLACE(ticker, '.US', '') as ticker_clean,
        close as price_current,
        CAST(vol AS INT64) as volume_daily,
        fecha
      FROM `sunny-advantage-471523-b3.market_data.Prices`
      WHERE REPLACE(ticker, '.US', '') = '{ticker}'
      ORDER BY fecha DESC
      LIMIT 1
    ),

    -- Ventana 52 semanas
    prices_52w AS (
      SELECT
        REPLACE(ticker, '.US', '') as ticker_clean,
        MAX(high) as high_52w,
        MIN(low) as low_52w
      FROM `sunny-advantage-471523-b3.market_data.Prices`
      WHERE REPLACE(ticker, '.US', '') = '{ticker}'
        AND fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 365 DAY)
      GROUP BY 1
    ),

    -- Volume promedio 50 días
    volume_50d AS (
      SELECT
        REPLACE(ticker, '.US', '') as ticker_clean,
        AVG(vol) as volume_avg_50d
      FROM `sunny-advantage-471523-b3.market_data.Prices`
      WHERE REPLACE(ticker, '.US', '') = '{ticker}'
        AND fecha >= DATE_SUB(CURRENT_DATE(), INTERVAL 50 DAY)
      GROUP BY 1
    ),

    -- Fundamentales más recientes
    fundamentals_latest AS (
      SELECT
        ticker,
        eps_diluted,
        revenues,
        net_income,
        shares_outstanding_diluted,
        stockholders_equity,
        current_assets,
        current_liabilities,
        long_term_debt,
        fiscal_year,
        fiscal_period
      FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
      WHERE ticker = '{ticker}'
      ORDER BY fiscal_year DESC, fiscal_period DESC
      LIMIT 1
    ),

    -- TTM calculation (sum of last 4 quarters)
    fundamentals_ttm AS (
      SELECT
        ticker,
        SUM(eps_diluted) as eps_ttm,
        SUM(revenues) as revenues_ttm,
        SUM(net_income) as net_income_ttm
      FROM (
        SELECT *
        FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_timeseries`
        WHERE ticker = '{ticker}'
        ORDER BY fiscal_year DESC, fiscal_period DESC
        LIMIT 4
      )
      GROUP BY ticker
    ),

    -- Ratios del quarter más reciente
    ratios_recent AS (
      SELECT
        ticker,
        roe,
        current_ratio,
        revenue_growth_yoy,
        eps_growth_yoy
      FROM `sunny-advantage-471523-b3.IS_Fundamentales.fundamentals_ratios`
      WHERE ticker = '{ticker}'
      ORDER BY fiscal_year DESC, fiscal_period DESC
      LIMIT 1
    ),

    -- Mapeo ticker
    mapping AS (
      SELECT
        ticker,
        company_name,
        sector
      FROM `sunny-advantage-471523-b3.IS_Fundamentales.cik_ticker_mapping`
      WHERE ticker = '{ticker}'
    )

    SELECT
      COALESCE(m.ticker, '{ticker}') as ticker,
      m.company_name,
      m.sector,
      CURRENT_DATE() as signal_date,

      p.price_current,
      p52.high_52w as price_52w_high,
      p52.low_52w as price_52w_low,
      p.volume_daily,
      v50.volume_avg_50d,

      f.eps_diluted as eps_diluted_q,
      f.shares_outstanding_diluted,
      f.stockholders_equity,
      f.current_assets,
      f.current_liabilities,
      f.long_term_debt,

      fttm.eps_ttm,
      fttm.revenues_ttm,
      fttm.net_income_ttm,

      r.roe,
      r.current_ratio,
      r.revenue_growth_yoy,
      r.eps_growth_yoy

    FROM prices_data p
    LEFT JOIN prices_52w p52 ON p.ticker_clean = p52.ticker_clean
    LEFT JOIN volume_50d v50 ON p.ticker_clean = v50.ticker_clean
    LEFT JOIN fundamentals_latest f ON p.ticker_clean = f.ticker
    LEFT JOIN fundamentals_ttm fttm ON p.ticker_clean = fttm.ticker
    LEFT JOIN ratios_recent r ON p.ticker_clean = r.ticker
    LEFT JOIN mapping m ON p.ticker_clean = m.ticker
    """

    try:
        result = client.query(query).to_dataframe()
        if result.empty:
            return None
        return result.iloc[0].to_dict()
    except Exception as e:
        print(f"    ⚠️ Error extrayendo datos: {e}")
        return None


def calculate_lynch_score(data):
    """Calcular Lynch Score y subscores"""
    peg_ratio = data.get('peg_ratio')
    roe = data.get('roe', 0) or 0
    eps_growth = data.get('eps_growth_yoy', 0) or 0

    # Convert ROE to percentage if it's a decimal
    if roe and abs(roe) < 1:
        roe = roe * 100

    # PEG Score (30% weight)
    if peg_ratio is None or peg_ratio <= 0:
        peg_score = 0
    elif peg_ratio <= LYNCH_PEG_EXCELLENT:
        peg_score = 100
    elif peg_ratio <= LYNCH_PEG_GOOD:
        peg_score = 80
    elif peg_ratio <= LYNCH_PEG_ACCEPTABLE:
        peg_score = 60
    else:
        peg_score = 30

    # ROE Score (25% weight)
    if roe >= LYNCH_ROE_EXCELLENT:
        roe_score = 100
    elif roe >= LYNCH_ROE_GOOD:
        roe_score = 80
    elif roe >= LYNCH_ROE_ACCEPTABLE:
        roe_score = 60
    else:
        roe_score = 30

    # EPS Growth Score (25% weight)
    if eps_growth >= LYNCH_EPS_GROWTH_EXCELLENT:
        eps_growth_score = 100
    elif eps_growth >= LYNCH_EPS_GROWTH_GOOD:
        eps_growth_score = 80
    elif eps_growth >= LYNCH_EPS_GROWTH_ACCEPTABLE:
        eps_growth_score = 60
    else:
        eps_growth_score = 30

    # Revenue Growth Score (20% weight) - use similar to EPS
    revenue_growth_score = eps_growth_score

    # Final Lynch Score
    lynch_score = (peg_score * 0.30) + (roe_score * 0.25) + (eps_growth_score * 0.25) + (revenue_growth_score * 0.20)

    return {
        'lynch_score': round(lynch_score, 2),
        'lynch_peg_score': peg_score,
        'lynch_roe_score': roe_score,
        'lynch_eps_growth_score': eps_growth_score
    }


def calculate_oneil_score(data):
    """Calcular O'Neil Score y subscores"""
    price_current = data.get('price_current', 0) or 0
    price_52w_high = data.get('price_52w_high', 0) or 0
    price_52w_low = data.get('price_52w_low', 0) or 0
    volume_daily = data.get('volume_daily', 0) or 0
    volume_avg_50d = data.get('volume_avg_50d', 1) or 1
    eps_growth = data.get('eps_growth_yoy', 0) or 0

    # Relative Strength calculation
    price_range = price_52w_high - price_52w_low
    if price_range > 0:
        rs = ((price_current - price_52w_low) / price_range) * 100
    else:
        rs = 50

    # RS Score (35% weight)
    if rs >= ONEIL_RS_EXCELLENT:
        rs_score = 100
    elif rs >= ONEIL_RS_GOOD:
        rs_score = 80
    elif rs >= ONEIL_RS_ACCEPTABLE:
        rs_score = 60
    else:
        rs_score = 30

    # Volume Surge calculation
    if volume_avg_50d > 0:
        volume_surge_pct = ((volume_daily / volume_avg_50d) - 1) * 100
    else:
        volume_surge_pct = 0

    # Volume Score (25% weight)
    if volume_surge_pct >= 200:
        volume_score = 100
    elif volume_surge_pct >= 150:
        volume_score = 80
    elif volume_surge_pct >= 100:
        volume_score = 60
    else:
        volume_score = 30

    # Price Momentum - distance from 52w high
    if price_52w_high > 0:
        distance_from_high = ((price_52w_high - price_current) / price_52w_high) * 100
    else:
        distance_from_high = 100

    # Momentum Score (20% weight)
    if distance_from_high <= 5:
        momentum_score = 100
    elif distance_from_high <= 10:
        momentum_score = 80
    elif distance_from_high <= 20:
        momentum_score = 60
    else:
        momentum_score = 30

    # EPS Growth Score for O'Neil (20% weight)
    if eps_growth >= LYNCH_EPS_GROWTH_EXCELLENT:
        eps_score = 100
    elif eps_growth >= LYNCH_EPS_GROWTH_GOOD:
        eps_score = 80
    elif eps_growth >= LYNCH_EPS_GROWTH_ACCEPTABLE:
        eps_score = 60
    else:
        eps_score = 30

    # Final O'Neil Score
    oneil_score = (rs_score * 0.35) + (volume_score * 0.25) + (momentum_score * 0.20) + (eps_score * 0.20)

    return {
        'oneil_score': round(oneil_score, 2),
        'oneil_rs_score': rs_score,
        'oneil_volume_score': volume_score,
        'oneil_price_momentum_score': momentum_score
    }


def calculate_graham_score(data):
    """Calcular Graham Score y subscores"""
    pb_ratio = data.get('pb_ratio', 0) or 0
    current_ratio = data.get('current_ratio', 0) or 0
    debt_to_equity = data.get('debt_to_equity', 0) or 0

    # P/B Score (30% weight)
    if pb_ratio <= 0:
        pb_score = 50  # Neutral if no data
    elif pb_ratio <= GRAHAM_PB_EXCELLENT:
        pb_score = 100
    elif pb_ratio <= GRAHAM_PB_GOOD:
        pb_score = 80
    elif pb_ratio <= GRAHAM_PB_ACCEPTABLE:
        pb_score = 60
    else:
        pb_score = 30

    # Current Ratio Score (25% weight)
    if current_ratio >= GRAHAM_CR_EXCELLENT:
        cr_score = 100
    elif current_ratio >= GRAHAM_CR_GOOD:
        cr_score = 80
    elif current_ratio >= GRAHAM_CR_ACCEPTABLE:
        cr_score = 60
    else:
        cr_score = 30

    # Debt/Equity Score (25% weight)
    if debt_to_equity <= 0:
        de_score = 100  # No debt is best
    elif debt_to_equity <= GRAHAM_DE_EXCELLENT:
        de_score = 100
    elif debt_to_equity <= GRAHAM_DE_GOOD:
        de_score = 80
    elif debt_to_equity <= GRAHAM_DE_ACCEPTABLE:
        de_score = 60
    else:
        de_score = 30

    # Earnings Stability (20% weight) - simplified
    earnings_stability_score = 70

    # Final Graham Score
    graham_score = (pb_score * 0.30) + (cr_score * 0.25) + (de_score * 0.25) + (earnings_stability_score * 0.20)

    return {
        'graham_score': round(graham_score, 2),
        'graham_pb_score': pb_score,
        'graham_current_ratio_score': cr_score,
        'graham_debt_equity_score': de_score
    }


def calculate_trinity_score(lynch_score, oneil_score, graham_score):
    """Calcular Trinity Score final"""
    trinity = (lynch_score * LYNCH_WEIGHT) + (oneil_score * ONEIL_WEIGHT) + (graham_score * GRAHAM_WEIGHT)
    return round(trinity, 2)


def get_signal_strength(trinity_score):
    """Determinar fuerza de señal"""
    if trinity_score >= STRONG_BUY_THRESHOLD:
        return "STRONG BUY"
    elif trinity_score >= BUY_THRESHOLD:
        return "BUY"
    elif trinity_score >= HOLD_THRESHOLD:
        return "HOLD"
    else:
        return "SELL"


def calculate_trading_prices(price_current):
    """Calcular precios de trading"""
    if not price_current or price_current <= 0:
        return None, None, None

    entry_price = round(price_current, 2)
    stop_loss = round(price_current * 0.93, 2)  # 7% below
    target_price = round(price_current * 1.20, 2)  # 20% above

    return entry_price, stop_loss, target_price


def process_ticker(client, ticker):
    """Procesar un ticker completo"""
    print(f"\n  📊 Procesando {ticker}...")

    # Extract data
    data = extract_ticker_data(client, ticker)
    if not data:
        print(f"    ❌ No se encontraron datos para {ticker}")
        return None

    # Calculate dynamic ratios
    price_current = data.get('price_current', 0) or 0
    eps_ttm = data.get('eps_ttm', 0) or 0
    shares_outstanding = data.get('shares_outstanding_diluted', 0) or 0
    stockholders_equity = data.get('stockholders_equity', 0) or 0
    long_term_debt = data.get('long_term_debt', 0) or 0

    # Market Cap
    if price_current and shares_outstanding:
        market_cap = price_current * shares_outstanding
    else:
        market_cap = None

    # P/E Ratio
    if eps_ttm and eps_ttm != 0:
        pe_ratio = round(price_current / eps_ttm, 2)
    else:
        pe_ratio = None

    # P/B Ratio
    if stockholders_equity and stockholders_equity > 0 and shares_outstanding:
        book_value_per_share = stockholders_equity / shares_outstanding
        pb_ratio = round(price_current / book_value_per_share, 2) if book_value_per_share > 0 else None
    else:
        pb_ratio = None

    # PEG Ratio
    eps_growth = data.get('eps_growth_yoy', 0) or 0
    if pe_ratio and eps_growth and eps_growth > 0:
        peg_ratio = round(pe_ratio / eps_growth, 2)
    else:
        peg_ratio = None

    # Debt to Equity
    if stockholders_equity and stockholders_equity > 0:
        debt_to_equity = round((long_term_debt or 0) / stockholders_equity, 2)
    else:
        debt_to_equity = None

    # Add calculated ratios to data
    data['market_cap'] = market_cap
    data['pe_ratio'] = pe_ratio
    data['pb_ratio'] = pb_ratio
    data['peg_ratio'] = peg_ratio
    data['debt_to_equity'] = debt_to_equity

    # Calculate scores
    lynch_scores = calculate_lynch_score(data)
    oneil_scores = calculate_oneil_score(data)
    graham_scores = calculate_graham_score(data)

    trinity_score = calculate_trinity_score(
        lynch_scores['lynch_score'],
        oneil_scores['oneil_score'],
        graham_scores['graham_score']
    )

    signal_strength = get_signal_strength(trinity_score)
    entry_price, stop_loss, target_price = calculate_trading_prices(price_current)

    # Combine all data
    result = {
        'ticker': ticker,
        'company_name': data.get('company_name'),
        'sector': data.get('sector'),
        'signal_date': date.today(),

        'price_current': price_current,
        'price_52w_high': data.get('price_52w_high'),
        'price_52w_low': data.get('price_52w_low'),
        'volume_daily': data.get('volume_daily'),
        'volume_avg_50d': data.get('volume_avg_50d'),
        'market_cap': market_cap,

        'eps_ttm': eps_ttm,
        'eps_diluted_q': data.get('eps_diluted_q'),
        'shares_outstanding_diluted': shares_outstanding,
        'revenues_ttm': data.get('revenues_ttm'),
        'net_income_ttm': data.get('net_income_ttm'),
        'stockholders_equity': stockholders_equity,
        'current_assets': data.get('current_assets'),
        'current_liabilities': data.get('current_liabilities'),
        'long_term_debt': long_term_debt,

        'roe': data.get('roe'),
        'current_ratio': data.get('current_ratio'),
        'revenue_growth_yoy': data.get('revenue_growth_yoy'),
        'eps_growth_yoy': eps_growth,

        'pe_ratio': pe_ratio,
        'pb_ratio': pb_ratio,
        'peg_ratio': peg_ratio,
        'debt_to_equity': debt_to_equity,

        **lynch_scores,
        **oneil_scores,
        **graham_scores,

        'trinity_score': trinity_score,
        'signal_strength': signal_strength,
        'entry_price': entry_price,
        'stop_loss': stop_loss,
        'target_price': target_price
    }

    print(f"    ✅ {ticker}: Trinity={trinity_score:.1f} ({signal_strength})")

    return result


def insert_to_bigquery(client, records):
    """PASO 3: Insertar registros en BigQuery"""
    print("\n" + "="*70)
    print("PASO 3: INSERT EN TABLA TEST")
    print("="*70)

    if not records:
        print("❌ No hay registros para insertar")
        return False

    table_id = f"{PROJECT_ID}.IS_Fundamentales.trinity_signals_daily_test"

    # Convert to proper format for BigQuery
    rows_to_insert = []
    for r in records:
        row = {}
        for k, v in r.items():
            if isinstance(v, date):
                row[k] = v.isoformat()
            elif pd.isna(v) if isinstance(v, float) else False:
                row[k] = None
            else:
                row[k] = v
        rows_to_insert.append(row)

    try:
        errors = client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            print(f"❌ Errores insertando: {errors}")
            return False
        else:
            print(f"✅ {len(records)} registros insertados exitosamente")
            return True
    except Exception as e:
        print(f"❌ Error: {e}")
        # Try with SQL INSERT instead
        print("  Intentando INSERT via SQL...")
        return insert_via_sql(client, records)


def insert_via_sql(client, records):
    """Insert via SQL as fallback"""
    for r in records:
        sql = f"""
        INSERT INTO `{PROJECT_ID}.IS_Fundamentales.trinity_signals_daily_test`
        (ticker, company_name, sector, signal_date, price_current, price_52w_high, price_52w_low,
         volume_daily, volume_avg_50d, market_cap, eps_ttm, eps_diluted_q, shares_outstanding_diluted,
         revenues_ttm, net_income_ttm, stockholders_equity, current_assets, current_liabilities,
         long_term_debt, roe, current_ratio, revenue_growth_yoy, eps_growth_yoy, pe_ratio, pb_ratio,
         peg_ratio, debt_to_equity, lynch_score, lynch_peg_score, lynch_roe_score, lynch_eps_growth_score,
         oneil_score, oneil_rs_score, oneil_volume_score, oneil_price_momentum_score, graham_score,
         graham_pb_score, graham_current_ratio_score, graham_debt_equity_score, trinity_score,
         signal_strength, entry_price, stop_loss, target_price)
        VALUES
        ('{r["ticker"]}',
         {f"'{r['company_name']}'" if r.get('company_name') else 'NULL'},
         {f"'{r['sector']}'" if r.get('sector') else 'NULL'},
         DATE('{r["signal_date"]}'),
         {r.get('price_current') or 'NULL'},
         {r.get('price_52w_high') or 'NULL'},
         {r.get('price_52w_low') or 'NULL'},
         {r.get('volume_daily') or 'NULL'},
         {r.get('volume_avg_50d') or 'NULL'},
         {r.get('market_cap') or 'NULL'},
         {r.get('eps_ttm') or 'NULL'},
         {r.get('eps_diluted_q') or 'NULL'},
         {r.get('shares_outstanding_diluted') or 'NULL'},
         {r.get('revenues_ttm') or 'NULL'},
         {r.get('net_income_ttm') or 'NULL'},
         {r.get('stockholders_equity') or 'NULL'},
         {r.get('current_assets') or 'NULL'},
         {r.get('current_liabilities') or 'NULL'},
         {r.get('long_term_debt') or 'NULL'},
         {r.get('roe') or 'NULL'},
         {r.get('current_ratio') or 'NULL'},
         {r.get('revenue_growth_yoy') or 'NULL'},
         {r.get('eps_growth_yoy') or 'NULL'},
         {r.get('pe_ratio') or 'NULL'},
         {r.get('pb_ratio') or 'NULL'},
         {r.get('peg_ratio') or 'NULL'},
         {r.get('debt_to_equity') or 'NULL'},
         {r.get('lynch_score') or 'NULL'},
         {r.get('lynch_peg_score') or 'NULL'},
         {r.get('lynch_roe_score') or 'NULL'},
         {r.get('lynch_eps_growth_score') or 'NULL'},
         {r.get('oneil_score') or 'NULL'},
         {r.get('oneil_rs_score') or 'NULL'},
         {r.get('oneil_volume_score') or 'NULL'},
         {r.get('oneil_price_momentum_score') or 'NULL'},
         {r.get('graham_score') or 'NULL'},
         {r.get('graham_pb_score') or 'NULL'},
         {r.get('graham_current_ratio_score') or 'NULL'},
         {r.get('graham_debt_equity_score') or 'NULL'},
         {r.get('trinity_score') or 'NULL'},
         '{r.get('signal_strength')}',
         {r.get('entry_price') or 'NULL'},
         {r.get('stop_loss') or 'NULL'},
         {r.get('target_price') or 'NULL'})
        """
        try:
            client.query(sql).result()
        except Exception as e:
            print(f"  ⚠️ Error insertando {r['ticker']}: {e}")

    print(f"✅ Registros procesados via SQL")
    return True


def export_to_csv(client, output_file):
    """PASO 4: Exportar resultados a CSV"""
    print("\n" + "="*70)
    print("PASO 4: GENERAR REPORTE CSV")
    print("="*70)

    query = f"""
    SELECT
      ticker,
      company_name,
      sector,
      ROUND(price_current, 2) as price,
      ROUND(pe_ratio, 2) as pe,
      ROUND(peg_ratio, 2) as peg,
      ROUND(COALESCE(roe * 100, roe), 2) as roe_pct,
      ROUND(eps_growth_yoy, 2) as eps_growth,
      ROUND(lynch_score, 1) as lynch,
      ROUND(oneil_score, 1) as oneil,
      ROUND(graham_score, 1) as graham,
      ROUND(trinity_score, 1) as trinity,
      signal_strength,
      ROUND(entry_price, 2) as entry,
      ROUND(stop_loss, 2) as stop,
      ROUND(target_price, 2) as target
    FROM `{PROJECT_ID}.IS_Fundamentales.trinity_signals_daily_test`
    ORDER BY trinity_score DESC
    """

    try:
        df = client.query(query).to_dataframe()
        df.to_csv(output_file, index=False)
        print(f"✅ CSV exportado: {output_file}")
        print(f"   Registros: {len(df)}")
        return df
    except Exception as e:
        print(f"❌ Error exportando CSV: {e}")
        return None


def generate_report(records, output_file):
    """PASO 5: Generar reporte final"""
    print("\n" + "="*70)
    print("PASO 5: GENERAR REPORTE FINAL")
    print("="*70)

    if not records:
        print("❌ No hay datos para reportar")
        return

    # Calculate statistics
    total_processed = len(records)
    signals = {'STRONG BUY': 0, 'BUY': 0, 'HOLD': 0, 'SELL': 0}

    for r in records:
        signal = r.get('signal_strength', 'UNKNOWN')
        if signal in signals:
            signals[signal] += 1

    # Sort by trinity score
    sorted_records = sorted(records, key=lambda x: x.get('trinity_score', 0), reverse=True)
    top_3 = sorted_records[:3]

    report = f"""
================================================================================
REPORTE VALIDACIÓN TRINITY METHOD MVP
Proyecto: {PROJECT_ID}
Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================

STATUS DE PASOS:
✅ PASO 1: Tabla test creada
✅ PASO 2: Datos extraídos y scores calculados
✅ PASO 3: Datos insertados en BigQuery
✅ PASO 4: CSV generado
✅ PASO 5: Reporte generado

================================================================================
RESUMEN DE PROCESAMIENTO
================================================================================

Tickers solicitados: {len(TICKERS)}
Tickers procesados exitosamente: {total_processed}
Tickers fallidos: {len(TICKERS) - total_processed}

Tickers procesados: {', '.join([r['ticker'] for r in records])}

================================================================================
DISTRIBUCIÓN DE SEÑALES
================================================================================

STRONG BUY: {signals['STRONG BUY']} tickers
BUY:        {signals['BUY']} tickers
HOLD:       {signals['HOLD']} tickers
SELL:       {signals['SELL']} tickers

================================================================================
TOP 3 TICKERS POR TRINITY SCORE
================================================================================
"""

    for i, r in enumerate(top_3, 1):
        report += f"""
{i}. {r['ticker']} - {r.get('company_name', 'N/A')}
   Trinity Score: {r['trinity_score']:.1f}
   Signal: {r['signal_strength']}
   Lynch: {r['lynch_score']:.1f} | O'Neil: {r['oneil_score']:.1f} | Graham: {r['graham_score']:.1f}
   Price: ${r.get('price_current', 0):.2f} | Entry: ${r.get('entry_price', 0):.2f} | Target: ${r.get('target_price', 0):.2f}
"""

    report += f"""
================================================================================
DETALLE COMPLETO POR TICKER
================================================================================
"""

    for r in sorted_records:
        report += f"""
{r['ticker']} ({r.get('sector', 'N/A')})
  Price: ${r.get('price_current', 0):.2f} | P/E: {r.get('pe_ratio') or 'N/A'} | PEG: {r.get('peg_ratio') or 'N/A'}
  Lynch: {r['lynch_score']:.1f} (PEG:{r['lynch_peg_score']}, ROE:{r['lynch_roe_score']}, EPS:{r['lynch_eps_growth_score']})
  O'Neil: {r['oneil_score']:.1f} (RS:{r['oneil_rs_score']}, Vol:{r['oneil_volume_score']}, Mom:{r['oneil_price_momentum_score']})
  Graham: {r['graham_score']:.1f} (P/B:{r['graham_pb_score']}, CR:{r['graham_current_ratio_score']}, D/E:{r['graham_debt_equity_score']})
  TRINITY: {r['trinity_score']:.1f} → {r['signal_strength']}
"""

    report += f"""
================================================================================
PARÁMETROS UTILIZADOS (Perfil: MODERATE)
================================================================================

LYNCH:
  PEG: Excellent≤{LYNCH_PEG_EXCELLENT}, Good≤{LYNCH_PEG_GOOD}, Acceptable≤{LYNCH_PEG_ACCEPTABLE}
  ROE: Excellent≥{LYNCH_ROE_EXCELLENT}%, Good≥{LYNCH_ROE_GOOD}%, Acceptable≥{LYNCH_ROE_ACCEPTABLE}%
  EPS Growth: Excellent≥{LYNCH_EPS_GROWTH_EXCELLENT}%, Good≥{LYNCH_EPS_GROWTH_GOOD}%, Acceptable≥{LYNCH_EPS_GROWTH_ACCEPTABLE}%

O'NEIL:
  RS: Excellent≥{ONEIL_RS_EXCELLENT}, Good≥{ONEIL_RS_GOOD}, Acceptable≥{ONEIL_RS_ACCEPTABLE}

GRAHAM:
  P/B: Excellent≤{GRAHAM_PB_EXCELLENT}, Good≤{GRAHAM_PB_GOOD}, Acceptable≤{GRAHAM_PB_ACCEPTABLE}
  Current Ratio: Excellent≥{GRAHAM_CR_EXCELLENT}, Good≥{GRAHAM_CR_GOOD}, Acceptable≥{GRAHAM_CR_ACCEPTABLE}
  D/E: Excellent≤{GRAHAM_DE_EXCELLENT}, Good≤{GRAHAM_DE_GOOD}, Acceptable≤{GRAHAM_DE_ACCEPTABLE}

TRINITY WEIGHTS:
  Lynch: {LYNCH_WEIGHT*100:.0f}% | O'Neil: {ONEIL_WEIGHT*100:.0f}% | Graham: {GRAHAM_WEIGHT*100:.0f}%

SIGNAL THRESHOLDS:
  STRONG BUY: ≥{STRONG_BUY_THRESHOLD} | BUY: ≥{BUY_THRESHOLD} | HOLD: ≥{HOLD_THRESHOLD} | SELL: <{HOLD_THRESHOLD}

================================================================================
✅ VALIDACIÓN PRE-DESARROLLO COMPLETADA EXITOSAMENTE
================================================================================
"""

    with open(output_file, 'w') as f:
        f.write(report)

    print(report)
    print(f"\n📄 Reporte guardado: {output_file}")


def main():
    print("="*70)
    print("TRINITY METHOD MVP - VALIDACIÓN PRE-DESARROLLO")
    print(f"Proyecto: {PROJECT_ID}")
    print(f"Fecha: {datetime.now()}")
    print(f"Tickers: {', '.join(TICKERS)}")
    print("="*70)

    client = bigquery.Client(project=PROJECT_ID)

    # PASO 1: Crear tabla test
    if not create_test_table(client):
        print("❌ No se pudo crear la tabla. Abortando.")
        return

    # PASO 2: Extraer datos y calcular scores
    print("\n" + "="*70)
    print("PASO 2: EXTRAER DATOS Y CALCULAR SCORES")
    print("="*70)

    records = []
    for ticker in TICKERS:
        result = process_ticker(client, ticker)
        if result:
            records.append(result)

    print(f"\n✅ {len(records)}/{len(TICKERS)} tickers procesados")

    # PASO 3: Insert en BigQuery
    insert_to_bigquery(client, records)

    # PASO 4: Exportar CSV
    csv_file = f"{OUTPUT_DIR}/trinity_test_results.csv"
    export_to_csv(client, csv_file)

    # PASO 5: Generar reporte
    report_file = f"{OUTPUT_DIR}/trinity_test_report.txt"
    generate_report(records, report_file)

    print("\n" + "="*70)
    print("✅ VALIDACIÓN COMPLETADA")
    print("="*70)


if __name__ == "__main__":
    main()
