import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { checkCookieConsent, showConsentMessage } from '@/utils/cookieConsent';
import InputMask from 'react-input-mask';

const ContactInfo = () => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'details'>('contacts');

  return (
    <div className="w-full h-full bg-gradient-to-br from-gradient-start/30 via-gradient-mid/20 to-gradient-end/30 rounded-3xl relative overflow-hidden border border-gradient-start/20 backdrop-blur-sm">
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-gradient-start to-gradient-mid rounded-2xl animate-float" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-gradient-mid to-gradient-end rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-gradient-end to-gradient-start rounded-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 right-10 w-14 h-14 bg-gradient-to-br from-gradient-start to-gradient-end rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-gray-950/80 to-transparent" />
      
      <div className="relative z-10 h-full flex flex-col p-8">
        <div className="flex gap-4 mb-6 justify-end">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'contacts'
                ? 'bg-gradient-to-r from-gradient-start to-gradient-mid text-white shadow-lg'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70'
            }`}
          >
            Контакты
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'details'
                ? 'bg-gradient-to-r from-gradient-start to-gradient-mid text-white shadow-lg'
                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-800/70'
            }`}
          >
            Реквизиты
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'contacts' ? (
            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gradient-start/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gradient-start to-gradient-mid flex items-center justify-center flex-shrink-0">
                    <Icon name="Phone" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Телефон</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300">+7 (958) 240‒00‒10</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gradient-start/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gradient-mid to-gradient-end flex items-center justify-center flex-shrink-0">
                    <Icon name="Mail" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
                    <p className="text-lg text-gray-700 dark:text-gray-300">ivanickiy@centerai.tech</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gradient-start/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gradient-end to-gradient-start flex items-center justify-center flex-shrink-0">
                    <Icon name="Clock" size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Режим работы</h3>
                    <p className="text-gray-700 dark:text-gray-300">Пн-Пт: 9:00-18:00</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gradient-start/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gradient-start via-gradient-mid to-gradient-end flex items-center justify-center flex-shrink-0">
                    <Icon name="MapPin" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Адрес</h3>
                    <p className="text-gray-700 dark:text-gray-300">614007, Пермский край, город Пермь,</p>
                    <p className="text-gray-700 dark:text-gray-300">ул. Революции, д. 14, кв. 57</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gradient-start/20">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gradient-start to-gradient-mid flex items-center justify-center flex-shrink-0">
                    <Icon name="Building2" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900 dark:text-white mb-1">Юридическая информация</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Полное наименование</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">ООО "МОЛОТОВ ТРАСТ"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ИНН</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">5906060110</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">КПП</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">590401001</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ОКПО</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">73907860</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Директор</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">Иваницкая Е. С.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Contacts = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkCookieConsent()) {
      toast.error('Требуется согласие', {
        description: 'Для отправки заявки необходимо принять согласие на использование cookies'
      });
      showConsentMessage();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/003b9991-d7d8-4f5d-8257-dee42fad0f91', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact_form',
          ...formData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки');
      }

      setSubmitStatus('success');
      setFormData({ name: '', phone: '' });
      toast.success('Заявка отправлена!', {
        description: 'Мы свяжемся с вами в ближайшее время'
      });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      toast.error('Ошибка отправки', {
        description: 'Попробуйте еще раз или свяжитесь с нами по телефону'
      });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacts" className="contacts relative bg-gray-50 dark:bg-gray-700">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-[76px] lg:gap-[76px] gap-12 items-center min-h-[600px]">
          <div className="contacts-content min-h-full z-[1] lg:p-5 p-0 content-center">
            <h2 className="section-title">Контакты</h2>
            <form className="flex flex-col gap-12" onSubmit={handleSubmit}>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className="form-input-custom peer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-gradient-start to-gradient-mid scale-x-0 peer-focus:scale-x-100 transition-transform duration-300" />
              </div>
              
              <div className="relative group">
                <InputMask
                  mask="+7 (999) 999-99-99"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isSubmitting}
                >
                  {((inputProps: any) => (
                    <input
                      {...inputProps}
                      type="tel"
                      placeholder="Телефон"
                      className="form-input-custom peer"
                      required
                    />
                  )) as any}
                </InputMask>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-gradient-mid to-gradient-end scale-x-0 peer-focus:scale-x-100 transition-transform duration-300" />
              </div>
              
              <button 
                type="submit" 
                className="btn bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end text-white py-4 sm:py-5 lg:py-6 px-6 sm:px-8 lg:px-[132px] rounded-full text-base sm:text-lg lg:text-xl max-w-[521px] w-full min-h-[56px] sm:min-h-[68px] font-semibold group relative overflow-hidden bg-[length:200%_auto] animate-gradient-shift disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? 'Отправка...' : submitStatus === 'success' ? 'Заявка отправлена!' : submitStatus === 'error' ? 'Ошибка отправки' : 'Оставить заявку'}
                  {!isSubmitting && submitStatus === 'success' && <Icon name="Check" size={24} />}
                  {!isSubmitting && submitStatus === 'error' && <Icon name="X" size={24} />}
                </span>
              </button>
            </form>
          </div>
          
          <div className="contacts-pic lg:block hidden lg:order-2 order-1">
            <ContactInfo />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;