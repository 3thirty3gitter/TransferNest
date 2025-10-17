// Square Web Payments SDK Configuration
// The actual Square Web Payments SDK is loaded via script tag in the HTML

export const squareConfig = {
  applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
  locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox',
};

// Type definitions for Square Web Payments SDK
declare global {
  interface Window {
    Square?: any;
  }
}

export const initSquarePayments = async () => {
  if (!window.Square) {
    throw new Error('Square Web Payments SDK not loaded');
  }

  const payments = window.Square.payments(
    squareConfig.applicationId,
    squareConfig.locationId
  );

  return payments;
};