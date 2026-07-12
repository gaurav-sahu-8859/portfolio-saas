import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import { Spinner, Avatar } from '../components/shared/UI';
import { getTheme } from '../themes/themeConfig';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const doSearch = async (q) => {
    setLoading(true);
    try {
      const { data } = await publicAPI.search({ q, limit: 24 });
      setResults(data.portfolios);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { doSearch(searchParams.get('q') || ''); }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="border-b border-dark-600 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/builder" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PF</span>
            </div>
          </Link>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search developers by name, username, title..."
              className="input-field flex-1" />
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {!loading && (
          <p className="text-sm text-gray-500 mb-6">
            {searchParams.get('q') ? `${total} result${total !== 1 ? 's' : ''} for "${searchParams.get('q')}"` : `${total} published portfolio${total !== 1 ? 's' : ''}`}
          </p>
        )}

        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> :
          results.length === 0 ? (
            <div className="text-center py-20"><p className="text-gray-400">No portfolios found. Try a different search.</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(p => {
                const theme = getTheme(p.theme);
                return (
                  <a key={p._id} href={`/${p.user?.username}`} target="_blank" rel="noopener noreferrer"
                    className="card hover:border-primary-500/40 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar src={p.profilePicture} name={p.fullName} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm group-hover:text-primary-400 transition-colors truncate">{p.fullName}</h3>
                        <p className="text-xs text-gray-400 truncate">{p.title || 'Developer'}</p>
                      </div>
                    </div>
                    {p.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.bio}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-dark-600">
                      <span className="text-xs text-gray-600 font-mono">/{p.user?.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${theme.preview.accent}22`, color: theme.preview.accent }}>{theme.name}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
