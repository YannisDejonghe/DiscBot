const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info
};
let client;

//Database entities
let Players;

function join(message, args) {
  Players.findOne({where: {player_id: message.author.id + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send("You've already joined in this server!");
    } else {
      Players.create({
        player_id: message.author.id + message.guild.id,
        gems: 500
      }).then((player) => {
        message.channel.send('Welcome **' + message.author.username + '**');
      })
    }
  });
}

function info(message, args) {
  Players.findOne({where: {player_id: message.author.id + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send(message.author + '\n' + player.gems + ' :gem:');
    }
  });

}

module.exports = (discordclient, db) => {
  Players = db.define('player', {
    player_id: Sequelize.STRING,
    gems: Sequelize.NUMERIC
  });

  client = discordclient;


  return cmds;
}