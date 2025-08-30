import React from "react";

const CanvasDocs: React.FC = () => {
  return (
    <div>
      <h2>Canvas</h2>
      <p>
        The Canvas mechanism in the Kasm SDK is used to create visualizers for
        MIDI data. It provides a way to draw and animate graphics in response to
        MIDI events.
      </p>

      <h2>How the Canvas Works</h2>
      <p>
        The Kasm Canvas is a 2D drawing surface that you can use to create
        real-time visualizations of MIDI data. It's built on the HTML5 Canvas
        API and is controlled from your Rust code. When you send MIDI data to
        the canvas, it creates animated "glows" that represent the notes and CC
        messages.

          <br/>
          <br/>
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
      <pre>
        <code>
          {`
fn render_frame() {
    let window = match web_sys::window() {
        Some(w) => w,
        None => return,
    };

    let document = match window.document() {
        Some(d) => d,
        None => return,
    };

    let canvas = match document.get_element_by_id("kasmHTMLCanvas") {
        Some(c) => match c.dyn_into::<HtmlCanvasElement>() {
            Ok(canvas) => canvas,
            Err(_) => return,
        },
        None => return,
    };

    let context = match canvas.get_context("2d") {
        Ok(Some(ctx)) => match ctx.dyn_into::<CanvasRenderingContext2d>() {
            Ok(context) => context,
            Err(_) => return,
        },
        _ => return,
    };

    let width = *CANVAS_WIDTH.lock().unwrap() as f64;
    let height = *CANVAS_HEIGHT.lock().unwrap() as f64;
    let min_dim = width.min(height);

    // Clear canvas
    context.clear_rect(0.0, 0.0, width, height);

    let centre_x = width / 2.0;
    let centre_y = height / 2.0;

    // Draw circle
    context.set_fill_style_str("#444");
    context.begin_path();
    let _ = context.arc(centre_x, centre_y, min_dim * 0.20, 0.0, 2.0 * std::f64::consts::PI);
    context.fill();

    // Draw text
    context.set_fill_style_str("#aaa");
    context.set_font("10px Arial");
    context.set_text_align("center");
    let _ = context.fill_text("Kasm", centre_x, centre_y + 3.0);
    context.set_text_align("start"); // Reset
}
`}
        </code>
      </pre>
      </p>
        <h2>Example Canvas Visualizers</h2>
        <p>
            <ul>
            <li>Emanator - shows notes and CC data as squares and circles in an live animation.</li>
            <li>Arpy - show held notes and how they are being played out in the sequence.</li>
            <li>Jog - shows motion video behind the apreggiator visualizer</li>
            </ul>
        </p>
    </div>
  );
};

export default CanvasDocs;
