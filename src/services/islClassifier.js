/**
 * Real-time Indian Sign Language (ISL) Geometric Classifier
 * 
 * Provides robust real-time classification of 21-point MediaPipe hand landmarks
 * for ISL alphabet (A-Z) and common signs (NAMASTE, HELLO, THANK YOU, YES, NO, HELP, etc.).
 * Works in tandem with or as baseline for loaded TensorFlow.js models.
 */

// Landmark indices
const WRIST = 0;
const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

function dist(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getFingerStates(landmarks) {
  const wrist = landmarks[WRIST];
  const scale = dist(wrist, landmarks[MIDDLE_MCP]) || 1;

  // Finger tip distances to wrist compared to PIP joints
  const isExtended = (tip, pip, mcp) => {
    return dist(landmarks[tip], wrist) > dist(landmarks[pip], wrist) * 1.15;
  };

  const isFolded = (tip, mcp) => {
    return dist(landmarks[tip], wrist) < dist(landmarks[mcp], wrist) * 1.05;
  };

  const thumbTip = landmarks[THUMB_TIP];
  const indexTip = landmarks[INDEX_TIP];
  const middleTip = landmarks[MIDDLE_TIP];
  const ringTip = landmarks[RING_TIP];
  const pinkyTip = landmarks[PINKY_TIP];

  const indexExt = isExtended(INDEX_TIP, INDEX_PIP, INDEX_MCP);
  const middleExt = isExtended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
  const ringExt = isExtended(RING_TIP, RING_PIP, RING_MCP);
  const pinkyExt = isExtended(PINKY_TIP, PINKY_PIP, PINKY_MCP);

  // Thumb extended if far from pinky MCP and index MCP
  const thumbExt = dist(thumbTip, landmarks[PINKY_MCP]) > 0.3 * scale &&
                   dist(thumbTip, landmarks[INDEX_MCP]) > 0.25 * scale;

  return {
    scale,
    thumb: thumbExt,
    index: indexExt,
    middle: middleExt,
    ring: ringExt,
    pinky: pinkyExt,
    thumbTip,
    indexTip,
    middleTip,
    ringTip,
    pinkyTip,
    wrist,
    indexMcp: landmarks[INDEX_MCP],
    middleMcp: landmarks[MIDDLE_MCP]
  };
}

export function classifyISLGestures(allHandsLandmarks, handednessList = []) {
  if (!allHandsLandmarks || allHandsLandmarks.length === 0) {
    return [];
  }

  const scores = {};
  const addScore = (label, conf) => {
    scores[label] = Math.max(scores[label] || 0, conf);
  };

  // Check 2-hand gestures first if two hands detected
  if (allHandsLandmarks.length >= 2) {
    const h1 = allHandsLandmarks[0];
    const h2 = allHandsLandmarks[1];
    const wristDist = dist(h1[WRIST], h2[WRIST]);
    const palmsDist = dist(h1[MIDDLE_MCP], h2[MIDDLE_MCP]);
    const tipsDist = dist(h1[MIDDLE_TIP], h2[MIDDLE_TIP]);

    // NAMASTE: Palms facing and pressed together, fingertips touching pointing upwards
    if (wristDist < 0.28 && palmsDist < 0.22 && tipsDist < 0.2) {
      addScore("NAMASTE", 0.96);
    }

    // HELP: Flat support hand under a fist or two interacting hands
    if (wristDist < 0.35 && palmsDist < 0.28) {
      const f1 = getFingerStates(h1);
      const f2 = getFingerStates(h2);
      if ((!f1.index && !f1.middle && f2.index && f2.middle) || 
          (!f2.index && !f2.middle && f1.index && f1.middle)) {
        addScore("HELP", 0.88);
      }
      addScore("THANK YOU", 0.82);
    }
  }

  // Single hand classification (primary hand)
  const landmarks = allHandsLandmarks[0];
  const f = getFingerStates(landmarks);
  const { thumb, index, middle, ring, pinky, thumbTip, indexTip, middleTip, ringTip, pinkyTip, scale } = f;

  // Distances between fingertips
  const dThumbIndex = dist(thumbTip, indexTip) / scale;
  const dThumbMiddle = dist(thumbTip, middleTip) / scale;
  const dIndexMiddle = dist(indexTip, middleTip) / scale;

  // "A": All fingers folded, thumb resting next to index (fist with thumb upright on side)
  if (!index && !middle && !ring && !pinky && thumb) {
    addScore("A", 0.92);
  } else if (!index && !middle && !ring && !pinky && !thumb) {
    // "S": Fist with thumb tucked in front of fingers
    addScore("S", 0.91);
    addScore("E", 0.74);
  }

  // "B": 4 fingers straight up, thumb folded across palm
  if (index && middle && ring && pinky && !thumb) {
    addScore("B", 0.95);
    addScore("HELLO", 0.88);
  }

  // "HELLO": Open hand with all fingers including thumb extended
  if (index && middle && ring && pinky && thumb) {
    addScore("HELLO", 0.94);
    addScore("GOODBYE", 0.89);
    addScore("B", 0.82);
  }

  // "C": Curved hand forming a C
  if (dThumbIndex > 0.35 && dThumbIndex < 0.85 && !index && !middle && !ring && !pinky) {
    addScore("C", 0.89);
  }

  // "D": Index straight up, thumb touches middle/ring/pinky tips
  if (index && !middle && !ring && !pinky && dThumbMiddle < 0.5) {
    addScore("D", 0.93);
  }

  // "F": Index and thumb tips touching (circle), middle, ring, pinky extended straight up
  if (middle && ring && pinky && dThumbIndex < 0.35) {
    addScore("F", 0.95);
    addScore("THANK YOU", 0.78);
  }

  // "I": Only pinky extended, other fingers folded
  if (!index && !middle && !ring && pinky && !thumb) {
    addScore("I", 0.95);
  }

  // "J": Pinky extended with thumb out or curving
  if (!index && !middle && !ring && pinky && thumb) {
    addScore("J", 0.88);
    addScore("Y", 0.85);
  }

  // "L": Thumb and index extended at right angle (90 deg), other 3 fingers folded
  if (index && thumb && !middle && !ring && !pinky) {
    addScore("L", 0.96);
  }

  // "V" / "PEACE": Index and middle extended spread apart, ring and pinky folded
  if (index && middle && !ring && !pinky && dIndexMiddle > 0.22) {
    addScore("V", 0.95);
    addScore("K", 0.84);
  }

  // "U": Index and middle extended held together (close)
  if (index && middle && !ring && !pinky && dIndexMiddle <= 0.22) {
    addScore("U", 0.94);
    addScore("H", 0.81);
  }

  // "W": Index, middle, and ring extended, pinky and thumb folded
  if (index && middle && ring && !pinky && !thumb) {
    addScore("W", 0.95);
  }

  // "Y": Thumb and pinky extended, middle 3 fingers folded
  if (thumb && pinky && !index && !middle && !ring) {
    addScore("Y", 0.96);
  }

  // "O": All fingertips curled to meet thumb tip
  if (!index && !middle && !ring && !pinky && dThumbIndex < 0.28 && dThumbMiddle < 0.3) {
    addScore("O", 0.91);
  }

  // "YES": Closed fist with firm tilt or vertical orientation
  if (!index && !middle && !ring && !pinky) {
    addScore("YES", 0.84);
  }

  // "NO": Index and middle fingers pinching thumb repeatedly
  if (dThumbIndex < 0.25 && dThumbMiddle < 0.3 && !ring && !pinky) {
    addScore("NO", 0.88);
  }

  // Convert scores dictionary to sorted array of predictions
  const predictions = Object.keys(scores).map(label => ({
    label,
    confidence: Math.min(1.0, Math.max(0.01, scores[label]))
  }));

  // Sort descending by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);

  return predictions;
}
