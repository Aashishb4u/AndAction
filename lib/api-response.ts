import { NextResponse } from 'next/server'

/**
 * API Response Utilities
 * Standardized response formats for API endpoints
 */

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

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  )
}

/**
 * Error response helper
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
  }

  return NextResponse.json(response, { status })
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => errorResponse('Unauthorized', 'UNAUTHORIZED', 401),
  forbidden: () => errorResponse('Forbidden', 'FORBIDDEN', 403),
  notFound: (resource: string = 'Resource') => 
    errorResponse(`${resource} not found`, 'NOT_FOUND', 404),
  badRequest: (message: string) => 
    errorResponse(message, 'BAD_REQUEST', 400),
  internalError: (message: string = 'Internal server error') => 
    errorResponse(message, 'INTERNAL_ERROR', 500),
  validationError: (details: unknown) =>
    errorResponse('Validation failed', 'VALIDATION_ERROR', 400, details)
}

