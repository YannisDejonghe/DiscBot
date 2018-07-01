const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info,
  shop: shop,
  stats: stats
};
let client;

//Database entities
let Players;
let Weapons;

function initialize() {
  let inits = {
    weapons: [
      {
        name: "Shortsword",
        mindmg: 5,
        maxdmg: 10,
        buy: 25,
        sell: 10
      },
      {
        name: "Evening star",
        mindmg: 15,
        maxdmg: 25,
        buy: 45,
        sell: 20
      }
    ]
  }

  let promises = [];

  inits.weapons.forEach((weapon) => {  
    promises.push(Weapons.findOrCreate({
      where: weapon,
      defaults: weapon
    }))
  });
  
  return Promise.all(promises);
}

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

function shop(message, args) {
  Weapons.findAll().then(weapons => {
    let wpns = weapons.map(w => w.name + ", " + w.mindmg + "-" + w.maxdmg + " dmg, buy " + w.buy + " :gem:" + " sell " + w.sell + " :gem:");
    message.channel.send("**Weapons**\n" + wpns.join("\n"));
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

  Weapons = db.define('weapon', {
    name: Sequelize.STRING,
    mindmg: Sequelize.NUMERIC,
    maxdmg: Sequelize.NUMERIC,
    buy: Sequelize.NUMERIC,
    sell: Sequelize.NUMERIC
  });

  client = discordclient;

  return {
    commands: cmds,
    initialize: initialize
  };
}