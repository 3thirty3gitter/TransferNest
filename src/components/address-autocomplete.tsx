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

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured.');
      return;
    }

    let autocompleteWidget: any = null;

    const initAutocomplete = async () => {
      if (!containerRef.current) return;

      try {
        // Load the Google Maps JavaScript API
        if (!(window as any).google?.maps) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
            script.async = true;
            script.onload = () => resolve();
            document.head.appendChild(script);
          });
        }

        // Wait for API to be ready
        await new Promise<void>((resolve) => {
          const check = () => {
            if ((window as any).google?.maps?.places) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

        const { places } = (window as any).google.maps;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = placeholder;
        input.className = className.replace('w-full', '').trim();
        input.style.width = '100%';
        input.disabled = disabled;

        // Create autocomplete
        const autocomplete = new places.Autocomplete(input, {
          types: ['address'],
          componentRestrictions: { country: country.toLowerCase() },
          fields: ['address_components', 'formatted_address'],
        });

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.address_components) {
            console.warn('No address components in selected place');
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

          place.address_components.forEach((component: any) => {
            const types = component.types;

            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              route = component.long_name;
            }
            if (types.includes('locality')) {
              components.city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              components.state = component.short_name;
            }
            if (types.includes('postal_code')) {
              components.zipCode = component.long_name;
            }
            if (types.includes('country')) {
              components.country = component.short_name;
            }
          });

          components.address = `${streetNumber} ${route}`.trim();
          
          console.log('Address components parsed:', components);
          
          onChange(components.address);

          if (onAddressSelect) {
            onAddressSelect(components);
            console.log('onAddressSelect callback triggered');
          }
        });

        // Listen for manual input changes
        input.addEventListener('input', (e) => {
          onChange((e.target as HTMLInputElement).value);
        });

        // Clear and append
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(input);
        
        autocompleteWidget = { autocomplete, input };

      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      if (autocompleteWidget) {
        const { google } = window as any;
        if (google?.maps?.event) {
          google.maps.event.clearInstanceListeners(autocompleteWidget.autocomplete);
        }
      }
    };
  }, [country, onChange, onAddressSelect, placeholder, className, disabled]);

  // Update input value when prop changes
  useEffect(() => {
    if (containerRef.current) {
      const input = containerRef.current.querySelector('input');
      if (input && input.value !== value) {
        input.value = value;
      }
    }
  }, [value]);

  return (
    <div ref={containerRef} className="w-full" />
  );
}
