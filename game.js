const Sequelize = require('sequelize');
const cmds =  {
  join: join,
  info: info,
  shop: shop,
  stats: stats,
  spawn: spawn,
  attack: attack
};
let client;

//Database entities
let Player;
let PlayerWeapon;
let Weapon;
let Enemy;

let currentEnemy;
let currentEnemyDamages = {};

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
  Player.findOne({include: [{model: Weapon}], where: {player_id: message.author.id + ',' + message.guild.id}}).then((player) => {
    if(player){    
      Weapon.findAll().then(weapons => {
        let wpns = weapons;
        let weaponName = args.slice(1).join(' ');

        if (args[0] === "affordable") {
          wpns = wpns.filter(weapon => parseInt(weapon.buy) <= parseInt(player.gems));
        } 
        
        if (args[0] === "buy" && weaponName) {
          let weapon = wpns.find(weapon => weapon.name.toLowerCase() === weaponName.toLowerCase());

          if (weapon) {
            if (parseInt(weapon.buy) <= parseInt(player.gems)) {
              player.gems = parseInt(player.gems) - parseInt(weapon.buy);
              
              player.setWeapons([weapon]).then(() => {
                return player.save();
              })
              .then(() => {
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

function spawn(message, args) {
  Enemy.findAll().then((enemies) => {
    currentEnemy = enemies[0]; //todo: randomize

    message.channel.send(`A ${currentEnemy.name} appeared with ${currentEnemy.hitpoints} HP!`);
  });
}

function attack(message, args) {
  if (currentEnemy) {
    Player.findOne({include: [{model: Weapon}], where: {player_id: message.author.id + ',' + message.guild.id}}).then((player) => {
      if (player && player.weapons) {
        if (currentEnemyDamages[message.author.id]) {
          if (new Date() - currentEnemyDamages[message.author.id].lastattack < 5000) {
            message.channel.send(`${message.author}, you're attacking too quickly!`);
            return;
          }
        }

        let damageDealt = player.weapons[0].maxdmg;
        currentEnemy.hitpoints -= damageDealt;
  
        if (currentEnemyDamages[message.author.id]) {
          currentEnemyDamages[message.author.id].damage += parseInt(damageDealt);
          currentEnemyDamages[message.author.id].lastattack = new Date();
        } else {
          currentEnemyDamages[message.author.id] = {
            author: message.author,
            damage: parseInt(damageDealt),
            lastattack: new Date()
          }
        }

        if (currentEnemy.hitpoints <= 0) {
          let damageTally = [];

          for (let key in currentEnemyDamages) {
            let value = currentEnemyDamages[key];

            damageTally.push(value.author + ": " + value.damage);
          }

          message.channel.send(`${currentEnemy.name} was defeated!`);
          message.channel.send(`**Damage tally**\n${damageTally.join('\n')}`);

          currentEnemy = null;
          currentEnemyDamages = {};
        } else {
          message.channel.send(`${message.author} dealt ${damageDealt} damage to the enemy ${currentEnemy.name}! ${currentEnemy.hitpoints} HP remaining.`);
        }
      }
    });
  }
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

  PlayerWeapon = db.define('playerweapon', {
    weaponId: Sequelize.NUMERIC,
    playerId: {
      type: Sequelize.NUMERIC,
      unique: true 
    },
    durability: Sequelize.NUMERIC
  });

  Player.belongsToMany(Weapon, {through: PlayerWeapon});
  //Weapon.belongsToMany(Player, {through: PlayerWeapon});

  client = discordclient;

  return {
    commands: cmds,
    initialize: initialize
  };
}