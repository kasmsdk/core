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

  // Define navigation items based on app context
  const getNavigationItems = () => {
    switch (appContext) {
      case 'kasm':
        return [
          { id: 'all-instruments', label: 'All Instruments', icon: '🎵', description: 'View all available instruments' },
          { id: 'oscillators', label: 'Oscillators', icon: '〰️', description: 'Basic waveform generators' },
          { id: 'synthesizers', label: 'Synthesizers', icon: '🎹', description: 'Complex multi-oscillator synths' },
          { id: 'effects', label: 'Effects', icon: '🎛️', description: 'Audio processing effects' },
          { id: 'sequencers', label: 'Sequencers', icon: '📊', description: 'Pattern and sequence generators' },
          { id: 'midi-devices', label: 'MIDI Devices', icon: '🔌', description: 'Connected MIDI controllers' },
          { id: 'presets', label: 'Presets', icon: '💾', description: 'Saved instrument configurations' },
        ];

      case 'tech':
        return [
          { id: 'webmidi', label: 'TechWebMIDI', icon: '🎥', description: 'Everything TechWebMIDI' },
          { id: 'webgpu', label: 'WebGPU', icon: '🎮', description: 'Using GPU compute shaders with music' },
        ];

      default: // 'main'
        return [
          { id: 'emanator', label: 'Emanations Editor', icon: '🎼', description: 'Emanator editor tool' },
          { id: 'bangaz', label: 'Bangaz Drum Machine', icon: '🥁', description: 'Drum machine patter editor tool' },
          { id: 'arpy', label: 'Arpy Arpeggiator Editor', icon: '🎼', description: 'Arpeggiator editor tool' },
          // { id: 'kasm', label: 'KASM SDK', icon: '🎵', description: 'Documentation for the Kasm SDK' },
          // { id: 'kasmxr', label: 'Kasm VR/AR MIDI controllers', icon: '🥽', description: 'Augmented and virtual reality MIDI instruments, control and play musical instruments that are not quite all there' },
          // { id: 'tech', label: 'More Tech Demos/Experiments', icon: '🔧', description: 'TechWebMIDI, Ableton SMPTE video sync and more' },
          { id: 'about', label: 'About', icon: 'ℹ️', description: 'Project information and credits' },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleItemClick = (itemId: string) => {
    // Sidebar clicked: itemId (removed console.log for production best practices)
    // In standalone mode (kasm, emanator, tech), treat clicks as filter changes
    if (appContext !== 'main' && onFilterChange) {
      onFilterChange(itemId);
      // Do NOT close sidebar for nested submenus
    } else {
      onAppChange(itemId);
      // Determine if the next context has filters
      let nextContext = itemId;
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
      // If there are no filters to show, close sidebar
      if (nextNavItems.length === 0) {
        setIsOpen(false);
      }
    }
  };

  // Handler to go back to main sidebar
  const handleBackToMain = () => {
    if (onAppChange) {
      onAppChange('bangaz'); // or any default main app
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className={`hamburger-menu ${isOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            <span className="sidebar-icon">🚀</span>
            Kasm SDK
          </h2>
          <button
            className="sidebar-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>
        {/* Back to Main button for nested contexts */}
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

        {/* Navigation Items */}
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
