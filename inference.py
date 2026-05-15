#!/usr/bin/env python3
"""
Colony detection Inference Script
- Test trained model on images
- Generate predictions with confidence scores
- Save annotated images
"""

import os
import json
import cv2
import argparse
from pathlib import Path
from ultralytics import YOLO

# Configuration
TRAINED_MODEL = "./best.pt"
TEST_IMAGES_DIR = "./test_images"  # Subdirectory in the same folder containing test images
OUTPUT_DIR = "./Results"  # Automatically created directory to save predictions

CONFIDENCE_THRESHOLD = 0.25  # Change confidence for predictions
MAX_DETECTIONS = 3000  # Maximum number of detections per image

 
def run_inference_on_directory():
    """Run inference on test images."""
    print("=" * 60)
    print("INFERENCE ON TEST SET")
    print("=" * 60)
    
    # Check model exists
    if not os.path.exists(TRAINED_MODEL):
        print(f"✗ ERROR:Model not found at {TRAINED_MODEL}")
        return
    
    # Load model
    print(f"\nLoading model: {TRAINED_MODEL}")
    model = YOLO(TRAINED_MODEL)
    
    # Create output directories
    os.makedirs(os.path.join(OUTPUT_DIR, "images"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "predictions"), exist_ok=True)
    
    # Find test images
    test_images = list(Path(TEST_IMAGES_DIR).glob("*"))
    print(f"Found {len(test_images)} test images")
    
    if len(test_images) == 0:
        print("No test images found. Please add images to the test_images/ directory.")
        return
    
    # Run inference
    print(f"\nRunning inference (confidence threshold: {CONFIDENCE_THRESHOLD})...")
    print("-" * 60)
    
    all_predictions = []
    stats = {
        'total_images': len(test_images),
        'total_detections': 0,
        'avg_confidence': 0,
        'detections_per_image': []
    }
    
    confidence_scores = []
    
    for idx, image_path in enumerate(test_images, 1):
        image_path = str(image_path)
        image_name = os.path.basename(image_path)
        
        # Run inference
        results = model.predict(
            source=image_path,
            conf=CONFIDENCE_THRESHOLD,
            max_det=MAX_DETECTIONS,
            verbose=False
        )
        
        result = results[0]
        detections = []
        
        # Extract predictions
        if result.boxes is not None:
            for box in result.boxes:
                detection = {
                    'image': image_name,
                    'class_id': int(box.cls[0]),
                    'class_name': model.names[int(box.cls[0])],
                    'confidence': float(box.conf[0]),
                    'bbox_norm': {  # Normalized coordinates
                        'x_center': float(box.xywhn[0][0]),
                        'y_center': float(box.xywhn[0][1]),
                        'width': float(box.xywhn[0][2]),
                        'height': float(box.xywhn[0][3])
                    },
                    'bbox_pixel': {  # Pixel coordinates
                        'x1': float(box.xyxy[0][0]),
                        'y1': float(box.xyxy[0][1]),
                        'x2': float(box.xyxy[0][2]),
                        'y2': float(box.xyxy[0][3])
                    }
                }
                detections.append(detection)
                confidence_scores.append(detection['confidence'])
        
        all_predictions.extend(detections)
        stats['total_detections'] += len(detections)
        stats['detections_per_image'].append(len(detections))
        
        # Draw and save annotated image
        annotated_img = result.plot()
        output_image_path = os.path.join(OUTPUT_DIR, "images", f"pred_{image_name}")
        cv2.imwrite(output_image_path, annotated_img)
        
        if idx % 10 == 0 or idx == len(test_images):
            print(f"  Processed {idx}/{len(test_images)} images "
                  f"({len(detections)} detections in this image)")
    
    # Calculate statistics
    stats['avg_confidence'] = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    print("-" * 60)
    print(f"\n✓ Inference Complete!")
    print(f"\nStatistics:")
    print(f"  Total images:            {stats['total_images']}")
    print(f"  Total detections:        {stats['total_detections']}")
    print(f"  Avg detections/image:    {stats['total_detections']/stats['total_images']:.1f}")
    print(f"  Avg confidence:          {stats['avg_confidence']:.3f}")
    print(f"  Max detections/image:    {max(stats['detections_per_image'])}")
    print(f"  Min detections/image:    {min(stats['detections_per_image'])}")
    
    # Save predictions JSON
    predictions_json = os.path.join(OUTPUT_DIR, "predictions", "predictions.json")
    with open(predictions_json, 'w') as f:
        json.dump(all_predictions, f, indent=2)
    print(f"\nPredictions saved to: {predictions_json}")
    print(f"Annotated images saved to: {os.path.join(OUTPUT_DIR, 'images')}")
    
    return all_predictions, stats


