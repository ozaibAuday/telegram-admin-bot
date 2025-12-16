# استخدام صورة Node.js الرسمية
FROM node:18-alpine

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات المشروع
COPY package*.json ./
COPY . .

# تثبيت المكتبات
RUN npm ci --only=production

# إنشاء مجلد البيانات
RUN mkdir -p data

# تعيين المتغيرات البيئية
ENV NODE_ENV=production

# بدء البوت
CMD ["node", "src/bot.js"]
