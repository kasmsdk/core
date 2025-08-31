import React from "react";
import LatestDemoRulez from "./LatestDemoRulez.tsx";

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
pub const MAX_NOTES_TWO_HANDS_CAN_PLAY: usize = 2; // Two hands can realistically play two notes at once
const MIN_VELOCITY_TO_PRODUCE_SOUND: i32 = 5; // Very light touch
const SIMULTANEOUS_TIME_WINDOW_MS: i32 = 500; // Time window to consider notes simultaneous for two-hand play

impl InstrumentRule for HandDrumsRule {
    fn apply_rule(&self, notes: Vec<NoteData>, _resolve_by: RuleOutcome) -> Vec<RulezResult> {
        // Build initial results, performing per-note checks (velocity, note-off)
        let mut results: Vec<RulezResult> = Vec::new();

        for note in notes.into_iter() {
            let mut outcome = RuleOutcome::DoNothing;
            let mut note_allowed = true;

            // Always allow note-off through
            if note.event_type == crate::kasm_rulez::MidiEventType::Note && note.velocity_or_ccvalue == 0 {
                outcome = RuleOutcome::DoNothing;
            } else if note.velocity_or_ccvalue < MIN_VELOCITY_TO_PRODUCE_SOUND {
                // Too light to produce sound on hand drums
                outlet_message!(4, "kasm_rulez: HandDrumsRule: velocity too low to make a sound: {}", note.velocity_or_ccvalue);
                outcome = RuleOutcome::Ignore;
                note_allowed = false;
            }

            results.push(RulezResult { note_allowed, note, outcome });
        }

        // Deduplicate notes before bucketing (by all fields)
        let mut unique_results: Vec<RulezResult> = Vec::new();
        for r in results.into_iter() {
            if !unique_results.iter().any(|ur| ur.note == r.note && ur.note.velocity_or_ccvalue == r.note.velocity_or_ccvalue && ur.note.start_time == r.note.start_time && ur.note.pan == r.note.pan && ur.note.length == r.note.length && ur.note.channel == r.note.channel && ur.note.event_type == r.note.event_type) {
                unique_results.push(r);
            }
        }

        // Group notes by time window buckets and enforce two-hand polyphony
        use std::collections::BTreeMap;
        let mut notes_by_bucket: BTreeMap<i32, Vec<usize>> = BTreeMap::new();
        for (idx, r) in unique_results.iter().enumerate() {
            if r.outcome == RuleOutcome::DoNothing {
                let bucket = if r.note.start_time >= 0 { r.note.start_time / SIMULTANEOUS_TIME_WINDOW_MS } else { 0 };
                notes_by_bucket.entry(bucket).or_default().push(idx);
            }
        }

        for (&bucket, _group) in notes_by_bucket.iter() {
            let mut allowed_count = 0;
            for res in unique_results.iter_mut().filter(|r| {
                let bucket_for_note = if r.note.start_time >= 0 {
                    r.note.start_time / SIMULTANEOUS_TIME_WINDOW_MS
                } else {
                    0
                };
                bucket_for_note == bucket && r.outcome == RuleOutcome::DoNothing && r.note.event_type == crate::kasm_rulez::MidiEventType::Note
            }) {
                if allowed_count < MAX_NOTES_TWO_HANDS_CAN_PLAY {
                    res.outcome = RuleOutcome::DoNothing;
                    res.note_allowed = true;
                    outlet_message!(4, "kasm_rulez: listening: hand drums");
                    allowed_count += 1;
                } else {
                    res.outcome = RuleOutcome::Ignore;
                    res.note_allowed = false;
                    outlet_message!(4, "kasm_rulez: HandDrumsRule: only two drums at a time {}", res.note.note_or_cc);
                }
            }
        }

        unique_results
    }
}
`}
        </code>
      </pre>
      </p>
    <p>
        <pre>
        <code>
          {`
          const MAX_JUMP_HUMAN_COULD_SPIN_SLIDER_FULL_SCALE: i32 = 48; // Realistic human jump for rotary dial (8 to 4 o'clock)

