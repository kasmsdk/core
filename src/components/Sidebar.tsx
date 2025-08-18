import { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentApp: string;
  onAppChange: (app: string) => void;
  appContext?: 'main' | 'kasm' | 'tech';
  onFilterChange?: (filter: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentApp, onAppChange, appContext = 'main', onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getNavigationItems = () => {
    switch (appContext) {
      case 'kasm':
        return [
          { id: 'emanator', label: 'Kasm Emanator', icon: '🎹', description: 'Melodic pattern generator' },
          { id: 'emanator_trans', label: 'Kasm Rust Emanator MIDI Transformation', icon: '🎹', description: 'Ableton Live ClipView transformation' },
          { id: 'emanator_gen', label: 'Kasm Rust Emanator Ableton MIDI Generative', icon: '🎹', description: 'Ableton Live ClipView generative' },
          { id: 'triggaz', label: 'Kasm Triggaz', icon: '🎹', description: 'Triggers MIDI note/cc pattern detection editor tool' },
          { id: 'bangaz', label: 'Kasm Bangaz', icon: '🎹', description: 'Ableton Drum Rack drum machine' },
          { id: 'kasm_lfo', label: 'Kasm LFO', icon: '🎹', description: 'Algorithmic LFO generator' },
          { id: 'kasm_lfo', label: 'Kasm LFO', icon: '🎹', description: 'Algorithmic LFO generator' },
          { id: 'arpy', label: 'Kasm Arpy', icon: '🎹', description: 'Arpeggiator sequencer based on keys held' },
          { id: 'kasm_canvas', label: 'Kasm Canvas', icon: '🎹', description: 'Visualizers for Kasm devices' },
          { id: 'kasm_jog', label: 'Kasm Jog', icon: '🎹', description: 'Motion video support for Kasm Canvas' },
        ];
      case 'tech':
        return [
          { id: 'webmidi', label: 'TechWebMIDI', icon: '🎥', description: 'Everything TechWebMIDI' },
          { id: 'webgpu', label: 'WebGPU', icon: '🎮', description: 'Using GPU compute shaders with music' },
        ];
      default:
        return [
          { id: 'kasm', label: 'Kasm SDK', icon: '🎹', description: 'Documentation for the Kasm SDK' },
          { id: 'emanator', label: 'Emanations Editor', icon: '🎹', description: 'Emanator editor tool' },
          { id: 'bangaz', label: 'Bangaz Drum Machine', icon: '🎹', description: 'Drum machine pattern editor tool' },
          { id: 'arpy', label: 'Arpy Arpeggiator Editor', icon: '🎹', description: 'Arpeggiator editor tool' },
          { id: 'triggaz', label: 'Triggers Editor', icon: '🎹', description: 'Triggers MIDI note/cc pattern detection editor tool' },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleItemClick = (itemId: string) => {
    if (appContext !== 'main' && onFilterChange) {
      onFilterChange(itemId);
    } else {
      onAppChange(itemId);
      const nextContext = itemId;
      let nextNavItems;
      switch (nextContext) {
        case 'kasm':
          nextNavItems = [
            { id: 'kasm_emanator' },
            { id: 'oscillators' },
            { id: 'kasm_lfo' },
            { id: 'effects' },
            { id: 'kasm_canvas' },
            { id: 'kasm_jog' },
            { id: 'kasm_emanator_trans' }
          ];
          break;
        case 'tech':
          nextNavItems = [
            { id: 'webmidi' },
            { id: 'webgpu' }
          ];
          break;
        default:
          nextNavItems = [];
      }
      if (nextNavItems.length === 0) {
        setIsOpen(false);
      }
    }
  };

  const handleBackToMain = () => {
    if (onAppChange) {
      onAppChange('bangaz');
    }
  };

  return (
    <>
      {/* Hamburger button: always rendered, only hidden by CSS on desktop */}
      <button
        className={`hamburger-menu${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      <nav className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            Kasm SDK
          </h2>
        </div>
        {appContext !== 'main' && (
          <div className="sidebar-back-main">
            <button
              className="nav-link"
              style={{ width: '100%', marginBottom: '1em', background: '#ffe4b5', color: '#3D3426', fontWeight: 'bold', borderRadius: 0 }}
              onClick={handleBackToMain}
            >
              ← Back to Main
            </button>
          </div>
        )}
        <div className="sidebar-nav">
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.id} className="nav-item">
                <button
                  className={`nav-link ${currentApp === item.id ? 'active' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                  aria-current={currentApp === item.id ? 'page' : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
