import React from "react";
import LatestDemoLFO from "./LatestDemoLFO.tsx";

const LFODocs: React.FC = () => {
  return (
    <div>
      <h2>LFO</h2>
      <p>
        The LFO (Low-Frequency Oscillator) engine in the Kasm SDK generates
        continuous MIDI CC messages for real-time modulation in Ableton Live or
        any MIDI-compatible software. LFOs are tempo-synced and can be controlled
        live via the Max for Live UI.
      </p>

        <h2>How to generate your own LFOs</h2>
        <p>
            LFO are executed using the <code>execute_emanator</code> function
            in your Rust code. You provide the index of the LFO emanator you want to
            use, along with various MIDI and control parameters.
            <br/>
            <br/>
            src/emanators/lfo.rs
            <pre>
        <code>
          {`
pub fn kasm_lfo_triangle_wave(
    _note: i32,
    cc_number: i32,
    _velocity: i32,
    enc1: i32,
    enc2: i32,
    _step: i32,
    _bar: i32,
) -> i32 {
    let now = crate::get_current_time_ms();
    let mut last_time = LAST_LFO_TIME.write().unwrap();
    let mut phase = LFO_PHASE.write().unwrap();

    // Calculate time delta in milliseconds
    let delta_ms = if *last_time == 0 {
        // First call, initialize time
        *last_time = now;
        0.0
    } else {
        // Calculate delta and update last time
        let delta = now.saturating_sub(*last_time) as f32;
        *last_time = now;
        delta
    };

    // Calculate phase increment based on speed and tempo/bar length
    let phase_increment = lfo_phase_increment(delta_ms, enc1);

    // Accumulate phase (0..1 range)
    *phase = (*phase + phase_increment).fract();

    // enc2 controls symmetry (0-127, 64 = perfect triangle)
    let symmetry = (enc2 as f32) / 127.0;
    let lfo_value = if *phase < symmetry {
        (*phase / symmetry * 127.0) as i32
    } else {
        ((1.0 - *phase) / (1.0 - symmetry) * 127.0) as i32
    };

    send_cc(cc_number, lfo_value.max(0).min(127), 0);
    cc_number
}
`}

        </code>
      </pre>
        </p>
        <p><pre><code>
  {`
pub fn kasm_lfo_golden_ratio(
    _note: i32,
    cc_number: i32,
    _velocity: i32,
    enc1: i32,
    enc2: i32,
    _step: i32,
    _bar: i32,
) -> i32 {
    let now = crate::get_current_time_ms();
    let mut last_time = LAST_LFO_TIME.write().unwrap();
    let mut phase = LFO_PHASE.write().unwrap();

    // Calculate time delta in milliseconds
    let delta_ms = if *last_time == 0 {
        *last_time = now;
        0.0
    } else {
        let delta = now.saturating_sub(*last_time) as f32;
        *last_time = now;
        delta
    };

    // Make the LFO smoother by reducing the speed multiplier and increasing phase resolution
    // Original: let speed_multiplier = 0.25 + (enc1 as f32 / 100.0) * 0.75;
    // Smoother: scale enc1 down and add a minimum
    let speed_multiplier = 0.05 + (enc1 as f32 / 300.0) * 0.5; // much slower, more resolution
    let beats_per_minute = (*crate::BEATS_PER_MINUTE.lock().unwrap() as f32).max(20.0).min(999.0);
    let beats_per_bar = (*crate::BEATS_PER_BAR.lock().unwrap() as f32).max(1.0).min(16.0);
    let bar_duration_ms = (60_000.0 * beats_per_bar) / beats_per_minute;
    let phase_increment = (delta_ms / bar_duration_ms) * speed_multiplier;

    *phase = (*phase + phase_increment).fract();

    use std::f32::consts::PI;
    let phi = (1.0 + 5.0_f32.sqrt()) / 2.0; // Golden ratio
    let spiral_factor = 1.0 + (enc2 as f32 / 127.0) * 5.0;
    let spiral_phase = *phase * 2.0 * PI;
    let radius = (spiral_phase / spiral_factor).exp();
    let spiral_value = (radius * (spiral_phase * phi).sin()).abs();
    let normalized = spiral_value % 1.0;
    let lfo_value = (normalized * 127.0) as i32;

    send_cc(cc_number, lfo_value.max(0).min(127), 0);
    cc_number
}
`}
        </code>
      </pre>
        </p>

        <p>Then add your new LFO emanators to the emanators registry with short description and you added functions, e.g.<pre><code>
  {`
  pub fn get_emanator_infos() -> Vec<EmanatorInfo> {
      vec![
            EmanatorInfo {
                emanator_idx: MAX4LIVE_UI_LFO_OFFSET + 3,
                name: "LFO Triangle",
                description: "Triangle wave LFO with speed and symmetry controls",
                category: EmanatorCategory::LFO,
                complexity: 1,
                function: kasm_lfo_triangle_wave,
            },
          ...
            EmanatorInfo {
                emanator_idx: MAX4LIVE_UI_LFO_OFFSET + 9,
                name: "LFO Golden Ratio",
                description: "Golden ratio spiral LFO with spiral tightness control",
                category: EmanatorCategory::LFO,
                complexity: 5,
                function: kasm_lfo_golden_ratio,
            },
          ...
`}
        </code>
      </pre>
        </p>

        <h2>Supported Waveforms</h2>
        <p>
      <ul>
        <li>
          <b>Sine Wave</b>: Classic smooth modulation.
          <br />
          <b>Controls:</b> Speed (enc1), Phase Offset (enc2)
        </li>
        <li>
          <b>Sawtooth Wave</b>: Linear ramp up or down.
          <br />
          <b>Controls:</b> Speed (enc1), Direction (enc2: 0–63 up, 64–127 down)
        </li>
        <li>
          <b>Square Wave</b>: On/off modulation with pulse width.
          <br />
          <b>Controls:</b> Speed (enc1), Pulse Width (enc2: 1–99%)
        </li>
        <li>
          <b>Triangle Wave</b>: Symmetrical or asymmetrical triangle shape.
          <br />
          <b>Controls:</b> Speed (enc1), Symmetry (enc2: 0–127, 64 = perfect
          triangle)
        </li>
        <li>
          <b>Motown Fadeout</b>: Gradually fades out modulation for smooth
          transitions.
          <br />
          <b>Controls:</b> Fadeout length in bars (enc2), Fadeout steps (enc1)
        </li>
      </ul>
        </p>

      <h2>General Features</h2>
        <p>
      <ul>
        <li>
          All LFOs are synchronized to Ableton Live's transport and tempo for
          rhythmic effects.
        </li>
        <li>Parameters are mapped to encoder controls for live tweaking.</li>
        <li>
          Each LFO sends MIDI CC messages to modulate parameters in Ableton or
          other MIDI-compatible software.
        </li>
      </ul>
        </p>

      <h2>Usage</h2>
      <p>
        Select the desired LFO waveform and assign a MIDI CC number to modulate.
        Adjust the encoders in the Max for Live UI to control speed, shape, and
        other parameters in real time. The LFO engine will continuously send MIDI
        CC messages based on your settings, synchronized to the current tempo and
        transport.
      </p>
      <LatestDemoLFO/>
    </div>
  );
};

export default LFODocs;
