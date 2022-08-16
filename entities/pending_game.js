// Store this somewhere as metadata?
var colorIndices = {
	"grey": 0,
	"turquoise": 1,
	"brown": 2,
	"white": 3,
	"orange": 4,
	"pink": 5,
	"red": 6,
	"green": 7,
	"yellow": 8,
	"purple": 9,
	"black": 10
}

var PendingGame = function() {
	this.players = {};
	this.state = "empty";
	this.mapName = "";
	this.colors = [
		// {colorName: "grey", available: true, id: 0}, 
		{colorName: "turquoise", available: true, id: 1}, 
		{colorName: "brown", available: true, id: 2}, 
		{colorName: "white", available: true, id: 3}, 
		{colorName: "orange", available: true, id: 4}, 
		{colorName: "pink", available: true, id: 5}, 
		{colorName: "red", available: true, id: 6},
		{colorName: "green", available: true, id: 7},
		{colorName: "yellow", available: true, id: 8},
		{colorName: "purple", available: true, id: 9},
		{colorName: "black", available: true, id: 10}];
	this.startGame = null;
};

PendingGame.prototype = {
	getPlayerIds: function() {
		return Object.keys(this.players);
	},

	getNumPlayers: function() {
		return Object.keys(this.players).length;
	},

	removePlayer: function(id) {
		this.colors[colorIndices[this.players[id]?.color]].available = true;
		delete this.players[id];
	},

	addPlayer: function(id, gameId) {
		this.players[id] = {color: this.claimFirstAvailableColor()};
		if(this.getNumPlayers() > 1) {
			this.startGame = setTimeout(function() {
				// emit server start game
				io.in(gameId).emit("start_game_timeleft");
			}, 5000);
		}
	},

	claimFirstAvailableColor: function() {
		for(var i = 0; i < this.colors.length; i++) {
			var color = this.colors[i];
			if(color.available) {
				color.available = false;
				return color.colorName;
			}
		}
	}
};

module.exports = PendingGame;