/**
* This module contains all logic related to hosting/joining games.
*/

var PendingGame = require("./entities/pending_game");
var MapInfo = require("./common/map_info");

var lobbySlots = [];
var lobbyId = -1;
var numLobbySlots = 5;

var Lobby = {
	getLobbySlots: function() {
		return lobbySlots;
	},

	getLobbyId: function() {
		return lobbyId;
	},

	getNumLobbySlots: function() {
		return numLobbySlots;
	},

	broadcastSlotStateUpdate: function(gameId, newState) {
		broadcastSlotStateUpdate(gameId, newState);
	},

	initialize: function() {
		// for(var i = 0; i < numLobbySlots; i++) {
		// 	lobbySlots.push(new PendingGame());
		// }
	},

	onEnterLobby: function(data) {
		this.join(lobbyId);
		io.in(lobbyId).emit("add slots", lobbySlots);
	},

	onHostGame: function(data) {
		// console.log("Hosting game", data.gameId);
		// debugger;
		// lobbySlots[data.gameId].state = "settingup";
		// this.gameId = data.gameId;
		// broadcastSlotStateUpdate(data.gameId, "settingup");
	},

	onStageSelect: function(data) {
		const availableGame = lobbySlots.findIndex(l => l.state === "joinable" && l.mapName === data.mapName);

		if(availableGame !== -1) {
			this.gameId = availableGame;
		} else {
			const emptyGame = lobbySlots.findIndex(l => l.state === "empty");

			if(emptyGame !== -1) {
				this.gameId = emptyGame
			}
			else {
				const newGame = lobbySlots.push(new PendingGame());
				this.gameId = newGame - 1;
			}
		}

		console.log("lobbySlots", lobbySlots);

		lobbySlots[this.gameId].state = "joinable";
		lobbySlots[this.gameId].mapName = data.mapName;
		broadcastSlotStateUpdate(this.gameId, "joinable");
	},

	onEnterPendingGame: function(data) {
		var pendingGame = lobbySlots[this.gameId];
	
		this.leave(lobbyId);
		this.join(this.gameId);
		
		pendingGame.addPlayer(this.id);
	
		this.emit("show current players", {players: pendingGame.players});
		this.broadcast.to(this.gameId).emit("player joined", {id: this.id, color: pendingGame.players[this.id].color});
	
		if(pendingGame.getNumPlayers() >= MapInfo[pendingGame.mapName].spawnLocations.length) {
			pendingGame.state = "full";
			broadcastSlotStateUpdate(data.gameId, "full");
		}
	},

	onLeavePendingGame: function(data) {
		leavePendingGame.call(this);
	}
};

function broadcastSlotStateUpdate(gameId, newState) {
	io.in(lobbyId).emit("update slot", {gameId: gameId, newState: newState});
};

function leavePendingGame() {
	var lobbySlot = lobbySlots[this.gameId];

	this.leave(this.gameId);
	lobbySlot.removePlayer(this.id);
	io.in(this.gameId).emit("player left", {players: lobbySlot.players});

	if(lobbySlot.getNumPlayers()== 0) {
		lobbySlot.state = "empty";
		io.in(lobbyId).emit("update slot", {gameId: this.gameId, newState: "empty"});
	}

	if(lobbySlot.state == "full") {
		lobbySlot.state = "joinable";
		io.in(lobbyId).emit("update slot", {gameId: this.gameId, newState: "joinable"});
	}
};

module.exports = Lobby;