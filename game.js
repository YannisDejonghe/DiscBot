const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info,
  shop: shop,
  stats: stats
};
let client;

//Database entities
let Player;
let Weapon;
let Enemy;

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
          combat_lvl_min: 44,
          combat_lvl_max: 52,
          strength_lvl: 15,
          archery_lvl: 10,
          defence_lvl: 15,
          weakness: "none"
      },
      {
        type: "Creature",
        name: "Duck",
        hitpoints: 500,
        combat_lvl_min: 15,
        combat_lvl_max: 23,
        strength_lvl: 10,
        archery_lvl: 0,
        defence_lvl: 15,
        weakness: "melee"
      }



    ]
  }

  let promises = [];

  inits.weapons.forEach((weapon) => {  
    promises.push(Weapon.findOrCreate({
      where: weapon,
      defaults: weapon
    }))
  });
  
  inits.enemies.forEach((enemy) => {  
    promises.push(Enemy.findOrCreate({
      where: enemy,
      defaults: enemy
    }))
  });
  return Promise.all(promises);
}

function join(message, args) {
  Player.findOne({where: {player_id: message.author.id + ',' + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send("You've already joined in this server!");
    } else {
      Player.create({
        player_id: message.author.id + ',' + message.guild.id
      }).then((player) => {
        message.channel.send('Welcome **' + message.author.username + '**');
      })
    }
  });
}

function info(message, args) {
  Player.findOne({where: {player_id: message.author.id + ',' + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send(message.author + '\n' + player.gems + ' :gem:'
                                          + '\n' + player.combat_lvl + ' :crossed_swords: '
                                         //place weapon here
                                         );
    }
  });

}

function stats(message, args) {
  Player.findOne({where: {player_id: message.author.id + ',' + message.guild.id}}).then((player) => {
    if (player) {
      message.channel.send(message.author + '\n' + player.combat_lvl + ' :crossed_swords: ' 
                                          + '\n' + player.hitpoints + ' :revolving_hearts: '
                                          + '\n' + player.strength_lvl + ' :muscle: ' 
                                          + '\n' + player.archery_lvl + ' :bow_and_arrow: ' 
                                          + '\n' + player.defence_lvl + ' :shield: ' 
                                          + '\n' + player.crafting_lvl + ' :poop:'
                                        );
    }
  });
}

function shop(message, args) {
  Player.findOne({where: {player_id: message.author.id + ',' + message.guild.id}}).then((player) => {
    if(player){    
      Weapon.findAll().then(weapons => {
        let wpns = weapons;

        if (args[0] === "affordable") {
          wpns = wpns.filter(weapon => parseInt(weapon.buy) <= parseInt(player.gems));
        } else if (args[0] === "buy" && args[1]) {
          let weapon = wpns.find(weapon => weapon.name.toLowerCase() === args[1].toLowerCase());

          if (weapon) {
            if (parseInt(weapon.buy) <= parseInt(player.gems)) {
              player.gems = parseInt(player.gems) - parseInt(weapon.buy);
              player.weaponId = weapon.id;

              player.save().then(() => {
                message.channel.send(weapon.name + " bought succesfully.");
              });
            } else {
              message.channel.send("You can't afford a " + weapon.name + ".");
            }
          } else {
            message.channel.send("The weapon " + weapon.name + " doesn't exist.");
          }
        } else {
          wpns = wpns.map(w => w.name + ", " + w.mindmg + "-" + w.maxdmg + " dmg, buy " + w.buy + " :gem:" + " sell " + w.sell + " :gem:");
          message.channel.send("**Weapons**\n" + wpns.join("\n"));
        }
      });
    }
  });
}
  
module.exports = (discordclient, db) => {
  Player = db.define('player', {
    player_id: Sequelize.STRING,
    gems: {type: Sequelize.NUMERIC, defaultValue: 500},
    hitpoints: {type: Sequelize.NUMERIC, defaultValue: 1000},
    combat_lvl: {type: Sequelize.NUMERIC, defaultValue: 35},
    strength_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
    archery_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
    defence_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
    crafting_lvl: {type: Sequelize.NUMERIC, defaultValue: 10},
  });

  Weapon = db.define('weapon', {
    name: Sequelize.STRING,
    mindmg: Sequelize.NUMERIC,
    maxdmg: Sequelize.NUMERIC,
    buy: Sequelize.NUMERIC,
    sell: Sequelize.NUMERIC
  });

  Enemy = db.define('enemy', {
    type : Sequelize.STRING, // boss or creature
    name : Sequelize.STRING,
    hitpoints: Sequelize.NUMERIC,
    combat_lvl_min: Sequelize.NUMERIC,
    combat_lvl_max: Sequelize.NUMERIC,
    strength_lvl: Sequelize.NUMERIC,
    archery_lvl: Sequelize.NUMERIC,
    defence_lvl: Sequelize.NUMERIC,
    weakness: Sequelize.STRING
  });

  Weapon.hasOne(Player);

  client = discordclient;

  return {
    commands: cmds,
    initialize: initialize
  };
}