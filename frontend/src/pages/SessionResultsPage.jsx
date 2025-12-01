import React, { useEffect, useState } from 'react';
import { sessionService } from '../services/sessions';

const SessionResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        // Attempt to fetch last completed session or results endpoint if available
        const res = await sessionService.getLastResults?.() || {};
        setResults(res.data?.data || null);
      } catch (err) {
        console.error(err);
        setError('Could not load session results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <div className="loading-screen">Loading results...</div>;

  return (
    <div className="session-results-page">
      <header>
        <h1>Session Results</h1>
        <p>Summary of your completed session</p>
      </header>

      {error && <div className="error">{error}</div>}

      <section>
        {results ? (
          <div className="results-summary">
            <div>Correct: {results.correct || 0}</div>
            <div>Wrong: {results.wrong || 0}</div>
            <div>Accuracy: {results.accuracy ? `${results.accuracy}%` : '—'}</div>
          </div>
        ) : (
          <div>No results available.</div>
        )}
      </section>
    </div>
  );
};

export default SessionResultsPage;
