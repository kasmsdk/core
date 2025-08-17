import { useState, useEffect } from 'react';
import TechWebMIDI from './TechWebMIDI.tsx';
import TechWebGPU from './TechWebGPU.tsx';

type TechModule = 'webmidi' | 'webgpu';

export default function Tech() {
  const [currentModule, setCurrentModule] = useState<TechModule>('webmidi');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module');
    if (moduleParam && ['webmidi'].includes(moduleParam)) {
      setCurrentModule(moduleParam as TechModule);
    }
  }, []);

  const modules = [
    { id: 'webmidi' as TechModule, name: 'WebMIDI', icon: '📡', description: 'WebMIDI' },
    { id: 'webgpu' as TechModule, name: 'WebGPU', icon: '📡', description: 'WebGPU' },
  ];

  return (
    <div className="tech-container">
      <div className="tech-selector">
        <h3>🔧 Tech Demos</h3>
        <div className="tech-selector-list">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`tech-selector-btn${currentModule === module.id ? ' active' : ''}`}
              onClick={() => setCurrentModule(module.id)}
            >
              <div className="tech-selector-btn-content">
                <span className="tech-selector-icon">{module.icon}</span>
                <div>
                  <div className="tech-selector-name">{module.name}</div>
                  <div className="tech-selector-description">{module.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="tech-selector-info">
          Giving a home to various tech demos and experiments that might be useful to others.
        </div>
      </div>
      <div className="tech-module-display">
        {currentModule === 'webmidi' && <TechWebMIDI />}
        {currentModule === 'webgpu' && <TechWebGPU />}
      </div>
      <div className="tech-info">
        <h4 style={{ color: 'var(--sandstone-base)' }}>
          {modules.find(m => m.id === currentModule)?.icon} {modules.find(m => m.id === currentModule)?.name}
        </h4>
        <p>
          {currentModule === 'webmidi' && 'How TechWebMIDI works, or at least is supposed to.'}
          {currentModule === 'webgpu' && 'How WebGPU can be used to speed instrument rendering and visualizations up.'}
        </p>
      </div>
    </div>
  );
}
