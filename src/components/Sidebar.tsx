import { useState } from "react";
import "./Sidebar.css";

interface SidebarProps {
  currentApp: string;
  onAppChange: (app: string) => void;
  appContext?: "main" | "kasm" | "tech";
  onFilterChange?: (filter: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentApp,
  onAppChange,
  appContext = "main",
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Local state, default closed

  const getNavigationItems = () => {
    switch (appContext) {
      case "kasm":
      default:
        return [
          {
            id: "kasm",
            label: "Kasm SDK",
            icon: "🎹",
            description: "Documentatin for the Kasm SDK",
          },
          {
            id: "emanator",
            label: "Emanator",
            icon: "🎹",
            description: "Emanator editor tool",
          },
          {
            id: "bangaz",
            label: "Bangaz",
            icon: "🎹",
            description: "Drum Machine pattern editor tool",
          },
          {
            id: "arpy",
            label: "Arpy",
            icon: "🎹",
            description: "Arpeggiaor editor tool",
          },
          {
            id: "triggaz",
            label: "Triggaz",
            icon: "🎹",
            description: "MIDI note/cc pattern detection",
          },
          {
            id: "lfo",
            label: "LFO",
            icon: "🎹",
            description: "Low Frequecy Oscillators editor",
          },
          {
            id: "docs",
            label: "Docs",
            icon: "📚",
            description: "Kasm SDK Documentation",
          },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleItemClick = (itemId: string) => {
    if (appContext !== "main" && onFilterChange) {
      onFilterChange(itemId);
    } else {
      onAppChange(itemId);
      const nextContext = itemId;
      let nextNavItems;
      switch (nextContext) {
        case "kasm":
          nextNavItems = [
            { id: "kasm_emanator" },
            { id: "oscillators" },
            { id: "kasm_lfo" },
            { id: "effects" },
            { id: "kasm_canvas" },
            { id: "kasm_jog" },
            { id: "kasm_emanator_trans" },
          ];
          break;
        case "tech":
          nextNavItems = [{ id: "webmidi" }, { id: "webgpu" }];
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
      onAppChange("bangaz");
    }
  };

  return (
    <>
      {/* Hamburger button: always rendered, only hidden by CSS on desktop */}
      <button
        className={`hamburger-menu${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}
      <nav className={`sidebar${isOpen ? " open" : ""}`}>
        <div className="sidebar-content">
          <div className="sidebar-header"></div>
          {appContext !== "main" && (
            <div className="sidebar-back-main">
              <button
                className="nav-link-back"
                style={{
                  width: "100%",
                  marginBottom: "1em",
                  color: "#ffffff",
                  fontWeight: "bold",
                  borderRadius: 0,
                }}
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
                    className={`nav-link ${
                      currentApp === item.id ? "active" : ""
                    }`}
                    onClick={() => handleItemClick(item.id)}
                    aria-current={currentApp === item.id ? "page" : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">
                        {item.description}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
