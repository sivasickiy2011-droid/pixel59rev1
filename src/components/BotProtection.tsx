import { useEffect } from 'react';

const BotProtection = () => {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    const whitelistedBots = [
      'googlebot',
      'bingbot',
      'yandexbot',
      'baiduspider',
      'slurp',
      'duckduckbot',
      'applebot',
      'facebookexternalhit',
      'twitterbot',
      'linkedinbot',
      'pinterestbot',
      'whatsapp',
      'telegrambot',
      'slack',
      'discordbot',
      'w3c_validator'
    ];
    
    const maliciousBotPatterns = [
      'scraper',
      'curl',
      'wget',
      'python-requests',
      'postman',
      'insomnia',
      'httpclient',
      'headlesschrome',
      'phantomjs',
      'selenium',
      'webdriver',
      'bot', 
      'crawler',
      'spider',
      'scrapy',
      'beautifulsoup',
      'mechanize',
      'httparty',
      'axios',
      'node-fetch',
      'okhttp',
      'apache-httpclient',
      'python',
      'java/',
      'perl',
      'ruby',
      'go-http-client',
      'libwww'
    ];

    const isWhitelisted = whitelistedBots.some(pattern => userAgent.includes(pattern));
    
    if (isWhitelisted) {
      fetch('/api/c3e66558-8a5b-42d7-b34d-ca6815cb2f76', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_agent: navigator.userAgent,
          is_blocked: false
        })
      }).catch(() => {});
      return;
    }

    const isMaliciousBot = maliciousBotPatterns.some(pattern => userAgent.includes(pattern));
    
    if (isMaliciousBot) {
      fetch('/api/c3e66558-8a5b-42d7-b34d-ca6815cb2f76', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_agent: navigator.userAgent,
          is_blocked: true
        })
      }).catch(() => {});
      
      window.location.href = 'https://ya.ru';
    }
  }, []);

  return null;
};

export default BotProtection;