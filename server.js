var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var cors = require("cors");
var debug = require('debug')('server:server');
var http = require('http');
var Player = require("./entities/player");
var Bomb = require("./entities/bomb");
var Map = require("./entities/map");
var MapInfo = require("./common/map_info");
var Game = require("./entities/game");
var Lobby = require("./lobby");
var PendingGame = require("./entities/pending_game");
var PowerupIDs = require("./common/powerup_ids");
var Lobby = require("./lobby");
var games = {};

require("dotenv").config();


const app = express();
app.use(session({
    secret: 'troopersleauge',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));
publicDir = path.join(__dirname,'public');

// view engine setup
app.use(express.static(publicDir))

app.use(cors());
app.use(logger('dev'));
app.use(express.json());

//expressjs session middleware

app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
    //vvvv
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

	console.log(`Server Error: ${err}`)
    // render the error page
    res.status(err.status || 500);
    res.json({ error: err })
	
});


module.exports = app;


/**
 * Get port from environment and store in Express.
 */

 var port = normalizePort(process.env.PORT || '3000');
 app.set('port', port);
 
 /**
  * Create HTTP server.
  */
 
 var server = http.createServer(app);
 
 /**
  * Listen on provided port, on all network interfaces.
  */
 
 server.listen(port);
 server.on('error', onError);
 server.on('listening', onListening);
 
 /**
  * Normalize a port into a number, string, or false.
  */
 
 function normalizePort(val) {
     var port = parseInt(val, 10);
 
     if (isNaN(port)) {
         // named pipe
         return val;
     }
 
     if (port >= 0) {
         // port number
         return port;
     }
 
     return false;
 }
 
 /**
  * Event listener for HTTP server "error" event.
  */
 
 function onError(error) {
     if (error.syscall !== 'listen') {
         throw error;
     }
 
     var bind = typeof port === 'string'
         ? 'Pipe ' + port
         : 'Port ' + port;
 
     // handle specific listen errors with friendly messages
     switch (error.code) {
         case 'EACCES':
             console.error(bind + ' requires elevated privileges');
             process.exit(1);
             break;
         case 'EADDRINUSE':
             console.error(bind + ' is already in use');
             process.exit(1);
             break;
         default:
             throw error;
     }
 }
 
 /**
  * Event listener for HTTP server "listening" event.
  */
 
 function onListening() {
     var addr = server.address();
     var bind = typeof addr === 'string'
         ? 'pipe ' + addr
         : 'port ' + addr.port;
     debug('Listening on ' + bind);
 }

 TILE_SIZE = 32;
// Broadcasting loop works better than sending an update every time a player moves because waiting for player movement messages adds
// another source of jitter.
var updateInterval = 30; // Broadcast updates every 100 ms.
io = require("socket.io").listen(server,
	{
	cors: {
	origin: '*',
}});



function onClientDisconnect() {
	console.log("Player has disconnected");
	if (this.gameId == null) {
		return;
	}

	var lobbySlots = Lobby.getLobbySlots();

	if (lobbySlots[this.gameId].state == "joinable" || lobbySlots[this.gameId].state == "full") {
		Lobby.onLeavePendingGame.call(this);
	} else if (lobbySlots[this.gameId].state == "settingup") {
		lobbySlots[this.gameId].state = "empty";

		Lobby.broadcastSlotStateUpdate(this.gameId, "empty");
	} else if(lobbySlots[this.gameId].state == "inprogress") {
		var game = games[this.gameId];
	
		if(this.id in game.players) {
			delete game.players[this.id];
	
			io.in(this.gameId).emit("remove player", {id: this.id});	
		}

		if(game.numPlayers < 2) {
			if(game.numPlayers == 1) {
				io.in(this.gameId).emit("no opponents left");
			}
			terminateExistingGame(this.gameId);
		}

		if(game.awaitingAcknowledgements && game.numEndOfRoundAcknowledgements >= game.numPlayers) {
			game.awaitingAcknowledgements = false;
		}
	}
};

// Deletes the game object and frees up the slot.
function terminateExistingGame(gameId) {
	games[gameId].clearBombs();

	delete games[gameId];

	Lobby.getLobbySlots()[gameId] = new PendingGame();

	Lobby.broadcastSlotStateUpdate(gameId, "empty");
};

function onStartGame() {
	console.log("Starting game");
	var lobbySlots = Lobby.getLobbySlots();

	var game = new Game();
	games[this.gameId] = game;
	var pendingGame = lobbySlots[this.gameId];
	lobbySlots[this.gameId].state = "inprogress";

	Lobby.broadcastSlotStateUpdate(this.gameId, "inprogress");

	var ids = pendingGame.getPlayerIds();
	
	for(var i = 0; i < ids.length; i++) {
		var playerId = ids[i];
		var spawnPoint = MapInfo[pendingGame.mapName].spawnLocations[i];
		var newPlayer = new Player(spawnPoint.x * TILE_SIZE, spawnPoint.y * TILE_SIZE, "down", playerId, pendingGame.players[playerId].color);
		newPlayer.spawnPoint = spawnPoint;

		game.players[playerId] = newPlayer;
	}

	game.numPlayersAlive = ids.length;

	io.in(this.gameId).emit("start game on client", {mapName: pendingGame.mapName, players: game.players});
};

function onRegisterMap(data) {
	games[this.gameId].map = new Map(data, TILE_SIZE);
};

function onMovePlayer(data) {
	var game = games[this.gameId];

	if(game === undefined || game.awaitingAcknowledgements) {
		return;
	}

	var movingPlayer = game.players[this.id];

	// Moving player can be null if a player is killed and leftover movement signals come through.
	if(!movingPlayer) {
		return;
	}

	movingPlayer.x = data.x;
	movingPlayer.y = data.y;
	movingPlayer.facing = data.facing;
	movingPlayer.hasMoved = true;
};

