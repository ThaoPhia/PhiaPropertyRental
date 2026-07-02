declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let recaptchaScriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (recaptchaScriptPromise) {
    return recaptchaScriptPromise;
  }

  recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    document.body.appendChild(script);
  });

  return recaptchaScriptPromise;
}

export function isRecaptchaConfigured(): boolean {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return typeof siteKey === 'string' && siteKey.trim().length > 0;
}

export async function executeRecaptcha(action: string): Promise<string> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || !siteKey.trim()) {
    throw new Error('reCAPTCHA is not configured. Please set NEXT_PUBLIC_RECAPTCHA_SITE_KEY.');
  }

  await loadRecaptchaScript(siteKey);

  await new Promise<void>((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error('reCAPTCHA is unavailable'));
      return;
    }

    window.grecaptcha.ready(() => resolve());
  });

  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA is unavailable');
  }

  return window.grecaptcha.execute(siteKey, { action });
}
