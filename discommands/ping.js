const { Client, RichEmbed } = require('discord.js');

module.exports = {
	name: 'ping',
	description: 'Ping.',
	cooldown: 0.5,
	execute(message, Cobal) {
    const roleColor = message.guild.me.displayHexColor === '#000000' ? '#FFFFFF' : message.guild.me.displayHexColor;
    
      const embed = new RichEmbed()
       .setColor(roleColor)
       .setDescription(`${message.author.tag} :ping_pong: ${Math.round(Date.now() - message.createdTimestamp)}ms`)
		return message.channel.send(embed);
	}
};