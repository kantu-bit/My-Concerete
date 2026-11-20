export const FRIENDLY_API_ERROR =
  'Something went wrong. Please call +91 73378 07372 or WhatsApp us';

export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response
): Promise<{ data: T | null; isJson: boolean }> {
  const contentType = res.headers.get('content-type') || '';
  const bodyText = await res.text();

  if (!contentType.toLowerCase().includes('application/json')) {
    console.error('[API non-JSON response]', {
      url: res.url,
      status: res.status,
      contentType,
      bodyPreview: bodyText.slice(0, 200),
    });
    return { data: null, isJson: false };
  }

  try {
    return { data: JSON.parse(bodyText) as T, isJson: true };
  } catch {
    console.error('[API invalid JSON body]', {
      url: res.url,
      status: res.status,
      contentType,
      bodyPreview: bodyText.slice(0, 200),
    });
    return { data: null, isJson: false };
  }
}

export async function readApiJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const { data, isJson } = await parseJsonResponse<T & { error?: string }>(res);
  if (!isJson || !data) {
    throw new Error(FRIENDLY_API_ERROR);
  }
  if (!res.ok) {
    throw new Error(data.error || FRIENDLY_API_ERROR);
  }
  return data;
}
