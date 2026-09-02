interface RecaptchaVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

interface VerifyRecaptchaOptions {
  token: string;
  remoteIp?: string | null;
  expectedAction: string;
  minimumScore?: number;
}

export async function verifyRecaptchaToken({
  token,
  remoteIp,
  expectedAction,
  minimumScore = 0.5,
}: VerifyRecaptchaOptions): Promise<boolean> {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.RECAPTCHA_E2E_TOKEN &&
    token === process.env.RECAPTCHA_E2E_TOKEN
  ) {
    return true;
  }

  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

  if (!recaptchaSecret) {
    throw new Error('RECAPTCHA_SECRET_KEY is not configured');
  }

  const payload = new URLSearchParams();
  payload.set('secret', recaptchaSecret);
  payload.set('response', token);
  if (remoteIp) {
    payload.set('remoteip', remoteIp);
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to verify reCAPTCHA');
  }

  const result = (await response.json()) as RecaptchaVerificationResponse;

  if (!result.success) {
    return false;
  }

  if (result.action && result.action !== expectedAction) {
    return false;
  }

  if (result.score !== undefined && result.score < minimumScore) {
    return false;
  }

  return true;
}
