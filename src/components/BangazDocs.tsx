import React from "react";

const BangazDocs: React.FC = () => {
  return (
    <div>
      <h1>Bangaz Documentation</h1>
      <p>
        Bangaz is the drum pattern generator in the Kasm SDK. It allows you to
        create and play a variety of drum beats and rhythms.
      </p>
      <p>
        This documentation will cover the different drum kits, how to create
        patterns, and how to integrate Bangaz into your projects.
      </p>

      <h2>How to Use Bangaz</h2>
      <p>
        The Bangaz drum machine is controlled by selecting a drum pattern. Once
        a pattern is selected, the drum machine will start playing in sync with
        the host's transport. You can assign different MIDI notes to each drum
        sound to customize your kit.
      </p>
      <pre>
        <code>
          {`
// Rust example of using the Bangaz drum machine
use kasm_sdk::drummer::{kasm_drummer_detect_pattern, set_drum_note, DrumType};

fn setup_drum_machine() {
    // Select a drum pattern (e.g., pattern 5)
    let pattern_selection_inlet = 5; // This would typically come from the Max for Live UI
    kasm_drummer_detect_pattern(0, 0, 0, 0, 0, pattern_selection_inlet);

    // Customize the drum kit by assigning MIDI notes to drum types
    set_drum_note(DrumType::Kick, 36); // C1
    set_drum_note(DrumType::Snare, 38); // D1
    set_drum_note(DrumType::ClosedHH, 42); // F#1

    // The drum machine will now play the selected pattern with the custom kit.
    // The kasm_drummer_update() function, called by the main metronome,
    // drives the drum pattern playback.
}
`}
        </code>
      </pre>

      <h2>Drum Kits</h2>
      <p>Bangaz supports several drum kit layouts:
      <ul>
        <li>
          <strong>Ableton Drum Rack:</strong> The default layout for Ableton's
          Drum Racks.
        </li>
        <li>
          <strong>General MIDI Drums:</strong> The standard General MIDI drum
          map.
        </li>
        <li>
          <strong>Arpeggiator:</strong> A melodic layout for playing arpeggios
          with drum sounds.
        </li>
        <li>
          <strong>Shuffle:</strong> A randomized drum kit layout.
        </li>
      </ul>
      </p>

      <h2>Drum Patterns</h2>
      <p>
        Bangaz includes a variety of built-in drum patterns, from simple to
        complex:
      <ul>
        <li>Four-to-the-floor kick</li>
        <li>Kick and snare backbeat</li>
        <li>Basic rock beat with hi-hats</li>
        <li>Syncopated beat with open hi-hats</li>
        <li>Polyrhythmic patterns with toms and percussion</li>
        <li>And many more, accessible through the emanator system.</li>
      </ul>
      </p>
    </div>
  );
};

export default BangazDocs;
