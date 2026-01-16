let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session', sessionId);
    }
  }
  return sessionId;
}

export async function trackPageVisit(page: string) {
  try {
    const isAdmin = localStorage.getItem('admin_token') !== null;
    
    const data = {
      page,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      sessionId: getSessionId(),
      isAdmin
    };

    await fetch('/pyapi/f4905f63-ce85-4850-9f3a-2677d35f7d16', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}