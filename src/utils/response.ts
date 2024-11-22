import { ApiResponse } from '../types';

export const createSuccessResponse = <T>(data?: T, message?: string): ApiResponse<T> => ({
  status: 'success',
  data,
  message,
});

export const createErrorResponse = (code: number, details?: string): ApiResponse => ({
  status: 'error',
  error: {
    code,
    details,
  },
});