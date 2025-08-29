import React, { useState } from "react";
import EmanatorDocs from "./EmanatorDocs";
import ArpyDocs from "./ArpyDocs";
import BangazDocs from "./BangazDocs";
import TriggazDocs from "./TriggazDocs";
import CanvasDocs from "./CanvasDocs";
import RulezDocs from "./RulezDocs";
import KrumhanselDocs from "./KrumhanselDocs";

type DocPage =
  | "emanator"
  | "arpy"
  | "bangaz"
  | "triggaz"
  | "canvas"
  | "rulez"
  | "krumhansel";

const Docs: React.FC = () => {
  const [page, setPage] = useState<DocPage>("emanator");

  const renderPage = () => {
    switch (page) {
      case "emanator":
        return <EmanatorDocs />;
      case "arpy":
        return <ArpyDocs />;
      case "bangaz":
        return <BangazDocs />;
      case "triggaz":
        return <TriggazDocs />;
      case "canvas":
        return <CanvasDocs />;
      case "rulez":
        return <RulezDocs />;
      case "krumhansel":
        return <KrumhanselDocs />;
      default:
        return <EmanatorDocs />;
    }
  };

  return (
    <div>
      <h1>Kasm SDK Documentation</h1>
      <nav>
        <button onClick={() => setPage("emanator")}>Emanator</button>
        <button onClick={() => setPage("arpy")}>Arpy</button>
        <button onClick={() => setPage("bangaz")}>Bangaz</button>
        <button onClick={() => setPage("triggaz")}>Triggaz</button>
        <button onClick={() => setPage("canvas")}>Canvas</button>
        <button onClick={() => setPage("rulez")}>Rulez</button>
        <button onClick={() => setPage("krumhansel")}>Krumhansel</button>
      </nav>
      <hr />
      {renderPage()}
    </div>
  );
};

export default Docs;
