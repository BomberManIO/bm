// Store this somewhere as metadata?
var colorIndices = {
	"white": 6,
	"black": 1,
	"blue": 2,
	"red": 3,
	"purple": 4,
	"green": 5
}

var PendingGame = function() {
	this.players = {};
	this.state = "empty";
	this.mapName = "";
	this.colors = [{colorName: "white", available: true, id: 0}, {colorName: "black", available: true, id: 1}, {colorName: "blue", available: true, id: 2}, {colorName: "red", available: true, id: 3}, 
	{colorName: "purple", available: true, id: 4}, {colorName: "green", available: true, id: 5}];
};

PendingGame.prototype = {
	getPlayerIds: function() {
		return Object.keys(this.players);
	},

	getNumPlayers: function() {
		return Object.keys(this.players).length;
	},

	removePlayer: function(id) {
		this.colors[colorIndices[this.players[id].color]].available = true;
		delete this.players[id];
	},

	addPlayer: function(id) {
		this.players[id] = {color: this.claimFirstAvailableColor()};
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