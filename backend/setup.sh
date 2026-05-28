#!/bin/bash

# Setup script for Institute ERP Backend
# Creates a Python virtual environment and installs dependencies
# Supports Python 3.11, 3.12, and 3.13

set -e

echo "Setting up Institute ERP Backend..."

# Create virtual environment
echo "Creating Python virtual environment..."
python -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo ""
echo "Setup complete!"
echo ""
echo "To activate the virtual environment next time, run:"
echo "  source venv/bin/activate"
echo ""
echo "To start the development server:"
echo "  uvicorn app.main:app --reload --port 5000"