static LAST_KNOWN_CC_VALUES: Lazy<Mutex<[Option<i32>; 128]>> = Lazy::new(|| Mutex::new([None; 128]));

pub struct DialsAndFadersRule {
    pub max_jump: i32,
    pub smooth: bool,
    pub smoothing_rate: i32,
    pub min_smoothing_steps: i32,
}

fn get_cc_values() -> std::sync::MutexGuard<'static, [Option<i32>; 128]> {
    LAST_KNOWN_CC_VALUES.lock().unwrap_or_else(|e| e.into_inner())
}

fn set_cc_values(cc_num: usize, value: i32) {
    get_cc_values()[cc_num] = Some(value);
}

impl InstrumentRule for DialsAndFadersRule {
    fn apply_rule(&self, notes: Vec<NoteData>, _resolve_by: RuleOutcome) -> Vec<RulezResult> {
        if notes.is_empty() || notes[0].event_type != MidiEventType::CC {
            // If not a CC event, pass through unchanged
            return notes.into_iter().map(|note| RulezResult {
                note_allowed: true,
                note,
                outcome: RuleOutcome::DoNothing,
                }).collect();
        }
        let mut results = Vec::new();
        if self.smooth && !notes.is_empty() {
            let curr = &notes[notes.len() - 1];
            let cc_num = curr.note_or_cc as usize % 128;
            let last_value = get_cc_values()[cc_num];
            set_cc_values(cc_num, curr.velocity_or_ccvalue);

            if let Some(prev_velocity) = last_value {
                let jump = (curr.velocity_or_ccvalue - prev_velocity).abs();
                if jump > self.max_jump {
                    outlet_message!(4,
                        "kasm_rulez: EncoderDialsAndFadersRule: impossible encoder dial movement CC#={} value={} jumped more than max {}",
                        curr.note_or_cc, curr.velocity_or_ccvalue, self.max_jump);

                    let value_based_steps = (jump as f32 / self.max_jump as f32).ceil() as i32;
                    let min_steps = self.min_smoothing_steps;
                    let steps = value_based_steps.max(min_steps);
                    for i in 0..=steps {
                        let fraction = if steps == 0 { 1.0 } else { (i as f32) / (steps as f32) };
                        let v = prev_velocity + ((curr.velocity_or_ccvalue - prev_velocity) as f32 * fraction).round() as i32;
                        let mut note = curr.clone();
                        note.velocity_or_ccvalue = v;
                        note.start_time = i * self.smoothing_rate;
                        send_cc(note.note_or_cc, note.velocity_or_ccvalue + 128 /* recurrsion */, note.start_time);
                        results.push(RulezResult {
                            note_allowed: false,
                            note,
                            outcome: RuleOutcome::Smooth,
                        });
                    }
                    return results;
                }
            }
        }
        // No smoothing needed, just clamp if needed
        for mut note in notes {
            let mut outcome = RuleOutcome::DoNothing;
            if note.velocity_or_ccvalue.abs() > self.max_jump {
                note.velocity_or_ccvalue = note.velocity_or_ccvalue.signum() * self.max_jump;
                outcome = RuleOutcome::Smooth;
            }
            let cc_num = note.note_or_cc as usize;
            set_cc_values(cc_num, note.velocity_or_ccvalue);
            results.push(RulezResult { note_allowed: true, note, outcome });
        }
        results
    }
}

impl Default for DialsAndFadersRule {
    fn default() -> Self {
        DialsAndFadersRule { max_jump: MAX_JUMP_HUMAN_COULD_SPIN_SLIDER_FULL_SCALE, smooth: false, smoothing_rate: 20, min_smoothing_steps: 20 }
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
        <LatestDemoRulez/>
    </div>

  );
};

export default RulezDocs;
