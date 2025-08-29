import React from "react";

const EmanatorDocs: React.FC = () => {
  return (
    <div>
      <h1>Emanator Documentation</h1>
      <p>
        Emanators are a core feature of the Kasm SDK. They are responsible for
        generating and transforming MIDI data in various ways.
      </p>
      <p>
        This documentation will cover the different types of emanators
        available, how to use them, and how to create your own.
      </p>

      <h2>How to Use Emanators</h2>
      <p>
        Emanators are executed using the <code>execute_emanator</code> function
        in your Rust code. You provide the index of the emanator you want to
        use, along with various MIDI and control parameters.
      <pre>
        <code>
          {`
// Rust example of executing an emanator
use kasm_sdk::emanators::{execute_emanator};

fn play_midi_note(note: i32, velocity: i32) {
    // Execute the first emanator in the registry
    let transformed_note = execute_emanator(
        0,       // Emanator index
        note,    // Inlet 0: MIDI note
        0,       // Inlet 1: Semitone offset
        velocity,// Inlet 2: Velocity
        64,      // Inlet 3: Encoder 1
        64,      // Inlet 4: Encoder 2
        0,       // Time step
        0        // Time bar
    );
    // The transformed_note can then be sent as MIDI output
}
`}
        </code>
      </pre>
      </p>

      <h2>Emanator Categories</h2>
      <p>Emanators are organized into the following categories:</p>

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
    </div>
  );
};

export default EmanatorDocs;
