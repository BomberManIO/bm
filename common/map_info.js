var MapInfo = {
	levelOne: {
		spawnLocations: [{x: 2, y: 5}, {x: 13, y: 1}, {x: 3, y: 1}, {x: 12, y: 6}],
		collisionTiles: [127, 361],
		groundLayer: "Ground",
		blockLayer: "Blocks",
		tilesetName: "tiles",
		tilesetImage: "tiles",
		destructibleTileId: 361
	},
	levelTwo: {
		spawnLocations: [{x: 2, y: 1}, {x: 13, y: 1}, {x: 2, y: 13}, {x: 13, y: 13}],
		collisionTiles: [169, 191],
		groundLayer: "Ground",
		blockLayer: "Blocks",
		tilesetName: "tiles",
		tilesetImage: "tiles",
		destructibleTileId: 191
	},
	levelThree: {
		spawnLocations: [{x: 2, y: 1}, {x: 13, y: 1}, {x: 2, y: 13}, {x: 13, y: 13}, {x: 2, y: 5}, {x: 13, y: 5}],
		collisionTiles: [1, 29, 30, 31, 32, 34, 38,39, 40 ,41 ,42, 43, 8],
		groundLayer: "Ground",
		blockLayer: "Blocks",
		tilesetName: "tiles",
		tilesetImage: "tiles",
		destructibleTileId: 1
	}
};

module.exports = MapInfo;