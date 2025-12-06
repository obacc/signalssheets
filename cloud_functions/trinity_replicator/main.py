"""
Trinity Signals Replicator
==========================
Replica senales Trinity desde BigQuery a Cloudflare KV y GitHub.
Ejecuta diariamente @ 3:05 AM EST (8:05 AM UTC)

Author: Indicium Signals Team
Date: 2024-12-06
"""

import functions_framework
from google.cloud import bigquery
from datetime import datetime, date
import json
import requests
import base64
import os
from typing import List, Dict, Any, Optional

# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ID = 'sunny-advantage-471523-b3'
DATASET_ID = 'IS_Fundamentales'
TABLE_ID = 'trinity_signals_daily'

CLOUDFLARE_ACCOUNT_ID = '213d7189694d6fefdf23cd1ff91385d2'
CLOUDFLARE_API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN')
CLOUDFLARE_KV_NAMESPACE_ID = os.environ.get('CLOUDFLARE_KV_NAMESPACE_ID')

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = 'obacc/indicium-signals-data'

# Plan limits
PLAN_LIMITS = {
    'free': 10,
    'basic': 30,
    'pro': 50,
    'premium': None  # All signals
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def json_serial(obj):
    """JSON serializer for objects not serializable by default."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def query_signals(execution_date: str) -> List[Dict[str, Any]]:
    """
    Query BigQuery for Trinity signals of the specified date.

    Args:
        execution_date: Date string in YYYY-MM-DD format

    Returns:
        List of signal dictionaries
    """
    print(f"[1/4] Querying BigQuery for {execution_date}...")

    client = bigquery.Client(project=PROJECT_ID)

    query = f"""
    SELECT
        ticker,
        company_name,
        sector,
        industry_title,
        trinity_score,
        signal_strength,
        lynch_score,
        oneil_score,
        graham_score,
        pe_ratio,
        pb_ratio,
        ps_ratio,
        peg_ratio,
        eps_growth_yoy,
        revenue_growth_yoy,
        roe,
        current_ratio,
        debt_to_equity,
        entry_price,
        target_price,
        stop_loss,
        risk_reward_ratio,
        market_regime,
        data_quality_score,
        calculation_timestamp
    FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
    WHERE signal_date = '{execution_date}'
    ORDER BY trinity_score DESC
    """

    try:
        results = client.query(query).result()

        signals = []
        for row in results:
            signal = dict(row.items())
            # Convert any non-serializable types
            for key, value in signal.items():
                if isinstance(value, (datetime, date)):
                    signal[key] = value.isoformat()
            signals.append(signal)

        print(f"    Found {len(signals)} signals")
        return signals

    except Exception as e:
        print(f"    ERROR querying BigQuery: {str(e)}")
        raise


def generate_plan_data(all_signals: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Generate different datasets per subscription plan.

    Args:
        all_signals: Complete list of signals sorted by trinity_score

    Returns:
        Dictionary with plan names as keys and signal lists as values
    """
    print("[2/4] Generating plan-specific datasets...")

    # Signals should already be sorted by trinity_score DESC
    sorted_signals = sorted(
        all_signals,
        key=lambda x: float(x.get('trinity_score', 0) or 0),
        reverse=True
    )

    plan_data = {}
    for plan, limit in PLAN_LIMITS.items():
        if limit is None:
            plan_data[plan] = sorted_signals
        else:
            plan_data[plan] = sorted_signals[:limit]
        print(f"    {plan.upper()}: {len(plan_data[plan])} signals")

    return plan_data


def save_to_cloudflare_kv(date_str: str, plan_data: Dict[str, List[Dict]]) -> bool:
    """
    Save signals to Cloudflare KV using bulk write API.

    Args:
        date_str: Date string for key naming
        plan_data: Dictionary of plan -> signals

    Returns:
        True if successful, False otherwise
    """
    print("[3/4] Saving to Cloudflare KV...")

    if not CLOUDFLARE_API_TOKEN or not CLOUDFLARE_KV_NAMESPACE_ID:
        print("    SKIPPED: Missing Cloudflare credentials")
        return False

    url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/{CLOUDFLARE_KV_NAMESPACE_ID}/bulk"

    headers = {
        'Authorization': f'Bearer {CLOUDFLARE_API_TOKEN}',
        'Content-Type': 'application/json'
    }

    # Prepare bulk write data
    bulk_data = []
    for plan, signals in plan_data.items():
        key = f"signals_{date_str}_{plan}"
        value = json.dumps({
            'date': date_str,
            'plan': plan,
            'total_signals': len(signals),
            'market_regime': signals[0].get('market_regime', 'UNKNOWN') if signals else 'UNKNOWN',
            'signals': signals,
            'generated_at': datetime.utcnow().isoformat()
        }, default=json_serial)

        bulk_data.append({
            'key': key,
            'value': value
        })

    # Also save "latest" keys for easy access
    for plan, signals in plan_data.items():
        key = f"signals_latest_{plan}"
        value = json.dumps({
            'date': date_str,
            'plan': plan,
            'total_signals': len(signals),
            'market_regime': signals[0].get('market_regime', 'UNKNOWN') if signals else 'UNKNOWN',
            'signals': signals,
            'generated_at': datetime.utcnow().isoformat()
        }, default=json_serial)

        bulk_data.append({
            'key': key,
            'value': value
        })

    try:
        response = requests.put(url, headers=headers, json=bulk_data, timeout=60)

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"    Saved {len(bulk_data)} keys to KV")
                return True
            else:
                print(f"    KV API Error: {result.get('errors', [])}")
                return False
        else:
            print(f"    KV HTTP Error: {response.status_code} - {response.text[:200]}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"    KV Request Error: {str(e)}")
        return False


def save_to_github(date_str: str, plan_data: Dict[str, List[Dict]]) -> bool:
    """
    Commit signals to GitHub repository.

    Args:
        date_str: Date string for file path
        plan_data: Dictionary of plan -> signals

    Returns:
        True if all files saved successfully
    """
    print("[4/4] Committing to GitHub...")

    if not GITHUB_TOKEN:
        print("    SKIPPED: Missing GitHub token")
        return False

    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }

    success_count = 0

    for plan, signals in plan_data.items():
        # Prepare file content
        file_path = f"data/{date_str}/{plan}.json"
        content = json.dumps({
            'date': date_str,
            'plan': plan,
            'total_signals': len(signals),
            'market_regime': signals[0].get('market_regime', 'UNKNOWN') if signals else 'UNKNOWN',
            'signals': signals,
            'generated_at': datetime.utcnow().isoformat()
        }, indent=2, default=json_serial)

        content_base64 = base64.b64encode(content.encode()).decode()

        try:
            # Check if file already exists (to get SHA for update)
            check_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}"
            check_response = requests.get(check_url, headers=headers, timeout=30)

            sha = None
            if check_response.status_code == 200:
                sha = check_response.json().get('sha')

            # Create or update file
            data = {
                'message': f'Daily signals {date_str} - {plan.upper()} - {len(signals)} tickers',
                'content': content_base64,
                'branch': 'main'
            }

            if sha:
                data['sha'] = sha

            response = requests.put(check_url, headers=headers, json=data, timeout=60)

            if response.status_code in [200, 201]:
                print(f"    {plan.upper()}: {file_path}")
                success_count += 1
            else:
                print(f"    {plan.upper()} Error: {response.status_code} - {response.text[:100]}")

        except requests.exceptions.RequestException as e:
            print(f"    {plan.upper()} Request Error: {str(e)}")

    return success_count == len(plan_data)


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

