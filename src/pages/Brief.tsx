import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Brief = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    goal: '',
    results: '',
    businessArea: '',
    clients: '',
    likeSites: '',
    dislikeSites: '',
    colorScheme: '',
    designType: [] as string[],
    sections: '',
    deliveryMethod: 'email' as 'email' | 'telegram',
    clientEmail: '',
    clientTelegram: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDesignTypeChange = (type: string) => {
    setFormData(prev => {
      const types = prev.designType.includes(type)
        ? prev.designType.filter(t => t !== type)
        : [...prev.designType, type];
      return { ...prev, designType: types };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/28e36fe2-2513-4ae6-bf76-26a49b33c1bf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка отправки');
      }

      toast.success('Анкета успешно отправлена! Проверьте вашу почту или Telegram.');
      setFormData({
        companyName: '',
        goal: '',
        results: '',
        businessArea: '',
        clients: '',
        likeSites: '',
        dislikeSites: '',
        colorScheme: '',
        designType: [],
        sections: '',
        deliveryMethod: 'email',
        clientEmail: '',
        clientTelegram: ''
      });
    } catch (error) {
      toast.error('Ошибка при отправке анкеты. Попробуйте позже.');
      console.error('Brief submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-start/5 via-gradient-mid/5 to-gradient-end/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gradient-start transition-colors mb-6"
        >
          <Icon name="ArrowLeft" size={20} />
          <span>На главную</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent mb-4">
              Анкета на создание сайта
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Данный документ является анкетой для заказа услуг по созданию сайта в Центре Автоматизации и внедрений.
              <br />
              Пожалуйста, максимально подробно ответьте на вопросы анкеты — это поможет сформировать представление о Ваших
              вкусах и предпочтениях, что позволит улучшить понимание желаемого результата и ускорить процесс разработки.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Название компании
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Правильное написание названия, возможные варианты сокращения и перевода на другой язык. 
                Какое название следует использовать на сайте?
              </p>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all text-gray-900"
                placeholder="ООО 'Название компании'"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Цель создания сайта
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Укажите, заказываете ли первый вариант, или редизайн созданного ранее сайта 
                (в случае редизайна, уточните чем не устраивает существующий сайт).
              </p>
              <textarea
                required
                rows={4}
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: Создание первого корпоративного сайта компании..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Желаемые результаты
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Какие практические результаты должен обеспечить сайт: увеличение продаж, 
                повышение узнаваемости марки, увеличение клиентской базы и т.д.
              </p>
              <textarea
                required
                rows={4}
                value={formData.results}
                onChange={(e) => handleInputChange('results', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: Увеличение входящих заявок на 30%, повышение узнаваемости бренда..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Область деятельности
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Укажите преимущества компании, отличия от конкурентов, и то, что еще необходимо 
                довести до посетителя сайта в первую очередь.
              </p>
              <textarea
                required
                rows={5}
                value={formData.businessArea}
                onChange={(e) => handleInputChange('businessArea', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: Производство и продажа промышленного оборудования. Преимущества: 15 лет на рынке, собственное производство..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Клиенты компании
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Опишите основных клиентов компании (слои населения, диапазон возрастов, 
                соотношение полов, уровень доходов и прочее).
              </p>
              <textarea
                required
                rows={4}
                value={formData.clients}
                onChange={(e) => handleInputChange('clients', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: Мужчины и женщины 30-50 лет, средний и высокий доход, руководители отделов закупок..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Сайты, которые нравятся
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Приведите примеры нескольких сайтов (желательно относящихся к сфере бизнеса компании). 
                Опишите, что именно понравилось, отметьте возможные недостатки.
              </p>
              <textarea
                rows={4}
                value={formData.likeSites}
                onChange={(e) => handleInputChange('likeSites', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: example.com - нравится минималистичный дизайн и удобная навигация, но слишком мало информации о товарах..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Сайты, которые не нравятся
              </label>
              <p className="text-sm text-gray-600 mb-3">
                На приведенных примерах объясните, почему сайты выглядят неудачно 
                (возможно общее это впечатление или из-за каких-то конкретных деталей).
              </p>
              <textarea
                rows={4}
                value={formData.dislikeSites}
                onChange={(e) => handleInputChange('dislikeSites', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: competitor.com - перегружен информацией, сложно найти нужное, устаревший дизайн..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Цветовая гамма
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Укажите наличие фирменного стиля (логотип, бренд-бук, полиграфическая продукция). 
                Укажите предпочтительную цветовую гамму и цвета, недопустимые к использованию, степень насыщенности цветов.
              </p>
              <textarea
                rows={4}
                value={formData.colorScheme}
                onChange={(e) => handleInputChange('colorScheme', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: Есть фирменный логотип в синих тонах. Предпочтительны синий и белый цвета. Избегать красного и оранжевого..."
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Характер дизайна
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Выберите один или несколько вариантов
              </p>
              <div className="space-y-3">
                {[
                  { value: 'corporate', label: 'Строгий корпоративный сайт' },
                  { value: 'corporate-graphics', label: 'Корпоративный сайт с графическими элементами' },
                  { value: 'graphic', label: 'Графический сайт (большое количество иллюстраций)' },
                  { value: 'informational', label: 'Информационный сайт (портальный тип)' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.designType.includes(option.value)}
                      onChange={() => handleDesignTypeChange(option.value)}
                      className="w-5 h-5 rounded border-gray-300 text-gradient-start focus:ring-gradient-start cursor-pointer"
                    />
                    <span className="text-gray-700 group-hover:text-gradient-start transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Разделы сайта
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Укажите предполагаемые разделы. Если необходимо не только размещение текста, изображений, 
                таблиц и ссылок, а также дополнительный функционал - укажите на это.
              </p>
              <textarea
                required
                rows={5}
                value={formData.sections}
                onChange={(e) => handleInputChange('sections', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all resize-none text-gray-900"
                placeholder="Например: О компании, Каталог товаров (с фильтрами), Новости, Контакты, Калькулятор стоимости, Форма заказа..."
              />
            </div>

            <div className="bg-gradient-to-r from-gradient-start/10 to-gradient-mid/10 rounded-2xl p-6">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                Способ получения заполненной анкеты (PDF)
              </label>
              
              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="email"
                    checked={formData.deliveryMethod === 'email'}
                    onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                    className="w-5 h-5 text-gradient-start focus:ring-gradient-start cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-gradient-start transition-colors font-medium">
                    На электронную почту
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="telegram"
                    checked={formData.deliveryMethod === 'telegram'}
                    onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                    className="w-5 h-5 text-gradient-start focus:ring-gradient-start cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-gradient-start transition-colors font-medium">
                    В Telegram
                  </span>
                </label>
              </div>

              {formData.deliveryMethod === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ваш email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all text-gray-900"
                    placeholder="example@mail.com"
                  />
                </div>
              )}

              {formData.deliveryMethod === 'telegram' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ваш Telegram (username или номер телефона) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientTelegram}
                    onChange={(e) => handleInputChange('clientTelegram', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gradient-start focus:border-transparent transition-all text-gray-900"
                    placeholder="@username или +79991234567"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Убедитесь, что вы написали боту хотя бы один раз, чтобы он мог отправить вам файл
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-gradient-start/10 to-gradient-mid/10 rounded-2xl p-6 text-center">
              <p className="text-gray-700 mb-4">
                Спасибо за уделенное время!
              </p>
              <p className="text-sm text-gray-600">
                После отправки анкеты вы получите PDF-копию на указанный контакт, а мы свяжемся с вами в ближайшее время для обсуждения деталей проекта.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-12 py-6 text-lg bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end text-black rounded-full hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Icon name="Loader2" size={20} className="animate-spin" />
                    Отправка...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="Send" size={20} />
                    Отправить анкету
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Brief;