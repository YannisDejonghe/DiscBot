const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info,
  shop: shop,
  stats: stats,
  whatcanibuy:whatcanibuy
};
let client;

//Database entities
let Players;
let Weapons;
let Enemies



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
    ],
    enemies: [
      {
          type: "Creature",
          name: "Centaur",
          hitpoints: 1500,
          combat_lvl: 48,
          strength_lvl: 15,
          archery_lvl: 10,
          defence_lvl: 15,
          weakness: "none"
      },
      {
        type: "Creature",
        name: "Duck",
        hitpoints: 500,
        combat_lvl: 19,
        strength_lvl: 10,
        archery_lvl: 0,
        defence_lvl: 15,
        weakness: "melee"
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
  
  inits.enemies.forEach((enemy) => {  
    promises.push(Enemies.findOrCreate({
      where: enemy,
      defaults: enemy
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


function whatcanibuy(message, args){
  Players.findOne({where: {player_id: message.author.id + message.guild.id}}).then((player) => {
    if(player){
      Weapons.findAll().then(weapons => {
        let result = weapons.filter(elem => parseInt(elem.buy) < parseInt(player.gems))
            .map(e => e.name);
        message.channel.send("**Available weapons**\n" + result.join("\n"));
      })
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

  Weapons = db.define('weapon', {
    name: Sequelize.STRING,
    mindmg: Sequelize.NUMERIC,
    maxdmg: Sequelize.NUMERIC,
    buy: Sequelize.NUMERIC,
    sell: Sequelize.NUMERIC
  });

  Enemies = db.define('enemy', {
    enemy_id: Sequelize.NUMERIC,
    type : Sequelize.STRING, // boss or creature
    name : Sequelize.STRING,
    hitpoints: Sequelize.NUMERIC,
    combat_lvl: Sequelize.NUMERIC,
    strength_lvl: Sequelize.NUMERIC,
    archery_lvl: Sequelize.NUMERIC,
    defence_lvl: Sequelize.NUMERIC,
    weakness : Sequelize.STRING

  })

  client = discordclient;

  return {
    commands: cmds,
    initialize: initialize
  };
}