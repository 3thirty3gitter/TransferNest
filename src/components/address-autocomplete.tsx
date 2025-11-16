'use client';

import { useEffect, useRef } from 'react';

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
  const elementRef = useRef<any>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not configured.');
        return;
      }

      // Check if already loaded
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        initAutocomplete();
        return;
      }

      // Load script
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.onload = () => initAutocomplete();
        document.head.appendChild(script);
      }
    };

    const initAutocomplete = () => {
      if (!containerRef.current || elementRef.current) return;

      try {
        const { PlaceAutocompleteElement } = google.maps.places;
        
        const autocompleteElement = new PlaceAutocompleteElement({
          componentRestrictions: { country: country.toLowerCase() },
        });

        autocompleteElement.id = 'place-autocomplete';
        
        // Apply custom styling
        Object.assign(autocompleteElement.style, {
          width: '100%',
          height: '48px',
        });

        // Listen for place selection
        autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
          const place = event.place;
          
          if (!place) return;

          try {
            await place.fetchFields({
              fields: ['addressComponents', 'formattedAddress'],
            });

            const addressComponents = place.addressComponents;
            if (!addressComponents) return;

            const components: AddressComponents = {
              address: '',
              city: '',
              state: '',
              zipCode: '',
              country: country.toUpperCase(),
            };

            let streetNumber = '';
            let route = '';

            addressComponents.forEach((component: any) => {
              const types = component.types;

              if (types.includes('street_number')) {
                streetNumber = component.longText;
              }
              if (types.includes('route')) {
                route = component.longText;
              }
              if (types.includes('locality')) {
                components.city = component.longText;
              }
              if (types.includes('administrative_area_level_1')) {
                components.state = component.shortText;
              }
              if (types.includes('postal_code')) {
                components.zipCode = component.longText;
              }
              if (types.includes('country')) {
                components.country = component.shortText;
              }
            });

            components.address = `${streetNumber} ${route}`.trim();
            onChange(components.address);

            if (onAddressSelect) {
              onAddressSelect(components);
            }
          } catch (error) {
            console.error('Error fetching place details:', error);
          }
        });

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(autocompleteElement);
        elementRef.current = autocompleteElement;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    loadGoogleMaps();

    return () => {
      if (elementRef.current) {
        elementRef.current = null;
      }
    };
  }, [country, onChange, onAddressSelect]);

  return (
    <div className={className}>
      <div ref={containerRef} />
      <style jsx global>{`
        #place-autocomplete {
          width: 100% !important;
        }
        #place-autocomplete input {
          width: 100% !important;
          padding: 12px 16px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: white !important;
          font-size: 14px !important;
        }
        #place-autocomplete input::placeholder {
          color: rgba(148, 163, 184, 1) !important;
        }
        #place-autocomplete input:focus {
          outline: none !important;
          ring: 2px !important;
          ring-color: rgb(59, 130, 246) !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .pac-container {
          background-color: rgb(30, 41, 59) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          margin-top: 4px !important;
        }
        .pac-item {
          color: white !important;
          padding: 8px 12px !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .pac-item:hover {
          background-color: rgba(59, 130, 246, 0.2) !important;
        }
        .pac-item-query {
          color: rgb(147, 197, 253) !important;
        }
        .pac-icon {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
