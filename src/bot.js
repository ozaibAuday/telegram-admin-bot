/**
 * بوت التليجرام الرئيسي
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');
const db = require('./db/schema');
const { startCommand, helpCommand, profileCommand, statsCommand } = require('./commands/basicCommands');
const {
  usersCommand,
  searchCommand,
  banCommand,
  unbanCommand,
  promoteCommand,
  deleteCommand,
  logsCommand,
  broadcastCommand
} = require('./commands/adminCommands');
const { handleCallback } = require('./handlers/callbackHandlers');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ خطأ: لم يتم تعيين BOT_TOKEN في ملف .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

/**
 * تهيئة قاعدة البيانات
 */
async function initializeDatabase() {
  try {
    await db.open();
    await db.createTables();
    console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    process.exit(1);
  }
}

/**
 * تسجيل الأوامر الأساسية
 */
function registerCommands() {
  // الأوامر الأساسية
  bot.command('start', startCommand);
  bot.command('help', helpCommand);
  bot.command('profile', profileCommand);
  bot.command('stats', statsCommand);

  // أوامر المشرف
  bot.command('users', usersCommand);
  bot.command('search', searchCommand);
  bot.command('ban', banCommand);
  bot.command('unban', unbanCommand);
  bot.command('promote', promoteCommand);
  bot.command('delete', deleteCommand);
  bot.command('logs', logsCommand);
  bot.command('broadcast', broadcastCommand);

  console.log('✅ تم تسجيل جميع الأوامر');
}

/**
 * تسجيل معالجات الأزرار
 */
function registerHandlers() {
  // معالج الأزرار الشفافة
  bot.on('callback_query', handleCallback);

  // معالج الرسائل العادية
  bot.on('message', async (ctx) => {
    // لا نفعل شيء للرسائل العادية حالياً
    // يمكن إضافة معالجات إضافية هنا
  });

  console.log('✅ تم تسجيل معالجات الأزرار');
}

/**
 * معالج الأخطاء
 */
function setupErrorHandling() {
  bot.catch((err, ctx) => {
    console.error('❌ خطأ في البوت:', err);
    ctx.reply('❌ حدث خطأ. يرجى المحاولة لاحقاً.').catch(console.error);
  });
}

/**
 * بدء البوت
 */
async function startBot() {
  try {
    // تهيئة قاعدة البيانات
    await initializeDatabase();

    // تسجيل الأوامر والمعالجات
    registerCommands();
    registerHandlers();
    setupErrorHandling();

    // بدء البوت
    await bot.launch();

    console.log('🚀 تم تشغيل البوت بنجاح!');
    console.log('📝 معرّف البوت:', bot.botInfo.id);
    console.log('👤 اسم البوت:', bot.botInfo.first_name);

    // معالج الإيقاف الآمن
    process.once('SIGINT', () => {
      console.log('\n⏹️  إيقاف البوت...');
      bot.stop('SIGINT');
      db.close();
      process.exit(0);
    });

    process.once('SIGTERM', () => {
      console.log('\n⏹️  إيقاف البوت...');
      bot.stop('SIGTERM');
      db.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ خطأ في بدء البوت:', error);
    process.exit(1);
  }
}

// بدء البوت
startBot();

module.exports = bot;
