/**
 * Text-to-Speech (TTS) Service using Web Speech API
 * 
 * Supports:
 * - English (en-US / en-IN)
 * - Hindi (hi-IN)
 * - Kannada (kn-IN)
 * With intelligent localization for common Indian Sign Language (ISL) vocabulary.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US/India)', flag: '🇺🇸', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', nativeName: 'ಕನ್ನಡ' }
];

// Vocabulary dictionary mapping common ISL words to Hindi & Kannada
const VOCABULARY_TRANSLATIONS = {
  'HELLO': {
    'hi-IN': 'नमस्ते',
    'kn-IN': 'ನಮಸ್ಕಾರ',
    'en-US': 'Hello'
  },
  'NAMASTE': {
    'hi-IN': 'नमस्ते',
    'kn-IN': 'ನಮಸ್ಕಾರ',
    'en-US': 'Namaste'
  },
  'THANK YOU': {
    'hi-IN': 'धन्यवाद',
    'kn-IN': 'ಧನ್ಯವಾದಗಳು',
    'en-US': 'Thank you'
  },
  'PLEASE': {
    'hi-IN': 'कृपया',
    'kn-IN': 'ದಯವಿಟ್ಟು',
    'en-US': 'Please'
  },
  'YES': {
    'hi-IN': 'हाँ',
    'kn-IN': 'ಹೌದು',
    'en-US': 'Yes'
  },
  'NO': {
    'hi-IN': 'नहीं',
    'kn-IN': 'ಇಲ್ಲ',
    'en-US': 'No'
  },
  'HELP': {
    'hi-IN': 'मदद',
    'kn-IN': 'ಸಹಾಯ',
    'en-US': 'Help'
  },
  'GOODBYE': {
    'hi-IN': 'अलविदा',
    'kn-IN': 'ವಿದಾಯ',
    'en-US': 'Goodbye'
  }
};

class TTSService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.initVoices();
  }

  initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth.getVoices();
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  getVoicesForLanguage(langCode) {
    if (!this.voices || this.voices.length === 0) {
      if (this.synth) this.voices = this.synth.getVoices();
    }

    const primaryLang = langCode.split('-')[0].toLowerCase();
    return this.voices.filter(v => 
      v.lang.toLowerCase().startsWith(primaryLang) || 
      v.lang.toLowerCase() === langCode.toLowerCase()
    );
  }

  /**
   * Translate ISL word or sentence to target language script if available
   */
  localizeText(text, langCode) {
    if (!text) return '';
    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();

    // Check single word exact match
    if (VOCABULARY_TRANSLATIONS[upper] && VOCABULARY_TRANSLATIONS[upper][langCode]) {
      return VOCABULARY_TRANSLATIONS[upper][langCode];
    }

    // Check words inside sentence
    if (langCode !== 'en-US') {
      let localized = trimmed;
      for (const [key, trans] of Object.entries(VOCABULARY_TRANSLATIONS)) {
        if (trans[langCode]) {
          const regex = new RegExp(`\\b${key}\\b`, 'gi');
          localized = localized.replace(regex, trans[langCode]);
        }
      }
      return localized;
    }

    return trimmed;
  }

  speak(text, {
    lang = 'en-US',
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    onStart = () => {},
    onEnd = () => {},
    onError = () => {}
  } = {}) {
    if (!this.synth) {
      onError(new Error('Speech Synthesis not supported in this browser'));
      return;
    }

    // Cancel any active speech
    this.cancel();

    const spokenText = this.localizeText(text, lang);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Pick best matching voice
    const matchedVoices = this.getVoicesForLanguage(lang);
    if (matchedVoices.length > 0) {
      utterance.voice = matchedVoices[0];
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  isAvailable() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

export const ttsService = new TTSService();
