import React from "react";

const KrumhanselDocs: React.FC = () => {
  return (
    <div>
      <h1>Krumhansel Documentation</h1>
      <p>
        The Krumhansel mechanism in the Kasm SDK is used to detect the scale,
        key, and chords being played in real-time.
      </p>
      <p>
        This documentation will explain how the Krumhansel algorithm works and
        how you can use it to get harmonic information from a MIDI stream.
      </p>

      <h2>How the Krumhansel Algorithm Works</h2>
      <p>
        The Krumhansel algorithm is a method for determining the musical key of
        a passage of music. It works by comparing the distribution of notes
        played over a short period of time to a set of predefined "key profiles"
        for major and minor keys. The key whose profile most closely matches the
        recent note distribution is selected as the current key.
      </p>
      <p>
        In the Kasm SDK, this algorithm is also used to detect the current chord
        being played. It analyzes the most recent notes and matches them against
        a library of known chord types.
      </p>

      <h2>How to Use the Krumhansel Engine</h2>
      <p>
        You can feed MIDI notes to the Krumhansel engine using the{" "}
        <code>kasm_krumhansl_detect_key</code> function. You can then retrieve
        the detected key and chord using their respective getter functions.
      </p>
      <pre>
        <code>
          {`
// Rust example of using the Krumhansel engine
use kasm_sdk::krumhansl::{kasm_krumhansl_detect_key, kasm_krumhansl_get_current_key, kasm_krumhansl_get_current_chord};

fn process_midi_note(note: i32, velocity: i32) {
    // Feed the note to the key detection engine
    kasm_krumhansl_detect_key(note, 0, velocity, 0, 0, 0);

    // Get the detected key and chord
    let current_key = kasm_krumhansl_get_current_key();
    let current_chord = kasm_krumhansl_get_current_chord();

    println!("Current Key: {}", current_key);
    println!("Current Chord: {}", current_chord);
}
`}
        </code>
      </pre>
    </div>
  );
};

export default KrumhanselDocs;
