export class ApiResponseDto<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;

  static ok<T>(data: T, message?: string): ApiResponseDto<T> {
    return { success: true, data, message };
  }
}

export class ApiErrorDto {
  success = false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    this.error = { code, message, details };
  }
}

export class PaginatedResponseDto<T> {
  success = true;
  data: {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
  };

  constructor(items: T[], nextCursor: string | null, hasMore: boolean) {
    this.data = { items, nextCursor, hasMore };
  }
}
