import { useState, useEffect } from 'react';
import TechWebMIDI from './TechWebMIDI.tsx';

type TechModule = 'webmidi' | 'webgpu';

export default function Tech() {
  const [currentModule, setCurrentModule] = useState<TechModule>('webmidi');

  // Handle URL parameters for direct navigation to specific tech modules
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam && ['webmidi'].includes(moduleParam)) {
      setCurrentModule(moduleParam as TechModule);
    }
  }, []);

  const modules = [
    { id: 'webmidi' as TechModule, name: 'WebMIDI', icon: '📡', description: 'TechWebMIDI' },
    { id: 'webgpu' as TechModule, name: 'WebGPU', icon: '📡', description: 'WebGPU' },
  ];

  return (
    <div className="tech-container" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Tech module selector */}
      <div className="tech-selector" style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '15px',
        padding: '1rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{
          color: 'white',
          marginBottom: '1rem',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          🔧 Tech Demos
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setCurrentModule(module.id)}
              style={{
                background: currentModule === module.id
                  ? 'rgba(0, 255, 136, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: currentModule === module.id
                  ? '1px solid rgba(0, 255, 136, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                minWidth: '180px',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (currentModule !== module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentModule !== module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--sandstone-base)' }}>{module.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{module.name}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {module.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#aaa',
          textAlign: 'center'
        }}>
          Giving a home to various tech demos and experiments that might be useful to others.
        </div>
      </div>

      {/* Current module display */}
      <div className="tech-module-display" style={{ width: '100%', height: '100%' }}>
        {currentModule === 'webmidi' && <TechWebMIDI />}
      </div>

      {/* Tech overview info */}
      <div className="tech-info" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '1rem',
        borderRadius: '10px',
        color: 'white',
        maxWidth: '300px'
      }}>
        <h4 style={{ marginBottom: '0.5rem', color: 'var(--sandstone-base)' }}>
          {modules.find(m => m.id === currentModule)?.icon} {modules.find(m => m.id === currentModule)?.name}
        </h4>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.4', margin: 0 }}>
          {currentModule === 'webmidi' && 'How TechWebMIDI works, or at least is supposed to.'}
          {currentModule === 'webgpu' && 'How WebGPU can be used to speed instrument rendering and visualizations up.'}
        </p>
      </div>
    </div>
  );
}
