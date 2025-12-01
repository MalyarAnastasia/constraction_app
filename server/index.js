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

        const existingUser = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);

        if (existingUser.rows.length > 0) { 
            return res.status(409).json({ message: 'Пользователь с таким именем уже создан' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, password_hash, full_name, email, role_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING id, username, role_id`;

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
        const user = await pool.query(`SELECT id, username, password_hash, role_id FROM users WHERE username = $1`, [username]);

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const UserData = user.rows[0]; 
        const truePassword = await bcrypt.compare(password, UserData.password_hash);

        if (!truePassword) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const payload = {
            id: UserData.id,
            role: UserData.role_id
        };

        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: { id: UserData.id, username: UserData.username, role: UserData.role_id }
        });

    } catch (err) {
        console.error('Ошибка входа:', err);
        res.status(500).json({ message: 'Ошибка сервера при входе' });
    }
});

app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const query = `SELECT id, username, email FROM users ORDER BY username`;
        const users = await pool.query(query);
        res.json(users.rows);
    } catch (err) {
        console.error('Ошибка получения пользователей:', err);
        res.status(500).json({ message: 'Ошибка получения пользователей' });
    }
});


app.post('/api/projects', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const { name, description, start_date, end_date } = req.body; 
        const manager_id = req.user.id; 

        if (!name || name.trim().length === 0) {
             return res.status(400).json({ message: 'Введите название проекта' });
        }
        
        const query = `
             INSERT INTO projects (
                 project_name,
                 description,
                 start_date,
                 end_date,
                 manager_id,
                 created_at
             ) 
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING *`;

        const values = [
            name,                               
            description || null,                
            start_date || null,                 
            end_date || null,                   
            manager_id                          
        ];

        const NewProject = await pool.query(query, values);

        res.status(201).json({
            message: 'Проект успешно создан',
            project: NewProject.rows[0]
        });

    } catch (err) {
        console.error('Критическая ошибка при создании проекта:', err.message, err); 
        return res.status(500).json({ 
            message: 'Не удается создать проект из-за ошибки базы данных.',
            errorDetails: err.message
        });
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

app.get('/api/project-stages', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM public.project_stages ORDER BY stage_id ASC`);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения этапов проектов:', err);
        res.status(500).json({ message: 'Ошибка получения этапов проектов' });
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

app.put('/api/projects/:id/stage', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const { stage_id } = req.body;
        const projectId = req.params.id;

        if (!stage_id) {
            return res.status(400).json({ message: 'Требуется ID этапа' });
        }

        const query = `
            UPDATE projects SET stage_id = $1 
            WHERE project_id = $2 
            RETURNING *`;

        const values = [stage_id, projectId];
        const updatedProject = await pool.query(query, values);

        if (updatedProject.rows.length === 0) {
            return res.status(404).json({ message: `Проект с ID ${projectId} не найден.` });
        }

        res.status(200).json({
            message: 'Этап проекта успешно обновлен.',
            project: updatedProject.rows[0]
        });

    } catch (err) {
        console.error('Ошибка при обновлении этапа проекта:', err);
        res.status(500).json({ message: 'Ошибка при обновлении этапа проекта' });
    }
});

app.get('/api/projects/:id/defects', authMiddleware, async (req, res) => {
    try {
        const projectId = req.params.id;
        const query = `
            SELECT d.*, p.project_name 
            FROM defects d 
            JOIN projects p ON d.project_id = p.project_id 
            WHERE d.project_id = $1 
            ORDER BY d.created_at DESC`;

        const result = await pool.query(query, [projectId]);

        res.json(result.rows);

    } catch (err) {
        console.error('Ошибка получения дефектов проекта:', err);
        res.status(500).json({ message: 'Ошибка получения дефектов проекта' });
    }
});

