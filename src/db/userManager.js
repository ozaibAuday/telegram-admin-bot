/**
 * مدير المستخدمين - جميع العمليات المتعلقة بالمستخدمين
 */

const db = require('./schema');

class UserManager {
  /**
   * إضافة مستخدم جديد
   */
  async addUser(userId, userData) {
    const { username, first_name, last_name, role = 'user' } = userData;
    
    try {
      const result = await db.run(
        `INSERT OR IGNORE INTO users (user_id, username, first_name, last_name, role)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, username, first_name, last_name, role]
      );
      return result;
    } catch (error) {
      console.error('❌ خطأ في إضافة المستخدم:', error);
      throw error;
    }
  }

  /**
   * الحصول على بيانات المستخدم
   */
  async getUser(userId) {
    try {
      const user = await db.get(
        'SELECT * FROM users WHERE user_id = ?',
        [userId]
      );
      return user;
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات المستخدم:', error);
      throw error;
    }
  }

  /**
   * تحديث دور المستخدم
   */
  async updateUserRole(userId, role) {
    if (!['admin', 'user', 'banned'].includes(role)) {
      throw new Error('دور غير صحيح');
    }

    try {
      await db.run(
        'UPDATE users SET role = ? WHERE user_id = ?',
        [role, userId]
      );
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث دور المستخدم:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة المستخدم
   */
  async updateUserStatus(userId, status) {
    if (!['active', 'inactive', 'banned'].includes(status)) {
      throw new Error('حالة غير صحيحة');
    }

    try {
      await db.run(
        'UPDATE users SET status = ? WHERE user_id = ?',
        [status, userId]
      );
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة المستخدم:', error);
      throw error;
    }
  }

  /**
   * الحصول على جميع المستخدمين
   */
  async getAllUsers() {
    try {
      const users = await db.all('SELECT * FROM users ORDER BY joined_at DESC');
      return users;
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      throw error;
    }
  }

  /**
   * الحصول على المستخدمين حسب الدور
   */
  async getUsersByRole(role) {
    try {
      const users = await db.all(
        'SELECT * FROM users WHERE role = ? ORDER BY joined_at DESC',
        [role]
      );
      return users;
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المستخدمين
   */
  async getUserStats() {
    try {
      const stats = await db.get(`
        SELECT
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned_count
        FROM users
      `);
      return stats;
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      throw error;
    }
  }

  /**
   * تحديث آخر نشاط للمستخدم
   */
  async updateLastActivity(userId) {
    try {
      await db.run(
        'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('❌ خطأ في تحديث آخر نشاط:', error);
    }
  }

  /**
   * حذف مستخدم
   */
  async deleteUser(userId) {
    try {
      await db.run('DELETE FROM users WHERE user_id = ?', [userId]);
      return true;
    } catch (error) {
      console.error('❌ خطأ في حذف المستخدم:', error);
      throw error;
    }
  }

  /**
   * إضافة ملاحظة للمستخدم
   */
  async addUserNote(userId, note) {
    try {
      await db.run(
        'UPDATE users SET notes = ? WHERE user_id = ?',
        [note, userId]
      );
      return true;
    } catch (error) {
      console.error('❌ خطأ في إضافة الملاحظة:', error);
      throw error;
    }
  }
}

module.exports = new UserManager();
