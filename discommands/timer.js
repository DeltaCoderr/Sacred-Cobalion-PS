const { RichEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
	name: 'timer',
	description: 'Timer. Usage: ^timer [time] [output]',
	cooldown: 0.5,
	execute(message, args, Cobal) {  
    function newTimer(output) {
          message.channel.send(output);
        }
        let msgcon = args.join(' ');
        let msgspl = msgcon.split(',');
        if (msgspl.length < 2) return message.channel.send('Unexpected number of arguments');
        let ttime = msgspl.shift();
        if (isNaN(ttime)) return message.channel.send('Invalid time.');
       
        setTimeout(newTimer, parseInt(ttime)*60000, ` ${msgspl.join(', ')}`);
        message.channel.send(`Timer set for ${ttime} minute(s).`);
	}
};