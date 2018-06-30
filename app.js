require('dotenv').config();

const Sequelize = require('sequelize');
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  operatorsAliases: false,
  logging: false
});

const Discord = require("discord.js");
const client = new Discord.Client();

const commands = require('./commands')(client);
const game = require('./game')(client, db);

client.on("ready", () => {

  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {

  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {

  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`on ${client.guilds.size} servers`);
});


client.on("message", async (message) => {
  if (message.author.bot) return;
  if (message.content.indexOf(process.env.PREFIX) !== 0) return;
  const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command in commands) {
    commands[command](message, args);
  }

  if (command in game) {
    game[command](message, args);
  }
});

/*client.on('typingStart', async (channel, user) => {
  client.channels.get(channel.id).send('Stop met typen!');
});*/

db.sync().then(() => {
  client.login(process.env.DISCORD_TOKEN);
});