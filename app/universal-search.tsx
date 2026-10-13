'use client';

import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SearchEntry } from '../lib/search-index';

function score(entry: SearchEntry, terms: string[]) {
  const title = entry.title.toLowerCase();
  const section = entry.section.toLowerCase();
  const content = entry.content.toLowerCase();
  return terms.reduce((total, term) => {
    if (!content.includes(term) && !title.includes(term) && !section.includes(term)) return -1000;
    return total + (title.includes(term) ? 8 : 0) + (section.includes(term) ? 4 : 0) + (content.includes(term) ? 1 : 0);
  }, 0);
}

export default function UniversalSearch({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    if (!terms.length) return [];
    return entries
      .map((entry) => ({ entry, rank: score(entry, terms) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => b.rank - a.rank || a.entry.title.localeCompare(b.entry.title))
      .slice(0, 12)
      .map(({ entry }) => entry);
  }, [entries, query]);

  return (
    <section className="universal-search" aria-label="Search all study spaces">
      <label className="universal-search-box">
        <Search size={18} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search MERN, GenAI, DSA, and LLD…"
          aria-label="Search all study spaces"
        />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
      </label>

      {terms.length > 0 && (
        <div className="search-results" role="list">
          <div className="search-results-meta">{results.length ? `${results.length} best matches` : 'No matches found'}</div>
          {results.map((result, index) => (
            <a
              key={`${result.source}-${result.href}-${result.title}-${index}`}
              href={result.href}
              target="_blank"
              rel="noopener noreferrer"
              className="search-result"
              role="listitem"
            >
              <span className={`search-source source-${result.source.toLowerCase()}`}>{result.source}</span>
              <span className="search-result-copy">
                <strong>{result.title}</strong>
                <small>{result.section}</small>
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
