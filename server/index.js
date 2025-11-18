require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors()); 
app.use(express.json());

const authMiddleware = require('./middleware/authMiddleware.js');
const roleMiddleware = require('./middleware/roleMiddleware.js');

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, full_name, password, email } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Требуется имя пользователя и пароль' });
        }

        const existingUser = await pool.query(`SELECT user_id FROM users WHERE username = $1`, [username]);

        if (existingUser.rows.length > 0) { 
            return res.status(409).json({ message: 'Пользователь с таким именем уже создан' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password_hash, full_name, email, role_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING user_id, username, role_id`;

        const values = [username, hashedPassword, full_name, email, 3]; 

        const newUser = await pool.query(query, values);

        res.status(201).json({
            message: 'Пользователь успешно создан',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.status(500).json({ message: 'Ошибка сервера при регистрации пользователя' }); 
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await pool.query(`SELECT user_id, username, password_hash, role_id FROM users WHERE username = $1`, [username]);

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const UserData = user.rows[0]; 
        const truePassword = await bcrypt.compare(password, UserData.password_hash);

        if (!truePassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const payload = {
            id: UserData.user_id,
            role: UserData.role_id
        };

        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: { id: UserData.user_id, username: UserData.username, role: UserData.role_id }
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
});

app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`SELECT user_id, username, full_name, role_id FROM users`);
        res.json(result.rows);
    }
    catch (err) {
        console.error(`Ошибка при получении пользователей`, err);
        res.status(500).json({ message: `Ошибка при получении данных` });
    }
});

app.post('/api/projects', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const { project_name, description, start_date, end_date } = req.body;
        const manager_id = req.user.id; 

        if (!project_name) {
            return res.status(400).json({ message: 'Введите название проекта' });
        }

        const query = `
            INSERT INTO projects (project_name, description, start_date, end_date, manager_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *`;

        const values = [project_name, description, start_date || null, end_date || null, manager_id];
        const NewProject = await pool.query(query, values);

        res.status(201).json({
            message: 'Проект успешно создан',
            project: NewProject.rows[0]
        });

    } catch (err) {
        console.error('Не удается создать проект:', err);
        return res.status(500).json({ message: 'Не удается создать проект' });
    }
});

app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM projects ORDER BY created_at DESC`);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения проектов:', err);
        res.status(500).json({ message: 'Ошибка получения проектов' });
    }
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        const query = `SELECT * FROM projects WHERE project_id = $1`;

        const result = await pool.query(query, [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Проект не найден' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error('Ошибка получения проекта:', err);
        res.status(500).json({ message: 'Ошибка получения проектов' });
    }
});

app.put('/api/projects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const { project_name, description, start_date, end_date } = req.body;
        const projectId = req.params.id; 

        if (!project_name) {
            return res.status(400).json({ message: 'Требуется название проекта для обновления' });
        }

        const query = `
            UPDATE projects SET project_name = $1, description = $2, start_date = $3, end_date = $4 
            WHERE project_id = $5 
            RETURNING *`;

        const values = [project_name, description, start_date || null, end_date || null, projectId];
        const updatedProject = await pool.query(query, values);

        if (updatedProject.rows.length === 0) {
            return res.status(404).json({ message: `Проект с ID ${projectId} не найден.` });
        }

        res.status(200).json({
            message: 'Проект успешно обновлен.',
            project: updatedProject.rows[0]
        });

    } catch (err) {
        console.error('Ошибка при обновлении проекта:', err);
        res.status(500).json({ message: 'Ошибка при обновлении проекта' });
    }
});

app.delete('/api/projects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const projectId = req.params.id;
        const query = `DELETE FROM projects WHERE project_id = $1`;
        const values = [projectId];

        const DeleteProject = await pool.query(query, values);

        if (DeleteProject.rowCount === 0) {
            return res.status(404).json({ message: `Проект с ID ${projectId} не найден.` });
        }

        res.status(204).send(); 

    } catch (err) {
        console.error('Ошибка при удалении проекта:', err);
        return res.status(500).json({ message: 'Ошибка при удалении проекта' });
    }
});

app.post('/api/defects', authMiddleware, roleMiddleware([1, 2]), async (req, res) => { 
    try {
        const { title, description, project_id, priority, due_date, assignee_id } = req.body;
        const reporterId = req.user.id;

        if (!title || !priority || !project_id) {
            return res.status(400).json({ message: 'Требуются: Заголовок, Приоритет и ID Проекта.' });
        }

        const query = `
            INSERT INTO defects (title, description, priority, status_id, assignee_id, reporter_id, project_id, due_date, created_at)
            VALUES ($1, $2, $3, 1, $4, $5, $6, $7, NOW())
            RETURNING *`;

        const values = [title, description, priority, assignee_id || null, reporterId, project_id, due_date || null];
        const newDefect = await pool.query(query, values);

        res.status(201).json({
            message: 'Дефект успешно создан',
            defect: newDefect.rows[0] 
        });

    } catch (err) {
        console.error('Ошибка при создании дефекта', err);
        return res.status(500).json({ message: 'Ошибка при добавлении дефекта' });
    }
});