def run_inference_on_single_image(image_path):
    """Run inference on a single image."""
    print("=" * 60)
    print("INFERENCE ON SINGLE IMAGE")
    print("=" * 60)
    
    # Check model exists
    if not os.path.exists(TRAINED_MODEL):
        print(f"✗ ERROR: Model not found at {TRAINED_MODEL}")
        return
    
    # Check image exists
    if not os.path.exists(image_path):
        print(f"✗ ERROR: Image not found at {image_path}")
        return
    
    print(f"\nImage:              {image_path}")
    print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
    
    # Load model
    model = YOLO(TRAINED_MODEL)
    
    # Run inference
    print(f"\nRunning inference...")
    results = model.predict(
        source=image_path,
        conf=CONFIDENCE_THRESHOLD,
        max_det=MAX_DETECTIONS,
        verbose=False
    )
    
    result = results[0]
    
    # Extract and display predictions
    print(f"\nDetections:")
    print("-" * 60)
    
    if result.boxes is None or len(result.boxes) == 0:
        print("  No detections found")
    else:
        for idx, box in enumerate(result.boxes, 1):
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0]
            
            print(f"  Detection {idx}:")
            print(f"    Class:      {model.names[class_id]} (ID: {class_id})")
            print(f"    Confidence: {confidence:.3f}")
            print(f"    Bbox:       [{x1:.0f}, {y1:.0f}, {x2:.0f}, {y2:.0f}]")
    
    # Save annotated image
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    image_filename = os.path.basename(image_path)
    output_path = os.path.join(OUTPUT_DIR, f"pred_{image_filename}")
    annotated_img = result.plot()
    cv2.imwrite(output_path, annotated_img)
    print(f"\n✓ Annotated image saved to: {output_path}")


def main():
    """Main execution."""
    global TEST_IMAGES_DIR
    global CONFIDENCE_THRESHOLD

    parser = argparse.ArgumentParser(description="YOLOv8 Inference Script")
    parser.add_argument("-i", "--input", type=str, help="Input directory of test images or a single image path")
    parser.add_argument("-c", "--conf", type=float, default=0.25, help="Confidence threshold for predictions (default: 0.25)")
    args = parser.parse_args()

    CONFIDENCE_THRESHOLD = args.conf

    if args.input:
        if os.path.isdir(args.input):
            TEST_IMAGES_DIR = args.input
            run_inference_on_directory()
        elif os.path.isfile(args.input):
            run_inference_on_single_image(args.input)
        else:
            print(f"✗ ERROR: Input path does not exist: {args.input}")
    else:
        # Batch inference on default test set directory
        run_inference_on_directory()
        
    print("\n" + "=" * 60)
    print("✓ INFERENCE COMPLETE")
    print("=" * 60)
    print("\nUsage:")
    print("  Batch inference (default dir): python inference.py")
    print("  Batch inference (custom dir):  python inference.py -i /path/to/dir/")
    print("  Single image:                  python inference.py -i /path/to/image.jpg")
    print("  Custom confidence:             python inference.py -i /path/to/image.jpg -c 0.5")


if __name__ == "__main__":
    main()
