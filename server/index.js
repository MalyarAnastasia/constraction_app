require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require ('pg');
const authMiddleware = require('./middleware/authMiddleware.js');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});


const app = express();

app.use(cors())
app.get('/api/projects', (req, res) => {
  res.send({massege: 'Сообщение c бэка' })
});

app.use(express.json())


app.get('/api/users', authMiddleware, async (req, res) => {
  try{
    const result = await pool.query(`SELECT * FROM users`);
    res.json(result.rows);
  }
  catch(err){
    console.error(`Ошибка при получении пользователей`, err);
    res.status(500).json({
      massege: `Ошибка при получении данных`
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try{

  const {username, full_name, password, email} = req.body;  

  if (!username || !password){
    return res.status(400).json({massege: 'Заполните имя и фамилию'});
  }

  const existingUser = await pool.query(`SELECT user_id FROM users WHERE username = $1 `, [username]);

  if (existingUser.rows.listen > 0) {
    return res.status(409)({massege: 'Пользователь с таким именем уже создан'});
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
  INSERT INTO users (username, password_hash, full_name, email, role_id, created_at) 
  VALUES ($1, $2, $3, $4, $5, NOW()) 
  RETURNING user_id, username, role_id`;

  const values = [username, hashedPassword, full_name, email, 3];
  const newUser = await pool.query(query, values);

  res.status(201).json({
    massege: 'Пользователь успешно создан',
    user: newUser.rows[0]
  })

  
  } catch (err) {
    console.error('Ошибка регистрации', err);
    res.status(400)({massege: 'Ошибка сервера при регистрации пользователя'});
  }
});

app.post('/api/auth/login', async (req, res) =>{
  try{
    const {username, password} = req.body; 
    const user = await pool.query(`SELECT user_id, username, password_hash, role_id FROM users WHERE username = $1`, [username]);

    if (user.rows.length === 0) {
      return res.status(401).json({
        massege: 'Неверный логин или пароль'
      });
    };

    const truePassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!truePassword){
      return res.status(401).json({
        massege:'Неверный логмн или пароль'
      });
    };

    if (truePassword){
      const UserData = user.rows[0];
      const payload = {
        id: UserData.user_id,
        role: UserData.role_id
      };

      const secret = process.env.JWT_SECRET

      const token = jwt.sign(payload, secret, { expiresIn: '1h' })

      res.json({
      message: 'Вход выполнен успешно',
      token, 
      user: { id: userData.user_id, username: userData.username, role: userData.role_id }
  });
};

  }catch (err){
    console.error('Ошибка регистрации', err);
    res.status(500).json({
      massege:'Ошибка регистрации'
    });
  };
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});