app.put('/api/projects/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const { name, description, start_date, end_date, stage_id } = req.body;
        const projectId = req.params.id; 

        if (!name) {
            return res.status(400).json({ message: 'Требуется название проекта для обновления' });
        }

        const query = `
            UPDATE projects SET 
                project_name = $1, 
                description = $2, 
                start_date = $3, 
                end_date = $4,
                stage_id = $5
            WHERE project_id = $6 
            RETURNING *`;

        const values = [
            name, 
            description || null, 
            start_date || null, 
            end_date || null,
            stage_id || null,
            projectId
        ];
        
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
        const { title, description, project_id, priority, status_id, assignee_id, due_date } = req.body;
        const reporterId = req.user.id;

        console.log('Полученные данные:', req.body);

        if (!title || !priority || !project_id) {
            return res.status(400).json({ message: 'Требуются: Заголовок, Приоритет и ID Проекта.' });
        }

        const projectCheck = await pool.query('SELECT * FROM projects WHERE project_id = $1', [project_id]);
        if (projectCheck.rows.length === 0) {
            return res.status(400).json({ message: 'Указанный проект не существует' });
        }

        const query = `
            INSERT INTO defects (title, description, priority, status_id, assignee_id, reporter_id, project_id, due_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *`;

        const values = [
            title, 
            description || null, 
            priority, 
            status_id || 1, 
            assignee_id || null, 
            reporterId, 
            project_id, 
            due_date || null
        ];

        console.log('SQL запрос:', query);
        console.log('Значения:', values);

        const newDefect = await pool.query(query, values);

        res.status(201).json({
            message: 'Дефект успешно создан',
            defect: newDefect.rows[0] 
        });

    } catch (err) {
        console.error('Ошибка при создании дефекта:', err);
        return res.status(500).json({ message: 'Ошибка при добавлении дефекта: ' + err.message });
    }
});


app.get('/api/defects/:id', authMiddleware, async (req, res) => { 
    try {
        const defectId = req.params.id;
        const values = [defectId];

        const defectQuery = `
            SELECT d.*, 
                   ds.status_name,
                   p.project_name,
                   u_reporter.username as reporter_name,
                   u_assignee.username as assignee_name
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            LEFT JOIN projects p ON d.project_id = p.project_id
            LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
            LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
            WHERE d.defect_id = $1
        `;
        
        const defectResult = await pool.query(defectQuery, values);

        if (defectResult.rows.length === 0) {
            return res.status(404).json({ message: `Дефект с ID ${defectId} не найден.` });
        }
        const defectData = defectResult.rows[0];

        const historyQuery = `
            SELECT dh.*, u.username as changed_by_name
            FROM defect_history dh
            LEFT JOIN users u ON dh.changed_by = u.id
            WHERE dh.defect_id = $1 
            ORDER BY dh.change_date DESC
        `; 
        const historyResult = await pool.query(historyQuery, values);
        const defectHistory = historyResult.rows;

        const commentsQuery = `
            SELECT c.*, u.username as author_name
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.defect_id = $1 
            ORDER BY c.created_at DESC
        `;
        const commentsResult = await pool.query(commentsQuery, values);
        const comments = commentsResult.rows;

        const attachmentsQuery = `
            SELECT a.*, u.username as uploaded_by_name
            FROM attachments a
            LEFT JOIN users u ON a.uploaded_by = u.id
            WHERE a.defect_id = $1 
            ORDER BY a.uploaded_at DESC
        `;
        const attachmentsResult = await pool.query(attachmentsQuery, values);
        const attachments = attachmentsResult.rows;

        res.json({
            defect: defectData,
            history: defectHistory,
            comments: comments,
            attachments: attachments
        });
    }
    catch (err) {
        console.error('Ошибка получения данных дефекта:', err);
        res.status(500).json({ message: 'Ошибка получения данных дефекта' });
    }
});

