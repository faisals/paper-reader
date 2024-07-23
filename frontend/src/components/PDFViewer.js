import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import '../pdf-worker';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfError, setPdfError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setPdfFile(file);
    setPageNumber(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error while loading document:', error);
    setPdfError(error.message);
  };

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <input type="file" onChange={handleFileChange} accept=".pdf" />
        <div className="scale-controls">
          <button onClick={() => setScale(scale - 0.1)}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(scale + 0.1)}>+</button>
        </div>
      </div>
      <div className="pdf-document">
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
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        )}
        {pdfError && <p className="error-message">Error loading PDF: {pdfError}</p>}
      </div>
      <div className="page-controls">
        <button
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
        >
          &lt;
        </button>
        <span>Page {pageNumber} of {numPages}</span>
        <button
          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default PDFViewer;
