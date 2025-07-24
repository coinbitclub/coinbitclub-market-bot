#!/bin/bash

echo "🚀 Starting CoinBitClub Market Bot on Railway..."

# Set error handling
set -e

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for database connection..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if node -e "
const { env } = require('./common/env.js');
const { ensureConnection } = require('./common/db.js');
ensureConnection().then(() => {
  console.log('✅ Database connected!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        echo "⏳ Database not ready (attempt $attempt/$max_attempts), waiting 10 seconds..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo "❌ Database connection failed after $max_attempts attempts"
    exit 1
}

# Wait for database to be ready
wait_for_db

# Run database migrations
echo "📊 Running database migrations..."
cd api-gateway
if npm run migrate; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migrations failed, but continuing..."
fi
cd ..

# Determine which service to start
SERVICE_NAME=${RAILWAY_SERVICE_NAME:-"api-gateway"}
echo "� Starting service: $SERVICE_NAME"
# Start the appropriate service
case "$SERVICE_NAME" in
    "api-gateway"|"")
        echo "🌐 Starting API Gateway..."
        cd api-gateway
        exec node src/index.js
        ;;
    "admin-panel")
        echo "👨‍💼 Starting Admin Panel..."
        cd admin-panel
        exec node src/index.js
        ;;
    "signal-ingestor")
        echo "📡 Starting Signal Ingestor..."
        cd signal-ingestor
        exec node src/index.js
        ;;
    "signal-processor")
        echo "⚙️ Starting Signal Processor..."
        cd signal-processor
        exec node src/index.js
        ;;
    "decision-engine")
        echo "🧠 Starting Decision Engine..."
        cd decision-engine
        exec node src/index.js
        ;;
    "order-executor")
        echo "💼 Starting Order Executor..."
        cd order-executor
        exec node src/index.js
        ;;
    "accounting")
        echo "💰 Starting Accounting Service..."
        cd accounting
        exec node src/index.js
        ;;
    "notifications")
        echo "🔔 Starting Notifications Service..."
        cd notifications
        exec node src/index.js
        ;;
    *)
        echo "⚠️ Unknown service: $SERVICE_NAME, defaulting to API Gateway"
        cd api-gateway
        exec node src/index.js
        ;;
esac
