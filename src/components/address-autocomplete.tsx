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
  const pickerRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured.');
      return;
    }

    if (!containerRef.current) return;

    // Create the place picker element
    const pickerElement = document.createElement('gmpx-place-picker') as any;
    pickerRef.current = pickerElement;
    
    // Set attributes
    pickerElement.setAttribute('type', 'address');
    
    // Normalize country code (Google Maps requires ISO 3166-1 Alpha-2)
    let countryCode = country.toLowerCase();
    if (countryCode === 'canada') countryCode = 'ca';
    if (countryCode === 'united states' || countryCode === 'usa') countryCode = 'us';
    
    pickerElement.setAttribute('country', countryCode);
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
        
        // Update the input field to show the selected address
        // The place picker clears its input after selection, so we need to set it manually
        setTimeout(() => {
          const input = pickerElement.shadowRoot?.querySelector('input') || 
                        pickerElement.querySelector('input');
          if (input && components.address) {
            input.value = components.address;
          }
        }, 50);
        
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
    
    // Disable browser autofill on the input to prevent interference with address lookup
    // Use requestAnimationFrame to ensure the shadow DOM is ready
    const disableAutofill = () => {
      const input = pickerElement.shadowRoot?.querySelector('input') || 
                    pickerElement.querySelector('input');
      if (input) {
        // Set multiple attributes to disable autofill across browsers
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        // Chrome specifically ignores 'off', so use a random string
        input.setAttribute('autocomplete', 'new-address-' + Math.random().toString(36).slice(2));
        input.setAttribute('data-lpignore', 'true'); // LastPass
        input.setAttribute('data-form-type', 'other'); // Dashlane
      }
    };
    
    // Try immediately and again after a short delay (shadow DOM timing)
    requestAnimationFrame(disableAutofill);
    setTimeout(disableAutofill, 100);
    setTimeout(disableAutofill, 500);

    return () => {
      pickerElement.removeEventListener('gmpx-placechange', handlePlaceChange);
    };
  }, [country, onChange, onAddressSelect, placeholder]);
  
  // Sync external value prop to the input when it changes (e.g., on page load with saved data)
  useEffect(() => {
    if (pickerRef.current && value) {
      const setInputValue = () => {
        const input = pickerRef.current.shadowRoot?.querySelector('input') || 
                      pickerRef.current.querySelector('input');
        if (input && value && input.value !== value) {
          input.value = value;
        }
      };
      requestAnimationFrame(setInputValue);
      setTimeout(setInputValue, 100);
    }
  }, [value]);

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
