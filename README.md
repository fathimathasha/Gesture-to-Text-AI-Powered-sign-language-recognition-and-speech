# Gesture to Text (ISL) — Indian Sign Language to Text & Speech

An affordable, real-time Indian Sign Language (ISL) translator web application built with **React**, **Vite**, **Tailwind CSS**, **MediaPipe Hands**, and **TensorFlow.js**. Operates **100% frontend-only** in the browser with zero backend or external API servers required.

---

## 🌟 3 Core Features

### 1. Live Hand Tracking
- **MediaPipe Hands**: Tracks up to 2 hands simultaneously (`maxNumHands = 2`) via webcam.
- **Glowing Neon Skeleton Overlay**: High-visibility cyberpunk HUD overlay rendering neon cyan (primary hand) and violet (secondary hand) bone lines, glowing radial joint nodes, and interactive corner-bracket bounding boxes.
- **FPS & Confidence Badges**: Real-time rolling frame-rate (FPS) counter and detection confidence badge.
- **Hand Region Cropping & Normalization**: Automatically calculates hand bounding box, crops a square region around the hand, resizes it to **224×224 pixels**, and normalizes tensor values with a live picture-in-picture (PIP) inspection preview.

### 2. Pretrained Model Recognition (A-Z + Common Words)
- **Model-Agnostic Engine**: Load any TensorFlow.js model from `/public/model/model.json` with class labels from `/public/model/labels.json`.
- **Flexible Input Adapters** (`src/config/modelConfig.js`):
  - **Landmarks Mode**: 21-joint 3D skeletal coordinate vector (`[1, 63]` for 1 hand or `[1, 126]` for 2 hands).
  - **Image Mode**: Normalized cropped hand image tensor (`[1, 224, 224, 3]`).
- **Runtime "Upload Model" Button**: Swap models on the fly at runtime by selecting `model.json`, `.bin` weight shard files, and optional `labels.json`.
- **Top-3 Predictions with Confidence Bars**: Live animated ranking bars displaying top 3 predictions with real-time percentages.
- **1-Second Hold to Append**: Hold any gesture steadily for **1.0 second at &ge;80% confidence** to automatically lock in and append it to the sentence builder. Includes a circular radial countdown timer and haptic audio tone.
- **Sentence Builder Controls**: Dedicated **Space**, **Backspace**, **Clear**, and **Copy** buttons.

### 3. Multilingual Text-To-Speech (TTS)
- **Web Speech API**: Zero-latency voice synthesis in the browser.
- **Speak Button**: Speaks the current sentence aloud with audio wave indicators.
- **Auto-Speak Toggle**: Automatically pronounces signs or words the instant they are held and appended.
- **Language Dropdown**:
  - 🇺🇸 **English** (`en-US` / `en-IN`)
  - 🇮🇳 **Hindi (हिन्दी)** (`hi-IN`) — with native vocabulary mapping (e.g. *NAMASTE* &rarr; "नमस्ते", *THANK YOU* &rarr; "धन्यवाद")
  - 🇮🇳 **Kannada (ಕನ್ನಡ)** (`kn-IN`) — with native vocabulary mapping (e.g. *NAMASTE* &rarr; "ನಮಸ್ಕಾರ", *THANK YOU* &rarr; "ಧನ್ಯವಾದಗಳು")
- **Voice Customization**: Adjustable speech rate and pitch sliders with an instant voice test preview.

---

## 📁 Where to Place Pretrained Model Files

To use your own custom pre-trained model as the default startup model, place the files inside the `/public/model/` directory:

```
gesture-to-text-isl/
├── public/
│   └── model/
│       ├── model.json              <-- TensorFlow.js Model topology & weights manifest
│       ├── weights.bin             <-- Model binary weights (or group1-shard1of1.bin)
│       └── labels.json             <-- Array of labels: ["A", "B", ... "NAMASTE"]
```

### 1. `labels.json` Format
Ensure `labels.json` is a JSON array of strings matching the model's output classes in exact order:
```json
[
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "HELLO", "THANK YOU", "PLEASE", "YES", "NO", "HELP", "NAMASTE", "GOODBYE"
]
```

### 2. Model Agnostic Configuration (`src/config/modelConfig.js`)
Edit `src/config/modelConfig.js` to match your model's architecture:
```javascript
export const DEFAULT_CONFIG = {
  inputType: "landmarks",            // "landmarks" or "image"
  inputShape: [63],                  // [63] for landmarks, or [224, 224, 3] for image
  cropSize: 224,                     // 224x224 image dimensions
  normalization: "wristRelative",    // "wristRelative" | "zeroToOne" | "minusOneToOne"
  confidenceThreshold: 0.80,         // 80% hold threshold
  holdDurationMs: 1000,              // 1.0 second hold time
  topK: 3                            // Top-3 predictions
};
```

---

## 🔄 Runtime Model Swapping (No Reload Required)

You do not need to restart the application to test different models:
1. Click the **"Upload Model"** button in the top navigation bar.
2. Select your `model.json`, `.bin` weight shard files, and optional `labels.json`.
3. Choose the model's input type (**Landmarks** or **Image 224×224**).
4. Click **"Swap to Uploaded Model"**. The weights are immediately loaded into WebGL memory and inference updates instantly.

---

## 🚀 Quickstart & Development

### Prerequisites
- Node.js (v18 or higher)
- Modern browser with WebGL and Webcam support (Chrome, Edge, Firefox, Brave, Safari)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🖐️ Indian Sign Language (ISL) Gesture Reference

The app includes an integrated ISL Gesture Cheat Sheet accessible via the **"ISL Guide"** button in the header:

| Sign | Hands | Description |
| :--- | :---: | :--- |
| **NAMASTE** | 2 Hands | Join both palms together in front of the chest pointing upwards. |
| **HELLO** | 1 Hand | Open hand with all 5 fingers spread out facing the camera. |
| **THANK YOU** | 1 or 2 Hands | Touch fingertips to chin and move forward, or join hands. |
| **YES** | 1 Hand | Closed fist with a gentle wrist nod. |
| **NO** | 1 Hand | Rapidly pinch index and middle fingertips to thumb tip. |
| **HELP** | 2 Hands | Place an upright fist on top of a flat horizontal palm. |
| **A – Z** | 1 Hand | Standard ISL / finger-spelling alphabet poses. |

---

## 🎨 Design System
- **Dark Glassmorphism**: `backdrop-blur-xl` frosted glass panels with subtle glowing neon borders.
- **Cyberpunk Accents**: Radiant Cyan (`#00f2fe`), Electric Violet (`#7928ca`), and Emerald (`#10b981`).
- **Accessible & Responsive**: Optimized for desktop, tablet, and mobile webcam feeds.
