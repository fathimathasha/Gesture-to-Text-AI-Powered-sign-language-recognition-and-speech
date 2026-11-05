/**
 * Model Agnostic Configuration for Gesture to Text (ISL)
 * 
 * Supports both:
 * 1. "landmarks" input: Hand skeletal coordinate vectors (e.g. 21 points * 3 = 63, or 2 hands = 126)
 * 2. "image" input: Cropped and resized hand region image tensor [224, 224, 3]
 */

export const DEFAULT_LABELS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "HELLO", "THANK YOU", "PLEASE", "YES", "NO", "HELP", "NAMASTE", "GOODBYE"
];

export const DEFAULT_CONFIG = {
  id: "isl-default-model",
  name: "ISL Neural Engine v1.0",
  modelUrl: "/model/model.json",
  labelsUrl: "/model/labels.json",
  
  // Model input configuration: "landmarks" or "image"
  inputType: "landmarks", 
  
  // For landmarks: [63] (1 hand) or [126] (2 hands)
  // For image: [224, 224, 3]
  inputShape: [63],
  
  // Image crop settings (when inputType === "image" or for live ROI preview)
  cropSize: 224,
  
  // Normalization mode: "wristRelative" | "zeroToOne" | "minusOneToOne"
  normalization: "wristRelative",
  
  // Detection and triggering rules
  confidenceThreshold: 0.80, // Hold sign above 80% confidence
  holdDurationMs: 1000,      // Hold for 1 second (1000ms) to trigger
  cooldownMs: 800,           // Cooldown before accepting another trigger
  topK: 3,                   // Display top-3 predictions
  maxNumHands: 2,            // MediaPipe tracking hands
  
  labels: DEFAULT_LABELS,
};

/**
 * Normalizes landmarks relative to wrist (landmark 0) and scales by hand size.
 * Returns a 1D Float32Array of 63 values (x, y, z for 21 landmarks).
 */
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return new Float32Array(63);
  }

  const wrist = landmarks[0];
  const out = new Float32Array(63);

  // Compute maximum distance from wrist to determine scale
  let maxDist = 0.0001;
  for (let i = 0; i < 21; i++) {
    const dx = landmarks[i].x - wrist.x;
    const dy = landmarks[i].y - wrist.y;
    const dz = landmarks[i].z - wrist.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > maxDist) maxDist = dist;
  }

  // Normalize coordinates relative to wrist and scaled
  for (let i = 0; i < 21; i++) {
    out[i * 3 + 0] = (landmarks[i].x - wrist.x) / maxDist;
    out[i * 3 + 1] = (landmarks[i].y - wrist.y) / maxDist;
    out[i * 3 + 2] = (landmarks[i].z - wrist.z) / maxDist;
  }

  return out;
}
