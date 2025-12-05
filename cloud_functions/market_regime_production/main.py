"""
Cloud Function: Update Market Regime Daily (Production)
Triggered by Cloud Scheduler at 2:00 AM EST (07:00 UTC)

Fetches S&P 500 YTD performance from Yahoo Finance and determines market regime.
Updates BigQuery table: sunny-advantage-471523-b3.IS_Fundamentales.market_regime_daily
"""

import os
from datetime import datetime, date

import functions_framework
from google.cloud import bigquery

# Config
PROJECT_ID = os.environ.get('PROJECT_ID', 'sunny-advantage-471523-b3')
DATASET_ID = 'IS_Fundamentales'
TABLE_ID = 'market_regime_daily'


def calculate_market_regime(ytd_change_pct):
    """
    Determine market regime based on S&P 500 YTD change.

    Rules:
        >= +20%     : BULL        (Strong bull market)
        >= +10%     : NEUTRAL     (Moderate positive)
        >= -10%     : NEUTRAL     (Sideways/consolidation)
        >= -20%     : CORRECTION  (Market correction)
        <  -20%     : BEAR        (Bear market)
    """
    if ytd_change_pct >= 20:
        return 'BULL'
    elif ytd_change_pct >= 10:
        return 'NEUTRAL'
    elif ytd_change_pct >= -10:
        return 'NEUTRAL'
    elif ytd_change_pct >= -20:
        return 'CORRECTION'
    else:
        return 'BEAR'


def fetch_market_data():
    """Fetch S&P 500 and VIX data from Yahoo Finance."""
    import yfinance as yf

    # S&P 500
    sp500 = yf.Ticker("^GSPC")
    sp500_history = sp500.history(period="1y")

    if sp500_history.empty:
        raise ValueError("Failed to fetch S&P 500 data from Yahoo Finance")

    # VIX
    vix = yf.Ticker("^VIX")
    vix_history = vix.history(period="5d")

    # Get current year data
    current_year = datetime.now().year
    ytd_data = sp500_history[sp500_history.index.year == current_year]

    if len(ytd_data) == 0:
        raise ValueError(f"No S&P 500 data found for {current_year}")

    ytd_start_price = float(ytd_data.iloc[0]['Close'])
    current_price = float(sp500_history.iloc[-1]['Close'])
    ytd_change_pct = ((current_price - ytd_start_price) / ytd_start_price) * 100

    vix_current = float(vix_history.iloc[-1]['Close']) if len(vix_history) > 0 else None

    return {
        'regime_date': date.today(),
        'sp500_close': current_price,
        'sp500_ytd_start': ytd_start_price,
        'sp500_ytd_change_pct': ytd_change_pct,
        'vix_close': vix_current,
        'regime_type': calculate_market_regime(ytd_change_pct),
        'calculation_method': 'SP500_YTD',
        'data_source': 'Yahoo Finance',
        'notes': f'S&P 500 YTD: {ytd_change_pct:+.2f}%'
    }


def update_bigquery(data):
    """Insert or update market regime in BigQuery using MERGE for idempotency."""
    client = bigquery.Client(project=PROJECT_ID)
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

    # Handle NULL for vix_close
    vix_value = str(data['vix_close']) if data['vix_close'] else 'NULL'

    # Escape single quotes in notes
    notes_escaped = data['notes'].replace("'", "''")
    source_escaped = data['data_source'].replace("'", "''")

    # MERGE query for idempotency
    merge_query = f"""
    MERGE `{table_ref}` T
    USING (
      SELECT
        DATE('{data['regime_date']}') as regime_date,
        '{data['regime_type']}' as regime_type,
        {data['sp500_close']} as sp500_close,
        {data['sp500_ytd_start']} as sp500_ytd_start,
        {data['sp500_ytd_change_pct']} as sp500_ytd_change_pct,
        {vix_value} as vix_close,
        '{data['calculation_method']}' as calculation_method,
        '{source_escaped}' as data_source,
        '{notes_escaped}' as notes,
        CURRENT_TIMESTAMP() as created_at,
        CURRENT_TIMESTAMP() as updated_at
    ) S
    ON T.regime_date = S.regime_date
    WHEN MATCHED THEN
      UPDATE SET
        regime_type = S.regime_type,
        sp500_close = S.sp500_close,
        sp500_ytd_start = S.sp500_ytd_start,
        sp500_ytd_change_pct = S.sp500_ytd_change_pct,
        vix_close = S.vix_close,
        updated_at = S.updated_at,
        notes = S.notes
    WHEN NOT MATCHED THEN
      INSERT (regime_date, regime_type, sp500_close, sp500_ytd_start,
              sp500_ytd_change_pct, vix_close, calculation_method,
              data_source, notes, created_at, updated_at)
      VALUES (S.regime_date, S.regime_type, S.sp500_close, S.sp500_ytd_start,
              S.sp500_ytd_change_pct, S.vix_close, S.calculation_method,
              S.data_source, S.notes, S.created_at, S.updated_at)
    """

    job = client.query(merge_query)
    job.result()
    return True


@functions_framework.http
def market_regime_update(request):
    """
    Cloud Function entry point.

    Args:
        request (flask.Request): HTTP request object

    Returns:
        tuple: (response_dict, status_code)
    """
    execution_time = datetime.now().isoformat()
    print(f"[{execution_time}] Market Regime Update started")

    try:
        # Fetch data from Yahoo Finance
        print("Fetching market data from Yahoo Finance...")
        data = fetch_market_data()

        print(f"S&P 500 YTD Start: ${data['sp500_ytd_start']:.2f}")
        print(f"S&P 500 Current:   ${data['sp500_close']:.2f}")
        print(f"YTD Change:        {data['sp500_ytd_change_pct']:+.2f}%")
        print(f"VIX Current:       {data['vix_close']:.2f}" if data['vix_close'] else "VIX: N/A")
        print(f"Regime:            {data['regime_type']}")

        # Update BigQuery
        print("Updating BigQuery...")
        update_bigquery(data)

        print(f"SUCCESS - Market Regime: {data['regime_type']}")

        return {
            'status': 'success',
            'message': 'Market regime updated successfully',
            'data': {
                'regime_date': str(data['regime_date']),
                'regime_type': data['regime_type'],
                'sp500_close': round(data['sp500_close'], 2),
                'sp500_ytd_change_pct': round(data['sp500_ytd_change_pct'], 2),
                'vix_close': round(data['vix_close'], 2) if data['vix_close'] else None,
                'data_source': data['data_source']
            }
        }, 200

    except Exception as e:
        error_msg = str(e)
        print(f"ERROR: {error_msg}")
        import traceback
        traceback.print_exc()

        return {
            'status': 'error',
            'message': error_msg
        }, 500
