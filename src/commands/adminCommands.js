/**
 * أوامر المشرف الإدارية
 */

const userManager = require('../db/userManager');
const activityLogger = require('../db/activityLogger');
const { isAdmin } = require('./basicCommands');

/**
 * عرض قائمة المستخدمين
 */
const usersCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  await activityLogger.logActivity(userId, '/users', 'عرض قائمة المستخدمين');

  const users = await userManager.getAllUsers();

  if (users.length === 0) {
    return ctx.reply('📭 لا توجد مستخدمين حتى الآن');
  }

  let usersList = '👥 **قائمة المستخدمين**\n\n';
  users.forEach((user, index) => {
    usersList += `${index + 1}. ${user.first_name} ${user.last_name || ''}\n`;
    usersList += `   🆔 ${user.user_id} | @${user.username || 'بدون معرّف'}\n`;
    usersList += `   🎯 ${user.role} | ✅ ${user.status}\n\n`;
  });

  // تقسيم الرسالة إذا كانت طويلة جداً
  if (usersList.length > 4096) {
    const chunks = usersList.match(/[\s\S]{1,4096}/g);
    for (const chunk of chunks) {
      await ctx.reply(chunk, { parse_mode: 'Markdown' });
    }
  } else {
    await ctx.reply(usersList, { parse_mode: 'Markdown' });
  }
};

/**
 * البحث عن مستخدم
 */
const searchCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('📝 الاستخدام: /search <معرّف المستخدم أو الاسم>');
  }

  const searchTerm = args.join(' ');
  await activityLogger.logActivity(userId, '/search', `البحث عن: ${searchTerm}`);

  const users = await userManager.getAllUsers();
  const results = users.filter(u =>
    u.user_id.toString().includes(searchTerm) ||
    u.username?.includes(searchTerm) ||
    u.first_name?.includes(searchTerm) ||
    u.last_name?.includes(searchTerm)
  );

  if (results.length === 0) {
    return ctx.reply('❌ لم يتم العثور على نتائج');
  }

  let resultText = `🔍 **نتائج البحث عن: ${searchTerm}**\n\n`;
  results.forEach(user => {
    resultText += `👤 ${user.first_name} ${user.last_name || ''}\n`;
    resultText += `🆔 ${user.user_id} | @${user.username || 'بدون معرّف'}\n`;
    resultText += `🎯 ${user.role} | ✅ ${user.status}\n`;
    resultText += `📅 ${new Date(user.joined_at).toLocaleDateString('ar-SA')}\n\n`;
  });

  await ctx.reply(resultText, { parse_mode: 'Markdown' });
};

/**
 * حظر مستخدم
 */
const banCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('📝 الاستخدام: /ban <معرّف المستخدم>');
  }

  const targetUserId = parseInt(args[0]);
  if (isNaN(targetUserId)) {
    return ctx.reply('❌ معرّف المستخدم غير صحيح');
  }

  const targetUser = await userManager.getUser(targetUserId);
  if (!targetUser) {
    return ctx.reply('❌ لم يتم العثور على المستخدم');
  }

  await userManager.updateUserStatus(targetUserId, 'banned');
  await activityLogger.logActivity(userId, '/ban', `حظر المستخدم: ${targetUserId}`);

  await ctx.reply(
    `✅ تم حظر المستخدم: ${targetUser.first_name} ${targetUser.last_name || ''}\n` +
    `🆔 ${targetUserId}`
  );
};

/**
 * إلغاء حظر مستخدم
 */
const unbanCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('📝 الاستخدام: /unban <معرّف المستخدم>');
  }

  const targetUserId = parseInt(args[0]);
  if (isNaN(targetUserId)) {
    return ctx.reply('❌ معرّف المستخدم غير صحيح');
  }

  const targetUser = await userManager.getUser(targetUserId);
  if (!targetUser) {
    return ctx.reply('❌ لم يتم العثور على المستخدم');
  }

  await userManager.updateUserStatus(targetUserId, 'active');
  await activityLogger.logActivity(userId, '/unban', `إلغاء حظر المستخدم: ${targetUserId}`);

  await ctx.reply(
    `✅ تم إلغاء حظر المستخدم: ${targetUser.first_name} ${targetUser.last_name || ''}\n` +
    `🆔 ${targetUserId}`
  );
};

