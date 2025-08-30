import React from 'react';

interface KasmBuyButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Button to buy and get updates to the Kasm SDK.
 * Opens the Pyrmont Brewery Kasm SDK page in a new tab.
 */
const KasmBuyButton: React.FC<KasmBuyButtonProps> = ({ className = '', style }) => (
  <button
    className={`kasm-demo-btn-cart ${className}`.trim()}
    style={style}
    onClick={() => window.open('https://pyrmontbrewery.com/get_kasm', '_blank')}
    title="Buy and get updates to the Kasm SDK"
  >
    🛒 <br />Buy<br/>Kasm
  </button>
);

export default KasmBuyButton;

