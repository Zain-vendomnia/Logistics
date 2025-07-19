// types.ts
export interface RouteEstimateResponse {
    distance: number; // In kilometers or miles, depending on the API response
    duration: number; // In minutes
    estimatedCost: number; // This can vary, so adjust based on your API
  }
  