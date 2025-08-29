import { useState, useRef, useEffect } from "react";
import {
  WebGPURenderer,
  createViewMatrix,
  createPerspectiveMatrix,
} from "./utils/webgpuRenderer";
import Kasm from "./components/Kasm";
import Tech from "./components/Tech";
import About from "./components/About";
import Sidebar from "./components/Sidebar";
import Bangaz from "../bangaz/Bangaz";
import Emanator from "../emanator/Emanator";
import Arpy from "../arpy/Arpy";
import Triggaz from "../triggaz/Triggaz";
import LFO from "../lfo/LFO";
import Looper from "./components/Looper";
import Canvas from "./components/Canvas";
import Krumhansel from "./components/Krumhansel";
import JogCanvas from "../latest/JogCanvas";
import Docs from "./components/Docs";
import "./App.css";

function App() {
  const [currentApp, setCurrentApp] = useState<
    | "kasm"
    | "emanator"
    | "tech"
    | "bangaz"
    | "arpy"
    | "about"
    | "triggaz"
    | "lfo"
    | "looper"
    | "jog"
    | "canvas"
    | "krumhansel"
    | "docs"
  >("kasm");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get("app");
    if (
      appParam &&
      [
        "kasm",
        "tech",
        "about",
        "bangaz",
        "arpy",
        "emanator",
        "lfo",
        "looper",
        "jog",
        "canvas",
        "krumhansel",
        "docs",
      ].includes(appParam)
    ) {
      setCurrentApp(appParam as typeof currentApp);
    } else if (appParam && ["webmidi", "webgpu"].includes(appParam)) {
      setCurrentApp("tech");
    }
  }, []);

  const isStandaloneMode = [
    "kasm",
    "emanator",
    "bangaz",
    "arpy",
    "triggaz",
    "lfo",
  ].includes(currentApp);

  const getSidebarContext = (): "main" | "kasm" | "tech" => {
    if (currentApp === "kasm") return "kasm";
    if (currentApp === "tech") return "tech";
    return "main";
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
      const projectionMatrix = createPerspectiveMatrix(
        45 * (Math.PI / 180),
        aspect,
        0.1,
        100
      );
      renderer.render([], viewMatrix, projectionMatrix);
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    initialize();

    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  const handleAppChange = (app: string) => {
    setCurrentApp(app as typeof currentApp);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
          width: "100vw",
          height: "100vh",
        }}
      />
      <div className="App">
        <Sidebar
          currentApp={currentApp}
          onAppChange={handleAppChange}
          appContext={getSidebarContext()}
        />
        <div
          className={`app-content ${isStandaloneMode ? "standalone-mode" : ""}`}
        >
          {currentApp === "bangaz" && <Bangaz />}
          {currentApp === "arpy" && <Arpy />}
          {currentApp === "triggaz" && <Triggaz />}
          {currentApp === "kasm" && <Kasm onNavigate={handleAppChange} />}
          {currentApp === "emanator" && <Emanator />}
          {currentApp === "tech" && <Tech />}
          {currentApp === "about" && <About />}
          {currentApp === "lfo" && <LFO />}
          {currentApp === "looper" && <Looper />}
          {currentApp === "jog" && <JogCanvas />}
          {currentApp === "canvas" && <Canvas />}
          {currentApp === "krumhansel" && <Krumhansel />}
          {currentApp === "docs" && <Docs />}
        </div>
      </div>
    </>
  );
}

export default App;
