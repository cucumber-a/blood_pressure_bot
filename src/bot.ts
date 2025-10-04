import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import { ACTIONS } from './models';
import { addPerson, listPersons } from './db';
import { Message } from 'telegraf/types';

const token = process.env.BOT_TOKEN;
if (!token) { console.error('BOT_TOKEN not set'); process.exit(1); }

const bot = new Telegraf(token);
bot.use(Telegraf.log());

const chatState: Map<number, { action: ACTIONS }> = new Map();

const mainKeyboard = Markup.keyboard([
  [ACTIONS.ADD_MEASUREMENT],
  [ACTIONS.LIST_PEOPLE, ACTIONS.ADD_PERSON],
]).resize().persistent();

bot.start(async ctx => {
  return ctx.reply( 
    "Нажмите на кнопку меню для просмотра доступных действий",
    mainKeyboard
  );
});
bot.hears(ACTIONS.MENU, async ctx => {
	return ctx.reply(
		"Выберите действие:",
    mainKeyboard
  );
});
bot.hears(ACTIONS.ADD_MEASUREMENT, ctx => {
  ctx.reply("Пока это не доступно", mainKeyboard);
});
bot.hears(ACTIONS.LIST_PEOPLE, ctx => {
  ctx.reply('List people in progress...');
  const persons = listPersons(ctx.chat.id);
  const list = persons.map((person, index) => `${index + 1}. ${person.name}`).join('\n');
  ctx.reply(`Список людей:\n${list}`, mainKeyboard);
});
bot.hears(ACTIONS.ADD_PERSON, ctx => {
  ctx.reply('Add person in progress...');
  const chatId = ctx.chat.id;
  chatState.set(chatId, { action: ACTIONS.ADD_PERSON });
  ctx.reply(
    "Введите имя:",
    Markup.keyboard([[ACTIONS.CANCEL]]).resize(),
  );
});
bot.hears(ACTIONS.CANCEL, ctx => {
  ctx.reply('Cancel in progress...');
  const chatId = ctx.chat.id;
  const state = chatState.get(chatId);
  console.log('Cancel state', state, chatId);
  if (!state) {
    ctx.reply('Выберите действие:', mainKeyboard);
  } else {
    chatState.delete(chatId);
    ctx.reply("Выберите действие:", mainKeyboard);
  }
});
bot.on(ACTIONS.MESSAGE, ctx => {
  const chatId = ctx.chat.id;
  const state = chatState.get(chatId);
  if (!state) return;

  if (state.action === ACTIONS.ADD_PERSON) {
    console.log('Add person state', state, chatId);
    const message = ctx.message as Message.TextMessage;
    const name = message.text.trim();
    if (name.toLowerCase() === ACTIONS.CANCEL) return;
    chatState.delete(chatId);

    addPerson(chatId, name);
    ctx.reply(`Добавлен человек: ${name}`, mainKeyboard);
    console.log('Add person state done', state, chatId);
  }
});

export default bot;
