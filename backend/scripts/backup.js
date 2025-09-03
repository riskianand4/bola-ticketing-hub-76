require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `persiraja_backup_${timestamp}.sql`);
  
  const pgDumpCommand = `pg_dump \
    --host=${DB_CONFIG.host} \
    --port=${DB_CONFIG.port} \
    --username=${DB_CONFIG.user} \
    --dbname=${DB_CONFIG.database} \
    --no-password \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --file=${backupFile}`;

  return new Promise((resolve, reject) => {
    // Set password via environment
    process.env.PGPASSWORD = DB_CONFIG.password;
    
    exec(pgDumpCommand, (error, stdout, stderr) => {
      delete process.env.PGPASSWORD;
      
      if (error) {
        console.error('Backup failed:', error);
        reject(error);
        return;
      }
      
      console.log('Backup created successfully:', backupFile);
      console.log('Output:', stdout);
      
      if (stderr) {
        console.log('Warnings:', stderr);
      }
      
      resolve(backupFile);
    });
  });
}

async function cleanOldBackups() {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const files = fs.readdirSync(BACKUP_DIR);
  
  for (const file of files) {
    if (file.startsWith('persiraja_backup_') && file.endsWith('.sql')) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log('Deleted old backup:', file);
      }
    }
  }
}

async function restoreBackup(backupFile) {
  if (!fs.existsSync(backupFile)) {
    throw new Error('Backup file not found: ' + backupFile);
  }
  
  const psqlCommand = `psql \
    --host=${DB_CONFIG.host} \
    --port=${DB_CONFIG.port} \
    --username=${DB_CONFIG.user} \
    --dbname=${DB_CONFIG.database} \
    --file=${backupFile}`;

  return new Promise((resolve, reject) => {
    process.env.PGPASSWORD = DB_CONFIG.password;
    
    exec(psqlCommand, (error, stdout, stderr) => {
      delete process.env.PGPASSWORD;
      
      if (error) {
        console.error('Restore failed:', error);
        reject(error);
        return;
      }
      
      console.log('Database restored successfully from:', backupFile);
      console.log('Output:', stdout);
      
      if (stderr) {
        console.log('Warnings:', stderr);
      }
      
      resolve();
    });
  });
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'create':
        await createBackup();
        await cleanOldBackups();
        break;
        
      case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('Please provide backup file path');
          process.exit(1);
        }
        await restoreBackup(backupFile);
        break;
        
      case 'clean':
        await cleanOldBackups();
        break;
        
      default:
        console.log('Usage:');
        console.log('  node backup.js create       - Create new backup');
        console.log('  node backup.js restore <file> - Restore from backup');
        console.log('  node backup.js clean        - Clean old backups');
        break;
    }
  } catch (error) {
    console.error('Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createBackup,
  restoreBackup,
  cleanOldBackups
};