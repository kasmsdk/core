import React from 'react';

interface KasmSDKEditorProps {
  title: string;
  description: string;
  icon?: string;
}

const KasmSDKEditor: React.FC<KasmSDKEditorProps> = ({ title, description, icon }) => {
  return (
    <div className="kasmsdk-editor-container">
      <h1>{icon ? <span style={{ marginRight: '0.5em' }}>{icon}</span> : null}{title}</h1>
      <p>{description}</p>
      <div style={{ marginTop: '2em', color: '#888' }}>
        <em>Feature development coming soon...</em>
      </div>
    </div>
  );
};

export default KasmSDKEditor;

