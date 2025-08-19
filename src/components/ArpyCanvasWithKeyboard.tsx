op import React from 'react';
import ArpyCanvas from '../../latest/ArpyCanvas';
import MidiKeyboard from './MidiKeyboard';

const ArpyCanvasWithKeyboard: React.FC = () => {
  // Handler for note on
  const handleNoteOn = (note: number, velocity: number) => {
    window.inlet_5_emanator = 'Arpy';
    if (typeof window.update_canvas_data === 'function') {
      window.update_canvas_data({ note, velocity });
    }
  };
  // Handler for note off
  const handleNoteOff = (note: number) => {
    if (typeof window.update_canvas_data === 'function') {
      window.update_canvas_data({ note, velocity: 0 });
    }
  };

  return (
    <div>
      <ArpyCanvas />
      <div style={{ margin: '1rem 0' }}>
        <MidiKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
      </div>
    </div>
  );
};

export default ArpyCanvasWithKeyboard;

