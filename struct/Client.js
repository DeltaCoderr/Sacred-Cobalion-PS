const { Client, Collection } = require('discord.js');

module.exports = class client extends Client {
  constructor(config) {
    super({
      disableEveryone: true
    });
    
    this.commands = new Collection();
    this.queue = new Map();
    this.config = config;
  }
}