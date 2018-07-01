const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info,
  stats: stats
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
        player_id: message.author.id + message.guild.id
      }).then((player) => {
        message.channel.send('Welcome **' + message.author.username + '**');
      })
    }
  });
}

function info(message, args) {
  Players.findOne({where: {player_id: message.author.id + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send(message.author + '\n' + player.gems + ' :gem:'
                                          + '\n' + player.combat_lvl + ' :crossed_swords: '
                                         //place weapon here
                                         );
    }
  });

}

function stats(message, args) {
  Players.findOne({where: {player_id: message.author.id + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send(message.author + '\n' + player.combat_lvl + ' :crossed_swords: ' 
                                          + '\n' +  player.hitpoints + ' :revolving_hearts: '
                                          + '\n' + player.strength_lvl + ' :muscle: ' 
                                          + '\n' + player.archery_lvl + ' :bow_and_arrow: ' 
                                          + '\n' + player.defence_lvl + ' :shield: ' 
                                          + '\n' + player.crafting_lvl + ' :poop:'
                                        );
    }
  });

}




module.exports = (discordclient, db) => {
  Players = db.define('player', {
    player_id: Sequelize.STRING,
    gems: {type: Sequelize.NUMERIC, defaultValue: 500},
    hitpoints: {type: Sequelize.NUMERIC, defaultValue: 1000},
    combat_lvl: {type: Sequelize.NUMERIC, defaultValue: 35},
    strength_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
    archery_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
    defence_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
    crafting_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
  });

  client = discordclient;


  return cmds;
}