function onPlaceBomb(data) {
	var game = games[this.gameId];
	var player = game.players[this.id];

	if(game === undefined || game.awaitingAcknowledgements || player.numBombsAlive >= player.bombCapacity) {
		return;
	}

	var gameId = this.gameId;
	var bombId = data.id;
	var normalizedBombLocation = game.map.placeBombOnGrid(data.x, data.y);

	if(normalizedBombLocation == -1) {
		return;
	}

	player.numBombsAlive++;

	var bombTimeoutId = setTimeout(function() {
		var explosionData = bomb.detonate(game.map, player.bombStrength, game.players);
		player.numBombsAlive--;

		io.in(gameId).emit("detonate", {explosions: explosionData.explosions, id: bombId, 
			destroyedTiles: explosionData.destroyedBlocks});
		delete game.bombs[bombId];
		game.map.removeBombFromGrid(data.x, data.y);

		handlePlayerDeath(explosionData.killedPlayers, gameId);
	}, 2000);

	var bomb = new Bomb(normalizedBombLocation.x, normalizedBombLocation.y, bombTimeoutId);
	game.bombs[bombId] = bomb;

	io.to(this.gameId).emit("place bomb", {x: normalizedBombLocation.x, y: normalizedBombLocation.y, id: data.id});
};

function onPowerupOverlap(data) {
	var powerup = games[this.gameId].map.claimPowerup(data.x, data.y);

	if(!powerup) {
		return;
	}

	var player = games[this.gameId].players[this.id];

	if(powerup.powerupType === PowerupIDs.BOMB_STRENGTH) {
		player.bombStrength++;
	} else if(powerup.powerupType === PowerupIDs.BOMB_CAPACITY) {
		player.bombCapacity++;
	}

	io.in(this.gameId).emit("powerup acquired", {acquiringPlayerId: this.id, powerupId: powerup.id, powerupType: powerup.powerupType});
};

function handlePlayerDeath(deadPlayerIds, gameId) {
	var tiedWinnerIds;

	if(deadPlayerIds.length > 1 && games[gameId].numPlayersAlive - deadPlayerIds.length == 0) {
		tiedWinnerIds = deadPlayerIds;
	}

	deadPlayerIds.forEach(function(deadPlayerId) {
		games[gameId].players[deadPlayerId].alive = false;
		io.in(gameId).emit("kill player", {id: deadPlayerId});
		games[gameId].numPlayersAlive--;
	}, this);

	if(games[gameId].numPlayersAlive <= 1) {
		endRound(gameId, tiedWinnerIds);
	}
};

function endRound(gameId, tiedWinnerIds) {
	var roundWinnerColors = [];

	var game = games[gameId];

	if(tiedWinnerIds) {
		tiedWinnerIds.forEach(function(tiedWinnerId) {
			roundWinnerColors.push(game.players[tiedWinnerId].color);
		});
	} else {
		var winner = game.calculateRoundWinner();
		winner.wins++;
		roundWinnerColors.push(winner.color);
	}

	game.currentRound++;

	if(game.currentRound > 2) {
		var gameWinners = game.calculateGameWinners();

		if(gameWinners.length == 1 && gameWinners[0].wins == 2) {
			io.in(gameId).emit("end game", {completedRoundNumber: game.currentRound - 1, roundWinnerColors: roundWinnerColors, 
				gameWinnerColor: gameWinners[0].color});
			terminateExistingGame(gameId);
			return;
		}
	}

	game.awaitingAcknowledgements = true;
	game.resetForNewRound();


	io.in(gameId).emit("new round", {completedRoundNumber: game.currentRound - 1, roundWinnerColors: roundWinnerColors});
};

function onRegister(account) {
	console.log("Registering player " + account);
}

function onReadyForRound() {
	var game = games[this.gameId];

	if(!game.awaitingAcknowledgements) {
		return;
	}

	game.acknowledgeRoundReadinessForPlayer(this.id);

	if(game.numRoundReadinessAcknowledgements >= game.numPlayers) {
		game.awaitingAcknowledgements = false;
	}
};

function broadcastingLoop() {
	for(var g in games) {
		var game = games[g];
		for(var i in game.players) {
			var player = game.players[i];
			if(player.alive && player.hasMoved) {
				io.to(g).emit("m", {id: player.id, x: player.x, y: player.y, f: player.facing});
				player.hasMoved = false;
			}
		}
	}
};



init();

function init() {
	Lobby.initialize();

	// Begin listening for events.
	setEventHandlers();

	// Start game loop
	setInterval(() => broadcastingLoop(), updateInterval);
};

function setEventHandlers () {
	console.log("Setting event handlers...");
	io.on("connection", function(client) {

		client.on('storeClientInfo', (data) => {
			console.log("connected custom id:", data.customId);
			client.customId = data.customId;
		});

		console.log("New player has connected: " + client.id);
		client.on('register', onRegister);
		client.on("move player", onMovePlayer);
		client.on("disconnect", onClientDisconnect);
		client.on("place bomb", onPlaceBomb);
		client.on("register map", onRegisterMap);
		client.on("start game on server", onStartGame);
		client.on("ready for round", onReadyForRound);
		client.on("powerup overlap", onPowerupOverlap);

		client.on("enter lobby", Lobby.onEnterLobby);
		client.on("host game", Lobby.onHostGame);
		client.on("select stage", Lobby.onStageSelect);
		client.on("enter pending game", Lobby.onEnterPendingGame);
		client.on("leave pending game", Lobby.onLeavePendingGame);

	});
};
 
 module.exports = app;