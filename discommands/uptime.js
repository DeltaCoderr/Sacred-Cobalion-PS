const { RichEmbed } = require('discord.js');
const fs = require('fs');
module.exports = {
	name: 'uptime',
	description: 'Displays the uptime.',
	cooldown: 0.5,
	execute(message, args, Cobal) {  
    function toDurationString(number, options) { 
	const date = new Date(+number);
	const parts = [date.getUTCFullYear() - 1970, date.getUTCMonth(), date.getUTCDate() - 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];
	const unitNames = ["second", "minute", "hour", "day", "month", "year"];
	const positiveIndex = parts.findIndex(elem => elem > 0);
	if (options && options.hhmmss) {
		let string = parts.slice(positiveIndex).map(value => value < 10 ? "0" + value : "" + value).join(":");
		return string.length === 2 ? "00:" + string : string;
	}
	return parts.slice(positiveIndex).reverse().map((value, index) => value ? value + " " + unitNames[index] + (value > 1 ? "s" : "") : "").reverse().join(" ").trim();
};
    const uptime = process.uptime();
		let uptimeText = '';
		if (uptime > 24 * 60 * 60) {
			let uptimeDays = Math.floor(uptime / (24 * 60 * 60));
			uptimeText = uptimeDays + " " + (uptimeDays === 1 ? "day" : "days");
			let uptimeHours = Math.floor(uptime / (60 * 60)) - uptimeDays * 24;
			if (uptimeHours) uptimeText += ", " + uptimeHours + " " + (uptimeHours === 1 ? "hour" : "hours");
		} else {
			uptimeText = toDurationString(uptime * 1000);
		}
    const roleColor = message.guild.me.displayHexColor === '#000000' ? '#FFFFFF' : message.guild.me.displayHexColor;
    const embed = new RichEmbed()
       .setColor(roleColor)
       .setAuthor(`Info`,  Cobal.user.displayAvatarURL)
       .addField('Sacred Cobalion\'s uptime: ', `**${uptimeText}**`)
    return message.channel.send(embed);
	}
};