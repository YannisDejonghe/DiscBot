const Sequelize = require('sequelize');
const cmds = {
  join: join,
  info: info,
  shop: shop,
  stats: stats,
  spawn: spawn,
  attack: attack,
  inventory: inventory,
  equip: equip
};
let client;
let sequelize;
//Database entities
let Player;
let PlayerItem;
let Enemy;
let Item;

let currentEnemy;
let currentEnemyDamages = {};

function initialize() {
  let inits = {
    enemies: [
      {
        type: "Archer",
        name: "Centaur",
        combat_lvl_min: 44,
        combat_lvl_max: 52,
        base_str: 5,
        str: 0.2,
        base_def: 5,
        def: 1,
        base_arch: 5,
        arch: 1,
        base_hp: 100,
        hp: 10,
        weakness: "none"
      },
      {
        type: "Melee",
        name: "Duck",
        combat_lvl_min: 15,
        combat_lvl_max: 23,
        base_str: 3,
        str: 1,
        base_def: 3,
        def: 1,
        base_arch: 1,
        arch: 1,
        base_hp: 50,
        hp: 5,
        weakness: "melee"
      }
    ],
    items: [
      {
        name: "Shortsword",
        type: "Weapon",
        buy: 25,
        sell: 10,
        durability: 100,
        data: {
          mindmg: 5,
          maxdmg: 10
        }
      },
      {
        name: "Evening star",
        type: "Weapon",
        buy: 45,
        sell: 20,
        durability: 100,
        data: {
          mindmg: 15,
          maxdmg: 25
        }
      }
    ]
  }

  let promises = [];

  inits.enemies.forEach((enemy) => {
    promises.push(Enemy.findOrCreate({
      where: enemy,
      defaults: enemy
    }))
  });

  inits.items.forEach((item) => {
    promises.push(Item.findOrCreate({
      where: item,
      defaults: item
    }))
  });

  return Promise.all(promises);
}