app.put('/api/defects/:id', authMiddleware, roleMiddleware(1), async (req, res) => {
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

        const { title, description, priority, status_id, due_date, assignee_id, project_id } = req.body;
        const newValues = {
            title: title !== undefined ? title : oldDefect.title,
            description: description !== undefined ? description : oldDefect.description,
            priority: priority !== undefined ? priority : oldDefect.priority,
            status_id: status_id !== undefined ? status_id : oldDefect.status_id,
            assignee_id: assignee_id !== undefined ? assignee_id : oldDefect.assignee_id,
            due_date: due_date !== undefined ? due_date : oldDefect.due_date,
            project_id: project_id !== undefined ? project_id : oldDefect.project_id,
        };

        const updateQuery = `
            UPDATE defects 
            SET title = $1, description = $2, priority = $3, status_id = $4, 
                assignee_id = $5, due_date = $6, project_id = $7, updated_at = NOW() 
            WHERE defect_id = $8 
            RETURNING *`;
        const updateValues = [
            newValues.title, newValues.description, newValues.priority, 
            newValues.status_id, newValues.assignee_id, newValues.due_date,
            newValues.project_id, defectId
        ];
        
        const updatedDefect = await client.query(updateQuery, updateValues); 

        const historyEntries = [];
        const fieldsToLog = ['title', 'description', 'priority', 'status_id', 'assignee_id', 'due_date', 'project_id'];

        for (const field of fieldsToLog) {
            const newValue = req.body[field]; 
            const oldValue = oldDefect[field];

            const newValueStr = newValue !== undefined && newValue !== null ? String(newValue) : null;
            const oldValueStr = oldValue !== undefined && oldValue !== null ? String(oldValue) : null;

            if (newValue !== undefined && newValueStr !== oldValueStr) {
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
            const historyValues = [
                defectId, 
                userId, 
                entry.field, 
                entry.old !== null && entry.old !== undefined ? String(entry.old) : null, 
                entry.new !== null && entry.new !== undefined ? String(entry.new) : null
            ];
            await client.query(historyQuery, historyValues); 
        }

        await client.query('COMMIT');
        
        const updatedDefectQuery = `
            SELECT d.*, 
                   ds.status_name,
                   p.project_name,
                   u_reporter.username as reporter_name,
                   u_assignee.username as assignee_name
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            LEFT JOIN projects p ON d.project_id = p.project_id
            LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
            LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
            WHERE d.defect_id = $1
        `;
        const finalDefectResult = await client.query(updatedDefectQuery, [defectId]);
        
        res.status(200).json({ 
            message: 'Дефект успешно обновлен', 
            defect: finalDefectResult.rows[0] 
        });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error('Ошибка при обновлении дефекта (транзакция):', err);
        return res.status(500).json({ message: 'Ошибка при обновлении дефекта: ' + err.message });
    } finally {
        client.release(); 
    }
});


