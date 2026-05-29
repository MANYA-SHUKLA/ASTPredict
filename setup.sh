#!/bin/bash
set -e

echo "========================================"
echo "Installing ASTPredict Dependencies"
echo "========================================"

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "========================================"
echo "✓ Installation Complete!"
echo ""
echo "Activate the environment, then start the backend:"
echo "  source venv/bin/activate"
echo "  python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
echo "========================================"
