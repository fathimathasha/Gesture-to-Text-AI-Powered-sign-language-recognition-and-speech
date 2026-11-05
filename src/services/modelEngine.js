import * as tf from '@tensorflow/tfjs';
import { DEFAULT_CONFIG, normalizeLandmarks } from '../config/modelConfig';
import { classifyISLGestures } from './islClassifier';

class ModelEngine {
  constructor() {
    this.model = null;
    this.labels = DEFAULT_CONFIG.labels;
    this.config = { ...DEFAULT_CONFIG };
    this.isLoaded = false;
    this.isLoading = false;
    this.loadError = null;
    this.modelSource = "Default Bundled Model";
    this.modelType = "LayersModel";
  }

  /**
   * Initializes or loads the model from default /model/model.json and labels from /model/labels.json
   */
  async loadDefaultModel() {
    this.isLoading = true;
    this.loadError = null;

    try {
      // 1. Fetch labels.json
      try {
        const labelsRes = await fetch(this.config.labelsUrl);
        if (labelsRes.ok) {
          const fetchedLabels = await labelsRes.json();
          if (Array.isArray(fetchedLabels) && fetchedLabels.length > 0) {
            this.labels = fetchedLabels;
          }
        }
      } catch (err) {
        console.warn('Could not fetch labels.json, using fallback labels:', err);
      }

      // 2. Load TFJS model
      try {
        this.model = await tf.loadLayersModel(this.config.modelUrl);
        this.modelType = "LayersModel";
      } catch (layerErr) {
        console.warn('LayersModel failed, trying GraphModel:', layerErr);
        this.model = await tf.loadGraphModel(this.config.modelUrl);
        this.modelType = "GraphModel";
      }

      this.isLoaded = true;
      this.modelSource = "Default (/model/model.json)";
      console.log('TFJS Model loaded successfully:', this.model);
      return { success: true };
    } catch (err) {
      console.error('Failed to load default TFJS model:', err);
      this.loadError = err.message || 'Failed to load model';
      // Notice: Even if model loading encounters an issue, our geometric classifier remains operational!
      return { success: false, error: this.loadError };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Loads custom user-uploaded model files at runtime
   * Accepts model.json, weights .bin files, and optional labels.json
   */
  async loadUserUploadedModel({ modelFile, weightFiles = [], labelsFile = null, inputType = "landmarks" }) {
    this.isLoading = true;
    this.loadError = null;

    try {
      // 1. Parse labels if provided
      if (labelsFile) {
        const labelsText = await labelsFile.text();
        const parsedLabels = JSON.parse(labelsText);
        if (Array.isArray(parsedLabels) && parsedLabels.length > 0) {
          this.labels = parsedLabels;
        }
      }

      // 2. Load model using tf.io.browserFiles
      const filesToLoad = [modelFile, ...weightFiles];
      try {
        this.model = await tf.loadLayersModel(tf.io.browserFiles(filesToLoad));
        this.modelType = "LayersModel";
      } catch (layerErr) {
        console.warn('Custom LayersModel failed, trying GraphModel:', layerErr);
        this.model = await tf.loadGraphModel(tf.io.browserFiles(filesToLoad));
        this.modelType = "GraphModel";
      }

      this.config.inputType = inputType;
      this.isLoaded = true;
      this.modelSource = `Uploaded: ${modelFile.name}`;
      console.log('Custom user model loaded successfully:', modelFile.name);
      return { success: true, modelName: modelFile.name, labelsCount: this.labels.length };
    } catch (err) {
      console.error('Failed to load uploaded model:', err);
      this.loadError = err.message || 'Invalid model files provided';
      return { success: false, error: this.loadError };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Prepares input tensor based on config.inputType
   */
  prepareTensorInput({ landmarks, allHandsLandmarks, cropCanvas }) {
    if (this.config.inputType === "image") {
      if (!cropCanvas) return null;
      return tf.tidy(() => {
        let tensor = tf.browser.fromPixels(cropCanvas).toFloat();
        // Resize if needed
        if (cropCanvas.width !== this.config.cropSize || cropCanvas.height !== this.config.cropSize) {
          tensor = tf.image.resizeBilinear(tensor, [this.config.cropSize, this.config.cropSize]);
        }
        // Normalize
        if (this.config.normalization === "minusOneToOne") {
          tensor = tensor.sub(127.5).div(127.5);
        } else {
          tensor = tensor.div(255.0); // 0 to 1
        }
        return tensor.expandDims(0); // [1, 224, 224, 3]
      });
    }

    // Default: "landmarks" mode
    if (!landmarks || landmarks.length === 0) return null;

    return tf.tidy(() => {
      const normalized = normalizeLandmarks(landmarks);
      return tf.tensor2d([Array.from(normalized)], [1, 63]);
    });
  }

  /**
   * Predicts gesture for current frame
   * Returns top-k predictions [{ label, confidence }, ...]
   */
  async predict({ landmarks, allHandsLandmarks = [], handednessList = [], cropCanvas = null, mode = "ensemble" }) {
    if (!landmarks || landmarks.length === 0) {
      return [];
    }

    let nnPredictions = [];
    const geometricPredictions = classifyISLGestures(
      allHandsLandmarks.length > 0 ? allHandsLandmarks : [landmarks],
      handednessList
    );

    // If Neural Network model is loaded and ready, run TFJS inference
    if (this.model && this.isLoaded && mode !== "geometric") {
      let inputTensor = null;
      try {
        inputTensor = this.prepareTensorInput({ landmarks, allHandsLandmarks, cropCanvas });

        if (inputTensor) {
          const outputTensor = tf.tidy(() => {
            const raw = this.model.predict(inputTensor);
            // Apply softmax if output is raw logits
            return raw.softmax ? raw.softmax() : raw;
          });

          const probabilities = await outputTensor.data();
          outputTensor.dispose();

          // Map probabilities to labels
          const mapped = [];
          for (let i = 0; i < probabilities.length; i++) {
            const label = this.labels[i] || `Class_${i}`;
            mapped.push({
              label,
              confidence: probabilities[i]
            });
          }

          // Sort descending
          mapped.sort((a, b) => b.confidence - a.confidence);
          nnPredictions = mapped;
        }
      } catch (inferErr) {
        // If shape mismatch or tensor error occurred, log once
        // and fall through to geometric predictions
      } finally {
        if (inputTensor) {
          inputTensor.dispose();
        }
      }
    }

    // Merge or select predictions according to mode
    if (mode === "neural" && nnPredictions.length > 0) {
      return nnPredictions.slice(0, this.config.topK);
    }

    if (mode === "geometric" || nnPredictions.length === 0) {
      return geometricPredictions.slice(0, this.config.topK);
    }

    // Ensemble Mode (Combines NN confidence with Geometric classifier for max stability)
    const combinedScores = {};

    // First assign geometric recognitions (high weight for verified hand poses)
    for (const g of geometricPredictions) {
      combinedScores[g.label] = g.confidence;
    }

    // Then blend in NN predictions
    for (const n of nnPredictions.slice(0, 5)) {
      if (combinedScores[n.label]) {
        combinedScores[n.label] = Math.max(combinedScores[n.label], n.confidence);
      } else if (n.confidence > 0.4) {
        combinedScores[n.label] = n.confidence;
      }
    }

    const merged = Object.keys(combinedScores).map(label => ({
      label,
      confidence: Math.min(1.0, combinedScores[label])
    }));

    merged.sort((a, b) => b.confidence - a.confidence);
    return merged.slice(0, this.config.topK);
  }
}

export const modelEngine = new ModelEngine();
