import React from "react";
import LatestDemoArpy from "./LatestDemoArpy.tsx";

const ArpyDocs: React.FC = () => {
  return (
    <div>
      <h2>Arpy</h2>
      <p>
        Arpy is the arpeggiator engine in the Kasm SDK. It provides a powerful
        and flexible way to create complex arpeggios and sequences.
      </p>

      <h2>How to Use Arpy</h2>
      <p>
        The Arpy engine is controlled through MIDI note messages. When Arpy is
        active, incoming MIDI note-on messages add notes to the arpeggiator's
        chord, and note-off messages remove them. The arpeggiator then generates
        a sequence based on the currently held notes and the selected mode.
        <br/>
        <br/>
        src/kasm_arpeggiator.rs
      <pre>
        <code>
          {`
fn generate_note_sequence() -> Vec<i32> {
    let held_notes = HELD_NOTES.lock().unwrap();
    let mode = *ARPEGGIATOR_MODE.lock().unwrap();

    let notes: Vec<i32> = held_notes.iter().map(|n| n.note).collect();

    match mode {
        ArpeggiatorMode::Up => notes,
        ArpeggiatorMode::Down => {
            let mut reversed = notes;
            reversed.reverse();
            reversed
        },
        ArpeggiatorMode::UpDown => {
            let mut sequence = notes.clone();
            let mut down = notes;
            down.reverse();
            if down.len() > 1 {
                down.remove(0); // Remove duplicate of highest note
            }
            if sequence.len() > 1 {
                down.remove(down.len() - 1); // Remove duplicate of lowest note
            }
            sequence.extend(down);
            sequence
        },
        ArpeggiatorMode::DownUp => {
            let mut sequence = notes.clone();
            sequence.reverse();
            let mut up = notes;
            if up.len() > 1 {
                up.remove(0); // Remove duplicate of lowest note
            }
            if sequence.len() > 1 {
                up.remove(up.len() - 1); // Remove duplicate of highest note
            }
            sequence.extend(up);
            sequence
        },
        ArpeggiatorMode::Random => {
            let mut rng = crate::SimpleRng::new(get_current_time_ms() as u32);
            let mut shuffled = notes;
            let len = shuffled.len();
            for i in 0..len {
                let j = (rng.next() as usize) % len;
                shuffled.swap(i, j);
            }
            shuffled
        },
        ...
`}
        </code>
      </pre>
      </p>

      <h2>Arpeggiator Modes</h2>
      <p>Arpy includes a wide variety of arpeggiator modes:<br/>
      <ul>
        <li>Up</li>
        <li>Down</li>
        <li>UpDown</li>
        <li>DownUp</li>
        <li>Random</li>
        <li>Flow</li>
        <li>UpIn</li>
        <li>DownIn</li>
        <li>ExpandingUp</li>
        <li>ExpandingDown</li>
        <li>LowAndUp</li>
        <li>LowAndDown</li>
        <li>HiAndUp</li>
        <li>HiAndDown</li>
        <li>Chord</li>
        <li>Octaves</li>
        <li>UpDownRepeat</li>
        <li>DownUpRepeat</li>
        <li>DoubledUp</li>
        <li>DoubledDown</li>
        <li>Converge</li>
        <li>Diverge</li>
        <li>ConvergeDiverge</li>
        ... etc
      </ul>
      </p>

      <LatestDemoArpy/>Q
    </div>
  );
};

export default ArpyDocs;