@functions_framework.http
def trinity_replicator(request):
    """
    Cloud Function HTTP entry point.

    Triggered daily by Cloud Scheduler at 3:05 AM EST (8:05 AM UTC).
    Replicates Trinity signals from BigQuery to Cloudflare KV and GitHub.

    Args:
        request: HTTP request object

    Returns:
        JSON response with replication status
    """
    start_time = datetime.utcnow()

    print("=" * 70)
    print("TRINITY SIGNALS REPLICATOR")
    print(f"Started: {start_time.isoformat()}")
    print("=" * 70)

    try:
        # Parse request for optional date override
        request_json = request.get_json(silent=True) or {}
        execution_date = request_json.get('date', date.today().isoformat())

        print(f"Execution date: {execution_date}")
        print("-" * 70)

        # Step 1: Query BigQuery
        all_signals = query_signals(execution_date)

        if not all_signals:
            return {
                'status': 'warning',
                'message': f'No signals found for {execution_date}',
                'date': execution_date,
                'timestamp': datetime.utcnow().isoformat()
            }, 200

        # Step 2: Generate plan-specific datasets
        plan_data = generate_plan_data(all_signals)

        # Step 3: Save to Cloudflare KV
        kv_success = save_to_cloudflare_kv(execution_date, plan_data)

        # Step 4: Save to GitHub
        gh_success = save_to_github(execution_date, plan_data)

        # Calculate duration
        end_time = datetime.utcnow()
        duration_seconds = (end_time - start_time).total_seconds()

        # Summary
        print("\n" + "=" * 70)
        print(f"REPLICATION COMPLETE - {execution_date}")
        print(f"Duration: {duration_seconds:.2f}s")
        print(f"Total signals: {len(all_signals)}")
        print(f"Cloudflare KV: {'SUCCESS' if kv_success else 'FAILED/SKIPPED'}")
        print(f"GitHub: {'SUCCESS' if gh_success else 'FAILED/SKIPPED'}")
        print("=" * 70)

        return {
            'status': 'success',
            'date': execution_date,
            'total_signals': len(all_signals),
            'plan_counts': {plan: len(signals) for plan, signals in plan_data.items()},
            'destinations': {
                'cloudflare_kv': kv_success,
                'github': gh_success
            },
            'duration_seconds': duration_seconds,
            'timestamp': end_time.isoformat()
        }, 200

    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }, 500


# For local testing
if __name__ == "__main__":
    class MockRequest:
        def get_json(self, silent=False):
            return {}

    result, status = trinity_replicator(MockRequest())
    print(f"\nResult ({status}): {json.dumps(result, indent=2)}")