app.delete('/api/defects/:id', authMiddleware, roleMiddleware(1), async (req, res) => {
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

app.get('/api/defects', authMiddleware, async (req, res) => { 
    try {
        let query = `
            SELECT d.*, 
                   ds.status_name,
                   p.project_name,
                   u_reporter.username as reporter_name,
                   u_assignee.username as assignee_name
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            LEFT JOIN projects p ON d.project_id = p.project_id
            LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
            LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
        `;
        
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (req.query.status_id) {
            paramCount++;
            values.push(req.query.status_id);
            conditions.push(`d.status_id = $${paramCount}`);
        }
        if (req.query.assignee_id) {
            paramCount++;
            values.push(req.query.assignee_id);
            conditions.push(`d.assignee_id = $${paramCount}`);
        }
        if (req.query.project_id) {
            paramCount++;
            values.push(req.query.project_id);
            conditions.push(`d.project_id = $${paramCount}`);
        }
        if (req.query.priority) {
            paramCount++;
            values.push(req.query.priority);
            conditions.push(`d.priority = $${paramCount}`);
        }
        if (req.query.reporter_id) {
            paramCount++;
            values.push(req.query.reporter_id);
            conditions.push(`d.reporter_id = $${paramCount}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY d.created_at DESC';

        const defects = await pool.query(query, values);
        res.json(defects.rows);

    } catch (err) {
        console.error('Ошибка получения дефектов:', err);
        return res.status(500).json({ message: 'Ошибка получения дефектов' });
    }
});

app.get('/api/defects/:id', authMiddleware, async (req, res) => { 
    try {
        const defectId = req.params.id;
        const values = [defectId];

        const defectQuery = `
            SELECT d.*, 
                   ds.status_name,
                   p.project_name,
                   u_reporter.username as reporter_name,
                   u_assignee.username as assignee_name
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            LEFT JOIN projects p ON d.project_id = p.project_id
            LEFT JOIN users u_reporter ON d.reporter_id = u_reporter.id
            LEFT JOIN users u_assignee ON d.assignee_id = u_assignee.id
            WHERE d.defect_id = $1
        `;
        
        const defectResult = await pool.query(defectQuery, values);

        if (defectResult.rows.length === 0) {
            return res.status(404).json({ message: `Дефект с ID ${defectId} не найден.` });
        }
        const defectData = defectResult.rows[0];

        const historyQuery = `
            SELECT dh.*, u.username as changed_by_name
            FROM defect_history dh
            LEFT JOIN users u ON dh.changed_by = u.id
            WHERE dh.defect_id = $1 
            ORDER BY dh.change_date DESC
        `; 
        const historyResult = await pool.query(historyQuery, values);
        const defectHistory = historyResult.rows;

        const commentsQuery = `
            SELECT c.*, u.username as author_name
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.defect_id = $1 
            ORDER BY c.created_at DESC
        `;
        const commentsResult = await pool.query(commentsQuery, values);
        const comments = commentsResult.rows;

        const attachmentsQuery = `
            SELECT a.*, u.username as uploaded_by_name
            FROM attachments a
            LEFT JOIN users u ON a.uploaded_by = u.id
            WHERE a.defect_id = $1 
            ORDER BY a.uploaded_at DESC
        `;
        const attachmentsResult = await pool.query(attachmentsQuery, values);
        const attachments = attachmentsResult.rows;

        res.json({
            defect: defectData,
            history: defectHistory,
            comments: comments,
            attachments: attachments
        });
    }
    catch (err) {
        console.error('Ошибка получения данных дефекта:', err);
        res.status(500).json({ message: 'Ошибка получения данных дефекта' });
    }
});

app.post('/api/defects/:id/comments', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const defectId = req.params.id;
        const { comment_text } = req.body;
        const userId = req.user.id;

        console.log('Добавление комментария:', { defectId, comment_text, userId });

        if (!comment_text || comment_text.trim().length === 0) {
            return res.status(400).json({ message: 'Текст комментария не может быть пустым' });
        }

        const defectCheck = await client.query('SELECT * FROM defects WHERE defect_id = $1', [defectId]);
        if (defectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Дефект не найден' });
        }

        const query = `
            INSERT INTO comments (defect_id, user_id, comment_text, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *
        `;
        const values = [defectId, userId, comment_text.trim()];
        
        const newComment = await client.query(query, values);

        const commentWithUser = await client.query(`
            SELECT c.*, u.username as author_name 
            FROM comments c 
            LEFT JOIN users u ON c.user_id = u.id 
            WHERE c.comment_id = $1
        `, [newComment.rows[0].comment_id]);
        
        res.status(201).json({
            message: 'Комментарий успешно добавлен',
            comment: commentWithUser.rows[0]
        });

    } catch (err) {
        console.error('Ошибка при добавлении комментария:', err);
        res.status(500).json({ message: 'Ошибка при добавлении комментария: ' + err.message });
    } finally {
        client.release();
    }
});

app.post('/api/defects/:id/attachments', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const defectId = req.params.id;
        const { file_name, file_path, file_size, mime_type } = req.body;
        const userId = req.user.id;

        console.log('Добавление вложения:', { defectId, file_name, file_path, userId });

        if (!file_name || !file_path) {
            return res.status(400).json({ message: 'Имя файла и путь обязательны' });
        }

        const defectCheck = await client.query('SELECT * FROM defects WHERE defect_id = $1', [defectId]);
        if (defectCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Дефект не найден' });
        }

        const query = `
            INSERT INTO attachments (defect_id, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *
        `;
        const values = [
            defectId, 
            file_name, 
            file_path, 
            file_size || null, 
            mime_type || 'application/octet-stream', 
            userId
        ];
        
        console.log('Выполняем запрос:', query, values);
        
        const newAttachment = await client.query(query, values);
        
        const attachmentWithUser = await client.query(`
            SELECT a.*, u.username as uploaded_by_name 
            FROM attachments a 
            LEFT JOIN users u ON a.uploaded_by = u.id 
            WHERE a.attachment_id = $1
        `, [newAttachment.rows[0].attachment_id]);
        
        console.log('Вложение успешно добавлено:', attachmentWithUser.rows[0]);
        
        res.status(201).json({
            message: 'Файл успешно загружен',
            attachment: attachmentWithUser.rows[0]
        });

    } catch (err) {
        console.error('Ошибка при загрузке файла:', err);
        console.error('Детали ошибки:', err.stack);
        res.status(500).json({ message: 'Ошибка при загрузке файла: ' + err.message });
    } finally {
        client.release();
    }
});
app.delete('/api/attachments/:id', authMiddleware, roleMiddleware([1, 2]), async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const query = `DELETE FROM attachments WHERE attachment_id = $1`;
        const values = [attachmentId];

        const deleteResult = await pool.query(query, values);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: `Вложение с ID ${attachmentId} не найдено` });
        }

        res.status(200).json({ message: 'Вложение успешно удалено' });

    } catch (err) {
        console.error('Ошибка при удалении вложения:', err);
        res.status(500).json({ message: 'Ошибка при удалении вложения' });
    }
});


app.get('/api/defect-statuses', authMiddleware, async (req, res) => {
    try {
        const query = `SELECT * FROM defect_statuses ORDER BY status_id`;
        const statuses = await pool.query(query);
        res.json(statuses.rows);
    } catch (err) {
        console.error('Ошибка получения статусов:', err);
        res.status(500).json({ message: 'Ошибка получения статусов' });
    }
});

app.get('/api/reports/defects-stats', authMiddleware, async (req, res) => {
    try {
        const { timeRange = 'month', project_id } = req.query;
        
        console.log('📊 Fetching defect stats with params:', { timeRange, project_id });
        
        let dateFilter = '';
        const queryParams = [];
        let paramCount = 0;

        if (project_id && project_id !== 'all') {
            paramCount++;
            queryParams.push(project_id);
            dateFilter += ` AND d.project_id = $${paramCount}`;
        }

        switch (timeRange) {
            case 'week':
                dateFilter += ` AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
                break;
            case 'month':
                dateFilter += ` AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
                break;
            case 'quarter':
                dateFilter += ` AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'`;
                break;
            case 'year':
                dateFilter += ` AND d.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
                break;
            default:
                break;
        }

        console.log('📊 Date filter:', dateFilter);
        console.log('📊 Query params:', queryParams);

        const statsQuery = `
            SELECT 
                COUNT(*) as total_defects,
                COUNT(CASE WHEN d.status_id IN (1, 2, 3) THEN 1 END) as open_defects, -- Новая, В работе, На проверке
                COUNT(CASE WHEN d.status_id IN (4, 5) THEN 1 END) as resolved_defects, -- Закрыта, Отменена
                COALESCE(AVG(
                    CASE WHEN d.status_id IN (4, 5) -- Закрыта, Отменена
                    THEN EXTRACT(EPOCH FROM (COALESCE(d.updated_at, CURRENT_TIMESTAMP) - d.created_at)) / 86400 
                    END
                ), 0) as avg_resolution_time
            FROM defects d
            WHERE 1=1 ${dateFilter}
        `;

        const statusQuery = `
            SELECT 
                ds.status_name,
                COUNT(*) as value
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            WHERE 1=1 ${dateFilter}
            GROUP BY ds.status_name, ds.status_id
            ORDER BY value DESC
        `;

        const priorityQuery = `
            SELECT 
                priority,
                COUNT(*) as value
            FROM defects d
            WHERE 1=1 ${dateFilter}
            GROUP BY priority
            ORDER BY 
                CASE priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END
        `;

        const projectsQuery = `
            SELECT 
                p.project_name,
                COUNT(*) as defect_count
            FROM defects d
            LEFT JOIN projects p ON d.project_id = p.project_id
            WHERE 1=1 ${dateFilter}
            GROUP BY p.project_id, p.project_name
            ORDER BY defect_count DESC
            LIMIT 10
        `;

        const trendQuery = `
            SELECT 
                DATE(d.created_at) as date,
                COUNT(*) as count
            FROM defects d
            WHERE 1=1 ${dateFilter}
            GROUP BY DATE(d.created_at)
            ORDER BY date
            LIMIT 30
        `;

        const assigneeQuery = `
            SELECT 
                u.username as assignee_name,
                COUNT(CASE WHEN d.status_id IN (4, 5) THEN 1 END) as resolved_count, -- Закрыта, Отменена
                COUNT(CASE WHEN d.status_id IN (1, 2, 3) THEN 1 END) as open_count -- Новая, В работе, На проверке
            FROM defects d
            LEFT JOIN users u ON d.assignee_id = u.id
            WHERE d.assignee_id IS NOT NULL AND 1=1 ${dateFilter}
            GROUP BY u.id, u.username
            ORDER BY resolved_count DESC
            LIMIT 10
        `;

        const resolutionTimeQuery = `
            SELECT 
                d.priority,
                COALESCE(AVG(
                    EXTRACT(EPOCH FROM (COALESCE(d.updated_at, CURRENT_TIMESTAMP) - d.created_at)) / 86400
                ), 0) as avg_days
            FROM defects d
            WHERE d.status_id IN (4, 5) AND 1=1 ${dateFilter} -- Закрыта, Отменена
            GROUP BY d.priority
            ORDER BY 
                CASE d.priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END
        `;

        const [
            statsResult,
            statusResult,
            priorityResult,
            projectsResult,
            trendResult,
            assigneeResult,
            resolutionTimeResult
        ] = await Promise.all([
            pool.query(statsQuery, queryParams),
            pool.query(statusQuery, queryParams),
            pool.query(priorityQuery, queryParams),
            pool.query(projectsQuery, queryParams),
            pool.query(trendQuery, queryParams),
            pool.query(assigneeQuery, queryParams),
            pool.query(resolutionTimeQuery, queryParams)
        ]);

        console.log('📊 Stats result:', statsResult.rows[0]);
        console.log('📊 Status result:', statusResult.rows);
        console.log('📊 Priority result:', priorityResult.rows);

        const responseData = {
            totalDefects: parseInt(statsResult.rows[0]?.total_defects) || 0,
            openDefects: parseInt(statsResult.rows[0]?.open_defects) || 0,
            resolvedDefects: parseInt(statsResult.rows[0]?.resolved_defects) || 0,
            avgResolutionTime: Math.round(statsResult.rows[0]?.avg_resolution_time) || 0,
            defectsByStatus: statusResult.rows,
            defectsByPriority: priorityResult.rows,
            defectsByProject: projectsResult.rows,
            defectsTrend: trendResult.rows,
            assigneeEfficiency: assigneeResult.rows,
            resolutionTimeByPriority: resolutionTimeResult.rows
        };

        console.log('📊 Final response data:', responseData);

        res.json(responseData);

    } catch (err) {
        console.error('❌ Error fetching defect stats:', err);
        console.error('❌ Error stack:', err.stack);
        res.status(500).json({ 
            message: 'Ошибка при получении статистики',
            error: err.message 
        });
    }
});

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const { timeRange = 'week' } = req.query;
        
        let dateFilter = '';
        switch (timeRange) {
            case 'week':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
                break;
            case 'month':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
                break;
            case 'quarter':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'`;
                break;
            case 'year':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
                break;
            default:
                dateFilter = '';
        }

        const statsQuery = `
            SELECT 
                COUNT(*) as total_defects,
                COUNT(CASE WHEN d.status_id IN (1, 2, 3) THEN 1 END) as open_defects,
                COUNT(CASE WHEN d.status_id IN (4, 5) THEN 1 END) as resolved_defects,
                COALESCE(AVG(
                    CASE WHEN d.status_id IN (4, 5)
                    THEN EXTRACT(EPOCH FROM (COALESCE(d.updated_at, CURRENT_TIMESTAMP) - d.created_at)) / 86400 
                    END
                ), 0) as avg_resolution_time
            FROM defects d
            WHERE 1=1 ${dateFilter}
        `;
        
        const statusQuery = `
            SELECT 
                ds.status_name,
                COUNT(*) as count
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            WHERE 1=1 ${dateFilter}
            GROUP BY ds.status_name, ds.status_id
            ORDER BY count DESC
        `;

        const priorityQuery = `
            SELECT 
                priority,
                COUNT(*) as count
            FROM defects d
            WHERE 1=1 ${dateFilter}
            GROUP BY priority
            ORDER BY 
                CASE priority 
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END
        `;

        const projectsQuery = `
            SELECT 
                p.project_id,
                p.project_name,
                COUNT(*) as defect_count
            FROM defects d
            LEFT JOIN projects p ON d.project_id = p.project_id
            WHERE 1=1 ${dateFilter}
            GROUP BY p.project_id, p.project_name
            ORDER BY defect_count DESC
            LIMIT 5
        `;

        const trendQuery = `
            SELECT 
                DATE(d.created_at) as date,
                COUNT(*) as count
            FROM defects d
            WHERE 1=1 ${dateFilter}
            GROUP BY DATE(d.created_at)
            ORDER BY date
            LIMIT 14
        `;

        const [
            statsResult,
            statusResult,
            priorityResult,
            projectsResult,
            trendResult
        ] = await Promise.all([
            pool.query(statsQuery),
            pool.query(statusQuery),
            pool.query(priorityQuery),
            pool.query(projectsQuery),
            pool.query(trendQuery)
        ]);

        const changes = {
            defectsChange: 12,
            openChange: -5,
            resolvedChange: 8,
            timeChange: -2
        };

        res.json({
            totalDefects: parseInt(statsResult.rows[0]?.total_defects) || 0,
            openDefects: parseInt(statsResult.rows[0]?.open_defects) || 0,
            resolvedDefects: parseInt(statsResult.rows[0]?.resolved_defects) || 0,
            avgResolutionTime: Math.round(statsResult.rows[0]?.avg_resolution_time) || 0,
            defectsByStatus: statusResult.rows,
            defectsByPriority: priorityResult.rows,
            defectsByProject: projectsResult.rows,
            defectsTrend: trendResult.rows,
            ...changes
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ message: 'Ошибка при получении статистики дашборда' });
    }
});

app.get('/api/dashboard/recent-defects', authMiddleware, async (req, res) => {
    try {
        const { timeRange = 'week' } = req.query;
        
        let dateFilter = '';
        switch (timeRange) {
            case 'week':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
                break;
            case 'month':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
                break;
            case 'quarter':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '90 days'`;
                break;
            case 'year':
                dateFilter = `AND d.created_at >= CURRENT_DATE - INTERVAL '365 days'`;
                break;
            default:
                dateFilter = '';
        }

        const query = `
            SELECT 
                d.defect_id,
                d.title,
                d.priority,
                ds.status_name,
                d.created_at
            FROM defects d
            LEFT JOIN defect_statuses ds ON d.status_id = ds.status_id
            WHERE 1=1 ${dateFilter}
            ORDER BY d.created_at DESC
            LIMIT 10
        `;

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error('Error fetching recent defects:', err);
        res.status(500).json({ message: 'Ошибка при получении последних дефектов' });
    }
});

const DatabaseBackup = require('./backup');
const backupManager = new DatabaseBackup();

app.post('/api/admin/backup', authMiddleware, roleMiddleware([1]), async (req, res) => {
    try {
        const backupFile = await backupManager.createBackup();
        
        res.json({
            message: 'Резервная копия создана успешно',
            backupFile: path.basename(backupFile),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Ошибка создания бэкапа:', error);
        res.status(500).json({ message: 'Ошибка создания резервной копии' });
    }
});

app.get('/api/admin/backups', authMiddleware, roleMiddleware([1]), async (req, res) => {
    try {
        const files = fs.readdirSync(backupManager.backupDir)
            .filter(file => file.endsWith('.sql'))
            .map(file => {
                const filePath = path.join(backupManager.backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.mtime,
                    readableSize: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));

        res.json(files);
    } catch (error) {
        console.error('Ошибка получения списка бэкапов:', error);
        res.status(500).json({ message: 'Ошибка получения списка бэкапов' });
    }
});

app.get('/api/admin/backups/:filename', authMiddleware, roleMiddleware([1]), async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(backupManager.backupDir, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Файл бэкапа не найден' });
        }

        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Ошибка скачивания бэкапа:', error);
        res.status(500).json({ message: 'Ошибка скачивания бэкапа' });
    }
});

app.post('/api/admin/restore/:filename', authMiddleware, roleMiddleware([1]), async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(backupManager.backupDir, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Файл бэкапа не найден' });
        }

        await backupManager.restoreBackup(filePath);
        
        res.json({ message: 'База данных успешно восстановлена из резервной копии' });
    } catch (error) {
        console.error('Ошибка восстановления:', error);
        res.status(500).json({ message: 'Ошибка восстановления базы данных' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});