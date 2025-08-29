import React from "react";

const ArpyDocs: React.FC = () => {
  return (
    <div>
      <h2>Arpy</h2>
      <p>
        Arpy is the arpeggiator engine in the Kasm SDK. It provides a powerful
        and flexible way to create complex arpeggios and sequences.
      </p>
      <p>
        This documentation will cover the different arpeggiator modes, how to
        use them, and how to create custom arpeggios.
      </p>

      <h2>How to Use Arpy</h2>
      <p>
        The Arpy engine is controlled through MIDI note messages. When Arpy is
        active, incoming MIDI note-on messages add notes to the arpeggiator's
        chord, and note-off messages remove them. The arpeggiator then generates
        a sequence based on the currently held notes and the selected mode.
      </p>
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

      <h2>Arpeggiator Modes</h2>
      <p>Arpy includes a wide variety of arpeggiator modes:</p>
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
        <li>CycleThirds</li>
        <li>SkipOneUp</li>
        <li>SkipOneDown</li>
        <li>OuterToInner</li>
        <li>InnerToOuter</li>
        <li>ReverseFlow</li>
        <li>StaggeredUp</li>
        <li>StaggeredDown</li>
        <li>Bounce</li>
        <li>RandomSkip</li>
        <li>ChordPulse</li>
        <li>OctaveJumpUp</li>
        <li>OctaveJumpDown</li>
        <li>SpiralUp</li>
        <li>SpiralDown</li>
        <li>DoubleBackUp</li>
        <li>DoubleBackDown</li>
        <li>MirrorUp</li>
        <li>MirrorDown</li>
        <li>RandomMirror</li>
        <li>ZigZagUp</li>
        <li>ZigZagDown</li>
        <li>ZigZagUpDown</li>
        <li>ZigZagDownUp</li>
        <li>SpiralIn</li>
        <li>SpiralOut</li>
        <li>SpiralInOut</li>
        <li>SpiralOutIn</li>
        <li>PinkyDown</li>
        <li>PinkyDownUp</li>
        <li>ThumbDown</li>
        <li>ThumbDownUp</li>
        <li>RandomOctave</li>
        <li>RandomCycle</li>
        <li>RandomCycleOctave</li>
        <li>MonoBassline</li>
        <li>ArcadeTrills</li>
        <li>BouncingFunk</li>
      </ul>
    </div>
  );
};

export default ArpyDocs;
