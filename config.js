// Admins (PS): people who can use every command on the bot.
// To make a command so only Admins can use it, add this line of code to the start of the 'execute':
// if (!admin.includes(toId(by)) return Bot.say(room, 'Access Denied')
exports.admin = ['', '']
// Dev is another permissions set like admin. Use this code for adminto make it so only devs and admins can use it
exports.dev = ['', '']
// Owner: this does not give admin permissions and it is used for display purposes only
exports.owner = ''
// Server: the Pokemon Showdown server you want Sacred Cobalion to connect to. If you want it to connect to the main server: leave the server, port and server id as they are
exports.server = 'sim.smogon.com';
exports.port = 8000;
exports.serverid = 'showdown';
// Token: the discord bot token. If you dont want the Bot to connect to discord, leave this blank
exports.token = ''
// The username of the bot. Register an account with the username of the bot, then use those details here
exports.nickName = 'Sacred Cobalion';
// Password of the bot
exports.pass = ''
// autoJoin: the rooms you want your bot to join
exports.autoJoin = ['room1', 'room2', 'room3'];
// Prefix: the character(s) used before a command
exports.prefix = '^';
