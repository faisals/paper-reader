import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import './pdf-worker'; // Import the worker setup
// import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Ensure the workerSrc is set correctly
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [simplificationLevel, setSimplificationLevel] = useState('medium');
  const [history, setHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      setSelectedText(selectedText);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setPdfFile(file);
    setSelectedText('');
    setSimplifiedText('');
    setPageNumber(1);
    setHistory([]);
    setCurrentHistoryIndex(-1);
  };

  const handleSimplify = async () => {
    if (!selectedText) {
      alert('Please select some text from the PDF to simplify.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5001/simplify', {
        text: selectedText,
        context: "This text is part of an academic paper. Please simplify it while maintaining its academic integrity and key points.",
        level: simplificationLevel
      });
      const newSimplifiedText = response.data.simplifiedText;
      const newHistoryItem = {
        selectedText,
        simplifiedText: newSimplifiedText,
        level: simplificationLevel,
        pageNumber: pageNumber
      };
      setHistory(prevHistory => [...prevHistory.slice(0, currentHistoryIndex + 1), newHistoryItem]);
      setCurrentHistoryIndex(prevIndex => prevIndex + 1);
      setSimplifiedText(newSimplifiedText);
    } catch (error) {
      console.error('Error simplifying text:', error);
      setSimplifiedText('Failed to simplify the text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousHistory = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prevIndex => prevIndex - 1);
      const prevItem = history[currentHistoryIndex - 1];
      setSelectedText(prevItem.selectedText);
      setSimplifiedText(prevItem.simplifiedText);
      setSimplificationLevel(prevItem.level);
      setPageNumber(prevItem.pageNumber);
    }
  };

  const goToNextHistory = () => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(prevIndex => prevIndex + 1);
      const nextItem = history[currentHistoryIndex + 1];
      setSelectedText(nextItem.selectedText);
      setSimplifiedText(nextItem.simplifiedText);
      setSimplificationLevel(nextItem.level);
      setPageNumber(nextItem.pageNumber);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error while loading document:', error);
    setPdfError(error.message);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Paper Reader</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input type="file" onChange={handleFileChange} accept=".pdf" style={{ padding: '0.5rem' }} />
        <select 
          value={simplificationLevel} 
          onChange={(e) => setSimplificationLevel(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="advanced">Advanced</option>
        </select>
        <button 
          onClick={handleSimplify} 
          disabled={!selectedText || isLoading}
          style={{ padding: '0.5rem 1rem', backgroundColor: !selectedText || isLoading ? '#ccc' : '#4299e1', color: 'white', border: 'none', borderRadius: '0.25rem' }}
        >
          {isLoading ? 'Processing...' : 'Simplify Selected Text'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setScale(scale - 0.1)} style={{ padding: '0.5rem', backgroundColor: '#edf2f7', borderRadius: '0.25rem' }}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(scale + 0.1)} style={{ padding: '0.5rem', backgroundColor: '#edf2f7', borderRadius: '0.25rem' }}>+</button>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, gap: '1rem' }}>
        <div style={{ width: '50%', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}>
          {pdfFile && (
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true,
              }}
              loading={<div>Loading PDF...</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
              />
            </Document>
          )}
          {pdfError && <p style={{ color: 'red' }}>Error loading PDF: {pdfError}</p>}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}>
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              style={{ padding: '0.5rem', backgroundColor: pageNumber <= 1 ? '#edf2f7' : '#e2e8f0', borderRadius: '0.25rem' }}
            >
              &lt;
            </button>
            <span style={{ margin: '0 0.5rem' }}>
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              style={{ padding: '0.5rem', backgroundColor: pageNumber >= numPages ? '#edf2f7' : '#e2e8f0', borderRadius: '0.25rem' }}
            >
              &gt;
            </button>
          </div>
        </div>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={goToPreviousHistory} 
              disabled={currentHistoryIndex <= 0}
              style={{ padding: '0.5rem', backgroundColor: currentHistoryIndex <= 0 ? '#edf2f7' : '#e2e8f0', borderRadius: '0.25rem' }}
            >
              Previous
            </button>
            <span>{currentHistoryIndex + 1} / {history.length} (Page {pageNumber})</span>
            <button 
              onClick={goToNextHistory} 
              disabled={currentHistoryIndex >= history.length - 1}
              style={{ padding: '0.5rem', backgroundColor: currentHistoryIndex >= history.length - 1 ? '#edf2f7' : '#e2e8f0', borderRadius: '0.25rem' }}
            >
              Next
            </button>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.25rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'semibold' }}>Simplified Text</h2>
              <button 
                onClick={() => navigator.clipboard.writeText(simplifiedText)}
                style={{ padding: '0.5rem', backgroundColor: '#edf2f7', borderRadius: '0.25rem' }}
              >
                Copy
              </button>
            </div>
            <p>{simplifiedText}</p>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.25rem', padding: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'semibold', marginBottom: '0.5rem' }}>Selected Text</h2>
            <p>{selectedText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
