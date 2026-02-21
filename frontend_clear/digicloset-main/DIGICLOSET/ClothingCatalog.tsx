import React, { useState } from 'react';
import ItemQualityBadge from './ItemQualityBadge';
import CatalogBulkActions from './CatalogBulkActions';
import CatalogQualityPanel from './CatalogQualityPanel';
import CatalogSuggestionsPanel from './CatalogSuggestionsPanel';
import { Heart, Star, Filter, Search } from 'lucide-react';
import { ClothingItem, ClothingCategory, ClothingStyle } from '../types';
import { mockClothingItems } from '../utils/mockData';

interface ClothingCatalogProps {
  onItemSelect: (item: ClothingItem) => void;
  selectedItems: ClothingItem[];
}

export const ClothingCatalog: React.FC<ClothingCatalogProps> = ({ onItemSelect, selectedItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [selectedStyle, setSelectedStyle] = useState<ClothingStyle | 'all'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [showFilters, setShowFilters] = useState(false);

  const categories: (ClothingCategory | 'all')[] = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'accessories'];
  const styles: (ClothingStyle | 'all')[] = ['all', 'casual', 'formal', 'business', 'trendy', 'classic', 'bohemian', 'minimalist'];

  const filteredItems = mockClothingItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStyle = selectedStyle === 'all' || item.style === selectedStyle;
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesStyle && matchesPrice;
  });

  const isSelected = (item: ClothingItem) => selectedItems.some(selected => selected.id === item.id);

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search clothing items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          </div>

          {/* Suggestions + Items Grid */}
        <button
            {filteredItems.map(item => (
          className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter size={20} />
          <span>Filters</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ClothingCategory | 'all')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as ClothingStyle | 'all')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              >
                {styles.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="300"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${
              isSelected(item) ? 'ring-2 ring-indigo-500 shadow-xl' : ''
            }`}
            onClick={() => onItemSelect(item)}
          >
            <div className="relative overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
                {/* quality badge */}
                <div className="absolute left-2 bottom-2 bg-white bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium">
                  <ItemQualityBadge itemId={item.id} />
                </div>
              <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart size={18} className="text-gray-600 hover:text-red-500" />
              </div>
              {isSelected(item) && (
                <div className="absolute inset-0 bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Selected
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">${item.price}</span>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{item.rating}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <CatalogSuggestionsPanel itemId={selectedItems[0]?.id} shopId={"demo-shop"} />
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No items found matching your criteria.</p>
        </div>
      )}
      {/* Bulk actions panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CatalogBulkActions selectedIds={selectedItems.map(i => i.id)} />
        </div>
        <div>
          <CatalogQualityPanel onSelect={(id) => {
            const item = mockClothingItems.find(it => it.id === id);
            if (item) onItemSelect(item);
          }} />
        </div>
      </div>
    </div>
  );
};