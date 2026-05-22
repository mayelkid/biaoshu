/**
 * API 工具函数
 */
import axios from 'axios';
import { StreamEvent } from './proposalApi';

const formatErrorDetail = (detail: unknown): string | null => {
  if (!detail) {
    return null;
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const lines = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object') {
          const maybeItem = item as { loc?: Array<string | number>; msg?: string };
          const path = maybeItem.loc?.join(' -> ');
          return path ? `${path}: ${maybeItem.msg || '参数校验失败'}` : (maybeItem.msg || '参数校验失败');
        }

        return null;
      })
      .filter((line): line is string => Boolean(line));

    return lines.length > 0 ? lines.join('；') : null;
  }

  if (detail && typeof detail === 'object') {
    const maybeDetail = detail as { detail?: unknown; message?: string };
    return formatErrorDetail(maybeDetail.detail) || maybeDetail.message || JSON.stringify(detail);
  }

  return String(detail);
};

export const getErrorMessage = (error: unknown, fallback = '请求失败'): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as { 
      response?: { 
        data?: { 
          detail?: unknown; 
          message?: string 
        } 
      };
      message?: string 
    };
    const detail = axiosError.response?.data?.detail;
    const message = axiosError.response?.data?.message;
    return formatErrorDetail(detail) || message || axiosError.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const ensureResponseOk = async (response: Response, fallback: string): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  try {
    const data = await response.json();
    throw new Error(formatErrorDetail(data.detail) || data.message || fallback);
  } catch (error) {
    if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
      throw error;
    }
  }

  const text = await response.text();
  throw new Error(text || fallback);
};

export const readSseStream = async (
  response: Response,
  onEvent: (event: StreamEvent) => void,
  fallbackMessage: string
): Promise<void> => {
  await ensureResponseOk(response, fallbackMessage);

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventBlock of events) {
      const dataLine = eventBlock
        .split('\n')
        .find((line) => line.startsWith('data: '));

      if (!dataLine) {
        continue;
      }

      const data = dataLine.slice(6);
      if (data === '[DONE]') {
        return;
      }

      let event: StreamEvent | null = null;
      try {
        event = JSON.parse(data) as StreamEvent;
      } catch {
        continue;
      }

      onEvent(event);
    }
  }
};

export const collectSseText = async (
  response: Response,
  onText?: (fullText: string, chunk: string) => void,
  fallbackMessage = '流式请求失败'
): Promise<string> => {
  let fullText = '';

  await readSseStream(
    response,
    (event) => {
      if (event.error) {
        throw new Error(event.message || fallbackMessage);
      }

      if (!event.chunk) {
        return;
      }

      fullText += event.chunk;
      onText?.(fullText, event.chunk);
    },
    fallbackMessage
  );

  return fullText;
};

export const postJson = (path: string, data: unknown, baseUrl?: string) => {
  const API_BASE_URL = baseUrl || process.env.REACT_APP_API_URL || '';
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};