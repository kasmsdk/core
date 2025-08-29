import React from "react";

const CanvasDocs: React.FC = () => {
  return (
    <div>
      <h1>Canvas Documentation</h1>
      <p>
        The Canvas mechanism in the Kasm SDK is used to create visualizers for
        MIDI data. It provides a way to draw and animate graphics in response to
        MIDI events.
      </p>
      <p>
        This documentation will explain how to use the Canvas to create your own
        custom visualizers.
      </p>

      <h2>How the Canvas Works</h2>
      <p>
        The Kasm Canvas is a 2D drawing surface that you can use to create
        real-time visualizations of MIDI data. It's built on the HTML5 Canvas
        API and is controlled from your Rust code. When you send MIDI data to
        the canvas, it creates animated "glows" that represent the notes and CC
        messages.
      </p>
      <p>
        The canvas displays MIDI notes as squares and CC messages as circles.
        The color of the glow is determined by the note's pitch, and the size is
        determined by its velocity. The position of the glow is determined by
        the note's pan position (for CCs) or spread across the canvas by pitch
        (for notes).
      </p>

      <h2>How to Use the Canvas</h2>
      <p>
        To use the canvas, you first need to initialize it with a specific width
        and height. Then, you can send MIDI data to it using the{" "}
        <code>update_canvas_data</code> function.
      </p>
      <pre>
        <code>
          {`
// Rust example of using the Canvas
use kasm_sdk::canvas::{init_kasm_canvas, update_canvas_data};

fn initialize_visualizer() {
    // Initialize the canvas with a size of 300x200 pixels
    init_kasm_canvas(300, 200);
}

fn visualize_midi_note(note: i32, velocity: i32) {
    // Send a note-on message to the canvas
    // The 'is_cc' parameter is false for MIDI notes
    update_canvas_data(note, velocity, false);
}

fn visualize_cc_message(cc_number: i32, value: i32) {
    // Send a CC message to the canvas
    // The 'is_cc' parameter is true for CC messages
    update_canvas_data(cc_number, value, true);
}
`}
        </code>
      </pre>
    </div>
  );
};

export default CanvasDocs;
