declare namespace google {
  namespace maps {
    namespace places {
      interface PlaceAutocompleteElementOptions {
        componentRestrictions?: {
          country: string | string[];
        };
      }

      interface PlaceSelectEvent extends Event {
        place: Place;
      }

      interface Place {
        addressComponents?: AddressComponent[];
        formattedAddress?: string;
        fetchFields(options: { fields: string[] }): Promise<void>;
      }

      interface AddressComponent {
        longText: string;
        shortText: string;
        types: string[];
      }

      class PlaceAutocompleteElement extends HTMLElement {
        constructor(options?: PlaceAutocompleteElementOptions);
      }
    }
  }
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export {};
