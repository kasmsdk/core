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
const BLACK_KEYS = [1, 3, 6, 8, 10];
const BLACK_KEY_NAMES = ['C#', 'Eb', 'F#', 'G#', 'Bb'];
const BASE_NOTE = 60; // C4

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
        setVelocity((prev) => Math.max(prev - 10, 1));
        return;
      }
      if (key === 'x') {
        setVelocity((prev) => Math.min(prev + 10, 127));
        return;
      }
      // Note keys
      if (Object.prototype.hasOwnProperty.call(KEYBOARD_MAPPING, key)) {
        const note = BASE_NOTE + KEYBOARD_MAPPING[key];
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
        const note = BASE_NOTE + KEYBOARD_MAPPING[key];
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
  }, [velocity, activeNotes, onNoteOn, onNoteOff]);

  // Helper: is white key
  const isWhite = (midi: number) => {
    const scale = midi % 12;
    return WHITE_KEYS.includes(scale);
  };
  // Helper: key name
  const getKeyName = (midi: number) => {
    const scale = midi % 12;
    if (WHITE_KEYS.includes(scale)) {
      return KEY_NAMES[WHITE_KEYS.indexOf(scale)];
    } else {
      return BLACK_KEY_NAMES[BLACK_KEYS.indexOf(scale)];
    }
  };

  // Mouse/touch handlers with velocity calculation
  const handleKeyDown = (note: number, e?: React.MouseEvent | React.TouchEvent) => {
    let v = velocity;
    if (e) {
      // Get bounding rect and vertical offset
      const target = e.target as SVGRectElement;
      const rect = target.getBoundingClientRect();
      let y: number;
      if ('touches' in e && e.touches.length > 0) {
        y = e.touches[0].clientY - rect.top;
      } else if ('clientY' in e) {
        y = e.clientY - rect.top;
      } else {
        y = rect.height / 2;
      }
      // Map y to velocity (top=10, bottom=127)
      v = Math.round(10 + (y / rect.height) * (127 - 10));
      v = Math.max(10, Math.min(127, v));
    }
    if (!activeNotes.includes(note)) {
      setActiveNotes((prev) => [...prev, note]);
      onNoteOn(note, v);
      if (window.kasm_rust && typeof window.kasm_rust.update_canvas_data === 'function') {
        window.kasm_rust.update_canvas_data(note, v, false);
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

  // Render all MIDI keys
  const keys = [];
  const whiteKeyWidth = 40;
  const blackKeyWidth = 24;
  const blackKeyHeight = 100;
  const whiteKeyHeight = 160;
  let whiteIndex = 0;
  for (let midi = 0; midi <= 127; midi++) {
    const isW = isWhite(midi);
    const x = isW ? whiteIndex * whiteKeyWidth : (whiteIndex - 1) * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2;
    if (isW) {
      keys.push(
        <g key={`w${midi}`}>
          <rect
            x={x}
            y={0}
            width={whiteKeyWidth}
            height={whiteKeyHeight}
            fill={activeNotes.includes(midi) || highlightedNotes.includes(midi) ? 'lime' : 'white'}
            stroke="#333"
            strokeWidth={1}
            onMouseDown={e => handleKeyDown(midi, e)}
            onMouseUp={() => handleKeyUp(midi)}
            onMouseLeave={() => handleKeyUp(midi)}
            onTouchStart={e => handleKeyDown(midi, e)}
            onTouchEnd={() => handleKeyUp(midi)}
            style={{ cursor: 'pointer' }}
          />
          <text x={x + whiteKeyWidth / 2} y={150} textAnchor="middle" fontSize={10} fill="#666">{getKeyName(midi)}</text>
        </g>
      );
      whiteIndex++;
    } else {
      keys.push(
        <g key={`b${midi}`}>
          <rect
            x={x}
            y={0}
            width={blackKeyWidth}
            height={blackKeyHeight}
            fill={activeNotes.includes(midi) || highlightedNotes.includes(midi) ? '#fbc02d' : '#333'}
            stroke="#000"
            strokeWidth={1}
            onMouseDown={e => handleKeyDown(midi, e)}
            onMouseUp={() => handleKeyUp(midi)}
            onMouseLeave={() => handleKeyUp(midi)}
            onTouchStart={e => handleKeyDown(midi, e)}
            onTouchEnd={() => handleKeyUp(midi)}
            style={{ cursor: 'pointer' }}
          />
          <text x={x + blackKeyWidth / 2} y={90} textAnchor="middle" fontSize={8} fill="#fff">{getKeyName(midi)}</text>
        </g>
      );
    }
  }
  const totalWhiteKeys = whiteIndex;
  return (
    <div style={{ overflowX: 'auto', width: '100%', borderRadius: 8, border: '2px solid #333', background: '#f0f0f0' }}>
      <svg
        width={totalWhiteKeys * whiteKeyWidth}
        height={whiteKeyHeight}
        style={{ userSelect: 'none', display: 'block' }}
      >
        {keys}
      </svg>
    </div>
  );
};

export default MidiKeyboard;
