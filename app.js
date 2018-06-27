
const Discord = require("discord.js");

const client = new Discord.Client();


const config = require("./config.json");
const translate = require('google-translate-api');


client.on("ready", () => {

  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {

  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {

  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setGame(`on ${client.guilds.size} servers`);
});


client.on("message", async message => {
  if(message.author.bot) return;
  if(message.content.indexOf(config.prefix) !== 0) return;
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  

  
  if(command === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }

  if (command === "translate"){
    let lang = args[0];
    let text = args.slice(1).join(" ");
    translate(text, {to: lang}).then(res => {
      message.channel.send(res.text);
  }).catch(err => {
     throw(err);
  });

  }

  if(command === "calc"){
    var calculation = message.content.substring(message.content.indexOf(' ') + 1);

    message.channel.send(eval(calculation));
  }
  
   if(command === "players") {

    var fs = require("fs");


    var contents = fs.readFileSync("nba.json");
    var jsonContent = JSON.parse(contents);

    console.log(jsonContent.league.standard.length);
    for ( var i = 0; i <jsonContent.league.standard.length; i++ ){
      playersName.push(jsonContent.league.standard[i].firstName);
    }
    //message.channel.send(JSON.stringify(playersName));
    function getPlayersName(){
      return playersName.join(', ');
    }
  

    //console.log(JSON.stringify(jsonContent.league.standard[0].firstName));
    message.channel.send(getPlayersName());

  
  }

  if (command === "lastCommits") {
      crequest("https://github.com/REPOHERE/commits/master", { json: true }, (err, res, body) => {
        if (err) throw err;

        let messages = body.map((commit) => {
          return commit.commit.message;
        });

        messages = messages.splice(0, 2);

        message.channel.send(messages.join(''));
      });
  }
}
);

client.login(config.token);
