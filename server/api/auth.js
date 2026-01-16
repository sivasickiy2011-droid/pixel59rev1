// const express = require('express');
// const router = express.Router();
// const pool = require('../config/database');
// const { comparePassword, generateToken } = require('../middleware/auth');

// async function logLoginAttempt(ipAddress, userAgent, success) {
//   try {
//     await pool.query(
//       'INSERT INTO admin_login_logs (ip_address, user_agent, success) VALUES ($1, $2, $3)',
//       [ipAddress, userAgent, success]
//     );
//   } catch (error) {
//     console.error('Failed to log login attempt:', error);
//   }
// }

// router.post('/admin', async (req, res) => {
//   const { password } = req.body;
//   const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
//   const userAgent = req.get('user-agent') || 'unknown';

//   if (!password) {
//     await logLoginAttempt(ipAddress, userAgent, false);
//     return res.status(400).json({ error: 'Password required' });
//   }

//   const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
//   if (!adminPasswordHash) {
//     return res.status(500).json({ error: 'Admin password not configured' });
//   }

//   try {
//     const isValid = await comparePassword(password, adminPasswordHash);
//     await logLoginAttempt(ipAddress, userAgent, isValid);

//     if (isValid) {
//       const token = generateToken({ role: 'admin' }, '7d');
//       return res.json({ 
//         success: true, 
//         message: 'Authentication successful',
//         token 
//       });
//     } else {
//       return res.status(401).json({ error: 'Invalid password' });
//     }
//   } catch (error) {
//     console.error('Auth error:', error);
//     await logLoginAttempt(ipAddress, userAgent, false);
//     return res.status(500).json({ error: 'Authentication failed' });
//   }
// });

// router.get('/admin/logs', async (req, res) => {
//   try {
//     const result = await pool.query(
//       'SELECT * FROM admin_login_logs ORDER BY created_at DESC LIMIT 100'
//     );
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Failed to fetch logs:', error);
//     res.status(500).json({ error: 'Failed to fetch login logs' });
//   }
// });

// router.post('/partner', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password required' });
//   }

//   try {
//     const result = await pool.query(
//       'SELECT * FROM partners WHERE email = $1',
//       [email]
//     );

//     if (result.rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     const partner = result.rows[0];
//     const isValid = await comparePassword(password, partner.password_hash);

//     if (isValid) {
//       const token = generateToken({ 
//         partnerId: partner.id, 
//         email: partner.email,
//         role: 'partner'
//       }, '30d');
      
//       return res.json({ 
//         success: true,
//         token,
//         partner: {
//           id: partner.id,
//           email: partner.email,
//           name: partner.name
//         }
//       });
//     } else {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }
//   } catch (error) {
//     console.error('Partner auth error:', error);
//     res.status(500).json({ error: 'Authentication failed' });
//   }
// });

// router.post('/change-password', async (req, res) => {
//   const { oldPassword, newPassword } = req.body;

//   if (!oldPassword || !newPassword) {
//     return res.status(400).json({ error: 'Old and new passwords required' });
//   }

//   const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
//   const isValid = await comparePassword(oldPassword, adminPasswordHash);

//   if (!isValid) {
//     return res.status(401).json({ error: 'Invalid current password' });
//   }

//   const bcrypt = require('bcrypt');
//   const newHash = await bcrypt.hash(newPassword, 10);

//   return res.json({
//     success: true,
//     message: 'Password changed successfully',
//     newHash,
//     instruction: 'Update ADMIN_PASSWORD_HASH in .env file with this hash and restart server'
//   });
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { comparePassword, generateToken } = require('../middleware/auth');

async function logLoginAttempt(ipAddress, userAgent, success) {
    try {
        await pool.query(
            'INSERT INTO admin_login_logs (ip_address, user_agent, success) VALUES ($1, $2, $3)',
            [ipAddress, userAgent, success]
        );
    } catch (error) {
        console.error('Failed to log login attempt:', error);
    }
}

// Авторизация через username и password
router.post('/admin', async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    if (!username || !password) {
        await logLoginAttempt(ipAddress, userAgent, false);
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        // Ищем пользователя в БД
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            await logLoginAttempt(ipAddress, userAgent, false);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValid = await comparePassword(password, user.password_hash);

        await logLoginAttempt(ipAddress, userAgent, isValid);

        if (isValid) {
            const token = generateToken({ 
                id: user.id, 
                username: user.username,
                role: 'admin' 
            }, '7d');
            
            return res.json({ 
                success: true, 
                message: 'Authentication successful',
                token,
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        await logLoginAttempt(ipAddress, userAgent, false);
        return res.status(500).json({ error: 'Authentication failed' });
    }
});

module.exports = router;

// Получить логи авторизации
router.get('/admin/logs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM admin_login_logs ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch logs:', error);
        res.status(500).json({ error: 'Failed to fetch login logs' });
    }
});

// Получить статистику логинов
router.get('/admin/stats', async (req, res) => {
    try {
        const totalResult = await pool.query(
            'SELECT COUNT(*) as total_attempts FROM admin_login_logs'
        );
        
        const successResult = await pool.query(
            'SELECT COUNT(*) as successful_logins FROM admin_login_logs WHERE success = true'
        );
        
        const failedResult = await pool.query(
            'SELECT COUNT(*) as failed_attempts FROM admin_login_logs WHERE success = false'
        );
        
        res.json({
            total_attempts: parseInt(totalResult.rows[0].total_attempts),
            successful_logins: parseInt(successResult.rows[0].successful_logins),
            failed_attempts: parseInt(failedResult.rows[0].failed_attempts)
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        res.json({
            total_attempts: 0,
            successful_logins: 0,
            failed_attempts: 0
        });
    }
});
