/**
 * Safe, reusable utility to extract meaningful error messages from Axios responses.
 * Handles the backend response formats like data.error, data.message, data.details,
 * or falls back to Axios/generic error message.
 */
export function extractErrorMessage(error: any): string {
  if (error && typeof error === 'object') {
    // If Axios error
    if (error.response) {
      const data = error.response.data;
      if (data) {
        // Look for data.error
        if (typeof data.error === 'string') return data.error;
        // Look for data.message
        if (typeof data.message === 'string') return data.message;
        // Look for data.details
        if (Array.isArray(data.details)) return data.details.join(', ');
        if (typeof data.details === 'string') return data.details;
        
        // Handle nested error object e.g., data.error.message
        if (typeof data.error === 'object' && data.error) {
          if (typeof data.error.message === 'string') return data.error.message;
          if (typeof data.error.error === 'string') return data.error.error;
        }
      }
    }
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}
