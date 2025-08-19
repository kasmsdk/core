declare global {
  interface Window {
    inlet_5_emanator?: string | number;
    update_canvas_data?: (data: { note: number; velocity: number }) => void;
  }
}

// Utility for setting inlet_5_emanator and sending middle C note
export function setEmanatorAndSendMiddleC(value: string | number) {
  // Set the value for inlet_5_emanator (implementation depends on your app's state management)
  window.inlet_5_emanator = value;
  // Call update_canvas_data to send middle C note (MIDI note 60)
  if (typeof window.update_canvas_data === 'function') {
    window.update_canvas_data({ note: 60, velocity: 127 });
  }
}
