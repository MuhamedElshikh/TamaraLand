import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response.model';

type ApiErrorPayload = Partial<ApiResponse<unknown>> & {
  title?: unknown;
  message?: unknown;
  error?: unknown;
};

export function extractErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiErrorPayload | string | undefined;

    if (typeof body === 'string' && body.trim()) return body;
    if ((body as any)?.error?.message) return (body as any).error.message;    // lowercase
    if ((body as any)?.error?.Message) return (body as any).error.Message;    // احتياط لو PascalCase
    if ((body as any)?.errors) return collectErrors((body as any).errors) ?? fallback;
    if ((body as any)?.Errors) return collectErrors((body as any).Errors) ?? fallback;
    if (typeof (body as any)?.message === 'string') return (body as any).message;
    if (typeof (body as any)?.Message === 'string') return (body as any).Message;
    if (typeof (body as any)?.title === 'string') return (body as any).title;
    if (typeof (body as any)?.Title === 'string') return (body as any).Title;

    return fallback; // مهم: منع الوقوع في الـ generic error.message
  }

  if (typeof error === 'string') return error;

  if (
    error && typeof error === 'object' &&
    'message' in error && typeof (error as any).message === 'string'
  ) {
    return (error as any).message; // كانت فيها typo: (error as any).console.error.message
  }

  return fallback;
}

function collectErrors(errors: unknown): string | null {
  if (!errors) {
    return null;
  }

  if (Array.isArray(errors)) {
    return errors
      .map((item) => (typeof item === 'string' ? item : null))
      .find((item): item is string => !!item) ?? null;
  }

  if (typeof errors === 'object') {
    const entries = Object.values(errors as Record<string, unknown>);
    for (const entry of entries) {
      if (Array.isArray(entry)) {
        const match = entry.find((item) => typeof item === 'string');
        if (typeof match === 'string' && match.trim().length > 0) {
          return match;
        }
      }

      if (typeof entry === 'string' && entry.trim().length > 0) {
        return entry;
      }
    }
  }

  return null;
}