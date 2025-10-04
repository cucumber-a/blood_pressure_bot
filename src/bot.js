require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const db = require('./db');

const token = process.env.BOT_TOKEN;
if (!token) { console.error('BOT_TOKEN not set'); process.exit(1); }

const bot = new Telegraf(token);
bot.use(Telegraf.log());

const mainKeyboard = Markup.keyboard([
  ["Меню"]
]).resize().persistent();

bot.start(ctx => {
  return ctx.reply(
    "Нажмите на кнопку меню для продолжения",
    mainKeyboard
  );
});

bot.hears("Меню", async ctx => {
	return ctx.reply(
		"Выберите действие:",
		Markup.keyboard([
			["Добавить измерение"],
			["Список людей", "Добавить нового человека"],
			["Закрыть"],
		])
			.resize()
      .persistent()
	);
});

bot.hears("Добавить измерение", ctx => {
  ctx.reply("Пока это не доступно");
  ctx.reply(mainKeyboard);
});
bot.hears("Список людей", ctx => {
  ctx.reply("Пока это не доступно");
  ctx.reply(mainKeyboard);
});
bot.hears("Добавить нового человека", ctx => {
  ctx.reply("Пока это не доступно");
  ctx.reply(mainKeyboard);
});
bot.hears("Закрыть", async ctx => {
  await ctx.reply(mainKeyboard);
});


module.exports = bot;
