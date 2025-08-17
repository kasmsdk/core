import { useState, useRef, useEffect } from 'react';
import { WebGPURenderer, createViewMatrix, createPerspectiveMatrix } from './utils/webgpuRenderer';
import Kasm from './components/Kasm';
import Tech from './components/Tech';
import About from './components/About';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [currentApp, setCurrentApp] = useState<'kasm' | 'emanator' | 'tech' | 'bangaz' | 'arpy' | 'about' | 'ar' | 'brewers-reference'>('bangaz');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle URL parameters for direct navigation from landing pages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app');
    if (appParam && ['kasm', 'tech', 'about', 'bangaz', 'arpy'].includes(appParam)) {
      setCurrentApp(appParam as 'kasm' | 'tech' | 'about' | 'bangaz' | 'arpy');
    } else if (appParam && ['webmidi', 'webgpu'].includes(appParam)) {
      // Redirect individual tech modules to the Tech component
      setCurrentApp('tech');
    }
  }, []);

  // Debug log to track currentApp changes
  useEffect(() => {
    console.log('Current app:', currentApp);
  }, [currentApp]);

  // Determine if we're in standalone mode (kasm or emanator)
  const isStandaloneMode = currentApp === 'kasm' || currentApp === 'emanator';

  // Get the appropriate app context for the sidebar
  const getSidebarContext = (): 'main' | 'kasm' | 'tech' => {
    if (currentApp === 'kasm') return 'kasm';
    if (currentApp === 'tech') return 'tech';
    return 'main';
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new WebGPURenderer(canvas);
    let animationFrameId: number;

    const initialize = async () => {
      const supported = await renderer.initialize();
      if (supported) {
        renderer.resize(window.innerWidth, window.innerHeight);
        renderLoop();
      }
    };

    const renderLoop = () => {
      const eye: [number, number, number] = [0, 0, 5];
      const target: [number, number, number] = [0, 0, 0];
      const up: [number, number, number] = [0, 1, 0];
      const viewMatrix = createViewMatrix(eye, target, up);
      const aspect = window.innerWidth / window.innerHeight;
      const projectionMatrix = createPerspectiveMatrix(45 * (Math.PI / 180), aspect, 0.1, 100);

      renderer.render([], viewMatrix, projectionMatrix);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    initialize();

    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  const handleAppChange = (app: string) => {
    setCurrentApp(app as 'kasm' | 'tech' | 'about' | 'emanator' | 'bangaz' | 'arpy');
  };

  // Main Content Area
  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, width: '100vw', height: '100vh' }} />
      <div className="App">
        {/* Sidebar Navigation */}
        <Sidebar
          currentApp={currentApp}
          onAppChange={handleAppChange}
          appContext={getSidebarContext()}
        />

        {/* Main Content Area */}
        <div className={`app-content ${isStandaloneMode ? 'standalone-mode' : ''}`}>
          {/* Main App Routing - Emanator removed */}
          {currentApp === 'bangaz' && <div>Bangaz app is now managed as a submodule.</div>}
          {currentApp === 'arpy' && <div>Arpy app is now managed as a submodule.</div>}
          {currentApp === 'kasm' && <Kasm />}
          {currentApp === 'emanator' && <div>Emanator app is now managed as a submodule.</div>}
          {currentApp === 'tech' && <Tech />}
          {currentApp === 'about' && <About />}
        </div>
      </div>
    </>
  );
}

export default App;
