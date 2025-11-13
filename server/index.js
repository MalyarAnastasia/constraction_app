require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require ('pg');
const authMiddleware = require('./middleware/authMiddleware.js');
const roleMiddleware = require('./middleware/roleMiddleware');

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

  app.post('/api/projects', authMiddleware, roleMiddleware([2, 1]), async (req, res) =>{

    try{

      const {project_name, description, start_date, end_date} = req.body;

      if(!project_name){
        return res.status(400).json({
          massege: 'Введите название проекта'
        })
      };

      const manager_id = req.user.id;

      const query = `
      INSERT INTO projects (project_name, description, start_date, end_date, manager_id, created_at) 
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING project_id, project_name, description, manager_id, created_at`;

      const values = [project_name, description, start_date || null, end_date || null, managerId];

      const NewProject = await pool.query(query, values);

      res.status(201).json({
        massege: 'Проект успешно создан',
        project: NewProject.rows[0]
      });

    }catch(err){
      console.error('Неудается создать проект', err);
      return res.status(500).json({
        massege: 'Неудается создать проект'
      })
    }
  });

app.get('/api/projects', authMiddleware, async (req, res) =>{
  try{
    const result = await pool.query(`SELECT * FROM projects`);
    res.json(result.rows);

  }catch(err){
    console.error('Ошибка получания проетов', err)
    res.status(500).json({
      massege: 'Ошибка получения проектов'
    })
  }
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try{
  const ProjectId = req.params.id;
  const query = `
              SELECT project_id, project_name, description, manager_id, created_at
              FROM projects 
              WHERE project_id = $1`;

  }catch(err){    
    console.error('Ошибка получания проетов', err)
    res.status(500).json({
      massege: 'Ошибка получения проектов'
    })
  }
});

app.put('/api/projects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
  try{
    const {project_name, description, start_date, end_date} = req.body;
    const projectId = req.params.id;

    if(!project_name){
      return res.status(400).json({
        massege: 'Требуется название проекта для обновления'
      })
    };

    const query = `UPDATE projects SET project_name = $1, description = $2, start_date = $3, end_date = $4 
    WHERE project_id = $5 RETURNING *`

    const values = [project_name, description, start_date || null, end_date || null, ProjectId]

    const updatedProject = await pool.query(query, values);

    if (updatedProject.rows.length === 0) {
      return res.status(404).json({ message: `Проект с ID ${projectId} не найден.` });
    }


    res.status(200).json({
      message: 'Проект успешно обновлен.',
      project: updatedProject.rows[0]
    });

  }catch (err){
    console.error('Ошибка при обновлении проекта', err);
    res.status(500).json({
      massege: 'Ошибка при обновлении проекта'
    })
  }
});

app.delete('/api/projects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
  try{

    const projectId = req.params.id;

    const query = `DELETE FROM projects WHERE project_id = $1`

    const values = [projectId];

    const DeleteProject = await pool.query(query, values);

    if (DeleteProject.rowCount === 0){
      return res.status(404).json({
        massege: `Проект с ID ${projectId} не найден.`
      });
    };

  res.status(204).send();

  }catch(err){
    console.error('Ошибка при удалении проекта', err);
    return res.status(500).json({
      massege:'Ошибка при удалении проекта'
    })
  }
});

app.post('api/defects', authMiddleware, roleMiddleware([1, 2]), async(req, res) =>{
  try{
    const {title, description, project_id, priority, due_date, assignee_id} = req.body;
    const RepoterId = req.user.id;


    if (!title || !priority || !project_id) {
       return res.status(400).json({ 
       message: 'Требуются: Заголовок, Приоритет и ID Проекта.' 
     });
     }

    const query = `INSERT INTO defects (title, description, priority, status_id, assignee_id, 
    reporter_id, project_id, due_date, created_at)
    VALUES ($1, $2, $3, 1, $4, $5, $6, $7, NOW())
    RETURNING *`

    const values = [title, description, priority, assignee_id || null, RepoterId, project_id, due_date || null];
    const newDefect = await pool.query(query, values);

    res.status(201).json({
      massege: 'Дефект успешно создан',
      project: newDefect.rows[0]
    });

  }catch(err){
    console.error('Ошибка при создании дефекта')
    return res.status(500).json({
      massege: 'Ошибка при добавлении проекта'
    })
  }
});

app.get ('/api/defects/by-project/:projectId', authMiddleware, async(req, res) =>{
  try{
    const ProjectId = req.params.projectId;
    const query = `SELECT * FROM defects where project_id = $1`

    if(!ProjectId){
      res.status(400).send({
        massege: 'Дефект не найден'
    });
    };

    const result = await pool.query(query, [ProjectId]);
    res.json = result.rows[0];

  }catch(err){
    console.error('Ошибка получения дефекта по id', err);
    return res.status(500).json({
      massege: 'Ошибка получения дефекта'
    })
  }
});

app.put('/api/defects/:id', authMiddleware, roleMiddleware([1, 2]), async(req, res) =>{
  try{
    const DefectId = req.params.id;
    const {title, description, priority, status_id, due_date, assignee_id} = req.body;

  if (!title && !description && !priority && !status_id && !assignee_id && !due_date) {
    return res.status(400).json({ 
    message: 'Необходимо передать хотя бы одно поле для обновления.' 
  });
  }

    const query = `UPDATE defects SET title = $1, description = $2, priority = $3, status_id = $4, assignee_id = $5, 
     due_date = $6, updated_at = NOW() RETURNING *`
    const values = [title, description, priority, status_id, assignee_id || null, due_date || null, DefectId];

    const updatedDefect = await pool.query(query, values);

    if (updatedDefect.rows.length === 0) {
      return res.status(404).json({ message: `Дефект с ID ${defectId} не найден.` });
    }
    return res.status(200).json({
      message: 'Дефект успешно обновлен.',
      defect: updatedDefect.rows[0]
    });

  }catch(err){
    console.error('Ошибка при обновлении дефекта', err);
    return res.status(500).json({
      massege: 'Ошибка при обновлении дефекта'
    })
  }
});

app.delete('/api/defects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
  try{

    const DefectId = req.params.id;
    const query = `DELETE FROM defect WHERE defect_id = $1`
    const values = [DefectId]

    const DeleteDefect = await pool.query(query, values);

    if (DeleteDefect.rowCount === 0){
      return res.status(404).json({
        massege: `Дефект с id ${DefectId} не найден`
      })
    };

    res.status(204).send;

  }catch(err){
    console.error('Ошибка при удалении дефекта', err);
    return res.status(500).json({
      massege: 'Ошибка при удалении дефекта'
    })
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});