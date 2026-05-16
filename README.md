# Colony Detection (ASTPredict)

This repository contains the setup and inference scripts for the Colony Detection. It uses a trained model to detect colonies in images, generating visual annotations and statistical metadata.

## Project Structure

- `setup.sh`: Bash script to install all required dependencies.
- `inference.py`: Main Python script to run model predictions.
- `best.pt`: The trained YOLOv8 model weights (must be present in the root directory).
- `test_images/`: Default directory for placing input images.
- `Results/`: Output directory (auto-generated) where annotated images and prediction JSONs are saved.

---

## 1. Environment Setup

Before running the inference script, you need to install the required Python packages (`ultralytics` for YOLO, and `opencv-python`). 

Open your terminal, navigate to this directory, and run the setup script:

```bash
# Make the script executable (macOS/Linux)
chmod +x setup.sh

# Run the setup script
./setup.sh
```


---

## 2. Running Inference

The `inference.py` script allows you to process either a full directory of images or a single image. It will output annotated images with bounding boxes and a `predictions.json` file containing all the statistical data (bounding box coordinates, confidence scores, etc.).

### Basic Usage (Batch Processing)
If you want to run the inference on sample images in `./test_images` directory, simply run:
```bash
python3 inference.py
```

### Custom Input Directory
To run batch inference on a specific folder of images:
```bash
python3 inference.py -i /path/to/your/custom_directory/
```

### Single Image Processing
To run inference on just one specific image:
```bash
python3 inference.py -i /path/to/image.jpg
```

### Adjusting Confidence Threshold
By default, the script only considers detections with a confidence score of **0.25** or higher. You can adjust this using the `-c` or `--conf` flag. For example, to require a 50% confidence:
```bash
python3 inference.py -i /path/to/image.jpg -c 0.5
```

---

## 3. Viewing Results
After inference is complete, check the `./Results` folder.
- **`Results/images/`**: Contains copies of your images drawn with bounding boxes and confidence scores.
- **`Results/predictions/predictions.json`**: Contains detailed JSON output of every detection (class, confidence, and normalized/pixel bounding box coordinates).
## 4. Class - Species Table
| **Class** | **Bacteria Species** |
| :--- | :--- |
| **class0** | _Actinobacillus equuli_ |
| **class1** | _Actinobacillus pleuropneumoniae_ |
| **class2** | _Aeromonas hydrophila_ |
| **class3** | _Bacillus cereus_ |
| **class4** | _Bibersteinia trehalosi_ |
| **class5** | _Bordetella bronchiseptica_ |
| **class6** | _Brucella ovis_ |
| **class7** | _Clostridium perfringens_ |
| **class8** | _Corynebacterium pseudotuberculosis_ |
| **class9** | _Erysipelothrix rhusiopathiae_ |
| **class10** | _Escherichia coli_ |
| **class11** | _Glaesserella parasuis_ |
| **class12** | _Klebsiella pneumoniae_ |
| **class13** | _Listeria monocytogenes_ |
| **class14** | _Paenibacillus larvae_ |
| **class15** | _Pasteurella multocida_ |
| **class16** | _Proteus mirabilis_ |
| **class17** | _Pseudomonas aeruginosa_ |
| **class18** | _Rhodococcus equi_ |
| **class19** | _Salmonella enterica_ |
| **class20** | _Staphylococcus aureus_ |
| **class21** | _Staphylococcus hyicus_ |
| **class22** | _Streptococcus agalactiae_ |
| **class23** | _Trueperella pyogenes_ |
