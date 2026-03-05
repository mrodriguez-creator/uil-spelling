// UIL Spelling & Vocabulary Practice - Configuration
// All tunable settings in one place for easy changes
'use strict';

var CONFIG = {
  // ==================== WORD EXPLORER ====================
  EXPLORER_MAX_VISIBLE: 200,       // Max words shown in grid before "use filters" message

  // ==================== QUIZ MODE ====================
  QUIZ_TIME_SECONDS: 900,          // 15 minutes
  QUIZ_QUESTION_COUNT: 15,         // Questions per quiz
  QUIZ_POOL_SIZE: 75,              // Word pool for proofreading quiz
  QUIZ_WORDS_PER_GROUP: 5,         // Words shown per proofreading question

  // ==================== FULL PRACTICE TEST ====================
  FULL_TEST_PROOFREAD_COUNT: 15,   // Part I questions
  FULL_TEST_VOCAB_COUNT: 15,       // Part II questions
  FULL_TEST_TIME_SECONDS: 900,     // 15 minutes

  // ==================== AUDIO TEST ====================
  AUDIO_DELAY_AFTER_FIRST: 600,    // ms pause after first pronunciation
  AUDIO_DELAY_AFTER_SECOND: 800,   // ms pause after second pronunciation
  AUDIO_DELAY_AFTER_DEF: 800,      // ms pause after definition is read
  AUDIO_TTS_TIMEOUT: 15000,        // ms safety timeout for TTS
  AUDIO_TTS_RATE: 0.85,            // Speech rate for TTS async (audio test)
  AUDIO_TTS_RATE_NORMAL: 0.8,      // Speech rate for normal TTS (speak button)

  // ==================== WORD COUNTS ====================
  AUDIO_TEST_COUNTS: [15, 35, 70], // Available word count options
  AUDIO_TEST_DEFAULT: 35,          // Default word count

  // ==================== DEFINITIONS ====================
  DEF_CACHE_SAVE_INTERVAL: 10,     // Save localStorage every N new definitions
  DEF_API_URL: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
  DEF_FALLBACK_TEXT: 'Definition not available. Check a dictionary for this word.',
  DEF_NOT_AVAILABLE_TEXT: 'Definition not available for this term.',
  DEF_SPELL_ONLY_TEXT: 'Spell the word as pronounced.',

  // ==================== STUDY CARDS ====================
  STUDY_MIN_DIFFICULT_LENGTH: 6,   // Min word length for "difficult" filter

  // ==================== LOCAL STORAGE KEYS ====================
  STORAGE_STUDIED: 'uil-studied',
  STORAGE_DEFS: 'uil-defs',
  STORAGE_MISSED: 'uil-missed',
  STORAGE_ACCURACY: 'uil-accuracy',

  // ==================== SPEED ROUNDS ====================
  SPEED_ROUND_SECONDS: 60,           // Duration of speed round

  // ==================== PATTERN DRILL ====================
  PATTERN_DEFAULT_COUNT: 20,         // Default words per pattern drill

  // ==================== LOCAL STORAGE KEYS (continued) ====================
  STORAGE_SPEED_BEST: 'uil-speed-best',

  // ==================== ID OFFSET RANGES ====================
  // Used when creating word objects from practice test data
  PRACTICE_ID_OFFSET: 1000,
  AUDIO_TEST_ID_OFFSET: 2000
};
