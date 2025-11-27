'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GarmentType, PrintLocation, TShirtSize, LocationSelection } from '@/types/wizard';
import { LOCATION_INFO } from '@/lib/wizard-config';
import { MOCKUP_CONFIGS, getPerspectiveTransform, LOCATION_TO_VIEW, ProductView, getScaledLocationConfig, getGarmentScaleFactor } from '@/lib/mockup-configs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface RealisticProductMockupProps {
  garmentType: GarmentType;
  garmentSize: TShirtSize | null;
  imagePreviewUrl: string;
  selectedLocations: PrintLocation[];
  onLocationClick: (location: PrintLocation) => void;
  quantities: Record<PrintLocation, number>;
  selections: LocationSelection[];
  onUpdateSelection: (location: PrintLocation, updates: Partial<LocationSelection>) => void;
}

export default function RealisticProductMockup({
  garmentType,
  garmentSize,
  imagePreviewUrl,
  selectedLocations,
  onLocationClick,
  quantities,
  selections,
  onUpdateSelection
}: RealisticProductMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 1125 });
  const mockupConfig = MOCKUP_CONFIGS[garmentType];
  
  // Determine which view to show based on selected locations
  const [activeView, setActiveView] = useState<ProductView>('front');
  const [selectedLocation, setSelectedLocation] = useState<PrintLocation | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Get available views for this garment
  const availableViews = Object.keys(mockupConfig.views) as ProductView[];
  
  // Auto-switch view when a location is selected
  useEffect(() => {
    if (selectedLocations.length > 0) {
      const lastSelectedLocation = selectedLocations[selectedLocations.length - 1];
      const viewForLocation = LOCATION_TO_VIEW[lastSelectedLocation];
      if (viewForLocation && mockupConfig.views[viewForLocation]) {
        setActiveView(viewForLocation);
      }
    }
  }, [selectedLocations, mockupConfig.views]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({
          width,
          height: width * 1.25 // 4:5 aspect ratio
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const currentView = mockupConfig.views[activeView];
  if (!currentView) return null;

  const getOverlayStyle = (location: PrintLocation) => {
    const locationConfig = currentView.locations[location];
    if (!locationConfig) return null;

    // Get selection for custom overrides
    const selection = selections.find(s => s.location === location);
    
    // Don't apply garment scaling to the location config - keep positions fixed
    // Only the maxWidth/maxHeight will scale based on garment size through selection.customSize or recommendedSize
    
    // Use custom position if available, otherwise use default
    const position = selection?.customPosition || locationConfig.position;
    
    // Calculate the actual size to display
    // If custom size exists, use it; otherwise use the recommended size (which is already scaled)
    const displaySize = selection?.customSize || selection?.recommendedSize || { width: 12, height: 15 };
    
    // Convert inches to pixels - use a fixed scale factor for consistent sizing
    // Assume roughly 30 pixels per inch for mockup display
    const pixelsPerInch = 30;
    const maxWidthPx = displaySize.width * pixelsPerInch;
    const maxHeightPx = displaySize.height * pixelsPerInch;
    
    return {
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${maxWidthPx}px`,
      height: `${maxHeightPx}px`,
      transform: `translate(-50%, -50%) ${getPerspectiveTransform(locationConfig.perspective)}`,
    };
  };

  const handleDragStart = (e: React.MouseEvent, location: PrintLocation) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedLocation(location);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedLocation || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
    
    const selection = selections.find(s => s.location === selectedLocation);
    const locationConfig = currentView.locations[selectedLocation];
    if (!selection || !locationConfig) return;
    
    const currentPos = selection.customPosition || locationConfig.position;
    const newX = Math.max(10, Math.min(90, currentPos.x + deltaX));
    const newY = Math.max(10, Math.min(90, currentPos.y + deltaY));
    
    onUpdateSelection(selectedLocation, {
      customPosition: { x: newX, y: newY }
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleSizeChange = (location: PrintLocation, scaleDelta: number) => {
    const selection = selections.find(s => s.location === location);
    if (!selection) return;
    
    const currentSize = selection.customSize || selection.recommendedSize;
    const newWidth = Math.max(0.5, currentSize.width + scaleDelta);
    const newHeight = Math.max(0.5, currentSize.height + scaleDelta);
    
    onUpdateSelection(location, {
      customSize: { width: newWidth, height: newHeight }
    });
  };

  const handleResetPosition = (location: PrintLocation) => {
    onUpdateSelection(location, {
      customPosition: undefined,
      customSize: undefined
    });
  };

  const isSelected = (location: PrintLocation) => selectedLocations.includes(location);
  const getQuantity = (location: PrintLocation) => quantities[location] || 0;
  
  // Get locations that should show on this view
  const locationsOnView = Object.keys(currentView.locations) as PrintLocation[];

  return (
    <div className="space-y-4">
      {/* View Selector Tabs */}
      {availableViews.length > 1 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {availableViews.map((view) => {
            const viewConfig = mockupConfig.views[view];
            if (!viewConfig) return null;
            
            // Count how many selected locations are on this view
            const locationsOnThisView = Object.keys(viewConfig.locations) as PrintLocation[];
            const selectedCount = locationsOnThisView.filter(loc => isSelected(loc) && getQuantity(loc) > 0).length;
            
            return (
              <Button
                key={view}
                variant={activeView === view ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView(view)}
                className="relative"
              >
                {viewConfig.name}
                {selectedCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-primary text-white text-xs px-1.5 py-0"
                  >
                    {selectedCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {/* Mockup Preview */}
      <Card className="relative overflow-visible bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8 shadow-2xl">
        <div className="relative mx-auto" style={{ maxWidth: '900px' }}>
          <div 
            ref={containerRef}
            className="relative mx-auto rounded-xl shadow-2xl"
            style={{
              aspectRatio: '4/5',
            }}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
          {/* Main product image */}
          <div className="absolute inset-0">
            <img
              src={currentView.imagePath}
              alt={currentView.name}
              className="w-full h-full object-cover"
              style={{
                filter: 'contrast(1.05) saturate(1.1)',
              }}
            />
            
            {/* Lighting overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 70%)',
                mixBlendMode: 'soft-light',
              }}
            />
          </div>

          {/* Interactive location overlays */}
          <div className="absolute inset-0" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
            {locationsOnView.map((location) => {
              const selected = isSelected(location);
              const quantity = getQuantity(location);
              const overlayStyle = getOverlayStyle(location);
              
              if (!overlayStyle) return null;

              const isActiveSelection = selectedLocation === location;
              const selection = selections.find(s => s.location === location);
              const hasCustomizations = selection?.customPosition || selection?.customSize;
              
              return (
                <div
                  key={location}
                  className={`absolute group transition-all duration-300 ${
                    selected ? 'z-30' : 'z-20'
                  } ${isActiveSelection ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  style={{
                    ...overlayStyle,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                    cursor: selected && quantity > 0 ? 'move' : 'pointer',
                  }}
                  title={LOCATION_INFO[location]?.label || location}
                  onClick={() => !isDragging && onLocationClick(location)}
                >
                  {selected && quantity > 0 ? (
                    <>
                      {/* Design preview */}
                      <div 
                        className="relative"
                        style={{
                          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35)) brightness(0.98) contrast(1.05)',
                        }}
                        onMouseDown={(e) => handleDragStart(e, location)}
                      >
                        <img
                          src={imagePreviewUrl}
                          alt="Design preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            mixBlendMode: 'multiply',
                            opacity: 0.92,
                            pointerEvents: 'none',
                          }}
                        />
                        
                        {/* Fabric texture overlay */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            mixBlendMode: 'overlay',
                            opacity: 0.15,
                          }}
                        />
                        
                        {/* Shine effect */}
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-10"
                          style={{
                            background: 'linear-gradient(135deg, transparent 30%, white 50%, transparent 70%)',
                          }}
                        />
                      </div>
                      
                      {/* Position/Size Controls */}
                      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-40">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSizeChange(location, -0.5); }}
                          className="bg-white hover:bg-gray-100 text-gray-700 p-1.5 rounded-md shadow-lg border border-gray-200"
                          title="Decrease size"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSizeChange(location, 0.5); }}
                          className="bg-white hover:bg-gray-100 text-gray-700 p-1.5 rounded-md shadow-lg border border-gray-200"
                          title="Increase size"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        {hasCustomizations && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResetPosition(location); }}
                            className="bg-white hover:bg-gray-100 text-orange-600 p-1.5 rounded-md shadow-lg border border-orange-200"
                            title="Reset position & size"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      {/* Hover label */}
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-40">
                        <Move className="w-3 h-3 inline mr-1" />
                        {LOCATION_INFO[location]?.label || location}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* View label */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            {currentView.name}
          </div>
        </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-green-600">Drag designs to reposition</span> • 
          Hover for <span className="font-semibold text-purple-600">size controls</span>
        </div>
      </Card>
    </div>
  );
}
