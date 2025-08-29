import { useState } from 'react';
import NewsNewFeatures from './NewsNewFeatures';
import LatestDemo from './LatestDemo';
import EmanatorDocs from './EmanatorDocs';
import ArpyDocs from './ArpyDocs';
import BangazDocs from './BangazDocs';
import TriggazDocs from './TriggazDocs';
import LFODocs from './LFODocs';
import LooperDocs from './LooperDocs';
import CanvasDocs from './CanvasDocs';
import RulezDocs from './RulezDocs';
import KrumhanselDocs from './KrumhanselDocs';
import './Kasm.css';

interface KasmProps {
  onNavigate: (app: string) => void;
}

// Add type for active section

type DocPage =
  | 'emanator'
  | 'arpy'
  | 'bangaz'
  | 'triggaz'
  | 'canvas'
  | 'rulez'
  | 'krumhansel'
  | 'lfo'
  | 'looper';

type ActiveSection = 'whatsnew' | DocPage;

export default function Kasm({ onNavigate }: KasmProps) {
  // Helper to generate a random offset for the background texture
  function getRandomOffset() {
    const x = Math.floor(Math.random() * 200); // px
    const y = Math.floor(Math.random() * 200); // px
    return `${x}px ${y}px`;
  }

  // Use activeSection state instead of docPage
  const [activeSection, setActiveSection] = useState<ActiveSection>('whatsnew');

  function renderDocPage(page: DocPage) {
    switch (page) {
      case 'emanator':
        return <EmanatorDocs />;
      case 'arpy':
        return <ArpyDocs />;
      case 'bangaz':
        return <BangazDocs />;
      case 'triggaz':
        return <TriggazDocs />;
      case 'canvas':
        return <CanvasDocs />;
      case 'rulez':
        return <RulezDocs />;
      case 'krumhansel':
        return <KrumhanselDocs />;
      case 'lfo':
        return <LFODocs />;
      case 'looper':
        return <LooperDocs />;
      default:
        return <EmanatorDocs />;
    }
  }

  return (
    <div className="kasm-landing-container">
      <h1>Kasm SDK</h1>
      <p style={{ backgroundPosition: getRandomOffset() }}>
        The main intention is interoperability between Web Browsers and DAWs using open standards, in particular to make
        head way for Augmented Reality glasses and Virtual Reality headset based instruments. The aim is to achieve this
        by utilising cross platform technologies such as WebAssembly, WebXR, WebGL/WebGPU, WebMIDI and OSC (Open Sound Control)
      </p>
      <p style={{ backgroundPosition: getRandomOffset() }}>
        The collection has zero formal roadmap, there is no rule book here as to what's right or wrong way, there will
        certainly be better ways of doing things, but it's a start. The common goal here is ease of open patching and
        sharing of editor tools to support the many different use cases and musical genres
      </p>
      <div style={{ backgroundPosition: getRandomOffset() }}>
        <nav>
          <div className="kasm-demo-buttons">
            <div className="kasm-demo-buttons-group">
              {/* What's new button */}
              <button
                className={`kasm-demo-btn${activeSection === 'whatsnew' ? ' active' : ''}`}
                onClick={() => setActiveSection('whatsnew')}
              >
                📰 <br />What's<br/>New
              </button>
            </div>
            <div className="kasm-demo-buttons-group">
              <button className="kasm-demo-btn" onClick={() => onNavigate('emanator')}>
                🎹 <br/>Emanator
              </button>
              <button className="kasm-demo-btn" onClick={() => setActiveSection('emanator')}>📖 <br/>Emanator<br/>Docs</button>
            </div>
            <div className="kasm-demo-buttons-group">
              <button className="kasm-demo-btn" onClick={() => onNavigate('bangaz')}>
                🎹 <br/>Bangaz
              </button>
              <button className="kasm-demo-btn" onClick={() => setActiveSection('bangaz')}>📖 <br/>Bangaz<br/>Docs</button>
            </div>
            <div className="kasm-demo-buttons-group">
              <button className="kasm-demo-btn" onClick={() => onNavigate('arpy')}>
                🎹 <br/>Arpy
              </button>
              <button className="kasm-demo-btn" onClick={() => setActiveSection('arpy')}>📖 <br/>Arpy<br/>Docs</button>
            </div>
            <div className="kasm-demo-buttons-group">
              <button className="kasm-demo-btn" onClick={() => onNavigate('triggaz')}>
                🎹 <br/>Triggaz
              </button>
              <button className="kasm-demo-btn" onClick={() => setActiveSection('triggaz')}>📖 <br/>Triggaz<br/>Docs</button>
            </div>
            <div className="kasm-demo-buttons-group">
              <button className="kasm-demo-btn" onClick={() => onNavigate('lfo')}>
                🎹 <br/>MIDI LFO
              </button>
              <button className="kasm-demo-btn" onClick={() => setActiveSection('lfo')}>📖 <br/>LFO<br/>Docs</button>
            </div>
            <div className="kasm-demo-buttons-group">
              <button className="kasm-demo-btn" onClick={() => onNavigate('looper')}>
                🎹 <br/>MIDI Looper
              </button>
              <button className="kasm-demo-btn" onClick={() => setActiveSection('looper')}>📖 <br/>Looper<br/>Docs</button>
            </div>
            <button className="kasm-demo-btn" onClick={() => setActiveSection('canvas')}>📖 <br/>Canvas<br/>Docs</button>
            <button className="kasm-demo-btn" onClick={() => setActiveSection('rulez')}>📖 <br/>Rulez<br/>Docs</button>
            <button className="kasm-demo-btn" onClick={() => setActiveSection('krumhansel')}>📖 <br/>Key/Chord<br/>Docs</button>
          </div>
        </nav>
      </div>

      {/* Show NewsNewFeatures only if activeSection is 'whatsnew' */}
      {activeSection === 'whatsnew' && <NewsNewFeatures />}

      <div className="kasm-docs-section">
        {/* Show doc page only if activeSection is a docPage */}
        {activeSection !== 'whatsnew' && renderDocPage(activeSection as DocPage)}
      </div>

      <LatestDemo />
    </div>
  );
}
