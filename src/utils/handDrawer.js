/**
 * Neon Cyber Glowing Skeleton Overlay Drawer for MediaPipe Hands
 */

// Landmark connections for rendering
export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17], [0, 17]
];

const FINGERTIPS = [4, 8, 12, 16, 20];

/**
 * Draws the cyber glowing skeleton on the canvas
 */
export function drawHandSkeleton(ctx, landmarks, handIndex = 0, handedness = null) {
  if (!landmarks || landmarks.length < 21) return;

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Colors based on hand index (Cyan for Hand 1, Violet for Hand 2)
  const isPrimary = handIndex === 0;
  const primaryColor = isPrimary ? '#00f2fe' : '#c084fc';
  const glowColor = isPrimary ? 'rgba(0, 242, 254, 0.7)' : 'rgba(192, 132, 252, 0.7)';
  const secondaryColor = isPrimary ? '#4facfe' : '#e879f9';

  ctx.save();

  // 1. Draw glowing connecting lines
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];

    const x1 = p1.x * width;
    const y1 = p1.y * height;
    const x2 = p2.x * width;
    const y2 = p2.y * height;

    // Glowing wider under-stroke
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = glowColor;
    ctx.stroke();

    // Sharp bright core line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();
  }

  // 2. Draw glowing joints
  ctx.shadowBlur = 8;
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    const x = p.x * width;
    const y = p.y * height;
    const isTip = FINGERTIPS.includes(i);
    const radius = isTip ? 6.5 : (i === 0 ? 7 : 4);

    // Outer glow halo
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? '#ffffff' : primaryColor;
    ctx.shadowColor = isTip ? '#ffffff' : glowColor;
    ctx.shadowBlur = isTip ? 16 : 8;
    ctx.fill();

    // Inner core
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Fingertip rings
    if (isTip) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = primaryColor;
      ctx.stroke();
    }
  }

  // 3. Draw Cyber Bounding Box HUD
  drawHandBoundingBox(ctx, landmarks, primaryColor, glowColor, handedness);

  ctx.restore();
}

/**
 * Draws HUD style corner brackets bounding box around hand
 */
function drawHandBoundingBox(ctx, landmarks, color, glowColor, handedness) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Margin
  const padX = (maxX - minX) * 0.2;
  const padY = (maxY - minY) * 0.2;

  const x1 = Math.max(0, (minX - padX) * width);
  const y1 = Math.max(0, (minY - padY) * height);
  const x2 = Math.min(width, (maxX + padX) * width);
  const y2 = Math.min(height, (maxY + padY) * height);

  const boxW = x2 - x1;
  const boxH = y2 - y1;
  const cornerLen = Math.min(24, boxW * 0.25, boxH * 0.25);

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Top-Left corner
  ctx.beginPath();
  ctx.moveTo(x1, y1 + cornerLen);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 + cornerLen, y1);
  ctx.stroke();

  // Top-Right corner
  ctx.beginPath();
  ctx.moveTo(x2 - cornerLen, y1);
  ctx.lineTo(x2, y1);
  ctx.lineTo(x2, y1 + cornerLen);
  ctx.stroke();

  // Bottom-Left corner
  ctx.beginPath();
  ctx.moveTo(x1, y2 - cornerLen);
  ctx.lineTo(x1, y2);
  ctx.lineTo(x1 + cornerLen, y2);
  ctx.stroke();

  // Bottom-Right corner
  ctx.beginPath();
  ctx.moveTo(x2 - cornerLen, y2);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 - cornerLen);
  ctx.stroke();

  // Label badge
  const label = handedness 
    ? `${handedness.label.toUpperCase()} HAND ${(handedness.score * 100).toFixed(0)}%`
    : 'HAND DETECTED';

  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = color;
  ctx.shadowBlur = 4;
  ctx.fillText(label, x1 + 4, Math.max(16, y1 - 6));
}

/**
 * Crops square hand region from source video/canvas and renders to 224x224 offscreen canvas
 */
export function cropHandRegion(videoElement, landmarks, targetCanvas, targetSize = 224) {
  if (!videoElement || !landmarks || landmarks.length === 0 || !targetCanvas) {
    return null;
  }

  const vWidth = videoElement.videoWidth || videoElement.width || 640;
  const vHeight = videoElement.videoHeight || videoElement.height || 480;

  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Center & square crop
  const centerX = ((minX + maxX) / 2) * vWidth;
  const centerY = ((minY + maxY) / 2) * vHeight;
  const handW = (maxX - minX) * vWidth;
  const handH = (maxY - minY) * vHeight;
  const cropDim = Math.max(handW, handH) * 1.45; // 45% margin for full hand gestures

  const cropX = Math.max(0, Math.min(vWidth - cropDim, centerX - cropDim / 2));
  const cropY = Math.max(0, Math.min(vHeight - cropDim, centerY - cropDim / 2));
  const actualDim = Math.min(cropDim, vWidth - cropX, vHeight - cropY);

  const targetCtx = targetCanvas.getContext('2d');
  targetCanvas.width = targetSize;
  targetCanvas.height = targetSize;

  targetCtx.clearRect(0, 0, targetSize, targetSize);
  targetCtx.drawImage(
    videoElement,
    cropX, cropY, actualDim, actualDim,
    0, 0, targetSize, targetSize
  );

  return {
    cropX, cropY, cropDim: actualDim, targetSize
  };
}
