const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
    try {
        console.log('>>> PARTNERS: Запрос получен');
        const result = await pool.query(
            'SELECT * FROM partners WHERE is_active = true ORDER BY sort_order'
        );
        console.log('>>> PARTNERS: Найдено', result.rows.length, 'партнёров');
        console.log('>>> PARTNERS: Данные:', JSON.stringify(result.rows));
        res.json(result.rows);
    } catch (error) {
        console.error('>>> PARTNERS: Ошибка:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, logo_url, website, sort_order } = req.body;
        const result = await pool.query(
            'INSERT INTO partners (name, logo_url, website, sort_order, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *',
            [name, logo_url, website, sort_order || 0]
        );
        res.json({ success: true, partner: result.rows[0] });
    } catch (error) {
        console.error('Create partner error:', error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo_url, website, sort_order, is_active } = req.body;
        const result = await pool.query(
            'UPDATE partners SET name = $1, logo_url = $2, website = $3, sort_order = $4, is_active = $5 WHERE id = $6 RETURNING *',
            [name, logo_url, website, sort_order, is_active, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        res.json({ success: true, partner: result.rows[0] });
    } catch (error) {
        console.error('Update partner error:', error);
        res.status(500).json({ error: 'Failed to update partner' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM partners WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete partner error:', error);
        res.status(500).json({ error: 'Failed to delete partner' });
    }
});

module.exports = router;
