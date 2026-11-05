import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const labels = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "HELLO", "THANK YOU", "PLEASE", "YES", "NO", "HELP", "NAMASTE", "GOODBYE"
];

const modelDir = path.join(__dirname, 'public', 'model');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

// 1. Save labels.json
fs.writeFileSync(path.join(modelDir, 'labels.json'), JSON.stringify(labels, null, 2));
console.log('Saved labels.json with', labels.length, 'classes');

// 2. Create a lightweight TFJS model: Landmarks-based neural network (input: 63 features, 3 dense layers)
const model = tf.sequential();
model.add(tf.layers.dense({
  inputShape: [63],
  units: 128,
  activation: 'relu',
  name: 'dense_1'
}));
model.add(tf.layers.dropout({ rate: 0.2 }));
model.add(tf.layers.dense({
  units: 64,
  activation: 'relu',
  name: 'dense_2'
}));
model.add(tf.layers.dense({
  units: labels.length,
  activation: 'softmax',
  name: 'output_predictions'
}));

model.compile({
  optimizer: 'adam',
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});

// Custom save handler to write model.json and group1-shard1of1.bin
const saveHandler = tf.io.withSaveHandler(async (artifacts) => {
  const weightData = Buffer.from(artifacts.weightData);
  const binName = 'weights.bin';
  
  const modelTopologyAndWeightsManifest = {
    format: artifacts.format,
    generatedBy: artifacts.generatedBy,
    convertedBy: artifacts.convertedBy,
    modelTopology: artifacts.modelTopology,
    weightsManifest: [
      {
        paths: [binName],
        weights: artifacts.weightSpecs
      }
    ]
  };

  fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(modelTopologyAndWeightsManifest, null, 2));
  fs.writeFileSync(path.join(modelDir, binName), weightData);
  console.log('Successfully wrote model.json and weights.bin to', modelDir);
  return {
    modelArtifactsInfo: {
      dateSaved: new Date(),
      modelTopologyType: 'JSON',
      modelTopologyBytes: JSON.stringify(artifacts.modelTopology).length,
      weightDataBytes: weightData.byteLength
    }
  };
});

await model.save(saveHandler);
console.log('TFJS model generation complete!');
