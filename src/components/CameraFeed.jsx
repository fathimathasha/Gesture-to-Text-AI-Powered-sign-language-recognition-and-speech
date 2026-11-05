import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as mpHands from '@mediapipe/hands';
import { Camera, CameraOff, Eye, RefreshCw, Sparkles, Activity, AlertTriangle, Video, Settings2 } from 'lucide-react';
import { drawHandSkeleton, cropHandRegion } from '../utils/handDrawer';

// Safely get MediaPipe Hands constructor from window (CDN) or npm module
function getHandsConstructor() {
  if (typeof window !== 'undefined' && window.Hands) {
    return window.Hands;
  }
  if (mpHands.Hands) {
    return mpHands.Hands;
  }
  if (mpHands.default && mpHands.default.Hands) {
    return mpHands.default.Hands;
  }
  return null;
}

export default function CameraFeed({
  onFrameResults,
  onFpsUpdate,
  isTracking,
  setIsTracking,
  inputType
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const handsRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const isProcessingFrameRef = useRef(false);

  const [cameraError, setCameraError] = useState(null);
  const [handsCount, setHandsCount] = useState(0);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [showCropPreview, setShowCropPreview] = useState(true);
  const [fps, setFps] = useState(0);
  
  // Available video devices
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // FPS calculation refs
  const lastFrameTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef([]);

  // 1. Initialize MediaPipe Hands with polling for CDN script if needed
  useEffect(() => {
    let handsInstance = null;
    let isCancelled = false;

    const initHands = () => {
      const HandsClass = getHandsConstructor();

      if (!HandsClass) {
        // Retry shortly if CDN scripts are still downloading
        if (!isCancelled) {
          setTimeout(initHands, 250);
        }
        return;
      }

      try {
        handsInstance = new HandsClass({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        handsInstance.onResults((results) => {
          isProcessingFrameRef.current = false;
          handleHandsResults(results);
        });

        handsRef.current = handsInstance;
        console.log('MediaPipe Hands initialized successfully');
      } catch (err) {
        console.error('Failed to initialize MediaPipe Hands:', err);
      }
    };

    initHands();

    return () => {
      isCancelled = true;
      if (handsInstance) {
        try {
          handsInstance.close();
        } catch (e) {}
      }
    };
  }, []);

  // 2. Fetch available camera devices
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate video devices:', err);
    }
  }, [selectedDeviceId]);

  // Handle detection results
  const handleHandsResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const multiHandLandmarks = results.multiHandLandmarks || [];
    const multiHandedness = results.multiHandedness || [];

    setHandsCount(multiHandLandmarks.length);

    let primaryConfidence = 0;
    if (multiHandedness.length > 0) {
      primaryConfidence = multiHandedness[0].score || 0;
      setDetectionConfidence(Math.round(primaryConfidence * 100));
    } else {
      setDetectionConfidence(0);
    }

    // Draw glowing skeleton on canvas overlay
    multiHandLandmarks.forEach((landmarks, index) => {
      const handedness = multiHandedness[index];
      drawHandSkeleton(ctx, landmarks, index, handedness);
    });

    // Crop 224x224 hand region from video
    let cropCanvas = cropCanvasRef.current;
    if (multiHandLandmarks.length > 0 && videoRef.current) {
      cropHandRegion(videoRef.current, multiHandLandmarks[0], cropCanvas, 224);
    } else if (cropCanvas) {
      const cropCtx = cropCanvas.getContext('2d');
      cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    }

    // Notify parent app for gesture prediction
    if (onFrameResults) {
      onFrameResults({
        landmarks: multiHandLandmarks[0] || null,
        allHandsLandmarks: multiHandLandmarks,
        handednessList: multiHandedness,
        cropCanvas: multiHandLandmarks.length > 0 ? cropCanvas : null,
        confidence: primaryConfidence
      });
    }
  }, [onFrameResults]);

  // Start webcam stream with detailed error handling
  const startCamera = async (deviceIdToUse = selectedDeviceId) => {
    setCameraError(null);

    // Check secure context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError({
        title: 'Camera Inaccessible (Insecure Context)',
        message: 'Web browsers only permit webcam access on https:// or http://localhost. If you opened this via a local IP (e.g. 192.168.x.x), please open http://localhost:5173 instead.',
        steps: [
          'Open http://localhost:5173 in Google Chrome, Microsoft Edge, or Firefox.',
          'Verify your URL bar does not start with http://192.168.x.x or non-localhost address.'
        ]
      });
      setIsTracking(false);
      return;
    }

    try {
      // Constraints
      const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      };

      if (deviceIdToUse) {
        videoConstraints.deviceId = { exact: deviceIdToUse };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');

        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted:', playErr);
        }

        setIsTracking(true);
        updateDeviceList();
      }
    } catch (err) {
      console.error('Camera access error:', err);

      let title = 'Unable to Access Camera';
      let message = err.message || 'An unknown error occurred while accessing the webcam.';
      let steps = [];

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        title = 'Camera Permission Blocked';
        message = 'The browser or operating system denied permission to use your camera.';
        steps = [
          'Click the lock/camera icon located on the left side of your browser address bar (URL bar).',
          'Switch the "Camera" setting from "Block" to "Allow".',
          'On Windows: Check Windows Settings > Privacy & Security > Camera, and ensure "Let desktop apps access your camera" is enabled.',
          'Click the "Retry Camera Access" button below.'
        ];
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        title = 'Camera is Currently Busy';
        message = 'Another application or browser tab is currently using your webcam.';
        steps = [
          'Close any video apps (Zoom, Microsoft Teams, Google Meet, Skype, OBS Studio, Discord).',
          'Close any other browser tabs that might be previewing the camera.',
          'Click "Retry Camera Access" below.'
        ];
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        title = 'No Camera Device Detected';
        message = 'The browser could not find any active camera connected to your system.';
        steps = [
          'Check that your USB webcam is securely plugged in.',
          'Check Windows Device Manager to make sure camera drivers are installed.',
          'Select a different camera from the device dropdown if using virtual cameras.'
        ];
      }

      setCameraError({ title, message, steps });
      setIsTracking(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    setIsTracking(false);
    setHandsCount(0);
    setDetectionConfidence(0);
    setFps(0);
  };

  // Automatic camera start on initial mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing loop
  useEffect(() => {
    let active = true;

    const processFrame = async () => {
      if (!active) return;

      const video = videoRef.current;
      const hands = handsRef.current;
      const canvas = canvasRef.current;

      if (isTracking && video && video.readyState >= 2 && hands && !isProcessingFrameRef.current) {
        if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        try {
          isProcessingFrameRef.current = true;
          await hands.send({ image: video });

          // Calculate rolling FPS
          const now = performance.now();
          const delta = now - lastFrameTimeRef.current;
          lastFrameTimeRef.current = now;
          if (delta > 0) {
            const currentFps = Math.round(1000 / delta);
            fpsHistoryRef.current.push(currentFps);
            if (fpsHistoryRef.current.length > 15) fpsHistoryRef.current.shift();
            const avgFps = Math.round(
              fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
            );
            setFps(avgFps);
            if (onFpsUpdate) onFpsUpdate(avgFps);
          }
        } catch (err) {
          isProcessingFrameRef.current = false;
        }
      }

      if (active) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    if (isTracking) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isTracking, onFpsUpdate]);

  return (
    <div className="relative w-full aspect-video md:aspect-[16/10] bg-dark-900 rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 shadow-glow-cyan/20 group">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100"
        playsInline
        autoPlay
        muted
      />

      {/* Glowing Skeleton Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
      />

      {/* Mini Preview Canvas for 224x224 Hand Crop */}
      <div className={`absolute bottom-4 right-4 z-20 transition-all duration-300 ${showCropPreview ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        <div className="p-2.5 rounded-2xl glass-panel border border-cyan-500/30 shadow-glow-cyan bg-dark-900/90 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5 text-[10px] font-mono text-cyan-300">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>CROP 224×224</span>
            </span>
            <span className="text-slate-400">NORM</span>
          </div>
          <canvas
            ref={cropCanvasRef}
            width={224}
            height={224}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-black/60 object-cover border border-cyan-400/20"
          />
          <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>[1, 224, 224, 3]</span>
            <span className="text-emerald-400 font-semibold">{handsCount > 0 ? 'ACTIVE' : 'IDLE'}</span>
          </div>
        </div>
      </div>

      {/* Top Floating Badges HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: FPS & Confidence Badges */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* FPS Badge */}
          <div className="glass-pill px-3 py-1 rounded-full flex items-center space-x-1.5 text-xs font-mono font-semibold text-emerald-400 border border-emerald-500/30 shadow-glow-emerald">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>{fps} FPS</span>
          </div>

          {/* Hand Tracking Confidence Badge */}
          <div className="glass-pill px-3 py-1 rounded-full flex items-center space-x-1.5 text-xs font-mono text-cyan-300 border border-cyan-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{detectionConfidence}% CONF</span>
          </div>

          {/* Hands Count Badge */}
          <div className={`glass-pill px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
            handsCount > 0 ? 'text-violet-300 border-violet-500/40 bg-violet-950/40' : 'text-slate-400 border-white/10'
          }`}>
            {handsCount === 0 && 'Searching Hands...'}
            {handsCount === 1 && '1 Hand Tracked'}
            {handsCount === 2 && '2 Hands Tracked (Dual ISL)'}
          </div>
        </div>

        {/* Right: Camera Switcher, Toggle, PIP */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Device Selector Dropdown if multiple cameras exist */}
          {videoDevices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="bg-dark-900/90 text-cyan-300 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none"
            >
              {videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Toggle Crop PIP */}
          <button
            onClick={() => setShowCropPreview(!showCropPreview)}
            className={`p-2 rounded-xl glass-pill text-xs transition-colors border ${
              showCropPreview ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'text-slate-400 border-white/10'
            }`}
            title="Toggle 224x224 Hand Crop Preview"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Camera On/Off Toggle */}
          <button
            onClick={isTracking ? stopCamera : () => startCamera()}
            className={`p-2 rounded-xl text-xs font-semibold transition-all border ${
              isTracking 
                ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={isTracking ? 'Pause Camera' : 'Start Camera'}
          >
            {isTracking ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Cyber Grid Scanning Line Overlay (when tracking) */}
      {isTracking && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-24 animate-scan opacity-60" />
      )}

      {/* Camera Error or Inactive Screen */}
      {(!isTracking || cameraError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-900/95 backdrop-blur-md p-6 text-center z-30 overflow-y-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-cyan-400">
            {cameraError ? <AlertTriangle className="w-8 h-8 text-amber-400" /> : <CameraOff className="w-8 h-8" />}
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            {cameraError ? cameraError.title : 'Webcam Is Paused'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mb-4">
            {cameraError ? cameraError.message : 'Click below to activate live webcam hand tracking with MediaPipe Hands.'}
          </p>

          {/* Actionable troubleshooting steps if error */}
          {cameraError && cameraError.steps && (
            <div className="text-left bg-black/40 border border-white/10 rounded-2xl p-4 max-w-md w-full mb-5 text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="text-cyan-300 font-bold mb-2 uppercase text-[11px] tracking-wider">
                Troubleshooting Steps:
              </div>
              {cameraError.steps.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold">{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => startCamera()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold shadow-glow-cyan transition-all active:scale-95 text-xs sm:text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera Access</span>
            </button>

            {videoDevices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  startCamera(e.target.value);
                }}
                className="bg-white/10 text-slate-200 border border-white/20 rounded-xl px-3 py-2 text-xs font-mono"
              >
                {videoDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-dark-900">
                    Switch to: {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