app.get('/api/defects', authMiddleware, async (req, res) => { 
    try {
        let query = `SELECT * FROM defects`;
        const conditions = [];
        const values = [];

        if (req.query.status_id) {
            values.push(req.query.status_id);
            conditions.push(`status_id = $${values.length}`);
        }
        if (req.query.assignee_id) {
            values.push(req.query.assignee_id);
            conditions.push(`assignee_id = $${values.length}`);
        }
        if (req.query.project_id) {
            values.push(req.query.project_id);
            conditions.push(`project_id = $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY created_at DESC';

        const defects = await pool.query(query, values);
        res.json(defects.rows);

    } catch (err) {
        console.error('Ошибка фильтрации:', err);
        return res.status(500).json({ message: 'Ошибка фильтрации' });
    }
});

app.get('/api/defects/:id', authMiddleware, async (req, res) => { 
    try {
        const defectId = req.params.id;
        const values = [defectId];

        const defectQuery = `SELECT * FROM defects WHERE defect_id = $1`;
        const InfoResult = await pool.query(defectQuery, values);

        if (InfoResult.rows.length === 0) {
            return res.status(404).json({ message: `Дефект с ID ${defectId} не найден.` });
        }
        const defectData = InfoResult.rows[0];

        const historyQuery = `SELECT * FROM defect_history WHERE defect_id = $1 ORDER BY change_date ASC`; 
        const HistoryResult = await pool.query(historyQuery, values);
        const defectHistory = HistoryResult.rows; 

        res.json({
            defect: defectData,
            history: defectHistory
        });
    }
    catch (err) {
        console.error('Ошибка получения истории по заданному дефекту', err);
        res.status(500).json({ message: 'Ошибка получения истории по заданному дефекту' });
    }
});

app.put('/api/defects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    const client = await pool.connect();
    try {
        const defectId = req.params.id;
        const userId = req.user.id;

        await client.query('BEGIN');

        const oldDefectQuery = `SELECT * FROM defects WHERE defect_id = $1 FOR UPDATE`; 
        const oldDefectResult = await client.query(oldDefectQuery, [defectId]); 

        if (oldDefectResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Дефект с ID ${defectId} не найден.` });
        }
        const oldDefect = oldDefectResult.rows[0];

        const { title, description, priority, status_id, due_date, assignee_id } = req.body;
        const newValues = {
            title: title !== undefined ? title : oldDefect.title,
            description: description !== undefined ? description : oldDefect.description,
            priority: priority !== undefined ? priority : oldDefect.priority,
            status_id: status_id !== undefined ? status_id : oldDefect.status_id,
            assignee_id: assignee_id !== undefined ? assignee_id : oldDefect.assignee_id,
            due_date: due_date !== undefined ? due_date : oldDefect.due_date,
        };

        const updateQuery = `
            UPDATE defects 
            SET title = $1, description = $2, priority = $3, status_id = $4, assignee_id = $5, due_date = $6, updated_at = NOW() 
            WHERE defect_id = $7 
            RETURNING *`;
        const updateValues = [
            newValues.title, newValues.description, newValues.priority, 
            newValues.status_id, newValues.assignee_id, newValues.due_date, 
            defectId 
        ];
        
        const updatedDefect = await client.query(updateQuery, updateValues); 

        const historyEntries = [];
        const fieldsToLog = ['title', 'description', 'priority', 'status_id', 'assignee_id', 'due_date'];

        for (const field of fieldsToLog) {
            const newValue = req.body[field]; 
            const oldValue = oldDefect[field];

            if (newValue !== undefined && String(newValue) !== String(oldValue)) {
                historyEntries.push({
                    field: field,
                    old: oldValue,
                    new: newValue
                });
            }
        }

        for (const entry of historyEntries) {
            const historyQuery = `
                INSERT INTO defect_history (defect_id, changed_by, field_name, old_value, new_value, change_date) 
                VALUES ($1, $2, $3, $4, $5, NOW())`;
            const historyValues = [defectId, userId, entry.field, String(entry.old), String(entry.new)];
            await client.query(historyQuery, historyValues); 
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Дефект успешно обновлен', defect: updatedDefect.rows[0] });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error('Ошибка при обновлении дефекта (транзакция):', err);
        return res.status(500).json({ message: 'Ошибка при обновлении дефекта' });
    } finally {
        client.release(); 
    }
});

app.delete('/api/defects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const defectId = req.params.id;
        const query = `DELETE FROM defects WHERE defect_id = $1`; 
        const values = [defectId];

        const DeleteDefect = await pool.query(query, values);

        if (DeleteDefect.rowCount === 0) {
            return res.status(404).json({ message: `Дефект с id ${defectId} не найден` });
        }

        res.status(204).send(); 

    } catch (err) {
        console.error('Ошибка при удалении дефекта:', err);
        return res.status(500).json({ message: 'Ошибка при удалении дефекта' });
    }
});

app.get('/api/export/defects', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const query = `
            SELECT defect_id, title, description, status_id, priority, assignee_id, reporter_id, project_id,
            due_date, created_at, updated_at 
            FROM defects ORDER BY defect_id ASC`;
            
        const defectResults = await pool.query(query); 
        const defects = defectResults.rows; 

        if (defects.length === 0) {
            return res.status(404).json({ message: 'Нет данных для экспорта' });
        }

        const headers = Object.keys(defects[0]);
        const headerRow = headers.join(';'); 

        const dataRows = defects.map(defect => { 
            return headers.map(header => {
                let value = defect[header];
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""').replace(/\n/g, ' ');
                } else if (value === null || value === undefined) {
                    value = '';
                }
                return `"${value}"`;
            }).join(';');
        });

        const csvData = [headerRow, ...dataRows].join('\n');

        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Content-Disposition', 'attachment; filename="defects_export.csv"');
        res.send(csvData);

    } catch (err) {
        console.error('Ошибка при экспорте дефектов', err); 
        res.status(500).json({ message: 'Ошибка при экспорте данных' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});