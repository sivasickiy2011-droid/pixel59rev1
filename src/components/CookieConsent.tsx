import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import InputMask from 'react-input-mask';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cookies, setCookies] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }

    const handleShowConsent = () => {
      setIsVisible(true);
    };

    window.addEventListener('showCookieConsent', handleShowConsent);
    return () => window.removeEventListener('showCookieConsent', handleShowConsent);
  }, []);

  useEffect(() => {
    if (cookies && !showExtraOptions) {
      setTimeout(() => setShowExtraOptions(true), 300);
    }
  }, [cookies]);

  const handleAccept = async () => {
    if (!cookies) return;
    
    if (privacy && !fullName.trim()) {
      alert('Пожалуйста, укажите ФИО');
      return;
    }

    setIsSubmitting(true);

    try {
      if (privacy) {
        const response = await fetch('/pyapi/80536dd3-4799-47a9-893a-a756a259460e', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookies,
            terms,
            privacy,
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка сохранения данных');
        }
      }

      localStorage.setItem('cookieConsent', JSON.stringify({
        cookies,
        terms,
        privacy,
        date: new Date().toISOString()
      }));
      
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Произошла ошибка при сохранении данных. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const canSubmit = cookies && (!privacy || fullName.trim());

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center px-4 py-4 sm:p-4 md:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 md:p-8 animate-slide-up border border-gradient-start/20 dark:border-gradient-start/30 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gradient-start to-gradient-mid rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
            <Icon name="Cookie" size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-gradient-start to-gradient-mid bg-clip-text text-transparent">
              Мы используем cookies
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Для корректной работы сайта и улучшения вашего опыта мы используем файлы cookies.
            </p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5 sm:mt-1">
              <input
                type="checkbox"
                checked={cookies}
                onChange={(e) => setCookies(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-gradient-start checked:to-gradient-mid checked:border-transparent focus:ring-2 focus:ring-gradient-start/30 cursor-pointer appearance-none"
              />
              {cookies && (
                <Icon name="Check" size={12} className="absolute text-white pointer-events-none sm:w-3.5 sm:h-3.5" />
              )}
            </div>
            <span className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              Согласие на использование cookies для улучшения работы сайта <span className="text-red-500 dark:text-red-400 font-semibold">*</span>
            </span>
          </label>

          {showExtraOptions && (
            <div className="space-y-3 sm:space-y-4 animate-slide-up">
              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5 sm:mt-1">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-gradient-start checked:to-gradient-mid checked:border-transparent focus:ring-2 focus:ring-gradient-start/30 cursor-pointer appearance-none"
                  />
                  {terms && (
                    <Icon name="Check" size={12} className="absolute text-white pointer-events-none sm:w-3.5 sm:h-3.5" />
                  )}
                </div>
                <span className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                  Согласие с{' '}
                  <a href="/terms" className="text-gradient-start dark:text-gradient-mid hover:text-gradient-mid underline font-medium" onClick={(e) => e.stopPropagation()}>
                    пользовательским соглашением
                  </a>
                </span>
              </label>

              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5 sm:mt-1">
                  <input
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-300 dark:border-gray-600 checked:bg-gradient-to-r checked:from-gradient-start checked:to-gradient-mid checked:border-transparent focus:ring-2 focus:ring-gradient-start/30 cursor-pointer appearance-none"
                  />
                  {privacy && (
                    <Icon name="Check" size={12} className="absolute text-white pointer-events-none sm:w-3.5 sm:h-3.5" />
                  )}
                </div>
                <span className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                  Согласие с{' '}
                  <a href="/privacy" className="text-gradient-start dark:text-gradient-mid hover:text-gradient-mid underline font-medium" onClick={(e) => e.stopPropagation()}>
                    политикой конфиденциальности
                  </a>
                </span>
              </label>
            </div>
          )}

          {privacy && showExtraOptions && (
            <div className="ml-6 sm:ml-8 space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-l-2 border-gradient-start/30 dark:border-gradient-start/50 pl-3 sm:pl-4 animate-slide-up">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ФИО <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:border-gradient-start focus:ring-2 focus:ring-gradient-start/30 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Телефон
                </label>
                <InputMask
                  mask="+7 (999) 999-99-99"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:border-gradient-start focus:ring-2 focus:ring-gradient-start/30 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:border-gradient-start focus:ring-2 focus:ring-gradient-start/30 outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-2.5 sm:px-6 sm:py-4 text-xs sm:text-sm rounded-full font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gradient-start hover:text-gradient-start transition-all duration-300"
          >
            Отклонить
          </button>
          <button
            onClick={handleAccept}
            disabled={!canSubmit || isSubmitting}
            className={`flex-1 px-4 py-2.5 sm:px-6 sm:py-4 text-xs sm:text-sm rounded-full font-semibold transition-all duration-300 ${
              canSubmit && !isSubmitting
                ? 'bg-gradient-to-r from-gradient-start to-gradient-mid text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Сохранение...' : 'Принять'}
          </button>
        </div>

        {!cookies && (
          <p className="text-xs text-red-500 text-center mt-4">
            * Согласие на использование cookies обязательно для работы сайта
          </p>
        )}
        {privacy && !fullName.trim() && (
          <p className="text-xs text-red-500 text-center mt-4">
            * При согласии с политикой конфиденциальности необходимо указать ФИО
          </p>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;