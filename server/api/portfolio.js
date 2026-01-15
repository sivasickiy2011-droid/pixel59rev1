const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyAdminToken } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM portfolio ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM portfolio WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch portfolio item:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio item' });
  }
});

router.post('/', verifyAdminToken, async (req, res) => {
  const { title, description, image_url, project_url, tags, category } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO portfolio (title, description, image_url, project_url, tags, category) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, image_url, project_url, tags, category]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create portfolio item:', error);
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
});

router.put('/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, project_url, tags, category } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE portfolio 
       SET title = $1, description = $2, image_url = $3, project_url = $4, 
           tags = $5, category = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, description, image_url, project_url, tags, category, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update portfolio item:', error);
    res.status(500).json({ error: 'Failed to update portfolio item' });
  }
});

router.delete('/:id', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM portfolio WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }
    
    res.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    console.error('Failed to delete portfolio item:', error);
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
});

module.exports = router;
