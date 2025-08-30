import React from "react";

const ArpyDocs: React.FC = () => {
  return (
    <div>
      <h2>Arpy</h2>
      <p>
        Arpy is the arpeggiator engine in the Kasm SDK. It provides a powerful
        and flexible way to create complex arpeggios and sequences.
      </p>

      <h2>How to Use Arpy</h2>
      <p>
        The Arpy engine is controlled through MIDI note messages. When Arpy is
        active, incoming MIDI note-on messages add notes to the arpeggiator's
        chord, and note-off messages remove them. The arpeggiator then generates
        a sequence based on the currently held notes and the selected mode.
      <pre>
        <code>
          {`
// Rust example of using the arpeggiator
use kasm_sdk::arpeggiator::{kasm_arpeggiator_note_on, kasm_arpeggiator_note_off, kasm_arpeggiator_set_mode};

fn play_arpeggio() {
    // Set the arpeggiator mode (e.g., UpDown)
    kasm_arpeggiator_set_mode(2);

    // Add notes to the arpeggiator
    kasm_arpeggiator_note_on(60, 100); // C4
    kasm_arpeggiator_note_on(64, 100); // E4
    kasm_arpeggiator_note_on(67, 100); // G4

    // The arpeggiator will now play a C major arpeggio.
    // The kasm_arpeggiator_update() function, called by the main metronome,
    // drives the arpeggio playback.

    // To stop the arpeggio, send note-off messages
    kasm_arpeggiator_note_off(60);
    kasm_arpeggiator_note_off(64);
    kasm_arpeggiator_note_off(67);
}
`}
        </code>
      </pre>
      </p>

      <h2>Arpeggiator Modes</h2>
      <p>Arpy includes a wide variety of arpeggiator modes:<br/>
      <ul>
        <li>Up</li>
        <li>Down</li>
        <li>UpDown</li>
        <li>DownUp</li>
        <li>Random</li>
        <li>Flow</li>
        <li>UpIn</li>
        <li>DownIn</li>
        <li>ExpandingUp</li>
        <li>ExpandingDown</li>
        <li>LowAndUp</li>
        <li>LowAndDown</li>
        <li>HiAndUp</li>
        <li>HiAndDown</li>
        <li>Chord</li>
        <li>Octaves</li>
        <li>UpDownRepeat</li>
        <li>DownUpRepeat</li>
        <li>DoubledUp</li>
        <li>DoubledDown</li>
        <li>Converge</li>
        <li>Diverge</li>
        <li>ConvergeDiverge</li>
        <li>ThumbUp</li>
        <li>ThumbUpDown</li>
        <li>PinkyUp</li>
        <li>PinkyUpDown</li>
        ...
      </ul>
      </p>
    </div>
  );
};

export default ArpyDocs;
