/**
 * Retry utility for API calls
 * Useful for handling temporary errors like 502 Bad Gateway (Render cold starts)
 */

export const retryRequest = async (requestFn, maxRetries = 5, initialDelay = 5000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Only retry on specific errors
      const shouldRetry = 
        error.response?.status === 502 || // Bad Gateway (Render cold start)
        error.response?.status === 503 || // Service Unavailable
        error.response?.status === 504 || // Gateway Timeout
        (!error.response && error.code === 'ERR_NETWORK') || // Network error
        (error.code === 'ECONNABORTED'); // Timeout
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with longer delays for Render cold starts
      // First retry: 5s, Second: 10s, Third: 15s, Fourth: 20s
      const waitTime = initialDelay * attempt;
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

