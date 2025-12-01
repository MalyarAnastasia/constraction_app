const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseBackup {
    constructor() {
        this.backupDir = path.join(__dirname, 'backups');
        this.ensureBackupDir();
    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    createBackup() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
            
            const command = `pg_dump -U ${process.env.PG_USER} -h ${process.env.PG_HOST} -d ${process.env.PG_DATABASE} > ${backupFile}`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ошибка создания бэкапа:', error);
                    reject(error);
                    return;
                }
                
                console.log(`✅ Бэкап создан: ${backupFile}`);
                resolve(backupFile);
            });
        });
    }

    // Автоматическое удаление старых бэкапов (храним только последние 7 дней)
    cleanupOldBackups() {
        const files = fs.readdirSync(this.backupDir);
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(this.backupDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime.getTime() > sevenDays) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Удален старый бэкап: ${file}`);
            }
        });
    }

    // Восстановление из бэкапа
    restoreBackup(backupFile) {
        return new Promise((resolve, reject) => {
            const command = `psql -U ${process.env.PG_USER} -h ${process.env.PG_HOST} -d ${process.env.PG_DATABASE} < ${backupFile}`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('Ошибка восстановления:', error);
                    reject(error);
                    return;
                }
                
                console.log(`✅ База данных восстановлена из: ${backupFile}`);
                resolve();
            });
        });
    }
}

module.exports = DatabaseBackup;