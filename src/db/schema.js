/**
 * قاعدة البيانات - تعريف الجداول والهيكل
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/bot.db');

class Database {
  constructor() {
    this.db = null;
  }

  /**
   * فتح اتصال قاعدة البيانات
   */
  open() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * تشغيل استعلام SQL
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * الحصول على صف واحد
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * الحصول على جميع الصفوف
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * إنشاء الجداول
   */
  async createTables() {
    // جدول المستخدمين
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'banned')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'banned')),
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    // جدول الأوامر والأنشطة
    await this.run(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        command TEXT,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // جدول الإشعارات
    await this.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'error', 'success')),
        read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);

    // جدول الرسائل المجدولة
    await this.run(`
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        target_user_id INTEGER,
        message TEXT,
        scheduled_time DATETIME,
        sent BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(user_id),
        FOREIGN KEY (target_user_id) REFERENCES users(user_id)
      )
    `);

    console.log('✅ تم إنشاء جميع الجداول بنجاح');
  }

  /**
   * إغلاق الاتصال
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
