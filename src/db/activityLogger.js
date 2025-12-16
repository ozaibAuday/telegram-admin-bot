/**
 * مسجل النشاطات - تسجيل جميع أنشطة المستخدمين
 */

const db = require('./schema');

class ActivityLogger {
  /**
   * تسجيل نشاط
   */
  async logActivity(userId, command, description = '') {
    try {
      await db.run(
        `INSERT INTO activity_log (user_id, command, description)
         VALUES (?, ?, ?)`,
        [userId, command, description]
      );
    } catch (error) {
      console.error('❌ خطأ في تسجيل النشاط:', error);
    }
  }

  /**
   * الحصول على سجل نشاط المستخدم
   */
  async getUserActivity(userId, limit = 50) {
    try {
      const activities = await db.all(
        `SELECT * FROM activity_log 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [userId, limit]
      );
      return activities;
    } catch (error) {
      console.error('❌ خطأ في جلب سجل النشاط:', error);
      throw error;
    }
  }

  /**
   * الحصول على جميع السجلات
   */
  async getAllActivities(limit = 100) {
    try {
      const activities = await db.all(
        `SELECT * FROM activity_log 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [limit]
      );
      return activities;
    } catch (error) {
      console.error('❌ خطأ في جلب السجلات:', error);
      throw error;
    }
  }

  /**
   * حذف السجلات القديمة
   */
  async cleanOldActivities(daysOld = 30) {
    try {
      await db.run(
        `DELETE FROM activity_log 
         WHERE timestamp < datetime('now', '-' || ? || ' days')`,
        [daysOld]
      );
    } catch (error) {
      console.error('❌ خطأ في حذف السجلات القديمة:', error);
    }
  }
}

module.exports = new ActivityLogger();
