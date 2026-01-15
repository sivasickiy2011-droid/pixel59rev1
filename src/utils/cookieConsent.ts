export const checkCookieConsent = (): boolean => {
  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    return false;
  }
  
  try {
    const consentData = JSON.parse(consent);
    return consentData.cookies === true;
  } catch {
    return false;
  }
};

export const showConsentMessage = (): void => {
  const event = new CustomEvent('showCookieConsent');
  window.dispatchEvent(event);
};
