/**
 * الأوامر الأساسية للبوت
 */

const userManager = require('../db/userManager');
const activityLogger = require('../db/activityLogger');

const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim()));

/**
 * التحقق من أن المستخدم مشرف
 */
const isAdmin = (userId) => adminIds.includes(userId);

/**
 * أمر البداية /start
 */
const startCommand = async (ctx) => {
  const userId = ctx.from.id;
  const userData = {
    username: ctx.from.username,
    first_name: ctx.from.first_name,
    last_name: ctx.from.last_name,
    role: isAdmin(userId) ? 'admin' : 'user'
  };

  // إضافة المستخدم إلى قاعدة البيانات
  await userManager.addUser(userId, userData);
  await activityLogger.logActivity(userId, '/start', 'بدء استخدام البوت');

  const userRole = isAdmin(userId) ? '👨‍💼 مشرف' : '👤 مستخدم عادي';

  const keyboard = isAdmin(userId)
    ? {
        inline_keyboard: [
          [
            { text: '👥 إدارة المستخدمين', callback_data: 'admin_users' },
            { text: '📊 الإحصائيات', callback_data: 'admin_stats' }
          ],
          [
            { text: '📢 إرسال رسالة', callback_data: 'admin_broadcast' },
            { text: '📋 السجلات', callback_data: 'admin_logs' }
          ],
          [
            { text: '⚙️ الإعدادات', callback_data: 'admin_settings' }
          ]
        ]
      }
    : {
        inline_keyboard: [
          [
            { text: '👤 ملفي الشخصي', callback_data: 'user_profile' },
            { text: '📞 الدعم', callback_data: 'user_support' }
          ]
        ]
      };

  await ctx.reply(
    `🎉 أهلاً وسهلاً ${ctx.from.first_name}!\n\n` +
    `دورك: ${userRole}\n` +
    `معرّفك: ${userId}\n\n` +
    `اختر من القائمة أدناه:`,
    { reply_markup: keyboard }
  );
};

/**
 * أمر المساعدة /help
 */
const helpCommand = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, '/help', 'طلب المساعدة');

  const adminHelp = `
📚 **قائمة الأوامر - المشرفون:**

👥 **/users** - عرض قائمة المستخدمين
📊 **/stats** - عرض الإحصائيات
📢 **/broadcast** - إرسال رسالة لجميع المستخدمين
🔍 **/search** - البحث عن مستخدم
⛔ **/ban** - حظر مستخدم
✅ **/unban** - إلغاء حظر مستخدم
🔄 **/promote** - ترقية مستخدم لمشرف
📋 **/logs** - عرض السجلات
❌ **/delete** - حذف مستخدم
`;

  const userHelp = `
📚 **قائمة الأوامر - المستخدمون:**

👤 **/profile** - عرض ملفك الشخصي
📞 **/support** - التواصل مع الدعم
❓ **/faq** - الأسئلة الشائعة
`;

  const help = isAdmin(userId) ? adminHelp : userHelp;

  await ctx.reply(help, { parse_mode: 'Markdown' });
};

/**
 * أمر الملف الشخصي /profile
 */
const profileCommand = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, '/profile', 'عرض الملف الشخصي');

  const user = await userManager.getUser(userId);

  if (!user) {
    return ctx.reply('❌ لم يتم العثور على ملفك الشخصي');
  }

  const profileText = `
👤 **ملفك الشخصي**

📝 الاسم: ${user.first_name} ${user.last_name || ''}
🔗 المعرّف: @${user.username || 'بدون معرّف'}
🎯 الدور: ${user.role === 'admin' ? '👨‍💼 مشرف' : '👤 مستخدم عادي'}
✅ الحالة: ${user.status === 'active' ? '🟢 نشط' : user.status === 'banned' ? '🔴 محظور' : '⚫ غير نشط'}
📅 تاريخ الانضمام: ${new Date(user.joined_at).toLocaleDateString('ar-SA')}
⏰ آخر نشاط: ${new Date(user.last_activity).toLocaleString('ar-SA')}
📝 ملاحظات: ${user.notes || 'لا توجد ملاحظات'}
`;

  await ctx.reply(profileText, { parse_mode: 'Markdown' });
};

/**
 * أمر الإحصائيات /stats
 */
const statsCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  await activityLogger.logActivity(userId, '/stats', 'عرض الإحصائيات');

  const stats = await userManager.getUserStats();

  const statsText = `
📊 **إحصائيات النظام**

👥 إجمالي المستخدمين: ${stats.total_users || 0}
👨‍💼 عدد المشرفين: ${stats.admin_count || 0}
👤 عدد المستخدمين: ${stats.user_count || 0}
🟢 المستخدمون النشطون: ${stats.active_count || 0}
🔴 المستخدمون المحظورون: ${stats.banned_count || 0}
`;

  await ctx.reply(statsText, { parse_mode: 'Markdown' });
};

module.exports = {
  startCommand,
  helpCommand,
  profileCommand,
  statsCommand,
  isAdmin,
  adminIds
};
