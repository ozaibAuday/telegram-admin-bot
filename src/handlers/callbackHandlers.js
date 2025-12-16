/**
 * معالجات الأزرار الشفافة (Inline Keyboards)
 */

const userManager = require('../db/userManager');
const activityLogger = require('../db/activityLogger');
const { isAdmin } = require('../commands/basicCommands');

/**
 * معالج الأزرار الرئيسي
 */
const handleCallback = async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  const userId = ctx.from.id;

  try {
    // أزرار المشرف
    if (callbackData === 'admin_users') {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      await handleAdminUsers(ctx);
    }
    else if (callbackData === 'admin_stats') {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      await handleAdminStats(ctx);
    }
    else if (callbackData === 'admin_broadcast') {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      await handleAdminBroadcast(ctx);
    }
    else if (callbackData === 'admin_logs') {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      await handleAdminLogs(ctx);
    }
    else if (callbackData === 'admin_settings') {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      await handleAdminSettings(ctx);
    }
    // أزرار المستخدم العادي
    else if (callbackData === 'user_profile') {
      await handleUserProfile(ctx);
    }
    else if (callbackData === 'user_support') {
      await handleUserSupport(ctx);
    }
    // أزرار الإجراءات
    else if (callbackData.startsWith('ban_')) {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      const targetUserId = parseInt(callbackData.split('_')[1]);
      await handleBanUser(ctx, targetUserId);
    }
    else if (callbackData.startsWith('promote_')) {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      const targetUserId = parseInt(callbackData.split('_')[1]);
      await handlePromoteUser(ctx, targetUserId);
    }
    else if (callbackData.startsWith('delete_')) {
      if (!isAdmin(userId)) {
        return ctx.answerCbQuery('❌ لا توجد صلاحيات', true);
      }
      const targetUserId = parseInt(callbackData.split('_')[1]);
      await handleDeleteUser(ctx, targetUserId);
    }
    else if (callbackData === 'back_to_menu') {
      await handleBackToMenu(ctx);
    }

    await ctx.answerCbQuery('✅ تم');
  } catch (error) {
    console.error('❌ خطأ في معالجة الزر:', error);
    await ctx.answerCbQuery('❌ حدث خطأ', true);
  }
};

/**
 * معالج أزرار إدارة المستخدمين
 */
const handleAdminUsers = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'عرض إدارة المستخدمين');

  const users = await userManager.getAllUsers();

  let text = '👥 **إدارة المستخدمين**\n\n';
  text += `إجمالي المستخدمين: ${users.length}\n\n`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔍 بحث', callback_data: 'search_users' },
        { text: '📊 إحصائيات', callback_data: 'admin_stats' }
      ],
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج أزرار الإحصائيات
 */
const handleAdminStats = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'عرض الإحصائيات');

  const stats = await userManager.getUserStats();

  let text = '📊 **إحصائيات النظام**\n\n';
  text += `👥 إجمالي المستخدمين: ${stats.total_users || 0}\n`;
  text += `👨‍💼 عدد المشرفين: ${stats.admin_count || 0}\n`;
  text += `👤 عدد المستخدمين: ${stats.user_count || 0}\n`;
  text += `🟢 المستخدمون النشطون: ${stats.active_count || 0}\n`;
  text += `🔴 المستخدمون المحظورون: ${stats.banned_count || 0}\n`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔄 تحديث', callback_data: 'admin_stats' }
      ],
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج أزرار الرسائل الجماعية
 */
const handleAdminBroadcast = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'عرض الرسائل الجماعية');

  let text = '📢 **الرسائل الجماعية**\n\n';
  text += 'أرسل الرسالة التي تريد نشرها لجميع المستخدمين.\n';
  text += 'استخدم: `/broadcast رسالتك هنا`';

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج أزرار السجلات
 */
const handleAdminLogs = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'عرض السجلات');

  const activities = await activityLogger.getAllActivities(10);

  let text = '📋 **آخر السجلات**\n\n';
  if (activities.length === 0) {
    text += 'لا توجد سجلات';
  } else {
    activities.forEach(activity => {
      text += `🆔 ${activity.user_id} - ${activity.command}\n`;
      text += `⏰ ${new Date(activity.timestamp).toLocaleString('ar-SA')}\n\n`;
    });
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔄 تحديث', callback_data: 'admin_logs' }
      ],
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج أزرار الإعدادات
 */
