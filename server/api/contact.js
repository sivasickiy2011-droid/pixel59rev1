const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/database');

const secretCache = {};

async function getSecret(key) {
  if (secretCache[key]) {
    return secretCache[key];
  }

  try {
    const result = await pool.query(
      'SELECT encrypted_value FROM secure_settings WHERE key = $1',
      [key]
    );

    if (result.rows.length > 0) {
      const value = Buffer.from(result.rows[0].encrypted_value, 'base64').toString('utf-8');
      secretCache[key] = value;
      return value;
    }
  } catch (error) {
    console.error(`DB secret read error for ${key}:`, error);
  }

  const envValue = process.env[key] || '';
  secretCache[key] = envValue;
  return envValue;
}

router.post('/', async (req, res) => {
  const { name = 'Не указано', phone = 'Не указано', type = 'contact_form', timestamp = '' } = req.body;

  let bitrixSuccess = false;
  let telegramSuccess = false;

  const bitrixWebhook = await getSecret('BITRIX24_WEBHOOK_URL') || await getSecret('bitrix24_webhook_url') || '';

  if (bitrixWebhook) {
    try {
      const bitrixData = {
        fields: {
          TITLE: `Обратная связь: ${name}`,
          NAME: name,
          PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
          COMMENTS: `📝 Форма: ${type}\n🕐 Время: ${timestamp}`,
          SOURCE_ID: 'WEB'
        }
      };

      const bitrixUrl = `${bitrixWebhook}crm.lead.add.json`;
      const response = await axios.post(bitrixUrl, bitrixData, { timeout: 10000 });
      bitrixSuccess = !!response.data.result;
    } catch (error) {
      console.error('Bitrix24 error:', error.message);
    }
  }

  const telegramBotToken = await getSecret('TELEGRAM_BOT_TOKEN') || '';
  const telegramChatId = await getSecret('TELEGRAM_CHAT_ID') || '';

  if (telegramBotToken && telegramChatId) {
    try {
      const telegramMessage = `🆕 Новая заявка с сайта

👤 Имя: ${name}
📞 Телефон: ${phone}

📝 Тип формы: ${type}
🕐 Время: ${timestamp}`;

      const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      const response = await axios.post(telegramUrl, {
        chat_id: telegramChatId,
        text: telegramMessage
      }, { timeout: 10000 });

      telegramSuccess = response.data.ok;
    } catch (error) {
      console.error('Telegram error:', error.message);
    }
  }

  res.json({
    success: true,
    bitrix24: bitrixSuccess,
    telegram: telegramSuccess,
    message: 'Заявка отправлена'
  });
});

module.exports = router;
