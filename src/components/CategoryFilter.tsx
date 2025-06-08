// CategoryFilter component
import './CategoryFilter.css';
import '../pages/HideScrollbar.css';

export type FilterCategory = 'books' | 'places' | 'products' | 'arts' | 'design' | 'interiors' | 'fashion' | 'food' | 'music' | 'travel';

interface CategoryFilterProps {
  title?: string;
  headerText?: string;
  categories: FilterCategory[];
  activeCategories: FilterCategory[];
  onCategoryChange: (categories: FilterCategory[]) => void;
  showSearch?: boolean;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  showCounts?: boolean;
  categoryCounts?: Record<string, number>;
  pageType?: 'discover' | 'collections';
}

export function CategoryFilter({
  title,
  headerText,
  categories,
  activeCategories,
  onCategoryChange,
  // Search functionality moved to MainNav
  // showSearch = false,
  // searchTerm = '',
  // onSearchChange,
  showCounts = false,
  categoryCounts = {},
  pageType = 'discover'
}: CategoryFilterProps) {
  const showAll = activeCategories.length === 0;
  
  // Only show books, places, products categories on discover page
  const filteredCategories = pageType === 'discover' 
    ? categories.filter(cat => ['books', 'places', 'products'].includes(cat))
    : categories.filter(cat => !['books', 'places', 'products'].includes(cat));
  
  const handleCategoryToggle = (category: FilterCategory) => {
    if (activeCategories.includes(category)) {
      // If this category is already selected, deselect it
      onCategoryChange(activeCategories.filter(cat => cat !== category));
    } else {
      // If this category is not selected, add it to the selected categories
      onCategoryChange([...activeCategories, category]);
    }
  };
  
  const handleAllToggle = () => {
    onCategoryChange([]);
  };

  return (
    <div>
      {/* Header Section */}
      {pageType === 'discover' ? (
        <div className="mb-2">
          {headerText && (
            <h2 className="text-gray-500 text-lg font-medium mb-1">
              {headerText}
            </h2>
          )}
          
          {/* Search functionality moved to MainNav */}
        </div>
      ) : (
        <div className="mb-2">
          {title && (
            <h2 className="text-gray-500 text-lg font-medium mb-1">
              {title}
            </h2>
          )}
          
          {/* Search functionality moved to MainNav */}
        </div>
      )}
      
      {/* Category Filters */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar md:pr-0" style={{ padding: '0.5rem 0' }} data-component-name="CategoryFilter">
        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-full">
          <input
            type="checkbox"
            name="category-all"
            checked={showAll}
            onChange={handleAllToggle}
            className="h-4 w-4 text-black rounded-full outline-none focus:ring-0 focus:ring-offset-0"
          />
          <span className="text-sm">All</span>
        </label>
        
        {filteredCategories.map((category) => (
          <label key={category} className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-full">
            <input
              type="checkbox"
              name={`category-${category}`}
              checked={activeCategories.includes(category)}
              onChange={() => handleCategoryToggle(category)}
              className="h-4 w-4 text-black rounded-full outline-none focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-sm capitalize">
              {category.charAt(0).toUpperCase() + category.slice(1)}
              {showCounts && categoryCounts[category] !== undefined && (
                <span className="ml-1 text-xs text-gray-500">
                  ({categoryCounts[category]})
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