const handleAdminSettings = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'عرض الإعدادات');

  let text = '⚙️ **إعدادات النظام**\n\n';
  text += 'الإعدادات المتاحة:\n';
  text += '• تنظيف السجلات القديمة\n';
  text += '• إدارة الأدوار\n';
  text += '• إدارة الأذونات\n';

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🧹 تنظيف السجلات', callback_data: 'clean_logs' }
      ],
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج ملف المستخدم الشخصي
 */
const handleUserProfile = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'عرض الملف الشخصي');

  const user = await userManager.getUser(userId);

  if (!user) {
    return ctx.answerCbQuery('❌ لم يتم العثور على ملفك', true);
  }

  let text = '👤 **ملفك الشخصي**\n\n';
  text += `📝 الاسم: ${user.first_name} ${user.last_name || ''}\n`;
  text += `🔗 المعرّف: @${user.username || 'بدون معرّف'}\n`;
  text += `✅ الحالة: ${user.status === 'active' ? '🟢 نشط' : '🔴 محظور'}\n`;
  text += `📅 تاريخ الانضمام: ${new Date(user.joined_at).toLocaleDateString('ar-SA')}\n`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج دعم المستخدم
 */
const handleUserSupport = async (ctx) => {
  const userId = ctx.from.id;
  await activityLogger.logActivity(userId, 'callback', 'طلب الدعم');

  let text = '📞 **الدعم الفني**\n\n';
  text += 'للتواصل مع فريق الدعم:\n';
  text += '📧 البريد الإلكتروني: support@example.com\n';
  text += '💬 قناة الدعم: @support_channel\n';
  text += '⏰ ساعات العمل: 24/7\n';

  const keyboard = {
    inline_keyboard: [
      [
        { text: '⬅️ العودة', callback_data: 'back_to_menu' }
      ]
    ]
  };

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

/**
 * معالج حظر المستخدم
 */
const handleBanUser = async (ctx, targetUserId) => {
  const adminId = ctx.from.id;
  const targetUser = await userManager.getUser(targetUserId);

  if (!targetUser) {
    return ctx.answerCbQuery('❌ لم يتم العثور على المستخدم', true);
  }

  await userManager.updateUserStatus(targetUserId, 'banned');
  await activityLogger.logActivity(adminId, 'ban', `حظر المستخدم ${targetUserId}`);

  await ctx.answerCbQuery(`✅ تم حظر ${targetUser.first_name}`);
};

/**
 * معالج ترقية المستخدم
 */
const handlePromoteUser = async (ctx, targetUserId) => {
  const adminId = ctx.from.id;
  const targetUser = await userManager.getUser(targetUserId);

  if (!targetUser) {
    return ctx.answerCbQuery('❌ لم يتم العثور على المستخدم', true);
  }

  await userManager.updateUserRole(targetUserId, 'admin');
  await activityLogger.logActivity(adminId, 'promote', `ترقية المستخدم ${targetUserId}`);

  await ctx.answerCbQuery(`✅ تم ترقية ${targetUser.first_name} لمشرف`);
};

/**
 * معالج حذف المستخدم
 */
const handleDeleteUser = async (ctx, targetUserId) => {
  const adminId = ctx.from.id;
  const targetUser = await userManager.getUser(targetUserId);

  if (!targetUser) {
    return ctx.answerCbQuery('❌ لم يتم العثور على المستخدم', true);
  }

  await userManager.deleteUser(targetUserId);
  await activityLogger.logActivity(adminId, 'delete', `حذف المستخدم ${targetUserId}`);

  await ctx.answerCbQuery(`✅ تم حذف ${targetUser.first_name}`);
};

/**
 * معالج العودة للقائمة الرئيسية
 */
const handleBackToMenu = async (ctx) => {
  const userId = ctx.from.id;
  const isAdminUser = isAdmin(userId);

  const keyboard = isAdminUser
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

  await ctx.editMessageText('🏠 **القائمة الرئيسية**\n\nاختر من الخيارات أدناه:', {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
};

module.exports = {
  handleCallback
};
