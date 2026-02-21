import Auth from "./components/Auth";
import React, { useState } from 'react';
import { Shirt, Sparkles, Sun, Camera, User } from 'lucide-react';
import { PhotoUpload } from './components/PhotoUpload';
import { ClothingCatalog } from './components/ClothingCatalog';
import { VirtualTryOn } from './components/VirtualTryOn';
import { AIPreferences } from './components/AIPreferences';
import { LightAdjustment } from './components/LightAdjustment';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { SmartRecommendations } from './components/SmartRecommendations';
import { OutfitGenerator } from './components/OutfitGenerator';
import { ColorHarmonyTool } from './components/ColorHarmonyTool';
import { AIServiceStatus } from './components/AIServiceStatus';
import { ClothingItem, StylePreferences, LightingSettings } from './types';
import { AIAnalysisResult } from './services/aiService';
import { mockUser } from './utils/mockData';
import { mockClothingItems } from './utils/mockData';

function App() {
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tryon' | 'catalog' | 'preferences' | 'lighting' | 'ai-analysis' | 'recommendations' | 'outfits' | 'colors'>('tryon');
  const [preferences, setPreferences] = useState<StylePreferences>(mockUser.preferences);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>({
    brightness: 100,
    contrast: 100,
    warmth: 50,
    scenario: 'natural',
    intensity: 80
  });

  const handleItemSelect = (item: ClothingItem) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      // Limit to 3 items for better performance
      if (selectedItems.length < 3) {
        setSelectedItems([...selectedItems, item]);
      } else {
        // Replace the oldest item
        setSelectedItems([...selectedItems.slice(1), item]);
      }
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const tabs = [
    { id: 'tryon', label: 'Try-On', icon: <Camera size={20} /> },
    { id: 'catalog', label: 'Catalog', icon: <Shirt size={20} /> },
    { id: 'ai-analysis', label: 'AI Analysis', icon: <Sparkles size={20} /> },
    { id: 'recommendations', label: 'Smart Picks', icon: <Sparkles size={20} /> },
    { id: 'outfits', label: 'Outfits', icon: <Shirt size={20} /> },
    { id: 'colors', label: 'Colors', icon: <Sun size={20} /> },
    { id: 'preferences', label: 'AI Preferences', icon: <Sparkles size={20} /> },
    { id: 'lighting', label: 'Lighting', icon: <Sun size={20} /> },
    { id: 'billing', label: 'Billing', icon: <Sparkles size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shirt className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VirtualFit</h1>
                <p className="text-sm text-gray-600">AI-Powered Virtual Try-On</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Sparkles size={16} className="text-indigo-500" />
                <span>AI Enhanced</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{mockUser.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Navigation & Photo Upload */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-indigo-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Photo Upload */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Photo</h3>
              <PhotoUpload onPhotoSelect={setUserPhoto} currentPhoto={userPhoto} />
            </div>

            {/* AI Analysis Summary */}
            {aiAnalysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Insights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Body Shape</span>
                    <span className="font-semibold text-purple-600 capitalize">
                      {aiAnalysis.bodyShape.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Skin Tone</span>
                    <span className="font-semibold text-orange-600 capitalize">{aiAnalysis.skinTone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confidence</span>
                    <span className="font-semibold text-emerald-600">{Math.round(aiAnalysis.confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Service Status */}
            <AIServiceStatus />

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Session Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items Tried</span>
                  <span className="font-semibold text-indigo-600">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Lighting Mode</span>
                  <span className="font-semibold text-emerald-600 capitalize">{lightingSettings.scenario}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AI Preferences</span>
                  <span className="font-semibold text-purple-600">{preferences.preferredStyles.length} styles</span>
                </div>
                {aiAnalysis && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">AI Analysis</span>
                    <span className="font-semibold text-emerald-600">Complete</span>
                  </div>
                )}
              </div>
            </div>
            {/* Billing panel */}
            <div className="mt-4">
              <BillingPanel shopId={'demo-shop'} />
              <AICreditsDashboard shopId={'demo-shop'} />
            </div>
          </div>

          {/* Center Column - Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'tryon' && (
              <VirtualTryOn
                userPhoto={userPhoto}
                selectedItems={selectedItems}
                lightingSettings={lightingSettings}
                onRemoveItem={handleRemoveItem}
              />
            )}

            {activeTab === 'catalog' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Clothing Catalog</h2>
                <ClothingCatalog
                  onItemSelect={handleItemSelect}
                  selectedItems={selectedItems}
                />
              </div>
            )}

            {activeTab === 'ai-analysis' && (
              <AIAnalysisPanel
                userPhoto={userPhoto}
                onAnalysisComplete={setAiAnalysis}
              />
            )}

            {activeTab === 'recommendations' && (
              <SmartRecommendations
                userAnalysis={aiAnalysis}
                preferences={preferences}
                availableItems={mockClothingItems}
                onItemSelect={handleItemSelect}
                selectedItems={selectedItems}
              />
            )}

            {activeTab === 'outfits' && (
              <OutfitGenerator
                userAnalysis={aiAnalysis}
                preferences={preferences}
                availableItems={mockClothingItems}
                onOutfitSelect={(items) => setSelectedItems(items)}
              />
            )}

            {activeTab === 'colors' && (
              <ColorHarmonyTool
                userAnalysis={aiAnalysis}
                selectedItem={selectedItems[0] || null}
              />
            )}

            {activeTab === 'preferences' && (
              <AIPreferences
                preferences={preferences}
                onPreferencesChange={setPreferences}
              />
            )}

            {activeTab === 'lighting' && (
              <LightAdjustment
                lightingSettings={lightingSettings}
                onLightingChange={setLightingSettings}
              />
            )}
            {activeTab === 'billing' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Billing & AI Credits</h2>
                <BillingPanel shopId={'demo-shop'} />
                <AICreditsDashboard shopId={'demo-shop'} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              &copy; 2025 VirtualFit. Powered by advanced AI technology for the best virtual try-on experience.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
