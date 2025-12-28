/**
 * API Response Utilities
 * Standardized response formats for API endpoints
 *
 * FIX: Helpers now return the raw body, and the API route uses NextResponse.json()
 * to ensure full compatibility without unsafe casting.
 */

import { NextResponse } from 'next/server'

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: unknown
}

// This remains the definition of the combined response body type
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;


/**
 * Success response helper: Now returns the raw JSON body, not a NextResponse.
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };

  // Return the complete NextResponse with the specific success body type
  return NextResponse.json(response, { status });
}

/**
 * Error response helper: Now returns the raw JSON body, not a NextResponse.
 */
export function errorResponse(
  error: string,
  code?: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(code && { code }),
    ...(details !== undefined && { details })
  };

  // Return the complete NextResponse with the specific error body type
  return NextResponse.json(response, { status });
}

/**
 * Common error responses
 * FIX: These now use errorResponse(), which returns a NextResponse<ApiErrorResponse>.
 * This still conflicts with the API route signature, so we must adjust the API routes.
 */
export const ApiErrors = {
  // Helpers now return the correct NextResponse type
  unauthorized: () => errorResponse('Unauthorized', 'UNAUTHORIZED', 401),
  forbidden: () => errorResponse('Forbidden', 'FORBIDDEN', 403),
  notFound: (resource: string = 'Resource') => 
    errorResponse(`${resource} not found`, 'NOT_FOUND', 404),
  badRequest: (message: string) => 
    errorResponse(message, 'BAD_REQUEST', 400),
  conflict: (message: string) =>
    errorResponse(message, 'CONFLICT', 409),
  internalError: (message: string = 'Internal server error') => 
    errorResponse(message, 'INTERNAL_ERROR', 500),
  validationError: (details: unknown) =>
    errorResponse('Validation failed', 'VALIDATION_ERROR', 400, details)
}