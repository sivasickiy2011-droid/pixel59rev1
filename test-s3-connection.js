// Тестовый скрипт для проверки подключения к S3
// Запустите: node test-s3-connection.js

const testUpload = async () => {
  // Создаём маленькую тестовую картинку 1x1 пиксель (красный PNG)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  console.log('🧪 Проверка подключения к S3...\n');
  
  try {
    const response = await fetch('/api/1103293c-17a5-453c-b290-c1c376ead996', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: testImageBase64,
        filename: 'test-logo.png'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ УСПЕХ! S3 настроен правильно\n');
      console.log('📦 Загруженный файл:', data.filename);
      console.log('🔗 URL изображения:', data.url);
      console.log('\n💡 Проверьте, что изображение доступно:');
      console.log(`   Откройте в браузере: ${data.url}\n`);
    } else {
      console.log('❌ ОШИБКА при загрузке\n');
      console.log('📝 Детали:', JSON.stringify(data, null, 2));
      console.log('\n🔧 Возможные причины:');
      
      if (data.error === 'S3 credentials not configured') {
        console.log('   • Не все секреты заполнены в poehali.dev');
        console.log('   • Проверьте: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME');
      } else if (data.error?.includes('Access Denied')) {
        console.log('   • Неверные ключи доступа');
        console.log('   • Сервисный аккаунт не имеет роли storage.editor');
      } else if (data.error?.includes('NoSuchBucket')) {
        console.log('   • Бакет не существует');
        console.log('   • Проверьте имя бакета в S3_BUCKET_NAME');
      } else {
        console.log('   • Проверьте логи функции для деталей');
        console.log('   • Убедитесь, что S3_ENDPOINT_URL корректный');
      }
      console.log('');
    }
  } catch (error) {
    console.log('❌ ОШИБКА подключения\n');
    console.log('📝 Детали:', error.message);
    console.log('\n🔧 Возможные причины:');
    console.log('   • Функция не развёрнута');
    console.log('   • Проблема с сетью');
    console.log('');
  }
};

testUpload();
