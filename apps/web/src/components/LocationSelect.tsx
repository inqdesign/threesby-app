import { useState, useEffect, useRef } from 'react';
import { locations } from '../data/locations';
import { Search, X } from 'lucide-react';

interface LocationSelectProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationSelect({ value, onChange, placeholder = 'Select a location', className = '' }: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(locations);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter locations based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = locations.filter(location => 
        location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selecting a location
  const handleSelectLocation = (location: string) => {
    onChange(location);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle custom location input
  const handleCustomLocation = () => {
    if (searchTerm.trim()) {
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Clear selected location
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search size={16} className="text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : value}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 pl-10 pr-10 p-3 h-10 text-foreground placeholder:text-muted-foreground"
        />
        {value && !isOpen && (
          <button 
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            <X size={16} className="text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-card rounded-md shadow-lg max-h-60 overflow-auto border border-border">
          <div className="py-1">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectLocation(location)}
                  className="px-4 py-2 text-sm hover:bg-muted cursor-pointer text-foreground"
                >
                  {location}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No locations found. 
                <button 
                  onClick={handleCustomLocation}
                  className="ml-1 text-primary hover:text-primary/80"
                >
                  Add "{searchTerm}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
