/**
 * BigQuery Inventory Script
 * Discovers all datasets, tables, views and their schemas
 */

import { BigQuery } from '@google-cloud/bigquery';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load credentials
const credentials = JSON.parse(
  readFileSync(join(__dirname, 'bigquery-credentials.json'), 'utf8')
);

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: credentials.project_id,
  credentials
});

console.log('🔍 Starting BigQuery Inventory...\n');
console.log(`📦 Project: ${credentials.project_id}\n`);

async function getInventory() {
  try {
    // 1. List all datasets
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DATASETS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [datasets] = await bigquery.getDatasets();

    if (datasets.length === 0) {
      console.log('⚠️  No datasets found in this project.\n');
      return;
    }

    for (const dataset of datasets) {
      console.log(`\n📁 Dataset: ${dataset.id}`);
      console.log(`   Location: ${dataset.metadata.location || 'N/A'}`);
      console.log(`   Created: ${new Date(parseInt(dataset.metadata.creationTime)).toISOString()}`);

      // 2. List tables and views in dataset
      const [tables] = await dataset.getTables();

      if (tables.length === 0) {
        console.log('   └─ (empty dataset)\n');
        continue;
      }

      console.log(`   └─ Tables/Views: ${tables.length}\n`);

      for (const table of tables) {
        const [metadata] = await table.getMetadata();
        const tableType = metadata.type === 'VIEW' ? '👁️  VIEW' : '📋 TABLE';

        console.log(`   ${tableType}: ${table.id}`);
        console.log(`      └─ Full ID: ${dataset.id}.${table.id}`);

        // Get row count and size
        if (metadata.type === 'TABLE') {
          const numRows = metadata.numRows || '0';
          const numBytes = metadata.numBytes || '0';
          const sizeMB = (parseInt(numBytes) / 1024 / 1024).toFixed(2);
          console.log(`      └─ Rows: ${parseInt(numRows).toLocaleString()}`);
          console.log(`      └─ Size: ${sizeMB} MB`);
        }

        // Get schema
        const schema = metadata.schema;
        if (schema && schema.fields) {
          console.log(`      └─ Columns: ${schema.fields.length}`);
          console.log('');
          console.log('      📋 SCHEMA:');
          console.log('      ┌─────────────────────────────────────────────────────────');

          schema.fields.forEach((field, idx) => {
            const prefix = idx === schema.fields.length - 1 ? '└─' : '├─';
            const mode = field.mode ? ` [${field.mode}]` : '';
            const desc = field.description ? ` - ${field.description}` : '';
            console.log(`      ${prefix} ${field.name.padEnd(30)} ${field.type.padEnd(12)}${mode}${desc}`);
          });

          console.log('      └─────────────────────────────────────────────────────────\n');
        }

        // If it's a view, show the query
        if (metadata.type === 'VIEW' && metadata.view && metadata.view.query) {
          console.log('      🔍 VIEW DEFINITION:');
          console.log('      ┌─────────────────────────────────────────────────────────');
          const queryLines = metadata.view.query.split('\n');
          queryLines.forEach(line => {
            console.log(`      │ ${line}`);
          });
          console.log('      └─────────────────────────────────────────────────────────\n');
        }

        // Sample data (first 5 rows)
        if (metadata.type === 'TABLE' || metadata.type === 'VIEW') {
          try {
            const query = `SELECT * FROM \`${credentials.project_id}.${dataset.id}.${table.id}\` LIMIT 5`;
            const [rows] = await bigquery.query(query);

            if (rows.length > 0) {
              console.log('      📊 SAMPLE DATA (first 5 rows):');
              console.log('      ┌─────────────────────────────────────────────────────────');
              rows.forEach((row, idx) => {
                console.log(`      │ Row ${idx + 1}:`, JSON.stringify(row, null, 2).split('\n').join('\n      │       '));
              });
              console.log('      └─────────────────────────────────────────────────────────\n');
            }
          } catch (err) {
            console.log(`      ⚠️  Could not fetch sample data: ${err.message}\n`);
          }
        }

        console.log('      ─────────────────────────────────────────────────────────\n');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Inventory Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Run inventory
getInventory();
