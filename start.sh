#!/bin/bash
cd "$(dirname "$0")"
echo "Starting LearnSphere frontend and MongoDB-backed API..."
echo ""
echo "Open: http://localhost:5173"
echo "Press Ctrl+C to stop both processes."
echo ""
npm run dev
