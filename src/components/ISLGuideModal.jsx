import React, { useState } from 'react';
import { X, BookOpen, Hand, Sparkles, CheckCircle } from 'lucide-react';

const COMMON_SIGNS = [
  { sign: 'NAMASTE', hands: '2 Hands', desc: 'Join both palms together flat in front of the chest pointing upwards.' },
  { sign: 'HELLO', hands: '1 Hand', desc: 'Open flat hand with all 5 fingers spread out, facing camera.' },
  { sign: 'THANK YOU', hands: '1 or 2 Hands', desc: 'Hand near chin or touch fingertips and move outward.' },
  { sign: 'YES', hands: '1 Hand', desc: 'Make a closed fist and tilt wrist slightly.' },
  { sign: 'NO', hands: '1 Hand', desc: 'Snap index and middle fingertips repeatedly against thumb tip.' },
  { sign: 'HELP', hands: '2 Hands', desc: 'Place closed fist upright on top of flat horizontal palm.' },
  { sign: 'GOODBYE', hands: '1 Hand', desc: 'Open hand waving gently side to side.' }
];

const ALPHABET_GUIDE = [
  { letter: 'A', pose: 'Closed fist with thumb upright along index finger side' },
  { letter: 'B', pose: 'Four fingers upright straight together, thumb folded across palm' },
  { letter: 'C', pose: 'Curved fingers and thumb forming the letter C' },
  { letter: 'D', pose: 'Index finger straight up, thumb touching middle, ring & pinky tips' },
  { letter: 'E', pose: 'All fingertips curled down tightly, thumb tucked under' },
  { letter: 'F', pose: 'Thumb and index tips touching in a circle, other 3 fingers straight up' },
  { letter: 'I', pose: 'Pinky finger straight up, other three fingers and thumb closed' },
  { letter: 'L', pose: 'Thumb and index extended at right angle forming "L", other fingers closed' },
  { letter: 'O', pose: 'All fingertips meet thumb tip to form an "O" loop' },
  { letter: 'S', pose: 'Fist with thumb firmly wrapped across the front of fingers' },
  { letter: 'U', pose: 'Index and middle fingers straight up held tightly together' },
  { letter: 'V', pose: 'Peace sign: index and middle fingers straight up in a V' },
  { letter: 'W', pose: 'Three fingers (index, middle, ring) upright in "W" shape' },
  { letter: 'Y', pose: 'Thumb and pinky extended, middle three fingers curled' }
];

export default function ISLGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('words');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/15 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Indian Sign Language (ISL) Guide</h2>
            <p className="text-xs text-slate-400">
              Gesture cheat sheet for real-time camera recognition
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 border-b border-white/10 pb-3 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('words')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'words'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan/20'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            Common ISL Signs (Namaste, Hello, etc.)
          </button>
          <button
            onClick={() => setActiveTab('alphabet')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'alphabet'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan/20'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            Alphabet Finger Spelling (A-Z)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'words' ? (
          <div className="space-y-2.5">
            {COMMON_SIGNS.map((item) => (
              <div
                key={item.sign}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 font-bold font-mono text-xs border border-cyan-500/30">
                    {item.sign}
                  </span>
                  <span className="text-xs text-slate-300">{item.desc}</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0 self-start sm:self-auto">
                  {item.hands}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALPHABET_GUIDE.map((item) => (
              <div
                key={item.letter}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3 hover:border-cyan-500/30 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm">
                  {item.letter}
                </div>
                <div className="text-xs text-slate-300 leading-snug">
                  {item.pose}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tip Box */}
        <div className="mt-5 p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Pro-tip:</strong> Hold your hand steady in frame for 1 second at &gt;80% confidence to append the character to your sentence box!
          </span>
        </div>
      </div>
    </div>
  );
}
