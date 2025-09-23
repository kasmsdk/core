import React from "react";

const WebXRDocs: React.FC = () => {
  return (
    <div>
      <h2>Triggaz</h2>
      <p>
        Triggaz is the MIDI pattern detection engine in the Kasm SDK. It can
        analyze incoming MIDI data to identify melodic and rhythmic patterns.
      </p>

      <h2>How Triggaz Works</h2>
      <p>
        Triggaz analyzes the incoming stream of MIDI notes, looking for patterns
        that match a predefined set of nursery rhymes and simple melodies. It
        considers both the pitch intervals between notes and the rhythmic
        timing. When a pattern is detected with a high enough confidence level,
        Triggaz can trigger a "tune completion" - playing the rest of the melody
        automatically.
        <br/>
          <br/>
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
      <pre>
        <code>
          {`
// Rust example of using the Triggaz pattern detection
// Note pattern definitions (relative intervals from starting note)
// Each pattern: (name, intervals, timing_ratios, min_notes_to_trigger)
const PATTERNS: &[(&str, &[i32], &[f64], usize)] = &[
    // Twinkle Twinkle Little Star - "Twinkle twinkle little star" (7 notes)
    // Pattern: C C G G A A G - distinctive opening with repeated notes and fifth leap
    // Key distinction: Repeated tonic, leap to dominant, step up, return to dominant
    ("twinkle_twinkle", &[0, 0, 7, 7, 9, 9, 7], &[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0], 7),

    // Three Blind Mice - "Three blind mice, three blind mice" (6 notes)
    // Pattern: E D C, E D C - distinctive descending thirds repeated
    // Key distinction: Descending minor third pattern repeated immediately
    // Reduced min_notes from 6 to 4 to trigger earlier (after first phrase + 1 note of repeat)
    ("three_blind_mice", &[0, -2, -4, 0, -2, -4], &[1.0, 1.0, 2.0, 1.0, 1.0, 2.0], 4),

    // Frère Jacques - "Frère Jacques, Frère Jacques" (8 notes)
    // Pattern: C D E C, C D E C - distinctive stepwise motion with returns
    // Key distinction: Stepwise ascending then return to tonic, repeated
    ("frere_jacques", &[0, 2, 4, 0, 0, 2, 4, 0], &[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], 8),

    // Mary Had a Little Lamb - "Mary had a little lamb" (7 notes)
    // Pattern: E D C D, E E E - distinctive descending then repeated notes
    // Key distinction: Descending minor third, return, then triple repetition
    // Made more specific to avoid false positives
    ("mary_little_lamb", &[0, -2, -4, -2, 0, 0, 0], &[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0], 7),

    // Happy Birthday - "Happy birthday to you" (6 notes)
    // Pattern: C C D C F E - distinctive leap to fourth with resolution
    // Key distinction: Repeated tonic, step up, leap to fourth, resolve down
    ("happy_birthday", &[0, 0, 2, 0, 5, 4], &[1.5, 0.5, 1.0, 1.0, 1.0, 0.5], 6),
];

// Tune completions - what to play after detecting the pattern
// Format: (pattern_name, completion_notes, completion_timing)
const TUNE_COMPLETIONS: &[(&str, &[i32], &[f64])] = &[
    ("twinkle_twinkle", &[5, 5, 4, 4, 2, 2, 0], &[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 2.0]),
    ("three_blind_mice", &[3, 1, 1, 0, 3, 1, 1, 0], &[1.5, 1.0, 0.5, 2.0, 1.5, 1.0, 0.5, 2.0]), // "see how they run, see how they run"
    ("frere_jacques", &[4, 5, 7, 4, 5, 7], &[1.0, 1.0, 2.0, 1.0, 1.0, 2.0]),
    ("mary_little_lamb", &[-2, -2, -2, 0, 3, 3], &[1.0, 1.0, 2.0, 1.0, 1.0, 2.0]),
    ("happy_birthday", &[0, 0, 2, 0, 7, 5], &[1.5, 0.5, 2.0, 1.0, 1.0, 1.0]),
];
`}
        </code>
      </pre>
      </p>

      <h2>Detected Patterns</h2>
      <p>The Triggaz example can currently detect the following note patterns in any key:
      <ul>
        <li>Twinkle Twinkle Little Star</li>
        <li>Three Blind Mice</li>
        <li>Frère Jacques</li>
        <li>Mary Had a Little Lamb</li>
        <li>Happy Birthday</li>
      </ul>
      </p>
    </div>
  );
};

export default WebXRDocs;
