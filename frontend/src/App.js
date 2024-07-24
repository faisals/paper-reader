import React from 'react';
import PDFViewer from './components/PDFViewer';
import TextSimplifier from './components/TextSimplifier';
import './App.css';
import './markdown-styles.css';

function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">Paper Reader</h1>
      <div className="app-content">
        <PDFViewer />
        <TextSimplifier />
      </div>
    </div>
  );
}

export default App;