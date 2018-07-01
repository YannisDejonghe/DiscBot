const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info,
  shop: shop
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
      where: {
        name: weapon.name,
        mindmg: weapon.mindmg,
        maxdmg: weapon.maxdmg,
        buy: weapon.buy,
        sell: weapon.sell
      },
      defaults: {
        name: weapon.name,
        mindmg: weapon.mindmg,
        maxdmg: weapon.maxdmg,
        buy: weapon.buy,
        sell: weapon.sell
      }
    }));
  });

  return Promise.all(promises);
}

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

function shop(message, args) {
  Weapons.findAll().then(weapons => {
    let wpns = weapons.map(w => w.name + ", " + w.mindmg + "-" + w.maxdmg + " dmg, buy " + w.buy + " :gem:" + " sell " + w.sell + " :gem:");
    message.channel.send("**Weapons**\n" + wpns.join("\n"));
  });
}

module.exports = (discordclient, db) => {
  Players = db.define('player', {
    player_id: Sequelize.STRING,
    gems: Sequelize.NUMERIC,
    hitpoints: Sequelize.NUMERIC,
    combat_lvl: Sequelize.NUMERIC,
    strength_lvl: Sequelize.NUMERIC,
    archery_lvl: Sequelize.NUMERIC,
    defence_lvl: Sequelize.NUMERIC,
    crafting_lvl: Sequelize.NUMERIC,
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