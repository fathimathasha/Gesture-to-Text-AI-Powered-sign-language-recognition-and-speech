import React, { useState } from 'react';
import { X, Upload, FileCode, CheckCircle2, AlertCircle, RefreshCw, Cpu, Sliders, Layers } from 'lucide-react';

export default function ModelManagerModal({
  isOpen,
  onClose,
  modelInfo,
  onLoadCustomModel,
  onResetDefaultModel,
  config,
  onUpdateConfig
}) {
  const [modelFile, setModelFile] = useState(null);
  const [binFiles, setBinFiles] = useState([]);
  const [labelsFile, setLabelsFile] = useState(null);
  const [selectedInputType, setSelectedInputType] = useState(config.inputType || 'landmarks');
  const [selectedNorm, setSelectedNorm] = useState(config.normalization || 'wristRelative');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  if (!isOpen) return null;

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    let foundModel = null;
    const foundBins = [];
    let foundLabels = null;

    files.forEach(f => {
      const name = f.name.toLowerCase();
      if (name === 'model.json') {
        foundModel = f;
      } else if (name.endsWith('.bin')) {
        foundBins.push(f);
      } else if (name.includes('label') && name.endsWith('.json')) {
        foundLabels = f;
      }
    });

    if (foundModel) setModelFile(foundModel);
    if (foundBins.length > 0) setBinFiles(foundBins);
    if (foundLabels) setLabelsFile(foundLabels);
  };

  const handleApplyUpload = async () => {
    if (!modelFile) {
      setUploadStatus({ type: 'error', message: 'Please select a valid model.json file.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    const result = await onLoadCustomModel({
      modelFile,
      weightFiles: binFiles,
      labelsFile,
      inputType: selectedInputType,
      normalization: selectedNorm
    });

    setIsUploading(false);

    if (result.success) {
      setUploadStatus({
        type: 'success',
        message: `Successfully loaded model "${result.modelName}" with ${result.labelsCount || 0} labels!`
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setUploadStatus({
        type: 'error',
        message: result.error || 'Failed to load TensorFlow.js model files.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/15 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">TensorFlow.js Model Manager</h2>
            <p className="text-xs text-slate-400">
              Load custom pre-trained models or swap models at runtime via config
            </p>
          </div>
        </div>

        {/* Active Model Overview */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Currently Loaded Model
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
              ACTIVE
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <div className="text-slate-500 text-[10px]">SOURCE</div>
              <div className="text-cyan-300 truncate font-semibold" title={modelInfo.source}>
                {modelInfo.source}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">INPUT TYPE</div>
              <div className="text-slate-200 uppercase font-semibold">{config.inputType}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">SHAPE</div>
              <div className="text-slate-200">
                {config.inputType === 'image' ? '[1, 224, 224, 3]' : '[1, 63]'}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">CLASSES</div>
              <div className="text-slate-200">{modelInfo.labelsCount} Labels</div>
            </div>
          </div>
        </div>

        {/* Runtime Upload Model Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Upload Custom Model Files</span>
          </h3>

          {/* File Picker Dropzone */}
          <div className="border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-2xl p-5 text-center transition-all bg-dark-900/60">
            <input
              type="file"
              multiple
              accept=".json,.bin"
              onChange={handleFilesChange}
              id="model-files-input"
              className="hidden"
            />
            <label htmlFor="model-files-input" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <FileCode className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-200 mb-1">
                Click to browse files: <span className="text-cyan-300 font-mono">model.json</span>, <span className="text-cyan-300 font-mono">*.bin</span>, and <span className="text-cyan-300 font-mono">labels.json</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Select all model files together from your file picker
              </p>
            </label>
          </div>

          {/* Staged Files List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className={`p-2.5 rounded-xl border ${modelFile ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              <div className="text-[10px] text-slate-400">1. Topology</div>
              <div className="truncate font-semibold">{modelFile ? modelFile.name : 'Missing model.json'}</div>
            </div>
            <div className={`p-2.5 rounded-xl border ${binFiles.length > 0 ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              <div className="text-[10px] text-slate-400">2. Shards (.bin)</div>
              <div className="truncate font-semibold">
                {binFiles.length > 0 ? `${binFiles.length} file(s) ready` : 'Missing .bin shard'}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${labelsFile ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
              <div className="text-[10px] text-slate-400">3. Labels (Optional)</div>
              <div className="truncate font-semibold">{labelsFile ? labelsFile.name : 'Default ISL A-Z'}</div>
            </div>
          </div>

          {/* Model Config Adapter: Input Type & Normalization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Model Input Type
              </label>
              <select
                value={selectedInputType}
                onChange={(e) => setSelectedInputType(e.target.value)}
                className="w-full bg-dark-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="landmarks">Landmarks Vector ([1, 63] / 21 joints × 3D)</option>
                <option value="image">Image Tensor ([1, 224, 224, 3] RGB crop)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Normalization Mode
              </label>
              <select
                value={selectedNorm}
                onChange={(e) => setSelectedNorm(e.target.value)}
                className="w-full bg-dark-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="wristRelative">Wrist-Relative (Translation & scale invariant)</option>
                <option value="zeroToOne">0.0 to 1.0 (Pixel values / 255.0)</option>
                <option value="minusOneToOne">-1.0 to 1.0 (Centered normalized)</option>
              </select>
            </div>
          </div>

          {/* Status Message */}
          {uploadStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
              uploadStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}>
              {uploadStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          {/* Load Model Action Button */}
          <button
            onClick={handleApplyUpload}
            disabled={!modelFile || isUploading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-glow-cyan transition-all flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading Model Weights into WebGL...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Swap to Uploaded Model</span>
              </>
            )}
          </button>
        </div>

        {/* Global Trigger Parameters */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Detection & Hold Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1 text-slate-300 font-mono">
                <span>Hold Confidence Threshold</span>
                <span className="text-cyan-300 font-bold">{(config.confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={config.confidenceThreshold}
                onChange={(e) => onUpdateConfig({ confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Sign must exceed this confidence (default 80%)</span>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-slate-300 font-mono">
                <span>Hold Duration (sec)</span>
                <span className="text-cyan-300 font-bold">{(config.holdDurationMs / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="500"
                max="2500"
                step="100"
                value={config.holdDurationMs}
                onChange={(e) => onUpdateConfig({ holdDurationMs: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Duration sign must be held continuously to append</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onResetDefaultModel}
              className="text-xs text-slate-400 hover:text-white underline font-mono flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to Default Model (/public/model/model.json)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
