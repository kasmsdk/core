import React from "react";

const RulezDocs: React.FC = () => {
  return (
    <div>
      <h2>Rulez</h2>
      <p>
        The Rulez engine in the Kasm SDK is used to detect unrealistic MIDI
        patterns that a human could not play on certain instruments.
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
      <pre>
        <code>
          {`
pub struct HandDrumsRule;

pub const MAX_NOTES_TWO_HANDS_CAN_PLAY: usize = 2; // Two hands can realistically play two notes at once
const MIN_VELOCITY_TO_PRODUCE_SOUND: i32 = 5; // Very light touch
const MINIMUM_TIMING_BETWEEN_ONE_NOTE_HUMANLY_POSSIBLE_TO_REPEAT_PLAY: u32 = 100; // Minimum time in ms between one note and the next on the same drum

impl InstrumentRule for HandDrumsRule {
    fn apply_rule(&self, notes: Vec<NoteData>) -> Vec<RulezResult> {
        use std::collections::HashMap;
        let mut results = Vec::new();
        let mut notes_by_time: HashMap<i32, Vec<&NoteData>> = HashMap::new();
        // Group notes by timestamp
        for note in &notes {
            notes_by_time.entry(note.start_time).or_default().push(note);
        }
        let mut notes_at_time = NOTES_AT_TIMESTAMP.lock().unwrap();
        for (timestamp, notes_group) in notes_by_time {
            let mut remove_timestamp = false;
            let mut batch_allowed_pitches = std::collections::HashSet::new();
            let mut batch_results = Vec::new();
            for note in notes_group {
                if note.velocity == 0 {
                    batch_results.push((note, RuleOutcome::DoNothing));
                    continue;
                }
                if note.velocity < MIN_VELOCITY_TO_PRODUCE_SOUND {
                    batch_results.push((note, RuleOutcome::Ignore));
                    continue;
                }
                if batch_allowed_pitches.len() < MAX_NOTES_TWO_HANDS_CAN_PLAY && !batch_allowed_pitches.contains(&note.note) {
                    batch_allowed_pitches.insert(note.note);
                    batch_results.push((note, RuleOutcome::DoNothing));
                } else {
                    batch_results.push((note, RuleOutcome::Ignore));
                }
            }
            let entry = notes_at_time.entry(timestamp).or_insert_with(std::collections::HashSet::new);
            for (note, outcome) in batch_results {
                if note.velocity == 0 {
                    if entry.is_empty() {
                        remove_timestamp = true;
                    }
                } else if outcome == RuleOutcome::DoNothing {
                    entry.insert(note.note);
                }
                results.push(RulezResult { note: note.clone(), outcome });
            }
            if remove_timestamp {
                notes_at_time.remove(&timestamp);
            }
        }
        results
    }
}

pub fn can_add_hand_drums_note(note_data: &NoteData) -> bool {
    let mut notes_at_time = NOTES_AT_TIMESTAMP.lock().unwrap();
    let entry = notes_at_time.entry(note_data.start_time).or_insert_with(std::collections::HashSet::new);
    if note_data.velocity == 0 {
        if entry.remove(&note_data.note) {
            post!("HandDrums: Note off at {} pitch {} removed, pitches now {:?}", note_data.start_time, note_data.note, entry);
        }
        if entry.is_empty() {
            notes_at_time.remove(&note_data.start_time);
        }
        return true;
    }
    if note_data.velocity < MIN_VELOCITY_TO_PRODUCE_SOUND {
        post!("HandDrums: Note at {} pitch {} blocked due to low velocity {}", note_data.start_time, note_data.note, note_data.velocity);
        return false;
    }
    if entry.len() < MAX_NOTES_TWO_HANDS_CAN_PLAY {
        entry.insert(note_data.note);
        true
    } else {
        post!("HandDrums: Note at {} pitch {} blocked, pitches are {:?} (max {})", note_data.start_time, note_data.note, entry, MAX_NOTES_TWO_HANDS_CAN_PLAY);
        false
    }
}
`}
        </code>
      </pre>
      </p>

      <h2>Some Rulez Examples what you might do with it</h2>
        <p>
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
        </p>
    </div>

  );
};

export default RulezDocs;
