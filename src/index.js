// src/index.js
require('dotenv').config();
const bot = require('./bot');
const db = require('./db');

const checkRemindersEverySec = 60;
setInterval(() => {
  try {
    const rems = db.getActiveReminders();
    const now = new Date();
    const curH = now.getHours();
    const curM = now.getMinutes();
    const dayNum = now.getDay(); // 0=Sun .. 6=Sat
    const mapDay = dayNum === 0 ? 7 : dayNum; // 1=Mon..7=Sun
    rems.forEach(r => {
      const days = (r.days || '').split(',').map(s => Number(s));
      if (!days.includes(mapDay)) return;
      if (r.hour === curH && r.minute === curM) {
        const last = r.last_sent ? new Date(r.last_sent).toISOString().slice(0,10) : null;
        const today = now.toISOString().slice(0,10);
        if (last === today) return; // уже отправляли сегодня
        // отправляем напоминание в чат
        bot.sendMessage(r.chat_id, `Напоминание: измерьте давление для ${r.person_name} — /add ${r.person_id}`);
        db.updateReminderLastSent(r.id, now.toISOString());
      }
    });
  } catch (err) {
    console.error('reminder loop error', err);
  }
}, checkRemindersEverySec * 1000);

console.log('Bot started');
