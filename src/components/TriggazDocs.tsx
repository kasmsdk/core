import React from "react";

const TriggazDocs: React.FC = () => {
  return (
    <div>
      <h1>Triggaz Documentation</h1>
      <p>
        Triggaz is the MIDI pattern detection engine in the Kasm SDK. It can
        analyze incoming MIDI data to identify melodic and rhythmic patterns.
      </p>
      <p>
        This documentation will explain how Triggaz works, how to use it to
        detect patterns, and how to interpret the results.
      </p>

      <h2>How Triggaz Works</h2>
      <p>
        Triggaz analyzes the incoming stream of MIDI notes, looking for patterns
        that match a predefined set of nursery rhymes and simple melodies. It
        considers both the pitch intervals between notes and the rhythmic
        timing. When a pattern is detected with a high enough confidence level,
        Triggaz can trigger a "tune completion" - playing the rest of the melody
        automatically.
      </p>
      <p>
        A key feature of Triggaz is its dynamic bass/treble split. It analyzes
        the range of notes being played to distinguish between bass and melody
        lines, allowing it to focus on the melodic content for pattern matching.
      </p>

      <h2>How to Use Triggaz</h2>
      <p>
        You can use the <code>kasm_triggaz_detect_pattern</code> function to
        feed MIDI notes to the detection engine. The function returns a
        confidence score, and if a pattern is confidently detected, it will
        trigger the tune completion.
      </p>
      <pre>
        <code>
          {`
// Rust example of using the Triggaz pattern detection
use kasm_sdk::triggaz::{kasm_triggaz_detect_pattern, kasm_triggaz_get_last_pattern, kasm_triggaz_get_confidence};

fn process_midi_note(note: i32, velocity: i32) {
    // Feed the note to the pattern detector
    let confidence = kasm_triggaz_detect_pattern(note, 0, velocity, 0, 0, 0);

    if confidence > 0 {
        println!("Pattern detected: {}", kasm_triggaz_get_last_pattern());
        println!("Confidence: {}", kasm_triggaz_get_confidence());
    }
}
`}
        </code>
      </pre>

      <h2>Detected Patterns</h2>
      <p>Triggaz can currently detect the following patterns:</p>
      <ul>
        <li>Twinkle Twinkle Little Star</li>
        <li>Three Blind Mice</li>
        <li>Frère Jacques</li>
        <li>Mary Had a Little Lamb</li>
        <li>Happy Birthday</li>
      </ul>
    </div>
  );
};

export default TriggazDocs;
