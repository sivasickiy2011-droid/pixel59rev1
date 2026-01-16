const bcrypt = require('bcrypt');
const password = process.argv[2] || 'admin123';
const hash = bcrypt.hashSync(password, 10);
console.log('Password:', password);
console.log('Hash:', hash);
console.log('');
console.log('Добавьте в server/.env:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
