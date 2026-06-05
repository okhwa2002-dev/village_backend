import { ApiResponse, PaginatedResult } from '../types/commonTypes'

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
})

export const errorResponse = (message: string): ApiResponse<never> => ({
  success: false,
  message,
})

export const paginatedResponse = <T>(result: PaginatedResult<T>, message?: string): ApiResponse<PaginatedResult<T>> => ({
  success: true,
  data: result,
  message,
})