/**
 * ترقية مستخدم لمشرف
 */
const promoteCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('📝 الاستخدام: /promote <معرّف المستخدم>');
  }

  const targetUserId = parseInt(args[0]);
  if (isNaN(targetUserId)) {
    return ctx.reply('❌ معرّف المستخدم غير صحيح');
  }

  const targetUser = await userManager.getUser(targetUserId);
  if (!targetUser) {
    return ctx.reply('❌ لم يتم العثور على المستخدم');
  }

  await userManager.updateUserRole(targetUserId, 'admin');
  await activityLogger.logActivity(userId, '/promote', `ترقية المستخدم: ${targetUserId}`);

  await ctx.reply(
    `✅ تم ترقية المستخدم: ${targetUser.first_name} ${targetUser.last_name || ''}\n` +
    `🆔 ${targetUserId} إلى مشرف 👨‍💼`
  );
};

/**
 * حذف مستخدم
 */
const deleteCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('📝 الاستخدام: /delete <معرّف المستخدم>');
  }

  const targetUserId = parseInt(args[0]);
  if (isNaN(targetUserId)) {
    return ctx.reply('❌ معرّف المستخدم غير صحيح');
  }

  const targetUser = await userManager.getUser(targetUserId);
  if (!targetUser) {
    return ctx.reply('❌ لم يتم العثور على المستخدم');
  }

  await userManager.deleteUser(targetUserId);
  await activityLogger.logActivity(userId, '/delete', `حذف المستخدم: ${targetUserId}`);

  await ctx.reply(
    `✅ تم حذف المستخدم: ${targetUser.first_name} ${targetUser.last_name || ''}\n` +
    `🆔 ${targetUserId}`
  );
};

/**
 * عرض السجلات
 */
const logsCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  await activityLogger.logActivity(userId, '/logs', 'عرض السجلات');

  const activities = await activityLogger.getAllActivities(20);

  if (activities.length === 0) {
    return ctx.reply('📭 لا توجد سجلات');
  }

  let logsText = '📋 **آخر السجلات**\n\n';
  activities.forEach(activity => {
    logsText += `🆔 ${activity.user_id}\n`;
    logsText += `📌 ${activity.command}\n`;
    logsText += `📝 ${activity.description}\n`;
    logsText += `⏰ ${new Date(activity.timestamp).toLocaleString('ar-SA')}\n\n`;
  });

  if (logsText.length > 4096) {
    const chunks = logsText.match(/[\s\S]{1,4096}/g);
    for (const chunk of chunks) {
      await ctx.reply(chunk, { parse_mode: 'Markdown' });
    }
  } else {
    await ctx.reply(logsText, { parse_mode: 'Markdown' });
  }
};

/**
 * إرسال رسالة جماعية
 */
const broadcastCommand = async (ctx) => {
  const userId = ctx.from.id;

  if (!isAdmin(userId)) {
    return ctx.reply('❌ هذا الأمر متاح فقط للمشرفين');
  }

  const args = ctx.message.text.split(' ').slice(1);
  if (args.length === 0) {
    return ctx.reply('📝 الاستخدام: /broadcast <الرسالة>');
  }

  const message = args.join(' ');
  await activityLogger.logActivity(userId, '/broadcast', `إرسال رسالة جماعية`);

  const users = await userManager.getAllUsers();
  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    if (user.status !== 'banned') {
      try {
        await ctx.telegram.sendMessage(user.user_id, `📢 ${message}`);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
  }

  await ctx.reply(
    `✅ تم إرسال الرسالة\n` +
    `📤 نجح: ${successCount}\n` +
    `❌ فشل: ${failCount}`
  );
};

module.exports = {
  usersCommand,
  searchCommand,
  banCommand,
  unbanCommand,
  promoteCommand,
  deleteCommand,
  logsCommand,
  broadcastCommand
};
