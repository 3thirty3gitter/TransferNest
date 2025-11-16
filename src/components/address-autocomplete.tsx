'use client';

import { useEffect, useRef } from 'react';
import '@googlemaps/extended-component-library/place_picker.js';

interface AddressComponents {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  country?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing your address...",
  className = "",
  disabled = false,
  country = "ca",
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured.');
      return;
    }

    if (!containerRef.current) return;

    // Create the place picker element
    const pickerElement = document.createElement('gmpx-place-picker') as any;
    
    // Set attributes
    pickerElement.setAttribute('type', 'address');
    pickerElement.setAttribute('country', country.toLowerCase());
    if (placeholder) {
      pickerElement.setAttribute('placeholder', placeholder);
    }

    // Listen for place changed event
    const handlePlaceChange = async () => {
      const place = pickerElement.value;
      
      if (!place) {
        console.warn('No place selected');
        return;
      }

      console.log('Place selected:', place);

      try {
        const components: AddressComponents = {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: country.toUpperCase(),
        };

        let streetNumber = '';
        let route = '';

        // Parse address components from the place object
        if (place.addressComponents) {
          place.addressComponents.forEach((component: any) => {
            const types = component.types;

            if (types.includes('street_number')) {
              streetNumber = component.longText || component.shortText || '';
            }
            if (types.includes('route')) {
              route = component.longText || component.shortText || '';
            }
            if (types.includes('locality')) {
              components.city = component.longText || component.shortText || '';
            }
            if (types.includes('administrative_area_level_1')) {
              components.state = component.shortText || component.longText || '';
            }
            if (types.includes('postal_code')) {
              components.zipCode = component.longText || component.shortText || '';
            }
            if (types.includes('country')) {
              components.country = component.shortText || component.longText || '';
            }
          });
        }

        components.address = `${streetNumber} ${route}`.trim();
        
        console.log('Address components parsed:', components);
        
        onChange(components.address);

        if (onAddressSelect) {
          onAddressSelect(components);
          console.log('onAddressSelect callback triggered');
        }
      } catch (error) {
        console.error('Error parsing place details:', error);
      }
    };

    pickerElement.addEventListener('gmpx-placechange', handlePlaceChange);

    // Clear container and append
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(pickerElement);

    return () => {
      pickerElement.removeEventListener('gmpx-placechange', handlePlaceChange);
    };
  }, [country, onChange, onAddressSelect, placeholder]);

  return (
    <>
      <div ref={containerRef} className={`w-full ${className}`} />
      <style jsx global>{`
        gmpx-place-picker {
          width: 100% !important;
          display: block !important;
        }
        
        gmpx-place-picker input {
          width: 100% !important;
          padding: 12px 16px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: white !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        gmpx-place-picker input::placeholder {
          color: rgba(148, 163, 184, 1) !important;
        }
        
        gmpx-place-picker input:focus {
          outline: none !important;
          border-color: rgb(59, 130, 246) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </>
  );
}
