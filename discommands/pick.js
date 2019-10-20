const { RichEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
	name: 'pick',
	description: 'Picks an option',
	cooldown: 0.5,
	execute(message, args, Cobal) {  
    if (!args[0]) return message.channel.send('You have not given options to chose from.');
		let pick = args[Math.floor(Math.random() * args.length)].trim();
   const roleColor = message.guild.me.displayHexColor === '#000000' ? '#FFFFFF' : message.guild.me.displayHexColor;
    const { commands } = message.client;
    
    const embed = new RichEmbed()
       .setColor(roleColor)
       .setAuthor(`Pick`, Cobal.user.displayAvatarURL)
       .setDescription(`Randomly selected option`) 
       .addField(`Randomly selected: `, `**${pick}**`)
		return message.channel.send(embed)
	}
};