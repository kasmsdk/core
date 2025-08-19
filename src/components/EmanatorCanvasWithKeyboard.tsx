import React from 'react';
import EmanatorCanvas from '../../latest/EmanatorCanvas';
import MidiKeyboard from './MidiKeyboard';

const EmanatorCanvasWithKeyboard: React.FC = () => {
  // Handler for note on
  const handleNoteOn = (note: number, velocity: number) => {
    // Set inlet_5_emanator and send note/velocity
    window.inlet_5_emanator = 'Emanator';
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
      <EmanatorCanvas />
      <div style={{ margin: '1rem 0' }}>
        <MidiKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
      </div>
    </div>
  );
};

export default EmanatorCanvasWithKeyboard;

