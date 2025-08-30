import React from "react";
import LatestDemo from "./LatestDemo.tsx";

const EmanatorDocs: React.FC = () => {
  return (
    <div>
      <h2>Emanator</h2>
      <p>
        Emanators are a core feature of the Kasm SDK. They are responsible for
        generating and transforming MIDI data in various ways.
      </p>

      <h2>How to Use Emanators</h2>
      <p>
        Emanators are executed using the <code>execute_emanator</code> function
        in your Rust code. You provide the index of the emanator you want to
        use, along with various MIDI and control parameters.
      <pre>
        <code>
          {`
/// Morse Code repeater with rhythmic patterns
pub fn rhythmic_morse_code(
    note: i32,
    offset: i32,
    velocity: i32,
    enc1_velocity_offset: i32,
    enc2_intensity: i32,
    _time_step: i32,
    _time_bar: i32,
) -> i32 {
    let root_note = (note + offset).max(0).min(127);
    let base_velocity = (velocity + (enc1_velocity_offset / 10)).max(30).min(127);
    let intensity_factor = enc2_intensity.max(1).min(127) as f32 / 32.0;

    // Morse code patterns for different notes
    let morse_alphabet = [
        ".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",
        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",
        "..-", "...-", ".--", "-..-", "-.--", "--..",
    ];

    let morse_index = ((root_note + enc1_velocity_offset) as usize) % morse_alphabet.len();
    let morse_pattern = morse_alphabet[morse_index];

    let dot_duration = (120.0 * intensity_factor) as i32;
    let dash_duration = (360.0 * intensity_factor) as i32;
    let element_gap = (120.0 * intensity_factor) as i32;

    let mut current_delay = 0;
    let total_elements = morse_pattern.len();
    
    for (i, morse_char) in morse_pattern.chars().enumerate() {
        let pan_angle = (i as f32 / total_elements as f32) * 2.0 * std::f32::consts::PI;
        let pan_position = ((pan_angle.cos() + 1.0) * 63.5) as i32;

        let (duration, pitch_offset) = match morse_char {
            '.' => (dot_duration, 0),
            '-' => (dash_duration, 12),
            _ => continue,
        };

        let morse_note = (root_note + pitch_offset).max(0).min(127);
        let morse_velocity = (base_velocity as f32 * (0.8 + 0.4 * intensity_factor)) as i32;

        send_note(
            morse_note,
            morse_velocity.max(30).min(127),
            current_delay,
            duration,
            pan_position,
        );

        current_delay += duration + element_gap;
    }

    root_note
}
`}

        </code>
      </pre>
      </p>
<p><pre><code>
  {`/// Simple first-order Markov chain with basic note transitions
pub fn rhythmic_markov_chain(
    note: i32,
    offset: i32,
    velocity: i32,
    enc1_intensity: i32,
    enc2_complexity: i32,
    _time_step: i32,
    _time_bar: i32,
) -> i32 {
    let root_note = (note + offset).max(0).min(127);
    let intensity_factor = (enc1_intensity.max(50).min(127) as f64 + 50.0) / 127.0;
    let complexity_factor = (enc2_complexity.max(40).min(127) as f64 + 40.0) / 127.0;

    // Simple first-order Markov transition matrix
    let transition_matrix = [
        [0.3, 0.2, 0.2, 0.1, 0.1, 0.05, 0.03, 0.02],
        [0.2, 0.1, 0.3, 0.2, 0.1, 0.05, 0.03, 0.02],
        [0.15, 0.2, 0.2, 0.2, 0.15, 0.05, 0.03, 0.02],
        [0.1, 0.15, 0.2, 0.2, 0.2, 0.1, 0.03, 0.02],
        [0.2, 0.1, 0.15, 0.15, 0.2, 0.15, 0.03, 0.02],
        [0.15, 0.1, 0.1, 0.15, 0.2, 0.2, 0.08, 0.02],
        [0.3, 0.15, 0.1, 0.1, 0.15, 0.15, 0.03, 0.02],
        [0.4, 0.2, 0.15, 0.1, 0.1, 0.03, 0.01, 0.01],
    ];

    let intervals = [0, 2, 4, 5, 7, 9, 11, 12];
    let sequence_length = (12.0 + complexity_factor * 8.0) as usize;
    let mut current_state = 0;

    for step in 0..sequence_length {
        let note_interval = intervals[current_state];
        let sequence_note = (root_note + note_interval).max(0).min(127);

        let base_delay = (step as f64 * 400.0 * intensity_factor) as i32;
        let ripple_delay = ((step as f64 * 0.3).sin() * 100.0) as i32;
        let final_delay = base_delay + ripple_delay;

        let base_velocity = (velocity as f64 * (0.8 + 0.2 * intensity_factor)) as i32;
        let velocity_variation = ((step as f64 * 0.7).sin() * 15.0) as i32;
        let sequence_velocity = (base_velocity + velocity_variation).max(40).min(100);

        let duration = (500.0 + (step as f64 * 0.2).cos() * 200.0) as i32;
        let final_duration = duration.max(300);

        let pan_position = ((step as f64 * 0.1).sin() * 30.0 + 64.0) as i32;

        send_note(
            sequence_note,
            sequence_velocity,
            final_delay,
            final_duration,
            pan_position,
        );

        // Determine next state using Markov probabilities
        let random_value = ((step * 17 + current_state * 23) % 1000) as f64 / 1000.0;
        let mut cumulative_prob = 0.0;
        let mut next_state = 0;

        for (state, &prob) in transition_matrix[current_state].iter().enumerate() {
            cumulative_prob += prob;
            if random_value <= cumulative_prob {
                next_state = state;
                break;
            }
        }
        current_state = next_state;
    }

    root_note
}
`}
        </code>
      </pre>
      </p>

      <p>The emanator.rs contains a simple registry, to add your new emanators to it simply adda short description and you added functions, e.g.<pre><code>
  {`
  pub fn get_emanator_infos() -> Vec<EmanatorInfo> {
      vec![
          EmanatorInfo {
              emanator_idx: MAX4LIVE_UI_EMANATORS_OFFSET_RHYTHMIC,
              name: "Morse Code",
              description: "Morse code patterns with rhythmic timing",
              category: EmanatorCategory::Rhythmic,
              complexity: 4,
              function: rhythmic_morse_code,
          },
          EmanatorInfo {
            emanator_idx: MAX4LIVE_UI_EMANATORS_OFFSET_RHYTHMIC + 1,
              name: "Markov Chain",
              description: "Markov chain-based rhythmic patterns",
              category: EmanatorCategory::Rhythmic,
              complexity: 5,
              function: rhythmic_markov_chain,
          }, 
          ...
`}
        </code>
      </pre>
      </p>

      <h2>Emanator Categories</h2>
      <p>The Kasm SDK comes with a few example Emanators for some ideas to get you started, they are organized into the following categories:</p>

      <h3>Harmonic Emanators</h3>
      <p>
        Harmonic emanators focus on generating harmonic content, such as chord
        progressions and harmonic series.
      <ul>
        <li>
          <strong>Chord Progression:</strong> Classic chord progressions with
          well-known patterns.
        </li>
        <li>
          <strong>Simple Chord:</strong> Basic major triad chord.
        </li>
        <li>
          <strong>Extended Inversions:</strong> Extended chords with inversions.
        </li>
        <li>
          <strong>Complex Extensions:</strong> Complex chord progressions with
          extensions and rhythmic variations.
        </li>
      </ul>
      </p>

      <h3>Rhythmic Emanators</h3>
      <p>
        Rhythmic emanators focus on generating rhythmic and percussive patterns.
      <ul>
        <li>
          <strong>Morse Code:</strong> Morse code patterns with rhythmic timing.
        </li>
        <li>
          <strong>Markov Chain:</strong> Markov chain-based rhythmic patterns.
        </li>
        <li>
          <strong>Wave Interference:</strong> Trigonometric wave interference
          patterns.
        </li>
        <li>
          <strong>Complex Reflection:</strong> Physics-based reflection
          algorithms.
        </li>
        <li>
          <strong>Balkan 7/8:</strong> Balkan 7/8 rhythm (aksak).
        </li>
        <li>
          <strong>West African Bell:</strong> West African bell pattern (12/8
          cross-rhythm).
        </li>
        <li>
          <strong>Indian Tintal:</strong> Indian Tintal (16-beat cycle).
        </li>
        <li>
          <strong>Latin son clave:</strong> Latin son clave (3-2).
        </li>
        <li>
          <strong>Jazz Swing 8ths:</strong> Jazz swing eighths.
        </li>
        <li>
          <strong>Fibonacci rhythm:</strong> Fibonacci rhythm (5, 8, 13, ...).
        </li>
        <li>
          <strong>Golden ratio pulse:</strong> Golden ratio pulse.
        </li>
        <li>
          <strong>Prime number rhythm:</strong> Prime number rhythm.
        </li>
        <li>
          <strong>Balkan 11/8 (3+2+3+3):</strong> Balkan 11/8 (3+2+3+3).
        </li>
        <li>
          <strong>Contemporary tuplets (5:4):</strong> Contemporary tuplets
          (5:4).
        </li>
        <li>
          <strong>Afro-Cuban 6/8 bell:</strong> Afro-Cuban 6/8 bell.
        </li>
      </ul>
      </p>

      <h3>Melodic Emanators</h3>
      <p>
        Melodic emanators focus on generating simple melodic patterns and
        sequences.
      <ul>
        <li>
          <strong>Phone Ringtone:</strong> Classic phone ringtone melody with
          humanization.
        </li>
        <li>
          <strong>Strummed Cascade:</strong> Cascading glissando with stereo
          spread.
        </li>
        <li>
          <strong>Elaborate Panning:</strong> Melodic patterns with dynamic
          panning.
        </li>
        <li>
          <strong>Advanced Rhythmic:</strong> Complex melodic patterns with
          rhythmic variations.
        </li>
      </ul>
      </p>

      <h3>Progression Emanators</h3>
      <p>
        Progression emanators generate musical progressions, including classic
        cadences and more complex harmonic sequences.
      <ul>
        <li>
          <strong>Circle of Fifths:</strong> Circle of Fifths progression with
          modulation and panning.
        </li>
        <li>
          <strong>Stepwise Progression:</strong> Diatonic stepwise progression.
        </li>
        <li>
          <strong>Plagal Cadence:</strong> IV-I plagal cadence.
        </li>
        <li>
          <strong>Deceptive Cadence:</strong> V-vi deceptive cadence.
        </li>
        <li>
          <strong>Modal Mixture:</strong> Modal mixture progression.
        </li>
        <li>
          <strong>Descending Fifths:</strong> Descending fifths progression.
        </li>
        <li>
          <strong>Jazz Turnaround:</strong> I-vi-ii-V jazz turnaround.
        </li>
        <li>
          <strong>Chromatic Mediant:</strong> Chromatic mediant progression.
        </li>
        <li>
          <strong>Neapolitan Chord:</strong> Neapolitan chord progression.
        </li>
        <li>
          <strong>Augmented Sixth:</strong> Augmented sixth progression.
        </li>
      </ul>
      </p>

      <h3>Responsorial Chant Emanators</h3>
      <p>
        Responsorial chant emanators generate call and response patterns
        inspired by Gregorian chant and other responsorial traditions.
      <ul>
        <li>
          <strong>Chant Dorian Call-Response:</strong> Call and response in
          Dorian mode (chant style).
        </li>
        <li>
          <strong>Chant Psalm Tone:</strong> Gregorian psalm tone formula.
        </li>
        <li>
          <strong>Chant Ornamented Response:</strong> Responsorial echo with
          ornamentation.
        </li>
        <li>
          <strong>Chant with Drone:</strong> Responsorial chant with ison
          (drone).
        </li>
        <li>
          <strong>Chant Antiphonal:</strong> Antiphonal (alternating) chant.
        </li>
      </ul>
      </p>

      <h3>Spatial Emanators</h3>
      <p>Spatial emanators focus on creating spatial and panning effects.
      <ul>
        <li>
          <strong>Harmonic Resonance:</strong> Harmonic series with spatial
          positioning.
        </li>
        <li>
          <strong>Swarm Movement:</strong> Boids algorithm with spatial audio.
        </li>
        <li>
          <strong>Circular Panning:</strong> Dynamic circular panning effects.
        </li>
        <li>
          <strong>3D Positioning:</strong> Simulated 3D spatial positioning.
        </li>
      </ul>
      </p>
      <h3>Mathematical Emanators</h3>
      <p>
        Mathematical emanators use algorithmic and mathematical patterns to
        generate MIDI.
      <ul>
        <li>
          <strong>Fibonacci Spiral:</strong> Fibonacci timing with golden ratio
          velocity decay.
        </li>
        <li>
          <strong>Fractal Cascade:</strong> Fractal echo patterns at different
          time scales.
        </li>
        <li>
          <strong>Swarming Spirals:</strong> Bumblebee flight patterns with
          Fibonacci timing.
        </li>
        <li>
          <strong>Fractal Chaos:</strong> L-systems, strange attractors, and
          chaos theory.
        </li>
      </ul>
      </p>

      <h3>Experimental Emanators</h3>
      <p>Experimental emanators explore chaotic and unconventional patterns.
      <ul>
        <li>
          <strong>Multidimensional Markov:</strong> Multi-dimensional Markov
          chain with harmonic context.
        </li>
        <li>
          <strong>Second Order Markov:</strong> Second-order Markov chain with
          rhythm patterns.
        </li>
        <li>
          <strong>Chaos Game Harmony:</strong> Chaos game algorithm for
          counterpoint harmony.
        </li>
        <li>
          <strong>Complex Drums:</strong> Complex drum patterns using golden
          ratio mathematics.
        </li>
        <li>
          <strong>Cellular Automaton:</strong> Cellular automaton melody
          generator (Rule 30).
        </li>
        <li>
          <strong>Euclidean Rhythm:</strong> Euclidean rhythm pattern generator.
        </li>
        <li>
          <strong>L-System:</strong> L-system based melody generator.
        </li>
        <li>
          <strong>Microtonal 24-TET:</strong> Microtonal melody generator using
          24-TET.
        </li>
        <li>
          <strong>Brownian Walk:</strong> Stochastic Brownian walk melody
          generator.
        </li>
        <li>
          <strong>Spectral Texture:</strong> Spectral overtone texture
          generator.
        </li>
        <li>
          <strong>Recursive Pattern:</strong> Recursive self-similar pattern
          generator.
        </li>
        <li>
          <strong>Parameter Morphing:</strong> Dynamic parameter morphing melody
          generator.
        </li>
        <li>
          <strong>Polymetric (3:4):</strong> Polymetric engine generating 3:4
          patterns.
        </li>
        <li>
          <strong>Polytempo Engine:</strong> Polytempo engine for variable speed
          patterns.
        </li>
      </ul>
      </p>
      <LatestDemo/>
    </div>
  );
};

export default EmanatorDocs;
