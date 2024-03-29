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
		spawnLocations: [{x: 14, y: 1}, {x: 25, y: 1}, {x: 14, y: 19}, {x: 25, y: 19}, {x: 14, y: 10}, {x: 25, y: 10}],
		collisionTiles: [1, 29, 30, 31, 32, 34, 38,39, 40 ,41 ,42, 43, 8],
		groundLayer: "Ground",
		blockLayer: "Blocks",
		tilesetName: "tiles",
		tilesetImage: "tiles",
		destructibleTileId: 1
	},
	levelThree: {
		spawnLocations: [{x: 14, y: 1}, {x: 25, y: 1}, {x: 14, y: 19}, {x: 25, y: 19}, {x: 14, y: 10}, {x: 25, y: 10}],
		collisionTiles: [1, 29, 30, 31, 32, 34, 38,39, 40 ,41 ,42, 43, 8],
		groundLayer: "Ground",
		blockLayer: "Blocks",
		tilesetName: "tiles",
		tilesetImage: "tiles",
		destructibleTileId: 1
	}
};

module.exports = MapInfo;