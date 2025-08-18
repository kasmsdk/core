interface KasmProps {
  onNavigate: (app: string) => void;
}

export default function Kasm({ onNavigate }: KasmProps) {
  return (
    <div className="kasm-landing-container">
      <h1>Kasm SDK</h1>
      <p className="sunken-paragraph">
        The main intention is interoperability between Web Browsers and DAWs using open standards, in particular to make
          head way for Augmented Reality glasses and Virtual Reality headset based instruments. The aim is to achieve this
          by utilising cross platform technologies such as WebAssembly, WebXR, WebGL/WebGPU, WebMIDI and OSC (Open Sound Control)</p>
        <p className="sunken-paragraph">
            The collection has zero formal roadmap, there is no rule book here as o whats the right or wrong way, thare will
            be better ways of doing things, but it's a start. The common goal is ease of open patching, sharing and many
            editor tools to support different use cases and musical genres</p>
        <p className="sunken-paragraph">
      <div className="kasm-demo-buttons">
        <button className="kasm-demo-btn" onClick={() => onNavigate('emanator')}>
            🎹 Emanator
        </button>
        <button className="kasm-demo-btn" onClick={() => onNavigate('bangaz')}>
            🎹 Bangaz
        </button>
        <button className="kasm-demo-btn" onClick={() => onNavigate('arpy')}>
            🎹 Arpy
        </button>
          <button className="kasm-demo-btn" onClick={() => onNavigate('arpy')}>
              🎹 Triggaz
          </button>
      </div>
        </p>
      <div className="kasm-tech-note">
      </div>

      <div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <iframe
          src="https://kasmsdk.github.io/latest/emanator.html"
          title="Kasm Demo"
          width="90%"
          height="1024"
          style={{ border: '2px solid #ccc', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
          allowFullScreen
        />
      </div>
    </div>
  );
}
