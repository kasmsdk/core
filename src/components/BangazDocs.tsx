import React from "react";

const BangazDocs: React.FC = () => {
  return (
    <div>
      <h2>Bangaz</h2>
      <p>
        Bangaz is the drum pattern generator in the Kasm SDK. It allows you to
        create and play a variety of drum beats and rhythms.
      </p>

      <h2>How to Use Bangaz</h2>
      <p>
        The Bangaz drum machine is controlled by selecting a drum pattern. Once
        a pattern is selected, the drum machine will start playing in sync with
        the host's transport. You can assign different MIDI notes to each drum
        sound to customize your kit.

          <br/>
          <br/>
          src/emanators/drumpattern.rs
      <pre>
        <code>
          {`
pub fn kasm_emanator_bangaz_1(
    _inlet_0_note: i32,
    _inlet_1_semitone: i32,
    _velocity: i32,
    enc1: i32,
    _enc2: i32,
    step: i32,
    _bar: i32,
) -> i32 {
    // Creative enc1 usage: 100 = normal, <100 = probabilistic beat skipping, >100 = fills and ghost hits
    let enc1_norm = if enc1 <= 100 {
        enc1 as f32 / 100.0 // Linear scaling for 0-100 range
    } else {
        // Exponential scaling for 100-127 range to amplify effect
        let excess = (enc1 - 100) as f32 / 27.0; // 0.0 to 1.0 for range 100-127
        1.0 + excess.powf(1.5) * 2.0 // Scale from 1.0 to 3.0 with exponential curve
    };
    let chaos_factor = (enc1_norm - 1.0).abs(); // Distance from normal (0.0 at enc1=100)

    // Calculate complexity factors based on all input parameters
    let note_complexity = ((_inlet_0_note - 60).max(0) as f32 / 127.0).min(1.0);
    let semitone_complexity = (_inlet_1_semitone.max(0) as f32 / 12.0).min(1.0);
    let combined_complexity = (note_complexity + semitone_complexity + enc1_norm) / 3.0;

    // Mathematical probability functions using golden ratio and prime numbers
    let phi = (1.0 + 5.0_f32.sqrt()) / 2.0; // Golden ratio for natural feel
    let step_f = step as f32;

    // Probability modulation using trigonometric chaos
    let prob_mod = (step_f * phi * 0.1 + chaos_factor * std::f32::consts::PI).sin() * 0.5 + 0.5;

    // Beat probability calculation
    let beat_prob = if enc1 < 100 {
        // Below 100: reduce probability using exponential decay
        enc1_norm.powf(1.5) * (0.7 + prob_mod * 0.3)
    } else {
        1.0 // Always hit main beats when enc1 >= 100
    };

    // Ghost hit probability for enc1 > 100
    let ghost_prob = if enc1 > 100 {
        ((enc1_norm - 1.0) * 2.0).min(1.0) * (0.3 + prob_mod * 0.4)
    } else {
        0.0
    };

    // Fill intensity for enc1 > 100 using Fibonacci-based chaos
    let fib_sequence = [1, 1, 2, 3, 5, 8, 13, 21];
    let fib_index = (step % 8) as usize;
    let fill_trigger = if enc1 > 100 {
        let fill_intensity = ((enc1_norm - 1.0) * 1.5).min(1.0);
        (step % fib_sequence[fib_index] == 0) && (prob_mod > (1.0 - fill_intensity))
    } else {
        false
    };

    // Progressive drum type introduction based on complexity
    let use_advanced_percussion = combined_complexity > 0.6;
    let use_exotic_drums = combined_complexity > 0.7;
    let use_world_percussion = combined_complexity > 0.8;

    // Subtle use of all DrumTypes with probability modulation
    if step % 4 == 0 {
        // Main kick - always respect beat probability
        let kick_vel = 127 + (chaos_factor * 20.0) as i32;
        send_note(get_drum_note(DrumType::Kick), kick_vel.min(127), 0, 100, 30);
        send_note(get_drum_note(DrumType::RideCymbal1), 80, 0, 100, 90); // Ride on downbeat

        // Add BassDrum layer when complexity increases
        if use_advanced_percussion {
            send_note(get_drum_note(DrumType::BassDrum), (kick_vel as f32 * 0.8) as i32, 0, 100, 20);
        }

        // Ghost kick when enc1 > 100
        if ghost_prob > 0.0 && prob_mod < ghost_prob {
            let ghost_delay = ((chaos_factor * 7.0) as i32).max(1);
            if step % ghost_delay == 0 {
                send_note(get_drum_note(DrumType::Kick), 60, 0, 100, 127 - 30);
            }
        }
        return get_drum_note(DrumType::Kick);
    } else if step % 4 == 2 {
        // Snare with probability and ghost hits
        if prob_mod < beat_prob {
            let snare_vel = 127 + (chaos_factor * 15.0) as i32;
            send_note(get_drum_note(DrumType::Snare), snare_vel.min(127), 0, 100, 80);
            send_note(get_drum_note(DrumType::Clap), 90, 0, 100, 100); // Layered clap

            // Add ElectricSnare and SideStick when complexity increases
            if use_advanced_percussion {
                send_note(get_drum_note(DrumType::ElectricSnare), (snare_vel as f32 * 0.6) as i32, 0, 100, 90);
                if step % 8 == 2 {
                    send_note(get_drum_note(DrumType::SideStick), 70, 0, 100, 50);
                }
            }

            // Mathematical ghost snare pattern using prime modulo
            if ghost_prob > 0.3 && step % 7 == 3 {
                send_note(get_drum_note(DrumType::Snare), 45, 0, 100, 64);
            }
        }
        return get_drum_note(DrumType::Snare);
    } else if step % 8 == 3 {
        // Tom patterns with enhanced fills
        if prob_mod < beat_prob || fill_trigger {
            let tom_vel = if fill_trigger { 100 + (chaos_factor * 27.0) as i32 } else { 64 };
            send_note(get_drum_note(DrumType::LowTom), tom_vel.min(127), 0, 100, 64);
            send_note(get_drum_note(DrumType::HiMidTom), 60, 0, 100, 70); // Tom fill

            // Add floor toms when complexity increases
            if use_advanced_percussion {
                send_note(get_drum_note(DrumType::LowFloorTom), (tom_vel as f32 * 0.9) as i32, 0, 100, 40);
                if step % 16 == 3 {
                    send_note(get_drum_note(DrumType::HighFloorTom), (tom_vel as f32 * 0.8) as i32, 0, 100, 90);
                }
            }

            // Complex tom cascade when enc1 is extreme
            if fill_trigger && enc1 > 120 {
                let cascade_pattern = [DrumType::LowTom, DrumType::HiMidTom, DrumType::HighTom];
                for (i, &tom_type) in cascade_pattern.iter().enumerate() {
                    let cascade_vel = (80.0 - i as f32 * 10.0 + chaos_factor * 20.0) as i32;
                    let pan_offset = 64 + (i as i32 * 20 - 20);
                    send_note(get_drum_note(tom_type), cascade_vel.min(127), 0, 100, pan_offset);
                }
            }
        }
        return get_drum_note(DrumType::LowTom);
    } else if step % 8 == 6 {
        if prob_mod < beat_prob {
            send_note(get_drum_note(DrumType::HiMidTom), 127 / 2, 0, 100, 64);
            send_note(get_drum_note(DrumType::HighTom), 60, 0, 100, 80); // Tom fill

            // Add world percussion when complexity is high
            if use_world_percussion && step % 32 == 6 {
                send_note(get_drum_note(DrumType::HiBongo), 75, 0, 100, 85);
                send_note(get_drum_note(DrumType::LowBongo), 70, 0, 100, 75);
            }
        }
        return get_drum_note(DrumType::HiMidTom);
    } else if step % 16 == 9 {
        if prob_mod < beat_prob || fill_trigger {
            let tom_vel = if fill_trigger { 90 } else { 64 };
            send_note(get_drum_note(DrumType::HighTom), tom_vel, 0, 100, 64);
            send_note(get_drum_note(DrumType::Cowbell), 50, 0, 100, 90); // Cowbell accent

            // Add exotic percussion when complexity increases
            if use_exotic_drums {
                send_note(get_drum_note(DrumType::Tambourine), 60, 0, 100, 100);
                if step % 32 == 9 {
                    send_note(get_drum_note(DrumType::Vibraslap), 55, 0, 100, 110);
                }
            }
        }
        return get_drum_note(DrumType::HighTom);
    } else if step % 16 == 13 {
        if prob_mod < beat_prob {
            send_note(get_drum_note(DrumType::Clap), 127 / 2, 0, 100, 64);
            send_note(get_drum_note(DrumType::Cowbell), 127 / 2, 0, 100, 64);
            send_note(get_drum_note(DrumType::RideCymbal1), 60, 0, 100, 110); // Ride fill

            // Add cymbals when complexity increases
            if use_advanced_percussion {
                send_note(get_drum_note(DrumType::CrashCymbal1), 85, 0, 100, 120);
                if step % 64 == 13 {
                    send_note(get_drum_note(DrumType::SplashCymbal), 70, 0, 100, 100);
                }
            }

            // Add exotic cymbals at high complexity
            if use_exotic_drums && step % 128 == 13 {
                send_note(get_drum_note(DrumType::ChineseCymbal), 80, 0, 100, 127);
                send_note(get_drum_note(DrumType::RideBell), 65, 0, 100, 90);
            }
        }
        return get_drum_note(DrumType::Clap);
    }

    // Hi-hat patterns with enc1 modulation
    let hat_skip_prob = if enc1 < 100 {
        1.0 - enc1_norm.powf(0.7) // More skipping as enc1 decreases
    } else {
        0.0
    };

    // Prime number modulo for irregular skipping pattern
    let hat_skip = (step % 23 == 0) && (prob_mod < hat_skip_prob);

    if !hat_skip {
        // Dynamic hi-hat velocity based on enc1 and mathematical chaos
        let hat_vel = if enc1 > 100 {
            // Enhanced velocity with chaos when enc1 > 100
            let base_vel = 64.0 + chaos_factor * 30.0;
            let chaos_mod = (step_f * phi * 0.2).sin() * 15.0;
            (base_vel + chaos_mod) as i32
        } else {
            // Reduced velocity when enc1 < 100
            (64.0 * enc1_norm) as i32
        };

        send_note(get_drum_note(DrumType::ClosedHH), hat_vel.min(127), 0, 100, 64);

        // Add PedalHiHat when complexity increases
        if use_advanced_percussion && step % 8 == 1 {
            send_note(get_drum_note(DrumType::PedalHiHat), (hat_vel as f32 * 0.7) as i32, 0, 100, 45);
        }

        // Mathematical ghost hats using golden ratio
        if ghost_prob > 0.2 && ((step_f * phi) % 11.0) < 2.0 {
            let ghost_hat_vel = (40.0 + chaos_factor * 20.0) as i32;
            let ghost_pan = 64 + ((step_f * phi * 0.1).sin() * 30.0) as i32;
            send_note(get_drum_note(DrumType::ClosedHH), ghost_hat_vel, 0, 100, ghost_pan);
        }
    }

    if step % 2 == 0 && prob_mod < beat_prob {
        send_note(get_drum_note(DrumType::OpenHH), 60, 0, 100, 80);
        send_note(get_drum_note(DrumType::RideCymbal1), 40, 0, 100, 120);

        // Add world percussion patterns at high complexity
        if use_world_percussion {
            // Conga patterns
            if step % 16 == 0 {
                send_note(get_drum_note(DrumType::OpenHiConga), 65, 0, 100, 95);
            } else if step % 16 == 8 {
                send_note(get_drum_note(DrumType::LowConga), 70, 0, 100, 85);
                send_note(get_drum_note(DrumType::MuteHiConga), 60, 0, 100, 75);
            }

            // Timbale accents
            if step % 32 == 16 {
                send_note(get_drum_note(DrumType::HiTimbale), 75, 0, 100, 105);
                send_note(get_drum_note(DrumType::LowTimbale), 70, 0, 100, 95);
            }

            // Add exotic instruments at maximum complexity
            if combined_complexity > 0.8 {
                if step % 64 == 32 {
                    send_note(get_drum_note(DrumType::Maracas), 55, 0, 100, 115);
                    send_note(get_drum_note(DrumType::Cabasa), 50, 0, 100, 105);
                }
                if step % 128 == 64 {
                    send_note(get_drum_note(DrumType::HiAgogo), 60, 0, 100, 110);
                    send_note(get_drum_note(DrumType::LowAgogo), 58, 0, 100, 100);
                }
                if step % 256 == 128 {
                    send_note(get_drum_note(DrumType::Claves), 65, 0, 100, 90);
                    send_note(get_drum_note(DrumType::HiWoodBlock), 60, 0, 100, 80);
                }
            }
        }

        // Complex polyrhythmic fills when enc1 is extreme
        if fill_trigger && enc1 > 130 {
            // Use Euclidean rhythm generation for fills
            let euclidean_hits = ((chaos_factor * 8.0) as i32).max(3);
            let euclidean_steps = 16;
            if (step * euclidean_hits) % euclidean_steps < euclidean_hits {
                let fill_drums = if use_world_percussion {
                    [DrumType::LowTom, DrumType::HiMidTom, DrumType::Clap, DrumType::Cowbell,
                        DrumType::HiBongo, DrumType::LowBongo, DrumType::Tambourine, DrumType::Maracas]
                } else if use_exotic_drums {
                    [DrumType::LowTom, DrumType::HiMidTom, DrumType::Clap, DrumType::Cowbell,
                        DrumType::Tambourine, DrumType::Vibraslap, DrumType::SplashCymbal, DrumType::RideBell]
                } else if use_advanced_percussion {
                    [DrumType::LowTom, DrumType::HiMidTom, DrumType::Clap, DrumType::Cowbell,
                        DrumType::LowFloorTom, DrumType::HighFloorTom, DrumType::ElectricSnare, DrumType::SideStick]
                } else {
                    [DrumType::LowTom, DrumType::HiMidTom, DrumType::Clap, DrumType::Cowbell,
                        DrumType::LowTom, DrumType::HiMidTom, DrumType::Clap, DrumType::Cowbell]
                };

                let drum_idx = ((step / 4) % fill_drums.len() as i32) as usize;
                let fill_vel = (70.0 + chaos_factor * 35.0) as i32;
                let fill_pan = 64 + ((step_f * phi * 0.3).cos() * 50.0) as i32;
                send_note(get_drum_note(fill_drums[drum_idx]), fill_vel.min(127), 0, 100, fill_pan);
            }
        }
    }

    get_drum_note(DrumType::ClosedHH)
}

`}
        </code>
      </pre>
      </p>

        <p>To add your new bangaz emanators to it simply adda short description and you added functions, e.g.<pre><code>
  {`
    pub fn get_emanator_infos() -> Vec<EmanatorInfo> {
        vec![
            EmanatorInfo {
        emanator_idx: MAX4LIVE_UI_BANGAZ_OFFSET_PATTERNS,
        name: "Bangaz 1",
        description: "Classic four-on-the-floor kick/snare with toms, enc1 changes fills/complexity!",
        category: EmanatorCategory::DrumPattern,
        complexity: 2,
        function: kasm_emanator_bangaz_1,
    },
              ...
`}
        </code>
      </pre>
        </p>

        <h2>Drum Kits</h2>
      <p>Bangaz supports several drum kit layouts:
      <ul>
        <li>
          <strong>Ableton Drum Rack:</strong> The default layout for Ableton's
          Drum Racks.
        </li>
        <li>
          <strong>General MIDI Drums:</strong> The standard General MIDI drum
          map.
        </li>
        <li>
          <strong>Arpeggiator:</strong> A melodic layout for playing arpeggios
          with drum sounds.
        </li>
        <li>
          <strong>Shuffle:</strong> A randomized drum kit layout.
        </li>
      </ul>
      </p>

      <h2>Drum Patterns</h2>
      <p>
        Bangaz includes a variety of built-in drum patterns, from simple to
        complex:
      <ul>
        <li>Four-to-the-floor kick</li>
        <li>Kick and snare backbeat</li>
        <li>Basic rock beat with hi-hats</li>
        <li>Syncopated beat with open hi-hats</li>
        <li>Polyrhythmic patterns with toms and percussion</li>
        <li>And many more, accessible through the emanator system.</li>
      </ul>
      </p>
    </div>
  );
};

export default BangazDocs;
