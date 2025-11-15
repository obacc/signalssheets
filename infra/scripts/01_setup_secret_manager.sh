#!/bin/bash
# Script to set up Secret Manager for Polygon API Key
# This script creates the secret and adds the API key as the first version

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
SECRET_NAME="polygon-api-key"
API_KEY="hb4SJORyGfIXhczEGpiIvq3Smt21_OgO"

echo "========================================="
echo "Setting up Secret Manager"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Secret Name: $SECRET_NAME"
echo ""

# Set the active project
gcloud config set project $PROJECT_ID

# Check if secret already exists
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
    echo "✓ Secret '$SECRET_NAME' already exists"

    # Add new version
    echo "Adding new version to existing secret..."
    echo -n "$API_KEY" | gcloud secrets versions add $SECRET_NAME \
        --project=$PROJECT_ID \
        --data-file=-

    echo "✓ New version added successfully"
else
    echo "Creating new secret '$SECRET_NAME'..."

    # Create secret
    gcloud secrets create $SECRET_NAME \
        --project=$PROJECT_ID \
        --replication-policy="automatic" \
        --labels="environment=production,service=polygon-loader"

    echo "✓ Secret created successfully"

    # Add the API key as first version
    echo "Adding API key as first version..."
    echo -n "$API_KEY" | gcloud secrets versions add $SECRET_NAME \
        --project=$PROJECT_ID \
        --data-file=-

    echo "✓ API key added successfully"
fi

# Grant access to Cloud Function's service account (will be created during function deployment)
SERVICE_ACCOUNT="polygon-loader@${PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "Granting access to service account: $SERVICE_ACCOUNT"
echo "(Note: This may fail if the service account doesn't exist yet - that's OK)"

gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || echo "⚠ Service account not found - will grant access during deployment"

# Also grant to the default Compute Engine service account for testing
DEFAULT_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:$DEFAULT_SA" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || echo "⚠ Default service account not found"

echo ""
echo "========================================="
echo "Secret Manager setup completed!"
echo "========================================="
echo ""
echo "Verify with:"
echo "  gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID"
echo "  gcloud secrets versions access latest --secret=$SECRET_NAME --project=$PROJECT_ID"
echo ""
