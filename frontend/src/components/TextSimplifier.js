import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import '../markdown-styles.css';

function TextSimplifier() {
  const [selectedText, setSelectedText] = useState('');
  const [simplifiedText, setSimplifiedText] = useState('');
  const [simplificationLevel, setSimplificationLevel] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
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
        level: simplificationLevel
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
    }
  };

  const goToNextHistory = () => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(prevIndex => prevIndex + 1);
      const nextItem = history[currentHistoryIndex + 1];
      setSelectedText(nextItem.selectedText);
      setSimplifiedText(nextItem.simplifiedText);
      setSimplificationLevel(nextItem.level);
    }
  };

  return (
    <div className="text-simplifier">
      <div className="simplification-controls">
        <select 
          value={simplificationLevel} 
          onChange={(e) => setSimplificationLevel(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="advanced">Advanced</option>
        </select>
        <button 
          onClick={handleSimplify} 
          disabled={!selectedText || isLoading}
        >
          {isLoading ? 'Processing...' : 'Simplify Selected Text'}
        </button>
      </div>
      <div className="history-navigation">
        <button 
          onClick={goToPreviousHistory} 
          disabled={currentHistoryIndex <= 0}
        >
          Previous
        </button>
        <span>{currentHistoryIndex + 1} / {history.length}</span>
        <button 
          onClick={goToNextHistory} 
          disabled={currentHistoryIndex >= history.length - 1}
        >
          Next
        </button>
      </div>
      <div className="simplified-text">
        <h2>Simplified Text</h2>
        <button onClick={() => navigator.clipboard.writeText(simplifiedText)}>
          Copy
        </button>
        <div className="markdown-content">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>
            {simplifiedText}
          </ReactMarkdown>
        </div>
      </div>
      <div className="selected-text">
        <h2>Selected Text</h2>
        <p>{selectedText}</p>
      </div>
    </div>
  );
}

export default TextSimplifier;