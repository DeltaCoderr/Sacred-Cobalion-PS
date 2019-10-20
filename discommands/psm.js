const { Client, RichEmbed } = require('discord.js');
const client = new Client({ disableEveryone: true });

module.exports = {
	name: 'pssay',
	description: 'Says something on PS.',
	cooldown: 0.5,
	execute(message, args, Cobal) {
    if (!args[0]) return message.channel.send('Unexpected number of arguments');
     let mesgcon = args.join(' ');
     let secarr = mesgcon.split(';');
     let tbsend = secarr.shift();
     if (!secarr[0]) return message.channel.send('Unexpected number of arguments');
     let messend = secarr.join(';');
     Bot.say('botdevelopment', '/pm '+tbsend+', '+messend);
  }
};