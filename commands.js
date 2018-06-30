const crequest = require('crequest');
const gtranslate = require('google-translate-api');
const Parser = require('expr-eval').Parser;
const cmds =  {
  ping: ping,
  translate: translate,
  calc: calc,
  players: players,
  lastcommits: lastcommits,
  say: say,
  commands: commands
};

let client;


async function ping(message, args) {
  const m = await message.channel.send("Ping?");
  m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
}

function translate(message, args) {
  let lang = args[0];
  let text = args.slice(1).join(" ");

  gtranslate(text, { to: lang }).then(res => {
    message.channel.send(res.text);
  }).catch(err => {
    throw (err);
  });
}

function calc(message, args) {
  let parser = new Parser();
  let expr = parser.parse(message.content.substring(message.content.indexOf(' ') + 1));

  message.channel.send(expr.evaluate());
}

function players(message, args) {
  var fs = require("fs");

  var playersName = [];
  var contents = fs.readFileSync("nba.json");
  var jsonContent = JSON.parse(contents);

  console.log(jsonContent.league.standard.length);
  for (var i = 0; i < jsonContent.league.standard.length; i++) {
    playersName.push(jsonContent.league.standard[i].firstName);
  }

  message.channel.send(playersName.join(', '));
}

function lastcommits(message, args) {
  crequest("https://api.github.com/repos/" + args[0] + "/" + args[1] + "/commits?sha=master", { json: true, headers: {'User-Agent': 'request'} }, 
  (err, res, body) => {
    if (err) throw err;
    if (!body || !body.map) return;

    let messages = body.map((commit) => {
      return ':small_blue_diamond: ' + commit.commit.message.split('\n')[0];
    });

    messages = messages.splice(0, 5);

    message.channel.send(messages.join('\r\n'));
  });
}

function say(message, args) {
  const sayMessage = args.join(" ");
  message.delete().catch(ಠ_ಠ=>{}); 
  message.channel.send(sayMessage);
}

function commands(message, args) {
  message.channel.send('Commands :100:\r\n' + Object.keys(cmds).filter(c => c !== 'commands').map(c => '.' + c).join('\r\n'));
}

module.exports = (discordclient) => {
  client = discordclient;

  return cmds;
}