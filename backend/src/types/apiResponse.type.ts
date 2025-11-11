// src/types/apiResponse.type.ts
export interface ApiResponse<T = any> {
  status: "success" | "error" | "warning" | "info";
  message: string;
  statusCode?: number;  // clearer name — indicates HTTP-like status
  data?: T;
}
