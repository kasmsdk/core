interface KasmProps {
  onNavigate: (app: string) => void;
}

export default function Kasm({ onNavigate }: KasmProps) {
  // Helper to generate a random offset for the background texture
  function getRandomOffset() {
    const x = Math.floor(Math.random() * 200); // px
    const y = Math.floor(Math.random() * 200); // px
    return `${x}px ${y}px`;
  }

  return (
    <div className="kasm-landing-container">
      <h1>Kasm SDK</h1>
      <p className="sunken-paragraph" style={{ backgroundPosition: getRandomOffset() }}>
        The main intention is interoperability between Web Browsers and DAWs using open standards, in particular to make
        head way for Augmented Reality glasses and Virtual Reality headset based instruments. The aim is to achieve this
        by utilising cross platform technologies such as WebAssembly, WebXR, WebGL/WebGPU, WebMIDI and OSC (Open Sound Control)
      </p>
      <p className="sunken-paragraph" style={{ backgroundPosition: getRandomOffset() }}>
        The collection has zero formal roadmap, there is no rule book here as to what's right or wrong way, there will
        certainly be better ways of doing things, but it's a start. The common goal here is ease of open patching and
        sharing of editor tools to support the many different use cases and musical genres
      </p>
      <div className="sunken-paragraph" style={{ backgroundPosition: getRandomOffset() }}>
        <div className="kasm-demo-buttons">
          <button className="kasm-demo-btn" onClick={() => onNavigate('emanator')}>
            🎹 <br/>Emanator
          </button>
          <button className="kasm-demo-btn" onClick={() => onNavigate('bangaz')}>
            🎹 <br/>Bangaz
          </button>
          <button className="kasm-demo-btn" onClick={() => onNavigate('arpy')}>
            🎹 <br/>Arpy
          </button>
          <button className="kasm-demo-btn" onClick={() => onNavigate('arpy')}>
            🎹 <br/>Triggaz
          </button>
        </div>
      </div>
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
