import React, { useState } from 'react';
import { Volume2, VolumeX, Globe, Sliders, Play, Square, Mic, Sparkles } from 'lucide-react';
import { SUPPORTED_LANGUAGES, ttsService } from '../services/ttsService';

export default function TTSControls({
  sentence = '',
  selectedLang = 'en-US',
  onSelectLang,
  autoSpeak = false,
  onToggleAutoSpeak,
  isSpeaking = false,
  onSpeak,
  onStopSpeaking
}) {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const handleTestVoice = () => {
    const samplePhrases = {
      'en-US': 'Hello! Indian Sign Language translator is ready.',
      'hi-IN': 'नमस्ते! भारतीय सांकेतिक भाषा अनुवादक तैयार है।',
      'kn-IN': 'ನಮಸ್ಕಾರ! ಭಾರತೀಯ ಸಂಕೇತ ಭಾಷೆ ಅನುವಾದಕ ಸಿದ್ಧವಾಗಿದೆ.'
    };
    ttsService.speak(samplePhrases[selectedLang] || 'Hello', {
      lang: selectedLang,
      rate,
      pitch
    });
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-glass flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Text to Speech (TTS)
            </h2>
            <p className="text-[11px] text-slate-400">
              Web Speech API with native Indian language voice synthesis
            </p>
          </div>
        </div>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-lg border text-xs transition-colors ${
            showSettings ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
          }`}
          title="Adjust speech rate and pitch"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Controls Row */}
      <div className="space-y-4">
        {/* Language Selection Dropdown + Auto-Speak Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Language Dropdown */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speech Language</span>
            </label>
            <div className="relative">
              <select
                value={selectedLang}
                onChange={(e) => onSelectLang(e.target.value)}
                className="w-full bg-dark-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-400 transition-colors appearance-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-dark-800 text-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Auto-Speak Switch Card */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Auto-Speak Toggle</span>
            </label>
            <button
              onClick={() => onToggleAutoSpeak(!autoSpeak)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border transition-all text-xs font-medium ${
                autoSpeak
                  ? 'bg-violet-950/40 border-violet-500/40 text-violet-200 shadow-glow-violet/30'
                  : 'bg-dark-900/80 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${autoSpeak ? 'bg-violet-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{autoSpeak ? 'Auto-Speak Active' : 'Auto-Speak Off'}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                autoSpeak ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-slate-500'
              }`}>
                {autoSpeak ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Rate and Pitch Sliders */}
        {showSettings && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-mono text-slate-300">
                <span>Speed / Rate</span>
                <span className="text-cyan-300">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1 font-mono text-slate-300">
                <span>Pitch</span>
                <span className="text-cyan-300">{pitch}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
            <div className="col-span-full pt-1">
              <button
                onClick={handleTestVoice}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 underline font-mono flex items-center space-x-1"
              >
                <span>&bull; Test voice in {currentLang.name}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Action Speak Button */}
        <div className="pt-2">
          {isSpeaking ? (
            <button
              onClick={onStopSpeaking}
              className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold border border-red-500/40 shadow-lg transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-current animate-pulse" />
              <span>Stop Speaking</span>
            </button>
          ) : (
            <button
              onClick={() => onSpeak(sentence, { lang: selectedLang, rate, pitch })}
              disabled={!sentence || sentence.trim().length === 0}
              className="w-full flex items-center justify-center space-x-2.5 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold shadow-glow-cyan transition-all active:scale-95 text-sm uppercase tracking-wider"
            >
              <Volume2 className="w-4 h-4" />
              <span>Speak Sentence ({currentLang.flag} {currentLang.name.split(' ')[0]})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
