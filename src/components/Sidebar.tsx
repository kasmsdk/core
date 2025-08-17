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
          { id: 'all-instruments', label: 'All Instruments', icon: '🎹', description: 'View all available instruments' },
          { id: 'oscillators', label: 'Oscillators', icon: '🎹', description: 'Basic waveform generators' },
          { id: 'synthesizers', label: 'Synthesizers', icon: '🎹', description: 'Complex multi-oscillator synths' },
          { id: 'effects', label: 'Effects', icon: '🎹', description: 'Audio processing effects' },
          { id: 'sequencers', label: 'Sequencers', icon: '📊', description: 'Pattern and sequence generators' },
          { id: 'midi-devices', label: 'MIDI Devices', icon: '🔌', description: 'Connected MIDI controllers' },
          { id: 'presets', label: 'Presets', icon: '💾', description: 'Saved instrument configurations' },
        ];
      case 'tech':
        return [
          { id: 'webmidi', label: 'TechWebMIDI', icon: '🎥', description: 'Everything TechWebMIDI' },
          { id: 'webgpu', label: 'WebGPU', icon: '🎮', description: 'Using GPU compute shaders with music' },
        ];
      default:
        return [
          { id: 'emanator', label: 'Emanations Editor', icon: '🎹', description: 'Emanator editor tool' },
          { id: 'bangaz', label: 'Bangaz Drum Machine', icon: '🎹', description: 'Drum machine pattern editor tool' },
          { id: 'arpy', label: 'Arpy Arpeggiator Editor', icon: '🎹', description: 'Arpeggiator editor tool' },
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
            { id: 'all-instruments' },
            { id: 'oscillators' },
            { id: 'synthesizers' },
            { id: 'effects' },
            { id: 'sequencers' },
            { id: 'midi-devices' },
            { id: 'presets' }
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
              style={{ width: '100%', marginBottom: '1em', background: '#ffe4b5', color: '#3D3426', fontWeight: 'bold' }}
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
