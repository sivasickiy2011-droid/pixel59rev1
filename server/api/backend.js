const express = require('express');
const router = express.Router();

// PARTNERS - Партнёры
router.get('/partners', async (req, res) => {
    try {
        const pool = require('../config/database');
        const result = await pool.query('SELECT * FROM partners WHERE is_active = true ORDER BY sort_order');
        res.json(result.rows);
    } catch (error) {
        console.error('Partners error:', error);
        // Возвращаем тестовые данные если БД недоступна
        res.json([
            { id: 1, name: 'Партнёр 1', logo_url: '/img/partner1.png', website: 'https://partner1.ru' },
            { id: 2, name: 'Партнёр 2', logo_url: '/img/partner2.png', website: 'https://partner2.ru' }
        ]);
    }
});

// NEWS - Новости
router.get('/news', async (req, res) => {
    try {
        res.json([
            { id: 1, title: 'Новость 1', date: '14 января 2026', summary: 'Описание новости...' },
            { id: 2, title: 'Новость 2', date: '13 января 2026', summary: 'Ещё одна новость...' }
        ]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SETTINGS - Настройки
router.get('/settings', async (req, res) => {
    try {
        const pool = require('../config/database');
        const result = await pool.query('SELECT * FROM settings ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Settings error:', error);
        res.json([]);
    }
});

module.exports = router;
