#!/bin/bash
# =============================================================================
# Cloudflare KV Namespace Setup
# =============================================================================
# This script creates the KV namespace for storing Trinity signals
#
# Prerequisites:
#   - wrangler CLI installed (npm install -g wrangler)
#   - Cloudflare API token set in CLOUDFLARE_API_TOKEN env var
#
# Usage:
#   export CLOUDFLARE_API_TOKEN="your_token_here"
#   ./setup_cloudflare_kv.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo ""
echo "=============================================="
echo "  CLOUDFLARE KV NAMESPACE SETUP"
echo "=============================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}ERROR: wrangler CLI is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

# Check if API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}ERROR: CLOUDFLARE_API_TOKEN environment variable not set${NC}"
    echo "Set it with: export CLOUDFLARE_API_TOKEN=\"your_token_here\""
    exit 1
fi

# Verify authentication
echo "Verifying Cloudflare authentication..."
if ! wrangler whoami &>/dev/null; then
    echo -e "${RED}ERROR: Cloudflare authentication failed${NC}"
    echo "Check your CLOUDFLARE_API_TOKEN"
    exit 1
fi

echo -e "${GREEN}Authentication successful!${NC}"
echo ""

# Create the KV namespace
echo "Creating KV namespace 'SIGNALS_KV'..."
echo ""

# Change to repo root for wrangler context
cd "${REPO_ROOT}"

KV_OUTPUT=$(wrangler kv:namespace create "SIGNALS_KV" 2>&1)

echo "$KV_OUTPUT"
echo ""

# Extract the namespace ID from output
# Expected format: { binding = "SIGNALS_KV", id = "abc123..." }
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | sed 's/id = "\([^"]*\)"/\1/')

if [ -z "$KV_ID" ]; then
    echo -e "${YELLOW}Could not extract KV namespace ID from output${NC}"
    echo "Please manually copy the ID from the output above"
else
    echo -e "${GREEN}KV Namespace created successfully!${NC}"
    echo ""
    echo "=============================================="
    echo "  IMPORTANT: Update your configuration files"
    echo "=============================================="
    echo ""
    echo "KV Namespace ID: ${KV_ID}"
    echo ""
    echo "1. Update wrangler.toml:"
    echo "   [[kv_namespaces]]"
    echo "   binding = \"SIGNALS_KV\""
    echo "   id = \"${KV_ID}\""
    echo ""
    echo "2. Update .env.yaml:"
    echo "   CLOUDFLARE_KV_NAMESPACE_ID: \"${KV_ID}\""
    echo ""

    # Optionally update files automatically
    read -p "Auto-update configuration files? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        # Update wrangler.toml
        sed -i "s/id = \"PENDING_CREATION\"/id = \"${KV_ID}\"/" "${REPO_ROOT}/wrangler.toml"
        echo -e "${GREEN}Updated wrangler.toml${NC}"

        # Update .env.yaml
        sed -i "s/CLOUDFLARE_KV_NAMESPACE_ID: \"PENDING_CREATION\"/CLOUDFLARE_KV_NAMESPACE_ID: \"${KV_ID}\"/" "${SCRIPT_DIR}/.env.yaml"
        echo -e "${GREEN}Updated .env.yaml${NC}"
    fi
fi

echo ""
echo "To list keys in the namespace:"
echo "  wrangler kv:key list --namespace-id=${KV_ID:-<YOUR_ID>}"
echo ""
