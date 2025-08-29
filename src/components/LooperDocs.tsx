import React from "react";

const LooperDocs: React.FC = () => {
  return (
    <div>
      <h2>Looper</h2>
      <p>
        The Looper engine in the Kasm SDK records and processes MIDI note events
        in real time, simulating the physical and timing constraints of real
        instruments. It uses a tape buffer to store note events with timestamps,
        supports pattern detection, tape delay, feedback loops, and automatic
        pruning of old events.
      </p>

      <h2>Core Features</h2>
        <p>
      <ul>
        <li>
          <b>Tape Recording:</b> Captures MIDI notes with timing for playback and
          analysis.
        </li>
        <li>
          <b>Pattern Detection:</b> Identifies and records repeating note patterns
          with time offsets.
        </li>
        <li>
          <b>Tape Delay & Feedback:</b> Adjustable delay and feedback loops for
          creative looping effects.
        </li>
        <li>
          <b>Pruning:</b> Automatically removes old note events to prevent
          overflow and maintain performance.
        </li>
        <li>
          <b>Instrument Realism:</b> Applies rules to enforce physical
          constraints of real instruments.
        </li>
        <li>Adjust tape delay and feedback loops for creative looping.</li>
        <li>Wipe tape and prune events to reset or optimize performance.</li>
        <li>
          Customize rule parameters (e.g., capo offset, hand span) for each
          instrument.
        </li>
      </ul>
        </p>
    </div>
  );
};

export default LooperDocs;
