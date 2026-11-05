import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import PredictionCard from './components/PredictionCard';
import SentenceBox from './components/SentenceBox';
import TTSControls from './components/TTSControls';
import ModelManagerModal from './components/ModelManagerModal';
import ISLGuideModal from './components/ISLGuideModal';
import { modelEngine } from './services/modelEngine';
import { ttsService } from './services/ttsService';
import { DEFAULT_CONFIG } from './config/modelConfig';

export default function App() {
  // App configurations and model state
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [modelInfo, setModelInfo] = useState({
    source: 'Loading Default Model...',
    inputType: DEFAULT_CONFIG.inputType,
    labelsCount: DEFAULT_CONFIG.labels.length
  });

  // Tracking and predictions
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [fps, setFps] = useState(0);
  const [predictions, setPredictions] = useState([]);
  
  // Hold-to-type state (1s hold at >= 80% confidence)
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdLabel, setHoldLabel] = useState('');
  const [lastAddedSign, setLastAddedSign] = useState(null);

  // Sentence & text state
  const [sentence, setSentence] = useState('HELLO');

  // TTS state
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Modals
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Hold tracking internal references
  const currentSignRef = useRef(null);
  const holdStartTimeRef = useRef(null);
  const cooldownUntilRef = useRef(0);
  const lastProcessedTimeRef = useRef(performance.now());

  // Load default model on startup
  useEffect(() => {
    const initModel = async () => {
      const res = await modelEngine.loadDefaultModel();
      setModelInfo({
        source: modelEngine.modelSource,
        inputType: modelEngine.config.inputType,
        labelsCount: modelEngine.labels.length
      });
    };
    initModel();
  }, []);

  // Audio tone feedback when sign is locked in
  const playTriggerSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  // Append sign to sentence
  const appendSign = useCallback((sign) => {
    setSentence((prev) => {
      let updated = prev;
      if (sign.length > 1) {
        // Multi-letter word (e.g., "NAMASTE", "HELLO", "THANK YOU")
        updated = prev.length > 0 && !prev.endsWith(' ') ? `${prev} ${sign} ` : `${prev}${sign} `;
      } else {
        // Single letter (A-Z)
        updated = `${prev}${sign}`;
      }
      return updated;
    });

    setLastAddedSign(sign);
    playTriggerSound();

    // Trigger visual confetti burst for celebratory feedback
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00f2fe', '#4facfe', '#7928ca', '#10b981']
    });

    // Auto-Speak if enabled
    if (autoSpeak) {
      ttsService.speak(sign, {
        lang: selectedLang,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  }, [autoSpeak, selectedLang]);

  // Frame processing from CameraFeed
  const handleFrameResults = useCallback(async ({ landmarks, allHandsLandmarks, handednessList, cropCanvas, confidence }) => {
    const now = performance.now();

    if (!landmarks || landmarks.length === 0) {
      setPredictions([]);
      setHoldProgress(0);
      setIsHolding(false);
      currentSignRef.current = null;
      holdStartTimeRef.current = null;
      return;
    }

    // Run prediction
    const preds = await modelEngine.predict({
      landmarks,
      allHandsLandmarks,
      handednessList,
      cropCanvas,
      mode: 'ensemble'
    });

    setPredictions(preds);

    // Evaluate hold-to-append logic
    if (preds.length > 0) {
      const top = preds[0];
      const threshold = config.confidenceThreshold || 0.80;
      const holdDuration = config.holdDurationMs || 1000;

      // Check if cooldown is active
      if (now < cooldownUntilRef.current) {
        setHoldProgress(0);
        setIsHolding(false);
        return;
      }

      if (top.confidence >= threshold) {
        // High confidence sign detected
        if (currentSignRef.current === top.label) {
          // Continuous hold of the same sign
          if (!holdStartTimeRef.current) {
            holdStartTimeRef.current = now;
          }
          const elapsed = now - holdStartTimeRef.current;
          const progress = Math.min(1.0, elapsed / holdDuration);

          setHoldProgress(progress);
          setIsHolding(true);
          setHoldLabel(top.label);

          // If held for full 1 second, trigger append
          if (progress >= 1.0) {
            appendSign(top.label);
            cooldownUntilRef.current = now + (config.cooldownMs || 800);
            holdStartTimeRef.current = null;
            currentSignRef.current = null;
            setHoldProgress(0);
            setIsHolding(false);
          }
        } else {
          // New sign started
          currentSignRef.current = top.label;
          holdStartTimeRef.current = now;
          setHoldProgress(0);
          setIsHolding(true);
          setHoldLabel(top.label);
        }
      } else {
        // Confidence dropped below threshold
        currentSignRef.current = null;
        holdStartTimeRef.current = null;
        setHoldProgress(0);
        setIsHolding(false);
      }
    } else {
      setHoldProgress(0);
      setIsHolding(false);
      currentSignRef.current = null;
      holdStartTimeRef.current = null;
    }
  }, [config, appendSign]);

  // Sentence Controls
  const handleAddSpace = () => {
    setSentence(prev => prev.endsWith(' ') ? prev : `${prev} `);
  };

  const handleBackspace = () => {
    setSentence(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setSentence('');
  };

  // TTS Controls
  const handleSpeakSentence = (text, opts) => {
    if (!text || text.trim().length === 0) return;
    setIsSpeaking(true);
    ttsService.speak(text, {
      ...opts,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleStopSpeaking = () => {
    ttsService.cancel();
    setIsSpeaking(false);
  };

  // Custom Model Upload Handler
  const handleLoadCustomModel = async (uploadData) => {
    const res = await modelEngine.loadUserUploadedModel(uploadData);
    if (res.success) {
      setConfig(prev => ({
        ...prev,
        inputType: uploadData.inputType,
        normalization: uploadData.normalization
      }));
      setModelInfo({
        source: modelEngine.modelSource,
        inputType: uploadData.inputType,
        labelsCount: res.labelsCount
      });
    }
    return res;
  };

  // Reset Model to Default
  const handleResetDefaultModel = async () => {
    const res = await modelEngine.loadDefaultModel();
    if (res.success) {
      setConfig(DEFAULT_CONFIG);
      setModelInfo({
        source: modelEngine.modelSource,
        inputType: DEFAULT_CONFIG.inputType,
        labelsCount: modelEngine.labels.length
      });
      setIsModelModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        modelInfo={modelInfo}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        isCameraActive={isCameraActive}
        fps={fps}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Camera Feed with Glowing Skeleton (7 Columns on large screens) */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          <CameraFeed
            onFrameResults={handleFrameResults}
            onFpsUpdate={setFps}
            isTracking={isCameraActive}
            setIsTracking={setIsCameraActive}
            inputType={config.inputType}
          />

          {/* Quick Hotkey & Instructions Bar */}
          <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>ISL Gestures: <strong className="text-slate-200">A-Z</strong> + <strong className="text-slate-200">Namaste, Hello, Thank You, Yes, No</strong></span>
            </div>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] underline"
            >
              View gesture cheat sheet &rarr;
            </button>
          </div>
        </section>

        {/* Right Column: Prediction, Sentence, and Speech Controls (5 Columns on large screens) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          {/* Feature 2: Pretrained Model Live Recognition Card */}
          <PredictionCard
            predictions={predictions}
            holdProgress={holdProgress}
            isHolding={isHolding}
            holdLabel={holdLabel}
            confidenceThreshold={config.confidenceThreshold}
            inputType={config.inputType}
            modelName={modelInfo.source}
          />

          {/* Sentence Builder Box (Space, Backspace, Clear) */}
          <SentenceBox
            sentence={sentence}
            onAddSpace={handleAddSpace}
            onBackspace={handleBackspace}
            onClear={handleClear}
            lastAddedSign={lastAddedSign}
          />

          {/* Feature 3: Text To Speech Controls */}
          <TTSControls
            sentence={sentence}
            selectedLang={selectedLang}
            onSelectLang={setSelectedLang}
            autoSpeak={autoSpeak}
            onToggleAutoSpeak={setAutoSpeak}
            isSpeaking={isSpeaking}
            onSpeak={handleSpeakSentence}
            onStopSpeaking={handleStopSpeaking}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        Gesture to Text (ISL) · React + Vite + Tailwind CSS + TensorFlow.js · Real-Time Indian Sign Language
      </footer>

      {/* Model Manager Upload Modal */}
      <ModelManagerModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        modelInfo={modelInfo}
        onLoadCustomModel={handleLoadCustomModel}
        onResetDefaultModel={handleResetDefaultModel}
        config={config}
        onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
      />

      {/* ISL Signs Guide Modal */}
      <ISLGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
