// An updated version of Ecuacion's client file connecting to Pokemon Showdown 

var util = require('util');
var https = require('https');
var url = require('url');
var WebSocketClient = require('./websocket').client;

function toId (text) {
	if (typeof text !== 'string') return text;
	return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

var Client = (function () {
	function Client (server, port, opts) {
		this.opts = {
			server: server,
			serverid: 'showdown',
			port: port,
			secprotocols: [],
			connectionTimeout: 2 * 60 * 1000,
			loginServer: 'https://play.pokemonshowdown.com/~~showdown/action.php',
			nickName: null,
			pass: null,
			retryLogin: 10 * 1000,
			autoConnect: true,
			autoReconnect: true,
			autoReconnectDelay: 30 * 1000,
			autoJoin: [],
			showErrors: false,
			debug: false
		};
		if (typeof opts === 'object') {
			for (var i in opts) 
				this.opts[i] = opts[i];
		}
		this.actionUrl = url.parse(this.opts.loginServer);
	
		this.rooms = {};
		this.roomcount = 0;
	
		this.connection = null;
		this.status = {
			connected: false,
			nickName: null,
			named: false
		};
		this.challstr = {
			id: 0,
			str: ''
		};
		this.events = {};
		this.debug = function (str) {
			if (this.opts.debug) console.log("DEBUG: " + str);
		};
		this.error = function (str) {
			if (this.opts.showErrors) console.log("ERROR: " + str);
		};
	}
	
	Client.prototype.init = function () {
		if (this.opts.autoConnect) {
			this.connect();
		}
		if (this.opts.connectionTimeout) {
			this.startConnectionTimeOut();
		}
	};
	
	/********************************
	*	Events
	*********************************/

	Client.prototype.on = function (name, func) {
		this.events[name] = func;
	};

	/********************************
	*	Connection
	*********************************/

	Client.prototype.connect = function (retry) {
		if (retry) {
			this.debug('retrying...');
		}
		if (this.status.connected) return this.error("Already connected");
		this.closed = false;
		var webSocket = new WebSocketClient();
		this.webSocket = webSocket;
		var self = this;
		self.rooms = {};
		self.roomcount = 0;
		webSocket.on('connectFailed', function(err) {
			self.error("Could not connect to server " + self.opts.server + ": " + util.inspect(err));
			if (self.events['disconnect'] && typeof self.events['disconnect'] === 'function') {
				self.events['disconnect'](err);
			}
			if (self.opts.autoReconnect) {
				self.debug("retrying in " + (self.opts.autoReconnectDelay / 1000) + " seconds");
				setTimeout(function() {
					self.connect(true);
				}, self.opts.autoReconnectDelay);
			}
		});
		webSocket.on('connect', function(connection) {
			if (self.events['connect'] && typeof self.events['connect'] === 'function') {
				self.events['connect'](connection);
			}
			self.debug('connected to server ' + self.opts.server);
			self.status.connected = true;
			self.connection = connection;
			connection.on('error', function(err) {
				self.error('connection error: ' + util.inspect(err));
				self.connection = null;
				self.status.connected = false;
				if (self.events['disconnect'] && typeof self.events['disconnect'] === 'function') {
					self.events['disconnect'](err);
				}
				if (self.opts.autoReconnect) {
					self.debug("retrying in " + (self.opts.autoReconnectDelay / 1000) + " seconds");
					setTimeout(function() {
						self.connect(true);
					}, self.opts.autoReconnectDelay);
				}
			});
			connection.on('close', function() {
				self.debug('connection closed: ' + util.inspect(arguments));
				self.connection = null;
				self.status.connected = false;
				if (self.events['disconnect'] && typeof self.events['disconnect'] === 'function') {
					self.events['disconnect'](0);
				}
				if (!self.closed && self.opts.autoReconnect) {
					self.debug("retrying in " + (self.opts.autoReconnectDelay / 1000) + " seconds");
					setTimeout(function() {
						self.connect(true);
					}, self.opts.autoReconnectDelay);
				}
			});
			connection.on('message', function(message) {
				if (message.type === 'utf8') {
					if (self.events['message'] && typeof self.events['message'] === 'function') {
						self.events['message'](message.utf8Data);
					}
					self.receive(message.utf8Data);
				}
			});
		});
		var id = ~~(Math.random() * 900) + 100;
		var chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
		var str = '';
		for (var i = 0, l = chars.length; i < 8; i++) {
			str += chars.charAt(~~(Math.random() * l));
		}
		var conStr = 'ws://' + self.opts.server + ':' + self.opts.port + '/showdown/' + id + '/' + str + '/websocket';
		self.debug('connecting to ' + conStr + ' - secondary protocols: ' + util.inspect(self.opts.secprotocols));
		webSocket.connect(conStr, self.opts.secprotocols);
	};

	Client.prototype.disconnect = function () {
		this.closed = true;
		if (this.connection) this.connection.close();
	};

	Client.prototype.softDisconnect = function () {
		if (this.connection) this.connection.close();
	};

	/********************************
	*	Login
	*********************************/

	Client.prototype.rename = function (nick, pass) {
		var requestOptions = {
			hostname: this.actionUrl.hostname,
			port: this.actionUrl.port,
			path: this.actionUrl.pathname,
			agent: false
		};
		if (!pass) {
			requestOptions.method = 'GET';
			requestOptions.path += '?act=getassertion&userid=' + toId(nick) + '&challengekeyid=' + this.challstr.id + '&challenge=' + this.challstr.str;
			this.debug("Sending log in request to: " + requestOptions.path);
		} else {
			requestOptions.method = 'POST';
			var data = 'act=login&name=' + toId(nick) + '&pass=' + pass + '&challengekeyid=' + this.challstr.id + '&challenge=' + this.challstr.str;
			requestOptions.headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			};
			this.debug("Sending log in request to: " + requestOptions.path + " | Data -> " + data);
		}
		var req = https.request(requestOptions, function(res) {
			res.setEncoding('utf8');
			var data = '';
			res.on('data', function(chunk) {
				data += chunk;
			});
			res.on('end', function() {
				if (data === ';') {
					this.error('failed to log in; nick is registered - invalid or no password given');
					if (this.events['renamefailure'] && typeof this.events['renamefailure'] === 'function') {
						this.events['renamefailure'](-1);
					}
					return;
				}
				if (data.length < 50) {
					this.error('failed to log in: ' + data);
					if (this.opts.retryLogin) {
						this.debug("Retrying log in process in " + (this.opts.retryLogin / 1000) + " seconds...");
						setTimeout(function() {this.rename(nick, pass);}.bind(this), this.opts.retryLogin);
					}
					if (this.events['renamefailure'] && typeof this.events['renamefailure'] === 'function') {
						this.events['renamefailure'](-2);
					}
					return;
				}
				if (data.indexOf('heavy load') !== -1) {
					this.error('the login server is under heavy load');
					if (this.opts.retryLogin) {
						this.debug("Retrying log in process in " + (this.opts.retryLogin / 1000) + " seconds...");
						setTimeout(function() {this.rename(nick, pass);}.bind(this), this.opts.retryLogin);
					}
					if (this.events['renamefailure'] && typeof this.events['renamefailure'] === 'function') {
						this.events['renamefailure'](-3);
					}
					return;
				}
				try {
					data = JSON.parse(data.substr(1));
					if (data.actionsuccess) {
						data = data.assertion;
					} else {
						this.error('could not log in; action was not successful: ' + JSON.stringify(data));
						if (this.opts.retryLogin) {
							this.debug("Retrying log in process in " + (this.opts.retryLogin / 1000) + " seconds...");
							setTimeout(function() {this.rename(nick, pass);}.bind(this), this.opts.retryLogin);
						}
						if (this.events['renamefailure'] && typeof this.events['renamefailure'] === 'function') {
							this.events['renamefailure'](-4);
						}
						return;
					}
				} catch (e) {}
				this.debug('Sending log in trn...');
				this.send('|/trn ' + nick + ',0,' + data);
        }.bind(this));
		}.bind(this));
		req.on('error', function(err) {
			this.error('login error: ' + util.inspect(err));
			if (this.opts.retryLogin) {
				this.debug("Retrying log in process in " + (this.opts.retryLogin / 1000) + " seconds...");
				setTimeout(function() {this.rename(nick, pass);}.bind(this), this.opts.retryLogin);
			}
			if (this.events['renamefailure'] && typeof this.events['renamefailure'] === 'function') {
				this.events['renamefailure'](err);
			}
			return;
		}.bind(this));
		if (data) {
			req.write(data);
		}
		req.end();
	};

	/********************************
	*	Sending data
	*********************************/

	Client.prototype.send = function (data, delay) {
		var connection = this.connection;
		var self = this;
		if (!delay) delay = 1000;
		if (connection && connection.connected) {
			if (!(data instanceof Array)) {
				data = [data.toString()];
			}
			if (data.length > 3) {
				var nextToSend = function () {
					if (!data.length) {
						clearInterval(spacer);
						return;
					}
					var toSend = data.splice(0, 3);
					toSend = JSON.stringify(toSend);
					if (self.events['send'] && typeof self.events['send'] === 'function') {
						self.events['send'](toSend);
					}
					connection.send(toSend);
				};
				var spacer = setInterval(nextToSend, delay);
				nextToSend();
			} else {
				data = JSON.stringify(data);
				if (self.events['send'] && typeof self.events['send'] === 'function') {
					self.events['send'](data);
				}
				connection.send(data);
			}
		} else {
			this.error("Could not send data: ERR_NOT_CONNECTED");
			if (self.events['sendfailure'] && typeof self.events['sendfailure'] === 'function') {
				self.events['sendfailure'](-1);
			}
		}
	};

	Client.prototype.sendRoom = function (room, data, delay) {
		if (!(data instanceof Array)) {
			data = [data.toString()];
		}
		for (var i = 0; i < data.length; i++) {
			data[i] = room + '|' + data[i];
		}
		this.send(data, delay);
	};

	Client.prototype.say = function (room, msg) {
		if (room.charAt(0) === ',') {
			return this.pm(room.substr(1), msg);
		}
		this.send(room + '|' + msg);
	};

	Client.prototype.pm = function (user, msg) {
		this.send('|/pm ' + user + ',' + msg);
	};

	Client.prototype.joinRooms = function (rooms) {
		var cmds = [];
		var room;
		for (var i = 0; i < rooms.length; i++) {
			room = toId(rooms[i]);
			if (this.rooms[room]) continue;
			cmds.push('|/join ' + room);
		}
		if (cmds.length) this.send(cmds);
	};

	Client.prototype.leaveRooms = function (rooms) {
		var cmds = [];
		var room;
		for (var i = 0; i < rooms.length; i++) {
			room = toId(rooms[i]);
			if (!this.rooms[room]) continue;
			cmds.push('|/leave ' + room);
		}
		if (cmds.length) this.send(cmds);
	};

	/********************************
	*	Data reception
	*********************************/

	Client.prototype.receive = function (message) {
		this.lastMessage = Date.now();
		var flag = message.substr(0, 1);
		var data;
		switch (flag) {
			case 'a':
				data = JSON.parse(message.substr(1));
				if (data instanceof Array) {
					for (var i = 0; i < data.length; i++) {
						this.receiveMsg(data[i]);
					}
				} else {
					this.receiveMsg(message);
				}
				break;
		}
	};

	Client.prototype.receiveMsg = function (message) {
		if (!message) return;
		if (message.indexOf('\n') > -1) {
			var spl = message.split('\n');
			var room = 'lobby';
			if (spl[0].charAt(0) === '>') {
				room = spl[0].substr(1);
				if (room === '') room = 'lobby';
			}
			for (var i = 0, len = spl.length; i < len; i++) {
				if (spl[i].split('|')[1] && (spl[i].split('|')[1] === 'init')) {
					for (var j = i; j < len; j++) {
						this.receiveLine(room, spl[j], true);
					}
					break;
				} else {
					this.receiveLine(room, spl[i]);
				}
			}
		} else {
			this.receiveLine('lobby', message);
		}
	};

	Client.prototype.receiveLine = function (room, message, isIntro) {
		var spl = message.substr(1).split('|');
		if (this.events['line'] && typeof this.events['line'] === 'function') {
			this.events['line'](room, message, isIntro, spl);
		}
		if (spl[1]) {
			var thisEvent = (spl[0].charAt(0) !== '-') ? 'major' : 'minor';
			if (this.events[thisEvent] && typeof this.events[thisEvent] === 'function') {
				this.events[thisEvent](room, spl[0], message.substr(spl[0].length + 2), isIntro);
			}
		} else {
			if (this.events['major'] && typeof this.events['major'] === 'function') {
				this.events['major'](room, '', message, isIntro);
			}
		}
		switch (spl[0]) {
			case 'formats':
				if (this.events['formats'] && typeof this.events['formats'] === 'function') {
					this.events['formats'](message.substr(spl[0].length + 2));
				}
				break;
			case 'challstr':
				var id = spl[1];
				var str = spl[2];
				this.challstr = {
					id: id,
					str: str
				};
				if (this.opts.nickName !== null) this.rename(this.opts.nickName, this.opts.pass);
				if (this.events['challstr'] && typeof this.events['challstr'] === 'function') {
					this.events['challstr'](spl[1] + spl[2]);
				}
				break;
			case 'updateuser':
				var name = spl[1];
				var named = parseInt(spl[2]);
				var avatar = spl[3];
				this.status.nickName = spl[1];
				this.status.named = named;
				this.status.avatar = avatar;
				if (this.events['rename'] && typeof this.events['rename'] === 'function') {
					this.events['rename'](name, named, avatar);
				}
				if (named) this.joinRooms(this.opts.autoJoin);
				break;
			case 'init':
				this.rooms[room] = {
					type: spl[1] || 'chat',
					title: '',
					users: {},
					userCount: 0
				};
				this.roomcount = Object.keys(this.rooms).length;
				if (this.events['joinroom'] && typeof this.events['joinroom'] === 'function') {
					this.events['joinroom'](room, this.rooms[room].type);
				}
				break;
			case 'deinit':
				if (this.rooms[room]) {
					if (this.events['leaveroom'] && typeof this.events['leaveroom'] === 'function') {
						this.events['leaveroom'](room);
					}
					delete this.rooms[room];
					this.roomcount = Object.keys(this.rooms).length;
				}
				break;
			case 'noinit':
				if (this.events['joinfailure'] && typeof this.events['joinfailure'] === 'function') {
					this.events['joinfailure'](room, spl[1], spl[2]);
				}
				break;
			case 'title':
				if (this.rooms[room]) this.rooms[room].title = spl[1];
				if (isIntro) {
					if (this.events['intro'] && typeof this.events['intro'] === 'function') {
						this.events['intro']('title', room, spl[1]);
					}
				}
				break;
			case 'users':
				if (!this.rooms[room]) break;
				var userArr = message.substr(7).split(",");
				this.rooms[room].userCount = parseInt(userArr[0]);
				for (var k = 1; k < userArr.length; k++) {
					this.rooms[room].users[toId(userArr[k])] = userArr[k];
				}
				if (isIntro) {
					if (this.events['intro'] && typeof this.events['intro'] === 'function') {
						this.events['intro']('users', room, this.rooms[room].users);
					}
				}
				break;
			case 'c':
				var by = spl[1];
				var timeOff = Date.now();
				spl.splice(0, 2);
				if (isIntro) {
					if (this.events['intro'] && typeof this.events['intro'] === 'function') {
						this.events['intro']('chat', room, timeOff, by, spl.join('|'));
					}
					break;
				}
				if (by.substr(1) === this.status.nickName) {
					if (this.events['chatsucess'] && typeof this.events['chatsucess'] === 'function') {
						this.events['chatsucess'](room, timeOff, spl.join('|'));
					}
				} else {
					if (this.events['chat'] && typeof this.events['chat'] === 'function') {
						this.events['chat'](room, timeOff, by, spl.join('|'));
					}
				}
				break;
			case 'c:':
				var by = spl[2];
				var timeOff = parseInt(spl[1]) * 1000;
				spl.splice(0, 3);
				if (isIntro) {
					if (this.events['intro'] && typeof this.events['intro'] === 'function') {
						this.events['intro']('chat', room, timeOff, by, spl.join('|'));
					}
					break;
				}
				if (by.substr(1) === this.status.nickName) {
					if (this.events['chatsucess'] && typeof this.events['chatsucess'] === 'function') {
						this.events['chatsucess'](room, timeOff, spl.join('|'));
					}
				} else {
					if (this.events['chat'] && typeof this.events['chat'] === 'function') {
						this.events['chat'](room, timeOff, by, spl.join('|'));
					}
				}
				break;
			case 'pm':
				var by = spl[1];
				var dest = spl[2];
				spl.splice(0, 3);
				if (by.substr(1) === this.status.nickName) {
					if (this.events['pmsucess'] && typeof this.events['pmsucess'] === 'function') {
						this.events['pmsucess'](dest, spl.join('|'));
					}
				} else {
					if (this.events['pm'] && typeof this.events['pm'] === 'function') {
						this.events['pm'](by, spl.join('|'));
					}
				}
				break;
			case 'n': case 'N':
				var by = spl[1];
				var old = spl[2];
				if (this.rooms[room]) {
					if (this.rooms[room].users[toId(old)]) delete this.rooms[room].users[toId(old)];
					this.rooms[room].users[toId(by)] = by;
				}
				if (this.events['userrename'] && typeof this.events['userrename'] === 'function') {
					this.events['userrename'](room, old, by);
				}
				break;
			case 'J': case 'j':
				var by = spl[1];
				if (this.rooms[room] && !this.rooms[room].users[toId(by)]) {
					this.rooms[room].users[toId(by)] = by;
					this.rooms[room].userCount++;
				}
				if (this.events['userjoin'] && typeof this.events['userjoin'] === 'function') {
					this.events['userjoin'](room, by);
				}
				break;
			case 'l': case 'L':
				var by = spl[1];
				if (this.rooms[room] && this.rooms[room].users[toId(by)]) {
					delete this.rooms[room].users[toId(by)];
					this.rooms[room].userCount--;
				}
				if (this.events['userleave'] && typeof this.events['userleave'] === 'function') {
					this.events['userleave'](room, by);
				}
				break;
			case 'queryresponse':
				if (this.events['queryresponse'] && typeof this.events['queryresponse'] === 'function') {
					this.events['queryresponse'](message.substr(15));
				}
				break;
			case 'popup':
				if (this.events['popup'] && typeof this.events['popup'] === 'function') {
					this.events['popup'](message.substr(7));
				}
				break;
			case 'raw': case 'html':
				if (isIntro) {
					if (this.events['intro'] && typeof this.events['intro'] === 'function') {
						this.events['intro']('raw', room, message.substr(2 + spl[0].length));
					}
					break;
				}
				if (this.events['raw'] && typeof this.events['raw'] === 'function') {
					this.events['raw'](room, message.substr(2 + spl[0].length));
				}
				break;
			default:
				if (!spl[1]) {
					if (isIntro) {
						if (this.events['intro'] && typeof this.events['intro'] === 'function') {
							this.events['intro']('raw', room, message);
						}
						break;
					}
					if (this.events['raw'] && typeof this.events['raw'] === 'function') {
						this.events['raw'](room, message);
					}
				}
		}
	};

	/********************************
	*	Connection Timer
	*********************************/

	Client.prototype.startConnectionTimeOut = function () {
		var self = this;
		this.stopConnectionTimeOut();
		this.connectionTimeOutInterval = setInterval(function () {
			if (self.status.connected && self.lastMessage) {
				var t = Date.now();
				if (t - self.lastMessage > self.opts.connectionTimeout) {
					self.error("Connection timeout: " + (t - self.lastMessage));
					self.softDisconnect();
				}
			}
		}, self.opts.connectionTimeout);
	};

	Client.prototype.stopConnectionTimeOut = function () {
		if (this.connectionTimeOutInterval) clearInterval(this.connectionTimeOutInterval);
	};

	return Client;
})();

module.exports = Client;
