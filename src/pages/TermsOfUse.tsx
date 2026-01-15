const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl shadow-lg border-b border-gradient-start/10">
        <div className="max-w-[1500px] w-full px-[50px] mx-auto py-4">
          <a href="/" className="inline-block transition-transform hover:scale-105">
            <img 
              src="/img/5e53ea79-1c81-4c3f-847b-e8a82a5743c2.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain"
            />
          </a>
        </div>
      </header>

      <main className="pt-32 pb-16">
        <div className="max-w-[900px] w-full px-[50px] mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent">
            Пользовательское соглашение
          </h1>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Общие положения</h2>
              <p className="mb-3">
                Настоящее Пользовательское соглашение (далее — Соглашение) регулирует отношения между владельцем сайта (далее — Администрация) и пользователями сайта.
              </p>
              <p>
                Использование сайта означает безоговорочное согласие пользователя с настоящим Соглашением и указанными в нем условиями. В случае несогласия с этими условиями пользователь должен воздержаться от использования сайта.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Предмет соглашения</h2>
              <p>
                Администрация предоставляет пользователю доступ к информации и сервисам, размещенным на сайте. Сайт предназначен для предоставления информации о services разработки и продвижения веб-сайтов.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Права и обязанности пользователя</h2>
              <p className="mb-3">Пользователь обязуется:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Предоставлять достоверную информацию при заполнении форм обратной связи</li>
                <li>Не нарушать работоспособность сайта</li>
                <li>Не использовать автоматизированные скрипты для сбора информации</li>
                <li>Соблюдать законодательство Российской Федерации</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Права и обязанности Администрации</h2>
              <p className="mb-3">Администрация имеет право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Изменять или дополнять содержание сайта</li>
                <li>Изменять настоящее Соглашение в одностороннем порядке</li>
                <li>Ограничивать доступ к сайту в случае нарушения условий Соглашения</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Ответственность сторон</h2>
              <p className="mb-3">
                Администрация не несет ответственности за:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Временные сбои и перерывы в работе сайта</li>
                <li>Убытки, которые пользователь может понести в результате использования или невозможности использования сайта</li>
                <li>Достоверность информации, размещенной пользователями</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Интеллектуальная собственность</h2>
              <p>
                Все объекты, размещенные на сайте, в том числе элементы дизайна, текст, графические изображения, иллюстрации, видео, программы для ЭВМ, базы данных, музыка, звуки и другие объекты являются объектами исключительных прав Администрации.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Заключительные положения</h2>
              <p className="mb-3">
                Настоящее Соглашение вступает в силу с момента начала использования сайта пользователем.
              </p>
              <p className="mb-3">
                К настоящему Соглашению и отношениям между пользователем и Администрацией применяется действующее законодательство Российской Федерации.
              </p>
              <p>
                Все возможные споры подлежат разрешению в соответствии с законодательством Российской Федерации.
              </p>
            </section>

            <section className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Дата последнего обновления: {new Date().toLocaleDateString('ru-RU')}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;
