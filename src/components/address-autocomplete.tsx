'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not configured.');
        return;
      }

      if (window.google?.maps?.places) {
        setIsScriptLoaded(true);
        return;
      }

      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=Function.prototype`;
        script.async = true;
        script.onload = () => setIsScriptLoaded(true);
        script.onerror = () => console.error('Failed to load Google Maps');
        document.head.appendChild(script);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: country.toLowerCase() },
        fields: ['address_components', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.address_components) return;

        const components: AddressComponents = {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: country.toUpperCase(),
        };

        let streetNumber = '';
        let route = '';

        place.address_components.forEach((component) => {
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
        onChange(components.address);

        if (onAddressSelect) {
          onAddressSelect(components);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isScriptLoaded, country, onChange, onAddressSelect]);

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoComplete="off"
    />
  );
}
