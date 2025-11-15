#!/bin/bash
# ================================================================
# Setup Secret Manager for Polygon API Key
# ================================================================
# File: 01_setup_secrets.sh
# Description: Creates and configures Polygon API key in Secret Manager

set -e  # Exit on error

# Configuration
PROJECT_ID="sunny-advantage-471523-b3"
SECRET_NAME="polygon-api-key"
API_KEY="hb4SJORyGfIXhczEGpiIvq3Smt21_OgO"  # Replace in production with secure input

echo "========================================="
echo "Polygon Pipeline - Secret Manager Setup"
echo "========================================="
echo "Project: $PROJECT_ID"
echo "Secret: $SECRET_NAME"
echo ""

# Set active project
echo "Setting active GCP project..."
gcloud config set project $PROJECT_ID

# Check if secret already exists
echo "Checking if secret exists..."
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &> /dev/null; then
    echo "⚠️  Secret '$SECRET_NAME' already exists"
    read -p "Do you want to create a new version? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Creating new version of secret..."
        echo -n "$API_KEY" | gcloud secrets versions add $SECRET_NAME \
            --project=$PROJECT_ID \
            --data-file=-
        echo "✅ New secret version created"
    else
        echo "Skipping secret creation"
    fi
else
    echo "Creating new secret..."
    gcloud secrets create $SECRET_NAME \
        --project=$PROJECT_ID \
        --replication-policy="automatic" \
        --labels="service=polygon,component=api"

    echo "Adding secret value..."
    echo -n "$API_KEY" | gcloud secrets versions add $SECRET_NAME \
        --project=$PROJECT_ID \
        --data-file=-

    echo "✅ Secret created successfully"
fi

# Verify secret
echo ""
echo "Verifying secret..."
SECRET_VALUE=$(gcloud secrets versions access latest --secret=$SECRET_NAME --project=$PROJECT_ID)
if [ ${#SECRET_VALUE} -gt 20 ]; then
    echo "✅ Secret verified (length: ${#SECRET_VALUE} characters)"
else
    echo "❌ Secret seems too short (length: ${#SECRET_VALUE})"
    exit 1
fi

# Grant access to Cloud Function service account
echo ""
echo "Granting access to Cloud Function service account..."
CF_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
echo "Service Account: $CF_SA"

gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:${CF_SA}" \
    --role="roles/secretmanager.secretAccessor"

echo "✅ IAM binding added"

# List secret metadata
echo ""
echo "Secret metadata:"
gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID

echo ""
echo "========================================="
echo "✅ Secret Manager setup complete!"
echo "========================================="
echo "Next step: Run 02_deploy_cloud_function.sh"
