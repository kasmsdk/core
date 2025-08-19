import React, { useState, useEffect, useRef } from 'react';

interface MidiKeyboardProps {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
  highlightedNotes?: number[];
  velocity?: number;
}

// MIDI note numbers for one octave starting at C4 (60)
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const KEY_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
// Black key positions relative to white keys (piano pattern)
const BLACK_KEY_POSITIONS = [0, 1, 3, 4, 5]; // C#, D#, F#, G#, A#
const BLACK_KEYS = [1, 3, 6, 8, 10];
const BLACK_KEY_NAMES = ['C#', 'Eb', 'F#', 'G#', 'Bb'];

const BASE_NOTE = 60; // C4
const OCTAVES = 2;

const KEYBOARD_MAPPING: Record<string, number> = {
  'a': 0,   // C
  'w': 1,   // C#
  's': 2,   // D
  'e': 3,   // Eb
  'd': 4,   // E
  'f': 5,   // F
  't': 6,   // F#
  'g': 7,   // G
  'y': 8,   // G#
  'h': 9,   // A
  'u': 10,  // Bb
  'j': 11,  // B
  'k': 12,  // C (next octave)
  'o': 13,  // C# (next octave)
  'l': 14,  // D (next octave)
  'p': 15,  // Eb (next octave)
  ';': 16,  // E (next octave)
  "'": 17, // F (next octave)
  ']': 18,  // F# (next octave)
  '\\': 20 // G# (next octave)
};

// Add global declaration for kasm_rust
declare global {
  interface Window {
    kasm_rust?: {
      update_canvas_data?: (pitch: number, velocity: number, isCC: boolean) => void;
    };
  }
}

const MidiKeyboard: React.FC<MidiKeyboardProps> = ({
  onNoteOn,
  onNoteOff,
  highlightedNotes = [],
  velocity: propVelocity = 100,
}) => {
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [octaveOffset, setOctaveOffset] = useState(0); // in semitones
  const [velocity, setVelocity] = useState(propVelocity);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setVelocity(propVelocity);
  }, [propVelocity]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.repeat) return;
      if (pressedKeysRef.current.has(key)) return;
      pressedKeysRef.current.add(key);
      // Octave control
      if (key === 'z') {
        setOctaveOffset((prev) => Math.max(prev - 12, -48));
        return;
      }
      if (key === 'x') {
        setOctaveOffset((prev) => Math.min(prev + 12, 48));
        return;
      }
      // Velocity control
      if (key === 'c') {
        setVelocity((prev) => Math.max(prev - 10, 1));
        return;
      }
      if (key === 'v') {
        setVelocity((prev) => Math.min(prev + 10, 127));
        return;
      }
      // Note keys
      if (Object.prototype.hasOwnProperty.call(KEYBOARD_MAPPING, key)) {
        const note = BASE_NOTE + KEYBOARD_MAPPING[key] + octaveOffset;
        if (!activeNotes.includes(note)) {
          setActiveNotes((prev) => [...prev, note]);
          onNoteOn(note, velocity);
          if (window.kasm_rust && typeof window.kasm_rust.update_canvas_data === 'function') {
            window.kasm_rust.update_canvas_data(note, velocity, false);
          }
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      pressedKeysRef.current.delete(key);
      if (Object.prototype.hasOwnProperty.call(KEYBOARD_MAPPING, key)) {
        const note = BASE_NOTE + KEYBOARD_MAPPING[key] + octaveOffset;
        setActiveNotes((prev) => prev.filter((n) => n !== note));
        onNoteOff(note);
        if (window.kasm_rust && typeof window.kasm_rust.update_canvas_data === 'function') {
          window.kasm_rust.update_canvas_data(note, 0, false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveOffset, velocity, activeNotes, onNoteOn, onNoteOff]);

  // Mouse/touch handlers
  const handleKeyDown = (note: number) => {
    if (!activeNotes.includes(note)) {
      setActiveNotes((prev) => [...prev, note]);
      onNoteOn(note, velocity);
      if (window.kasm_rust && typeof window.kasm_rust.update_canvas_data === 'function') {
        window.kasm_rust.update_canvas_data(note, velocity, false);
      }
    }
  };
  const handleKeyUp = (note: number) => {
    setActiveNotes((prev) => prev.filter((n) => n !== note));
    onNoteOff(note);
    if (window.kasm_rust && typeof window.kasm_rust.update_canvas_data === 'function') {
      window.kasm_rust.update_canvas_data(note, 0, false);
    }
  };

  // Render SVG keys
  const keys = [];
  const whiteKeyWidth = 40;
  const blackKeyWidth = 24;
  const blackKeyHeight = 100;
  const whiteKeyHeight = 160;
  for (let octave = 0; octave < OCTAVES; octave++) {
    // White keys
    for (let i = 0; i < WHITE_KEYS.length; i++) {
      const note = BASE_NOTE + octave * 12 + WHITE_KEYS[i];
      const x = (octave * 7 + i) * whiteKeyWidth;
      keys.push(
        <g key={`w${octave}-${i}`}>
          <rect
            x={x}
            y={0}
            width={whiteKeyWidth}
            height={whiteKeyHeight}
            fill={activeNotes.includes(note) || highlightedNotes.includes(note) ? 'lime' : 'white'}
            stroke="#333"
            strokeWidth={1}
            onMouseDown={() => handleKeyDown(note)}
            onMouseUp={() => handleKeyUp(note)}
            onMouseLeave={() => handleKeyUp(note)}
            onTouchStart={() => handleKeyDown(note)}
            onTouchEnd={() => handleKeyUp(note)}
            style={{ cursor: 'pointer' }}
          />
          <text x={x + whiteKeyWidth / 2} y={150} textAnchor="middle" fontSize={14} fill="#666">{KEY_NAMES[i]}</text>
        </g>
      );
    }
    // Black keys (grouped 2-3)
    for (let i = 0; i < BLACK_KEY_POSITIONS.length; i++) {
      // Position black keys between white keys
      // C# between C and D, D# between D and E, F# between F and G, G# between G and A, A# between A and B
      const pos = BLACK_KEY_POSITIONS[i];
      // Skip E-F and B-C (no black key)
      const x = (octave * 7 + pos) * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
      const note = BASE_NOTE + octave * 12 + BLACK_KEYS[i];
      keys.push(
        <g key={`b${octave}-${i}`}>
          <rect
            x={x}
            y={0}
            width={blackKeyWidth}
            height={blackKeyHeight}
            fill={activeNotes.includes(note) || highlightedNotes.includes(note) ? '#fbc02d' : '#333'}
            stroke="#000"
            strokeWidth={1}
            onMouseDown={() => handleKeyDown(note)}
            onMouseUp={() => handleKeyUp(note)}
            onMouseLeave={() => handleKeyUp(note)}
            onTouchStart={() => handleKeyDown(note)}
            onTouchEnd={() => handleKeyUp(note)}
            style={{ cursor: 'pointer' }}
          />
          <text x={x + blackKeyWidth / 2} y={90} textAnchor="middle" fontSize={10} fill="#fff">{BLACK_KEY_NAMES[i]}</text>
        </g>
      );
    }
  }
  return (
    <svg width={OCTAVES * 7 * whiteKeyWidth} height={whiteKeyHeight} style={{ userSelect: 'none', display: 'block', background: '#f0f0f0', borderRadius: 8, border: '2px solid #333' }}>
      {keys}
    </svg>
  );
};

export default MidiKeyboard;
