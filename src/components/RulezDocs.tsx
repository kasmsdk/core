import React from "react";

const RulezDocs: React.FC = () => {
  return (
    <div>
      <h1>Rulez Documentation</h1>
      <p>
        The Rulez engine in the Kasm SDK is used to detect unrealistic MIDI
        patterns that a human could not play on certain instruments.
      </p>
      <p>
        This documentation will explain how to define and apply rules to filter
        or modify MIDI data.
      </p>

      <h2>How the Rulez Engine Works</h2>
      <p>
        The Rulez engine allows you to define a set of rules that are applied to
        incoming MIDI data. Each rule can inspect the MIDI data and decide to
        either allow it, block it, or modify it. This is useful for enforcing
        constraints that mimic the physical limitations of real instruments.
      </p>
      <p>
        For example, a "Hand Drums" rule might limit the number of simultaneous
        notes to two, since a percussionist only has two hands. A "Keyboard"
        rule might prevent notes from being played that are impossibly far
        apart.
      </p>

      <h2>How to Use the Rulez Engine</h2>
      <p>
        You can add and remove rules from a global registry. When MIDI data is
        sent, the <code>apply_rules_chain</code> function is called to process
        the data through all active rules.
      </p>
      <pre>
        <code>
          {`
// Rust example of using the Rulez engine
use kasm_sdk::rulez::{add_rule, remove_rule, apply_rules_chain, Rulez, RulezType, NoteData, MidiEventType};

fn setup_rules() {
    // Add a rule to simulate a 6-string guitar
    let guitar_rule = Rulez {
        rule_type: RulezType::Guitar6String,
    };
    add_rule(guitar_rule);
}

fn process_midi_notes(notes: Vec<NoteData>) -> Vec<NoteData> {
    // Apply all active rules to the incoming notes
    let filtered_notes = apply_rules_chain(notes);
    return filtered_notes;
}
`}
        </code>
      </pre>

      <h2>Available Rulez</h2>
      <ul>
        <li>
          <strong>EncoderDialsAndFaders:</strong> Limits the rate of change for
          CC messages to simulate physical knobs and faders.
        </li>
        <li>
          <strong>Guitar6String:</strong> Enforces the physical limitations of a
          6-string guitar.
        </li>
        <li>
          <strong>HandDrums:</strong> Simulates the limitations of a two-handed
          percussionist.
        </li>
        <li>
          <strong>Keyboard:</strong> Enforces realistic hand spans for keyboard
          playing.
        </li>
        <li>
          <strong>Bowed:</strong> Simulates the characteristics of bowed string
          instruments like violins.
        </li>
        <li>
          <strong>Stringed:</strong> General rules for stringed instruments.
        </li>
      </ul>
    </div>
  );
};

export default RulezDocs;
