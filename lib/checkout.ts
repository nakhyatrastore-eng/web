export async function redirectToCheckout(onReady?: () => void) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const payload = (await response.json()) as {
    url?: string;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(
      payload.error || 'Checkout is unavailable right now. Please try again.'
    );
  }

  onReady?.();
  window.location.assign(payload.url);
}
