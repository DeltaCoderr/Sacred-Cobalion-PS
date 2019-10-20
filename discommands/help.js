
const { Client, RichEmbed } = require('discord.js');
const client = new Client({ disableEveryone: true });

module.exports = {
	name: 'help',
	description: 'Gathers all the commands the client has.',
	cooldown: 0.5,
	execute(message, args, Cobal) {
    if (args.join(' ')) {
      let commandfile = require(`./discommands/${args.join(' ').replace(' ', '').toLowerCase()}.js`)
      if (commandfile) {
        return
        message.channel.send(commandfile.description)
      }
    }
    const roleColor = message.guild.me.displayHexColor === '#000000' ? '#FFFFFF' : message.guild.me.displayHexColor;
    const { commands } = message.client;
    
    const embed = new RichEmbed()
       .setColor(roleColor)
       .setAuthor(`Help`, Cobal.user.displayAvatarURL)
       .setDescription(`Here's a list of all my commands`) 
       .addField(`${commands.map(command => command.name).join(', ')}`, `You can send \`${config.prefix}help [command name]\` to get info on a specific command!`)
		return message.channel.send(embed)
    
	}
};