import { useState } from 'react';
import Icon from '@/components/ui/icon';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Сколько времени занимает разработка сайта?",
      answer: "Сроки разработки зависят от сложности проекта. Простой landing page можно создать за 7-10 дней, корпоративный сайт — за 2-4 недели, интернет-магазин или сложное веб-приложение — от 1 до 3 месяцев. Мы всегда согласовываем сроки до начала работ и держим вас в курсе прогресса."
    },
    {
      question: "Какова стоимость разработки сайта?",
      answer: "Стоимость определяется индивидуально и зависит от ваших задач, функционала и дизайна. Landing page от 30 000 ₽, корпоративный сайт от 80 000 ₽, интернет-магазин от 150 000 ₽. Мы предлагаем гибкие условия оплаты и прозрачное ценообразование — вы платите только за те функции, которые действительно нужны вашему бизнесу."
    },
    {
      question: "Будет ли сайт адаптирован для мобильных устройств?",
      answer: "Да, абсолютно все наши сайты адаптивны и отлично работают на смартфонах, планшетах и десктопах. Мы используем mobile-first подход, то есть сначала проектируем для мобильных, а затем масштабируем на большие экраны. Это гарантирует идеальный пользовательский опыт на любом устройстве."
    },
    {
      question: "Предоставляете ли вы поддержку после запуска?",
      answer: "Да, мы предлагаем комплексную техническую поддержку после запуска. В течение 30 дней после сдачи проекта действует бесплатная гарантия на исправление ошибок. Далее вы можете выбрать тариф поддержки — от базового (обновления контента, резервное копирование) до расширенного (добавление функций, аналитика, консультации)."
    },
    {
      question: "Могу ли я самостоятельно редактировать контент на сайте?",
      answer: "Да, мы интегрируем удобную систему управления контентом (CMS), которая позволяет вам самостоятельно редактировать тексты, добавлять новости, загружать изображения и управлять товарами без навыков программирования. После запуска мы проведем подробное обучение и предоставим инструкции по работе с вашим сайтом."
    },
    {
      question: "Занимаетесь ли вы продвижением сайтов?",
      answer: "Да, мы предлагаем полный комплекс услуг по digital-маркетингу: SEO-оптимизация для поисковых систем, настройка контекстной рекламы (Яндекс.Директ, Google Ads), таргетированная реклама в социальных сетях, email-маркетинг и контент-маркетинг. Наша цель — не просто создать сайт, а обеспечить его видимость и привлечь целевую аудиторию."
    },
    {
      question: "Что нужно для старта проекта?",
      answer: "Для начала нам нужно понимание ваших бизнес-целей, целевой аудитории и желаемого функционала. Мы проведем бриф-встречу (онлайн или офлайн), где обсудим все детали. Далее подготовим коммерческое предложение, техническое задание и дизайн-концепцию. После согласования и заключения договора приступаем к разработке."
    },
    {
      question: "Будет ли сайт оптимизирован для поисковых систем?",
      answer: "Да, базовая SEO-оптимизация включена в каждый проект: правильная структура URL, мета-теги, микроразметка, оптимизация изображений, настройка robots.txt и sitemap.xml, адаптивная верстка. За дополнительную плату мы также предлагаем комплексную SEO-стратегию, подбор семантического ядра и контент-план для продвижения."
    }
  ];

  return (
    <section id="faq" className="faq bg-gray-50 dark:bg-gray-700">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Часто задаваемые вопросы</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Ответы на самые популярные вопросы о разработке и продвижении сайтов
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-gradient-start/20 overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 pr-4">
                  {faq.question}
                </h3>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  <Icon name="ChevronDown" size={20} className="text-white" />
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Не нашли ответ на свой вопрос?
          </p>
          <a
            href="#contacts"
            className="btn bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-8 py-4 rounded-full text-sm font-semibold hover:shadow-2xl transition-all duration-300 inline-block"
          >
            Свяжитесь с нами
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;