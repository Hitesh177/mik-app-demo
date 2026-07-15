import { useEffect, useMemo, useRef, useState } from 'react';

function waitForGoogle(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error('Google sign-in script did not load'));
        return;
      }
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

export default function GoogleSignInButton({
  onCredential,
  className = '',
  label = 'Continue with Google',
  size = 'large',
}) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const isConfigured = useMemo(() => Boolean(clientId), [clientId]);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      if (!containerRef.current || !isConfigured) return;
      try {
        const googleId = await waitForGoogle();
        if (!mounted || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        googleId.initialize({
          client_id: clientId,
          callback: response => {
            if (response?.credential) {
              onCredential?.(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        const width = Math.min(containerRef.current.clientWidth || 320, 400);
        googleId.renderButton(containerRef.current, {
          theme: 'outline',
          size,
          shape: 'pill',
          text: 'continue_with',
          width,
        });
        setError('');
      } catch (err) {
        if (mounted) setError(err.message || 'Google sign-in failed to load');
      }
    }

    setup();
    return () => {
      mounted = false;
    };
  }, [clientId, isConfigured, onCredential, size]);

  if (!isConfigured) {
    return (
      <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 ${className}`}>
        Google sign-in needs `VITE_GOOGLE_CLIENT_ID` in your environment.
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      {error && (
        <p className="text-xs text-red-500 mt-2">
          {error}
        </p>
      )}
      {!error && (
        <p className="text-xs text-gray-400 mt-2">
          {label}
        </p>
      )}
    </div>
  );
}
