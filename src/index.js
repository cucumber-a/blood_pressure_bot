require('dotenv').config();
const bot = require('./bot');
const db = require('./db');

bot.launch();

console.log('Bot started');
