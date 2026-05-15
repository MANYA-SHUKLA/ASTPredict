#!/bin/bash
echo "========================================"
echo "Installing Colony Detection Dependencies"
echo "========================================"
pip install --upgrade pip
pip install opencv-python
# Install Ultralytics (provides 'YOLO' and installs PyTorch, Numpy, etc.)
pip install ultralytics
echo "========================================"
echo "✓ Installation Complete!"
echo "========================================"