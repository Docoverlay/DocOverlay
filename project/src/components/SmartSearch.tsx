import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, User, X } from 'lucide-react';
import { SearchResult } from '../types';
import { performGlobalSearch } from '../utils/userPreferences';

interface SmartSearchProps {
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export default function SmartSearch({ onSelectResult, placeholder = "Rechercher...", className = "" }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const searchResults = performGlobalSearch(query);
      setResults(searchResults.slice(0, 8)); // Limiter à 8 résultats
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'patient':
        return <User className="w-4 h-4 text-green-600" />;
      case 'template':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-auto">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelectResult(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getResultIcon(result.type)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {result.title}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {result.subtitle}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      result.type === 'document' ? 'bg-blue-100 text-blue-800' :
                      result.type === 'patient' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {result.type === 'document' ? 'Feuille' :
                       result.type === 'patient' ? 'Patient' : 'Template'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {Math.round(result.relevanceScore)}%
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Aucun résultat pour "{query}"</p>
        </div>
      )}
    </div>
  );
}