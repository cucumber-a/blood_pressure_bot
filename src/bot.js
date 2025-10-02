require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');

const token = process.env.BOT_TOKEN;
if (!token) { console.error('BOT_TOKEN not set'); process.exit(1); }

const bot = new TelegramBot(token, { polling: true });

// простое состояние для диалога: chatId -> state
const states = new Map();

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || msg.from.username || 'User';
  db.createUser(chatId, name);
  bot.sendMessage(chatId, `Привет, ${name}! Чтобы добавить человека: /add_person`);
});

// /add_person
bot.onText(/\/add_person(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const nameArg = match && match[1];
  if (nameArg) {
    db.addPerson(chatId, nameArg);
    bot.sendMessage(chatId, `Добавил человека: ${nameArg}`);
    return;
  }
  states.set(chatId, { action: 'adding_person' });
  bot.sendMessage(chatId, 'Как зовут человека? Введи имя:');
});

// /list_persons
bot.onText(/\/list_persons/, (msg) => {
  const chatId = msg.chat.id;
  const persons = db.listPersons(chatId);
  if (!persons.length) return bot.sendMessage(chatId, 'Нет добавленных людей. /add_person чтобы добавить.');
  const text = persons.map(p => `${p.id}. ${p.name}`).join('\n');
  bot.sendMessage(chatId, `Список:\n${text}\n\nЧтобы добавить измерение: /add <id>`);
});

// /add <personId>
bot.onText(/\/add(?: (\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const id = match && match[1];
  if (!id) {
    return bot.sendMessage(chatId, 'Используй: /add <person_id> (посмотреть id: /list_persons)');
  }
  const personId = Number(id);
  states.set(chatId, { action: 'add_measurement', step: 1, personId, temp: {} });
  bot.sendMessage(chatId, 'Введите верхнее (систолическое) давление (например 120):');
});

// универсальная обработка сообщений в состоянии
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const state = states.get(chatId);
  if (!state) return; // не в диалоге — игнорируем (команды выше обрабатывают)
  const text = (msg.text || '').trim();

  if (state.action === 'adding_person') {
    db.addPerson(chatId, text);
    states.delete(chatId);
    return bot.sendMessage(chatId, `Добавил человека: ${text}`);
  }

  if (state.action === 'add_measurement') {
    const s = state;
    if (s.step === 1) {
      const v = parseInt(text, 10);
      if (isNaN(v)) return bot.sendMessage(chatId, 'Неверное число. Введите верхнее давление (целое).');
      s.temp.systolic = v; s.step = 2;
      return bot.sendMessage(chatId, 'Введите нижнее (диастолическое) давление:');
    }
    if (s.step === 2) {
      const v = parseInt(text, 10);
      if (isNaN(v)) return bot.sendMessage(chatId, 'Неверное число. Введите нижнее давление (целое).');
      s.temp.diastolic = v; s.step = 3;
      return bot.sendMessage(chatId, 'Введите пульс:');
    }
    if (s.step === 3) {
      const v = parseInt(text, 10);
      if (isNaN(v)) return bot.sendMessage(chatId, 'Неверное число. Введите пульс (целое).');
      s.temp.pulse = v; s.step = 4;
      return bot.sendMessage(chatId, 'Оцените самочувствие 1–5:');
    }
    if (s.step === 4) {
      const v = parseInt(text, 10);
      if (isNaN(v) || v < 1 || v > 5) return bot.sendMessage(chatId, 'Неверно. Оценка 1–5.');
      s.temp.mood = v; s.step = 5;
      return bot.sendMessage(chatId, 'Комментарий (или /skip):');
    }
    if (s.step === 5) {
      const comment = text === '/skip' ? '' : text;
      db.addMeasurement(s.personId, s.temp.systolic, s.temp.diastolic, s.temp.pulse, s.temp.mood, comment);
      states.delete(chatId);
      return bot.sendMessage(chatId, `Сохранено ✅\n${s.temp.systolic}/${s.temp.diastolic}, pulse ${s.temp.pulse}, mood ${s.temp.mood}`);
    }
  }
});
module.exports = bot;
