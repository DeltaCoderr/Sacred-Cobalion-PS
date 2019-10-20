// SDClient: the PS client this bot uses
var SDClient = require("./client.js");
let usediscord = true;
// config: gets details from config.js to use here
global.config = require("./config.js");
// tools: takes functions from tools.js to use here. Add more as you see fit
global.tools = require("./tools.js");
// expfunctions: Used for the exp function on this bot
global.expfunctions = require("./exp.js");
// admin: the bot admin
global.admin = config.admin;
// dev: the bot dev
global.dev = config.dev;
// Discord client stuff
global.Client = require("./struct/Client.js");
// fs
global.fs = require("fs");
// if there's no token then it doesn't connect to discord
if (!config.token) {
  usediscord = false
}
// The actual discord client
global.Cobal = new Client({ token: config.token, prefix: config.prefix });
// Just some fancy text formatting
const { RichEmbed } = require("discord.js");
const { join } = require("path");

const { readdirSync } = require("fs");
// This is where the interesting stuff happens. When everyone's happy and all is working, this is what the Cobalion does
// All of line 31 - 37 is about that
Cobal.on("ready", () => {
  console.log(`Discord connection established.`);
  console.log("Servers:");
  Cobal.guilds.forEach(guild => {
    console.log(" - " + guild.name);
  });
});
// Discord command parser
const commandFiles = readdirSync(join(__dirname, "discommands")).filter(file =>
  file.endsWith(".js")
);
for (const file of commandFiles) {
  const command = require(join(__dirname, "discommands", `${file}`));
  Cobal.commands.set(command.name, command);
}

// Discord Message/Command Handler
Cobal.on("message", message => {
  if (message.author.bot) return;
  if (message.content === "UwU") return message.channel.send("UwU");
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;
  if (message.channel.type === "dm") return;

  const args = message.content.slice(config.prefix.length).split(/ +/g);
  const commandName = args.shift().toLowerCase();
  const command =
    Cobal.commands.get(commandName) ||
    Cobal.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;
  if (command.guildOnly && message.channel.type !== "text") {
    const embed = new RichEmbed()
      .setColor(0xf04947)
      .setTitle("Error!")
      .setDescription("This command cannot be used in direct messages.");
    return message.channel.send({ embed: embed });
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;
    if (command.usage)
      reply += `Command Usage: \`${config.prefix}${command.name} ${command.usage}\``;
    return message.channel.send(`${reply}`);
  }

  try {
    command.execute(message, args, Cobal);
  } catch (error) {
    const embed2 = new RichEmbed()
      .setColor(0xf04947)
      .setTitle("Error!")
      .setDescription("Something went wrong, check the logs for more info.");

    console.error(error);
    return message.channel.send({ embed: embed2 });
  }
});
// PS client stuff
var options = {
  serverid: config.serverid,
  loginServer:
    "https://play.pokemonshowdown.com/~~" + config.serverid + "/action.php",
  nickName: config.nickName,
  pass: config.pass,
  autoJoin: config.autoJoin
};
// The global PS bot which handles all of the Cobalion's functions and everything it does on PS
global.Bot = new SDClient(config.server, config.port, options);
// Useful global function
global.toId = function(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
};
// Bot connecting
Bot.connect();
// When it's ready
Bot.on("connect", function(connection) {
  console.log("Connection established.");
});
// PS Message/Command handler
Bot.on("chat", function(room, time, by, message) {
  if (message === "UwU" && toId(by) !== toId(config.nick))
    return Bot.say(room, "UwU");
  // Whenever someone speaks in chat, they get one exp
  addexp(toId(by), 1);
  var prefix = config.prefix;
  if (!message.startsWith(prefix)) return;
  messagecontent = message.substr(prefix.length);
  const args = messagecontent.split(" ");
  const command = args.shift().toLowerCase();
  let commandcode = require("./commands.js");
  if (commandcode[command]) {
    commandcode[command].execute(Bot, room, by, args, Cobal);
  } else {
    Bot.say(room, "/pm " + by + ", That command doesn't exist");
  }
});
Bot.on("popup", message => {
  Bot.say("botdevelopment", "/pm " + config.owner + "POPUP: " + message);
});
Bot.on("pm", (by, message) => {
  if (!admin.includes(toId(by)) && !by === toId(config.nickName))
    Bot.pm(config.owner, `${by}: ${message}`);
  return Bot.pm(
    by,
    `Hi, I'm ${config.nickName}! I'm a Bot. My prefix is \`\`${config.prefix}\`\`. Use ${config.prefix}help in a chat which I'm in to see my commands.`
  );
});
// Connects to discord
if (usediscord) {
Cobal.login(config.token);
}
