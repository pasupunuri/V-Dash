import React, { useState, useRef, useEffect } from 'react';
import { Hotel, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePropertyStore } from '@/store/propertyStore';

// Fuzzy search: checks if all characters in query appear in text in order
const fuzzyMatch = (text, query) => {
  if (!query) return true;
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  let textIndex = 0;
  for (let i = 0; i < queryLower.length; i++) {
    const charIndex = textLower.indexOf(queryLower[i], textIndex);
    if (charIndex === -1) return false;
    textIndex = charIndex + 1;
  }
  return true;
};

const HotelSelector = ({ selectedHotel, setSelectedHotel }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { properties, loading } = usePropertyStore();

  const count = properties?.length || 0;

  // Filter properties based on fuzzy search
  const filteredProperties = properties?.filter((property) =>
    fuzzyMatch(property.name, searchQuery)
  ) || [];

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
    if (!showDropdown) {
      setSearchQuery('');
    }
  }, [showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
      >
        <Hotel className="w-5 h-5 text-gray-600" />
        {/* Show selected hotel name + count on desktop, just count on mobile */}
        {selectedHotel ? (
          <>
            <span className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className="max-w-[200px] truncate">{selectedHotel}</span>
              <span className="text-gray-400">|</span>
              <span>{loading ? '...' : count}</span>
            </span>
            <span className="lg:hidden text-sm font-medium text-gray-700">
              {loading ? '...' : count}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-gray-700">
            {loading ? '...' : count}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hotels..."
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Hotels ({filteredProperties.length}{searchQuery ? ` of ${count}` : ''})
            </p>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredProperties.map((property) => (
              <button
                key={property._id || property.name}
                onClick={() => {
                  setSelectedHotel(property.name);
                  setShowDropdown(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                  property.name === selectedHotel ? "bg-yellow-50 text-yellow-700 font-medium" : "text-gray-700"
                )}
              >
                {property.name} {typeof property.rooms === 'number' ? `(${property.rooms})` : ''}
              </button>
            ))}
            {!loading && filteredProperties.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchQuery ? 'No matching hotels' : 'No properties'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelSelector;
