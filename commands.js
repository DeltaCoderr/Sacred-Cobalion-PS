const fs = require("fs");
// Commands folder for Cobalion
exports.say = {
  description: "Says what you want it to say",
  syntax: config.prefix + "say [message]",
  execute: function(Bot, room, by, args) {
    if (!admin.includes(toId(by)) && !dev.includes(toId(by)))
      return Bot.say(room, "Access Denied");
    Bot.say(room, args.join(" "));
  }
};
(exports.q = {
  description:
    "Chooses a quote at random, adds a quote ot lists all the quotes",
  syntax: config.prefix + "q [list/amt/add] [quote]",
  execute: function(Bot, room, by, args) {
    const qfol = "./data/quotes";
    if (!args[0]) {
      fs.readdir(qfol, (e, files) => {
        let randqn = 1 + Math.floor(Math.random() * (files.length - 1));
        try {
          var fdata = fs.readFileSync(`./data/quotes/q${randqn}.txt`, "utf8");
          var rdata = fdata.toString();
          let noofl = rdata.split("\n");
          if (noofl.length == 1)
            return Bot.say(room, `\`\`${fdata.toString()}\`\``);
          else return Bot.say(room, `!code ${rdata.toString()}`);
        } catch (e) {
          return console.log(e.stack);
        }
      });
    } else if (args[0] === "amt") {
      if (args[1]) return Bot.say(room, "Unexpected number of arguments.");
      fs.readdir(qfol, (e, files) => {
        try {
          if (files.length === 2) {
            return Bot.say(room, "We have 1 quote, so far.");
          } else {
            return Bot.say(room, `We have ${files.length - 1} quotes, so far.`);
          }
        } catch (e) {
          return console.log(e.stack);
        }
      });
    } else if (args[0] === "add") {
      if (!admin.includes(toId(by))) return Bot.say(room, "Access denied.");
      fs.readdir(qfol, (e, files) => {
        if (e) throw e;
        remone = args.shift();
        let quotepres = args.join(" ");
        let quotearr = quotepres.split("\\n ");
        let quotetba = quotearr.join("\n");
        fs.writeFile(
          `./data/quotes/q${files.length + 1}.txt`,
          quotetba,
          function(err) {
            if (err) throw err;
            Bot.say(room, "Quote added.");
            return console.log(`Quote added by ${by}: ${quotetba}`);
          }
        );
      });
    } else if (args[0] === "list") {
      if (args[1]) return Bot.say(room, "Unexpected number of arguments.");
      fs.readdir(qfol, (e, files) => {
        if (e) throw e;
        let qdata = [];
        for (var i = 1; i < files.length; i++) {
          var qtext = fs.readFileSync(`./data/quotes/q${i}.txt`);
          qdata.push(`${i}: \n${qtext}`);
        }
        if (qdata.length == files.length - 1) {
          Bot.say(room, `!code ${qdata.join("\n\n\n")}`);
        }
      });
    } else {
      if (!args[0]) return;
      fs.readdir(qfol, (e, files) => {
        try {
          var qu = parseInt(args[0], 10);
          if (qu < files.length) {
            var quotetbdd = fs.readFileSync(`./data/quotes/q${qu}.txt`, "utf8");
            var quotetbd = quotetbdd.toString();
            let noofl = quotetbd.split("\n");
            if (noofl.length == 1)
              Bot.say(room, `\`\`${quotetbdd.toString()}\`\``);
            else Bot.say(room, `!code ${quotetbd.toString()}`);
          } else Bot.say(room, "Quote not found.");
        } catch (e) {
          console.log(e.stack);
        }
      });
    }
  }
}),
  (exports.exp = {
    description:
      "Displays the targets amount of exp points. Defaults to yourself",
    syntax: config.prefix + "exp",
    execute: function(Bot, room, by, args, Cobal) {
      let xp = parseInt(getexp(toId(by)));
      Bot.say(room, "Your current number of exp points is " + xp + ".");
    }
  }),
  exports.help = {
    description:
      "Displays the help for the target command. Defaults to listing all the commands",
    syntax: config.prefix + "help [command]",
    execute: function(Bot, room, by, args) {
      let commands = require("./commands.js");
      let helpcmd = toId(args.join(" "));
      let htmlstring = "";
      let commandlist = Object.keys(commands);
      commandlist.forEach(function(x) {
        let commande = commands[x];
        let desc = commande.description;
        let syntax = commande.syntax;
        htmlstring +=
          "<details><summary>" +
          x +
          "</summary>" +
          desc +
          "<br>Syntax: " +
          syntax +
          "</details>";
      });
      if (!helpcmd) {
        if (admin.includes(toId(by))) {
          Bot.say(
          room,
          "/adduhtml cobalhelp, " +
            "<details><summary>PS Commands</summary>" +
            htmlstring +
            "</details>"
        );
        }
        Bot.say(
          room,
          "/pminfobox " +
            by +
            ", " +
            "<details><summary>PS Commands</summary>" +
            htmlstring +
            "</details>"
        );
      } else {
        if (commands[helpcmd]) {
          if (admin.includes(toId(by)))
            return Bot.say(
              room,
              commands[helpcmd].description +
                ". Syntax: " +
                commands[helpcmd].syntax
            );
          Bot.say(
            room,
            "/pm " +
              by +
              ", " +
              commands[helpcmd].description +
              ". Syntax: " +
              commands[helpcmd].syntax
          );
        } else {
          Bot.pm(by, "Command not found.");
        }
      }
    }
  }
exports.die = {
  description: "Kills the bot",
  syntax: config.prefix + "die",
  execute: function(Bot, room, by, args) {
    Bot.disconnect();
  }
};
exports.credits = {
  syntax: config.prefix + "credits",
  description: ` Displays the credits for ${config.nick}`,
  execute: function(Bot, room, by, args) {
    const fs = require("fs");
    let credits = JSON.parse(fs.readFileSync("./data/credits.json"));
    let htmlstring = "/adduhtml credits, <center>";
    Object.keys(credits).forEach(function(x) {
      let reason = credits[x];
      htmlstring += tools.colourize(x) + " for " + reason + "<br>";
    });
    Bot.say(room, htmlstring);
  }
};
exports.mgc = {
  description: "Creates a groupchat and invites users",
  syntax: config.prefix + "mgc [groupchat name], [user 1], [user 2]...",
  execute: function(Bot, room, by, args) {
    let cargs = args.join(" ");
    let ccargs = cargs.split(", ");
    function users(user) {
      Bot.say(room, "/invite " + user + ", " + ccargs[0]);
    }
    Bot.say(room, "/makegroupchat " + ccargs[0]);
    ccargs.forEach(function(x) {
      users(x);
    });
    users;
  }
};
exports.invite = {
  description: "Invites a user to the room",
  syntax: config.prefix + "invite [user]",
  execute: function(Bot, room, by, args, Cobal) {
    Bot.say(room, "/invite " + args.join(" "));
  }
};
