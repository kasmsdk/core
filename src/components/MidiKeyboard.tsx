import React, { useState, useEffect, useRef } from 'react';

interface MidiKeyboardProps {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
  highlightedNotes?: number[];
  velocity?: number;
}

// MIDI note numbers for one octave starting at C4 (60)
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // After rendering keys, center on middle C (C4, MIDI 60)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    // Find white key index for MIDI 60 (C4)
    let c4WhiteIndex = 0;
    let idx = 0;
    for (let midi = 0; midi <= 127; midi++) {
      if (WHITE_KEYS.includes(midi % 12)) {
        if (midi === 60) {
          c4WhiteIndex = idx;
          break;
        }
        idx++;
      }
    }
    const c4X = c4WhiteIndex * whiteKeyWidth + whiteKeyWidth / 2;
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    // Center C4
    container.scrollLeft = Math.max(0, c4X - containerWidth / 2);
  }, []);

  const CHROMATIC_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Helper: get note name with octave
  const getNoteNameWithOctave = (midi: number) => {
    const name = CHROMATIC_NAMES[midi % 12];
    const octave = Math.floor(midi / 12) - 2;
    return `${name}${octave}`;
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
  const blackKeyWidth = 28;
  const blackKeyHeight = 100;
  const whiteKeyHeight = 160;
  let whiteIndex = 0;
  const whiteKeyPositions: number[] = [];
  for (let midi = 0; midi <= 127; midi++) {
    const scale = midi % 12;
    const isW = WHITE_KEYS.includes(scale);
    if (isW) {
      const x = whiteIndex * whiteKeyWidth;
      whiteKeyPositions.push(x);
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
          <text x={x + whiteKeyWidth / 2} y={150} textAnchor="middle" fontSize={10} fill="#666"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', pointerEvents: 'none' }}>
            {getNoteNameWithOctave(midi)}
          </text>
        </g>
      );
      whiteIndex++;
    }
  }
  // Now render black keys with correct offsets
  whiteIndex = 0;
  for (let midi = 0; midi <= 127; midi++) {
    const scale = midi % 12;
    if (WHITE_KEYS.includes(scale)) {
      whiteIndex++;
      continue;
    }
    // Find which black key it is
    let offset = 0;
    let x = 0;
    switch (scale) {
      case 1: // C#
        // Between C (whiteIndex-1) and D (whiteIndex), closer to D
        offset = 0.9;
        x = whiteKeyPositions[whiteIndex - 1] + whiteKeyWidth * offset - blackKeyWidth / 2;
        break;
      case 3: // D#
        // Between D and E, closer to E
        offset = 1.1;
        x = whiteKeyPositions[whiteIndex - 1] + whiteKeyWidth * offset - blackKeyWidth / 2;
        break;
      case 6: // F#
        // Between F and G, closer to G
        offset = 0.9;
        x = whiteKeyPositions[whiteIndex - 1] + whiteKeyWidth * offset - blackKeyWidth / 2;
        break;
      case 8: // G#
        // Between G and A, closer to A
        offset = 1.0;
        x = whiteKeyPositions[whiteIndex - 1] + whiteKeyWidth * offset - blackKeyWidth / 2;
        break;
      case 10: // A#
        // Between A and B, centered
        offset = 1.1;
        x = whiteKeyPositions[whiteIndex - 1] + whiteKeyWidth * offset - blackKeyWidth / 2;
        break;
      default:
        x = whiteKeyPositions[whiteIndex - 1] + whiteKeyWidth - blackKeyWidth / 2;
    }
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
        <text x={x + blackKeyWidth / 2} y={90} textAnchor="middle" fontSize={8} fill="#fff"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', pointerEvents: 'none' }}>
          {getNoteNameWithOctave(midi)}
        </text>
      </g>
    );
  }
  const totalWhiteKeys = whiteKeyPositions.length;
  return (
    <div ref={scrollContainerRef} style={{ overflowX: 'auto', width: '100%', borderRadius: 8, border: '2px solid #333', background: '#f0f0f0' }}>
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
