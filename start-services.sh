#!/bin/bash

# Start API Gateway
echo "Starting API Gateway..."
cd "c:\Nova pasta\coinbitclub-market-bot\backend\api-gateway"
npm run dev &

# Start Frontend
echo "Starting Frontend..."
cd "c:\Nova pasta\coinbitclub-market-bot\coinbitclub-frontend-premium"
npm run dev &

echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "API Gateway: http://localhost:8080"

wait
