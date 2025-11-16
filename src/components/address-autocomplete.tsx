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
  const inputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured.');
      return;
    }

    // Load the Maps JavaScript API with the marker library for extended components
    const loadGoogleMapsScript = () => {
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        initAutocomplete();
        return;
      }

      const script = document.createElement('script');
      // Use v=beta for access to new components and marker library for extended component library
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=beta`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    };

    const initAutocomplete = async () => {
      if (!inputContainerRef.current) return;

      try {
        // Wait for the API to be fully loaded
        await new Promise((resolve) => {
          if (window.google?.maps?.places?.PlaceAutocompleteElement) {
            resolve(true);
          } else {
            const checkInterval = setInterval(() => {
              if (window.google?.maps?.places?.PlaceAutocompleteElement) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 100);
          }
        });

        const { PlaceAutocompleteElement } = window.google.maps.places;
        
        // Create the autocomplete element
        const autocomplete = new PlaceAutocompleteElement({
          componentRestrictions: { country: [country.toLowerCase()] },
        });

        // Add event listener for place selection
        autocomplete.addEventListener('gmp-placeselect', async (event: any) => {
          const { place } = event;
          
          if (!place) {
            console.warn('No place data in event');
            return;
          }

          try {
            // Fetch place details
            await place.fetchFields({
              fields: ['addressComponents', 'formattedAddress'],
            });

            const addressComponents = place.addressComponents;
            if (!addressComponents) {
              console.warn('No address components returned');
              return;
            }

            const components: AddressComponents = {
              address: '',
              city: '',
              state: '',
              zipCode: '',
              country: country.toUpperCase(),
            };

            let streetNumber = '';
            let route = '';

            // Parse address components using new API structure
            addressComponents.forEach((component: any) => {
              const types = component.types;

              if (types.includes('street_number')) {
                streetNumber = component.longText || component.shortText;
              }
              if (types.includes('route')) {
                route = component.longText || component.shortText;
              }
              if (types.includes('locality')) {
                components.city = component.longText || component.shortText;
              }
              if (types.includes('administrative_area_level_1')) {
                components.state = component.shortText || component.longText;
              }
              if (types.includes('postal_code')) {
                components.zipCode = component.longText || component.shortText;
              }
              if (types.includes('country')) {
                components.country = component.shortText || component.longText;
              }
            });

            components.address = `${streetNumber} ${route}`.trim();
            
            console.log('Address components parsed:', components);
            
            onChange(components.address);

            if (onAddressSelect) {
              onAddressSelect(components);
              console.log('onAddressSelect callback triggered');
            }
          } catch (error) {
            console.error('Error fetching place details:', error);
          }
        });

        // Clear container and append the autocomplete element
        inputContainerRef.current.innerHTML = '';
        inputContainerRef.current.appendChild(autocomplete);
      } catch (error) {
        console.error('Error initializing PlaceAutocompleteElement:', error);
      }
    };

    loadGoogleMapsScript();
  }, [country, onChange, onAddressSelect]);

  return (
    <>
      <div 
        ref={inputContainerRef} 
        className={className}
      />
      <style jsx global>{`
        gmp-place-autocomplete {
          width: 100% !important;
        }
        
        gmp-place-autocomplete input {
          width: 100% !important;
          padding: 12px 16px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: white !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        gmp-place-autocomplete input::placeholder {
          color: rgba(148, 163, 184, 1) !important;
        }
        
        gmp-place-autocomplete input:focus {
          outline: none !important;
          border-color: rgb(59, 130, 246) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </>
  );
}
