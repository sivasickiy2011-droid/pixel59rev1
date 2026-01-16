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
      fetch('/pyapi/c61d607d-a45d-40ee-88b9-34da6d3ca3e7', {
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
      fetch('/pyapi/c61d607d-a45d-40ee-88b9-34da6d3ca3e7', {
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