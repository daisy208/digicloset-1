// admin-ui/App.jsx
// Minimal React + Polaris admin UI shell
import React from 'react';
// TODO: import Polaris components as needed

export default function App() {
  // TODO: Fetch and display app status, merchantId
  return (
    <div style={{ padding: 32 }}>
      <h1>DigiCloset App Installed</h1>
      <p>Status: <b>Connected</b> {/* TODO: dynamic status */}</p>
      <p>Merchant ID: {/* TODO: show merchantId */}</p>
      <hr />
      <h2>Billing</h2>
      <p>Coming soon...</p>
    </div>
  );
}
