import React from "react";

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
    </div>
  );
};

export default LFODocs;