function join(message, args) {
  Player.findOne({ where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
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

function playerNotRegistered(message) {
  message.channel.send("You haven't joined this server yet! Write .join to do so.")
}

function info(message, args) {
  Player.findOne({ include: [{ model: Item }], where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
    if (player) {

      player.getEquippedWeapon().then((weapon) => {
        message.channel.send(message.author + '\n' + player.gems + ' :gem:'
        + '\n' + player.combat_lvl + ' :crossed_swords: '
        + '\n' + 'Equipped weapon: ' + weapon.dataValues.name //TODO: get equipped weapon?
        );
      });
    } else playerNotRegistered(message);
  });
}

function stats(message, args) {
  Player.findOne({ where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
    if (player) {
      message.channel.send(message.author + '\n' + player.combat_lvl + ' :crossed_swords: '
        + '\n' + player.hitpoints + ' :revolving_hearts: '
        + '\n' + player.strength_lvl + ' :muscle: '
        + '\n' + player.archery_lvl + ' :bow_and_arrow: '
        + '\n' + player.defence_lvl + ' :shield: '
        + '\n' + player.crafting_lvl + ' :poop:'
      );
    } else playerNotRegistered(message);
  });
}

function shop(message, args) {
  Player.findOne({ include: [{ model: Item }], where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
    if (player) {
      Item.findAll().then(items => {
        let itms = items;
        let itemName = args.slice(1).join(' ');

        if (args[0] === "affordable") {
          itms = itms.filter(item => parseInt(item.buy) <= parseInt(player.gems));
        }

        if (args[0] === "buy" && itemName) {
          let item = itms.find(item => item.name.toLowerCase() === itemName.toLowerCase());

          if (item) {
            if (parseInt(item.buy) <= parseInt(player.gems)) {
              player.gems = parseInt(player.gems) - parseInt(item.buy);
              
              PlayerItem.build({
                durability: item.durability,
                playerId: player.id,
                itemId: item.id
              }).save().then(() => {
                return player.save();
              }).then(() => {
                return message.channel.send(item.name + " bought succesfully.");
              });


              /*player.addItem(item, {through: { durability: item.durability } }).then(() => {
                return player.save();
              }).then(() => {
                return message.channel.send(item.name + " bought succesfully.");
              });*/


              //TODO: Fix weapon equip
            } else {
              message.channel.send("You can't afford a " + item.name + ".");
            }
          } else {
            message.channel.send("The item " + item.name + " doesn't exist.");
          }
        } else {
          itms = itms.map(i => i.name + ", " /*+ w.mindmg + "-" + w.maxdmg + " dmg,*/ + "buy " + i.buy + " :gem:" + " sell " + i.sell + " :gem:");
          message.channel.send("Your funds: " + player.gems + " :gem:\n\n" + "**Items**\n" + itms.join("\n"));
        }
      });
    } else playerNotRegistered(message);
  });
}

function inventory(message, args) {
  Player.findOne({ where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
    if (player) {

      sequelize.query("SELECT playeritems.id, playeritems.durability, playeritems.equipped, items.name FROM playeritems " + 
      "JOIN items ON items.id = playeritems.itemId WHERE playerId = ?", 
      {replacements: [player.id], model: PlayerItem}).then(playerItems => {
        let inventoryText = playerItems.map(i => `${i.dataValues.id}: ${i.dataValues.name} (durability ${i.durability}) ${i.dataValues.equipped ? '(equipped)' : ''}`)
        message.author.send(inventoryText.join('\n'));
      });

      /*PlayerItem.findAll({ include: [{ model: Player }], where: { playerId: player.id } }).then((items) => {
        let inventoryText = items.map(i => `${i.name} (durability ${i.durability})\n`)
        message.channel.send(inventoryText);
      });*/
    }
  });
}

function equip(message, args) {
  Player.findOne({ where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
    let equipId = parseInt(args[0]);

    if (player) {

      //TODO: get the currently equipped item of itemtype and unequip it first
      player.equipItem(equipId).then(() => {
        message.author.send(`Equipped inventory item #${equipId}`)
      });
    }
  });
}

function spawn(message, args) {
  Enemy.findAll().then((enemies) => {
    let enemyId = parseInt(args[0]);
    let combatlvl = parseInt(args[1]);

    currentEnemy = enemies[enemyId]; //[Math.floor(Math.random() * enemies.length)];
    currentEnemy.hitpoints = currentEnemy.getStats(combatlvl).hp;

    message.channel.send(`A ${currentEnemy.name} appeared with ${currentEnemy.hitpoints} HP! Stats:\n` + currentEnemy.toStatsString(combatlvl));
  });
}

function attack(message, args) {
  if (currentEnemy) {
    Player.findOne({ include: [{ model: Weapon }], where: { player_id: message.author.id + ',' + message.guild.id } }).then((player) => {
      if (player && player.weapons) {
        if (currentEnemyDamages[message.author.id]) {
          if (new Date() - currentEnemyDamages[message.author.id].lastattack < 5000) {
            //message.channel.send(`${message.author}, you're attacking too quickly!`);
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
  sequelize = db;
  client = discordclient;

  Player = sequelize.define('player', {
    player_id: Sequelize.STRING,
    gems: { type: Sequelize.NUMERIC, defaultValue: 500 },
    hitpoints: { type: Sequelize.NUMERIC, defaultValue: 1000 },
    combat_lvl: { type: Sequelize.NUMERIC, defaultValue: 35 },
    strength_lvl: { type: Sequelize.NUMERIC, defaultValue: 10 },
    archery_lvl: { type: Sequelize.NUMERIC, defaultValue: 10 },
    defence_lvl: { type: Sequelize.NUMERIC, defaultValue: 10 },
    crafting_lvl: { type: Sequelize.NUMERIC, defaultValue: 10 },
  });

  Player.prototype.getEquippedWeapon = function() {
    return sequelize.query("SELECT * FROM playeritems " + 
    "JOIN items ON items.id = playeritems.itemId WHERE playerId = ? AND items.type = ? AND equipped = true", 
    {replacements: [this.id, "Weapon"], model: PlayerItem}).then(playerItems => {
      return new Promise((resolve, reject) => {
          resolve(playerItems[0]);
      });
    });
  }

  Player.prototype.equipItem = function(itemId) {
    return sequelize.query("SELECT * FROM playeritems " + 
    "JOIN items ON items.id = playeritems.itemId WHERE playerId = ? AND playeritems.id = ?", 
    {replacements: [this.id, itemId], model: PlayerItem}).then(playerItems => {
      if (playerItems[0]) {
        let itemType = playerItems[0].dataValues.type;

        return sequelize.query("UPDATE playeritems JOIN items ON items.id = playeritems.itemId SET equipped=false WHERE items.type = ?",
        {replacements: [itemType], model: PlayerItem, type: Sequelize.QueryTypes.UPDATE}).then(() => {
          
          return PlayerItem.find({where: {id: itemId}}).then((playerItem) => {
            playerItem.equipped = true;

            return playerItem.save();
          })
        });
      }
    });
  }

  Enemy = sequelize.define('enemy', {
    type: Sequelize.STRING,
    name: Sequelize.STRING,
    combat_lvl_min: Sequelize.NUMERIC,
    combat_lvl_max: Sequelize.NUMERIC,
    base_str: Sequelize.NUMERIC,
    str: Sequelize.DOUBLE,
    base_def: Sequelize.NUMERIC,
    def: Sequelize.DOUBLE,
    base_arch: Sequelize.NUMERIC,
    arch: Sequelize.DOUBLE,
    base_hp: Sequelize.NUMERIC,
    hp: Sequelize.DOUBLE,
    weakness: Sequelize.STRING
  });

  Item = sequelize.define('item', {
    name: Sequelize.STRING,
    type: Sequelize.STRING,
    buy: Sequelize.NUMERIC,
    sell: Sequelize.NUMERIC,
    durability : Sequelize.NUMERIC,
    data: Sequelize.JSON
  });

  Enemy.prototype.calcLinear = function(combatlvl, base, growth) {
    return Math.floor(parseFloat(growth) * combatlvl + parseFloat(base))
  }

  Enemy.prototype.getStats = function(combatlvl) {
    let self = this;
    
    return {
      str: self.calcLinear(combatlvl, self.base_str, self.str),
      def: self.calcLinear(combatlvl, self.base_def, self.def),
      arch: self.calcLinear(combatlvl, self.base_arch, self.arch),
      hp: self.calcLinear(combatlvl, self.base_hp, self.hp)
    }
  }

  Enemy.prototype.toStatsString = function(combatlvl) {
    let stats = this.getStats(combatlvl)

    return `:muscle::skin-tone-3: ${stats.str}\n :shield: ${stats.def}\n :bow_and_arrow: ${stats.arch}\n`
  }

  PlayerItem = sequelize.define('playeritem', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    durability: Sequelize.NUMERIC,
    equipped: { type: Sequelize.BOOLEAN, defaultValue: false }
  });

  Item.belongsToMany(Player, { through: { model: PlayerItem, unique: false } });
  Player.belongsToMany(Item, { through: { model: PlayerItem, unique: false } });

  //Item.belongsToMany(Player, { through: { model: PlayerItem, unique: false } });
  //Player.belongsToMany(Item, { through: { model: PlayerItem, unique: false } });
  //Weapon.belongsToMany(Player, {through: PlayerWeapon});

  return {
    commands: cmds,
    initialize: initialize
  };
}