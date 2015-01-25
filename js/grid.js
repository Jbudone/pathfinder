var DIR_NW = 1,
	DIR_N  = 2,
	DIR_NE = 3,
	DIR_SE = 4,
	DIR_S  = 5,
	DIR_SW = 6;

var Grid = (function(_properties){

	this.start = null;
	this.goal = null;
	this.tiles = {};

	var properties = _.defaults(_properties,
			{
				width: 10,
				height: 10,

				minObstructionSystems: 3,
				maxObstructionSystems: 8,
				minObstructionPressure: 12,
				maxObstructionPressure: 20,
				obstructionTurnChance: 0.4,
				totalObstructions: null
			});

	this.hashTile = function(x, y){
		return y*properties.width + x;
	};


	///////////////////////////////
	//
	//	Generate Grid
	//
	///////////////////////////////

	var w = properties.width,
		h = properties.height,
		c = 0,
		totalPaths = 0;
	for (var y=1; y<h; ++y) {
		
		var xStart = 2;
		if (y & 0x01) xStart = 1; // tile centers go by the following pattern:
									//    (even y, even x)
									//    (odd y, odd x)
		for (var x=xStart; x<w; x+=2) {
			var cHash  = this.hashTile(x, y),
				nwHash = (x > 0 && y > 0)     ? this.hashTile(x-1, y-1) : null,
				nHash  = (y > 1)              ? this.hashTile(x, y-2)   : null,
				neHash = (x < w-1 && y > 0)   ? this.hashTile(x+1, y-1) : null,
				swHash = (x > 0 && y < h-1)   ? this.hashTile(x-1, y+1) : null,
				sHash  = (y < h-2)            ? this.hashTile(x, y+2)   : null,
				seHash = (x < w-1 && y < h-1) ? this.hashTile(x+1, y+1) : null,
				hexagon = null;


			hexagon = new Hexagon({x: x, y: y});
			if (this.tiles.hasOwnProperty(nwHash)) {
				hexagon.nw = this.tiles[nwHash];
				hexagon.nw.se = hexagon;
				++totalPaths;
			}
			if (this.tiles.hasOwnProperty(neHash)) {
				hexagon.ne = this.tiles[neHash];
				hexagon.ne.sw = hexagon;
				++totalPaths;
			}
			if (this.tiles.hasOwnProperty(nHash)) {
				hexagon.n = this.tiles[nHash];
				hexagon.n.s = hexagon;
				++totalPaths;
			}
			if (this.tiles.hasOwnProperty(swHash)) {
				hexagon.sw = this.tiles[swHash];
				hexagon.sw.ne = hexagon;
				++totalPaths;
			}
			if (this.tiles.hasOwnProperty(seHash)) {
				hexagon.se = this.tiles[seHash];
				hexagon.se.nw = hexagon;
				++totalPaths;
			}
			if (this.tiles.hasOwnProperty(sHash)) {
				hexagon.s = this.tiles[sHash];
				hexagon.s.n = hexagon;
				++totalPaths;
			}
			this.tiles[cHash] = hexagon;
			++c;
			if (properties.total !== null && c >= properties.total) break;
		}
		if (properties.total !== null && c >= properties.total) break;
		if (y+1 == h && c < properties.total) {
			h = h + 1; // leftover tiles
			properties.height = h; // this needs to reflect the grid dimensions (for the canvas)
		}
	}


	///////////////////////////////
	//
	//	Generate Start/Goal Tile
	//
	///////////////////////////////


	// Choose start/goal state slightly offset from the center of the grid
	var center = {x: parseInt(properties.width / 2), y: parseInt(properties.height / 2)},
		grid = this,
		findNearestTileTo = function(x, y){
			var cHash = grid.hashTile(x, y);
			if (grid.tiles.hasOwnProperty(cHash)) {
				return grid.tiles[cHash];
			}

			var maxOffset = 2;
			for (var yOffset = -1*maxOffset; yOffset < maxOffset; ++yOffset) {
				for (var xOffset = -1*maxOffset; xOffset < maxOffset; ++xOffset) {
					var hash = grid.hashTile(x+xOffset, y+yOffset);
					if (grid.tiles.hasOwnProperty(hash)) {
						return grid.tiles[hash];
					}
				}
			}

			return null;
		};

	var startTile = null,
		endTile = null,
		iterations = 0,
		maxIterations = 100;

	while (!startTile) {
		var heightFactor = parseInt(properties.height * 0.1),
			widthFactor  = parseInt(properties.width * 0.1),
			yOffset = parseInt(2 * Math.random() * heightFactor) - heightFactor,
			xOffset = parseInt(-1 * Math.random() * widthFactor - 2);
		startTile = findNearestTileTo(center.x + xOffset, center.y + yOffset);
		if (++iterations > maxIterations && !startTile) {
			// Failed to find a start tile..brute force to find the first available one
			for (var tileHash in this.tiles) {
				var tile = this.tiles[tileHash];
				if (tile.state == 0) {
					startTile = tile;
				}
			}

			if (!startTile) {
				console.error("FAILED TO FIND START TILE!");
				return;
			}
		}
	}


	iterations = 0;
	while (!endTile) {
		var heightFactor = parseInt(properties.height * 0.1),
			widthFactor  = parseInt(properties.width * 0.2),
			yOffset = parseInt(4 * Math.random() * heightFactor) - 2 * heightFactor,
			xOffset = parseInt(Math.random() * widthFactor + 2);
		endTile = findNearestTileTo(center.x + xOffset, center.y + yOffset);
		if (endTile == startTile) endTile = null;
		if (++iterations > maxIterations && !endTile) {
			// Failed to find a goal tile..brute force to find the first available one
			for (var tileHash in this.tiles) {
				var tile = this.tiles[tileHash];
				if (tile.state == 0 && tile != startTile) {
					endTile = tile;
				}
			}

			console.error("FAILED TO FIND END TILE!");
			return;
		}
	}

	startTile.state = STATE_START;
	endTile.state = STATE_GOAL;

	this.start = startTile;
	this.goal = endTile;


	///////////////////////////////
	//
	//	Generate Obstructions
	//
	///////////////////////////////


	/*  Obstruction Concept
	 *
	 *	A good description is to imagine pouring water onto the grid, and allowing the water to flow between
	 *	tiles. This creates a believable wall layout (walls which are connected). Each water pouring spot
	 *	(obstruction system) starts with a given pressure level, then it iterates by the following method: for
	 *	each tile in the system, if the pressure in that tile is greater then a certain threshold then process
	 *	that tile. The process uses the same direction as before and applies a random chance to move into
	 *	another direction. Before moving to the next direction, there is also a small chance that the tile may
	 *	split into more than 1 tile, and will split the pressure evenly between each next tile
	 ***************************************/

	var obstructionSystems = [];
	var ObstructionSystem = function(tile){

		this.center = null;
		this.pressure = parseInt(Math.random() * (properties.maxObstructionPressure - properties.minObstructionPressure)) + properties.minObstructionPressure;
		this.tiles = {};
		this.activeTiles = [];
		
		var Obstruction = function(tile, pressure, direction){
			this.tile = tile;
			this.hash = grid.hashTile(tile.x, tile.y);
			this.pressure = pressure;
			this.direction = direction;

			tile.state = STATE_HIGHLIGHTED;
		};

		var findNeighbour = function(tile, direction){
			     if (direction === DIR_NW) return tile.nw;
			else if (direction === DIR_N)  return tile.n;
			else if (direction === DIR_NE) return tile.ne;
			else if (direction === DIR_SW) return tile.sw;
			else if (direction === DIR_S)  return tile.s;
			else if (direction === DIR_SE) return tile.se;
			return null;
		};

		this.center = new Obstruction(tile, this.pressure, null);
		this.tiles[this.center.hash] = this.center;
		this.activeTiles.push(this.center);

		while (this.activeTiles.length) {
			var tile = this.activeTiles.shift(),
				pressure = tile.pressure - 1,
				direction = tile.direction,
				offsetDir = 0,
				nextTile = null;

			// Random direction if none picked
			if (!direction) {
				direction = parseInt(Math.random() * 6) + 1; 
			} else {
				toTurnVal = Math.random();
				if (toTurnVal < properties.obstructionTurnChance) {
					offsetDir = parseInt(Math.random() * 4) - 2;
					direction += offsetDir;
					direction = direction % 6 + 1;
				}
			}

			nextTile = findNeighbour(tile.tile, direction);
			if (nextTile) {
				var hash = grid.hashTile(nextTile.x, nextTile.y);
				if (this.tiles.hasOwnProperty(hash)) {
					// TODO: what to do if we already have this tile ??
					continue;
				} else if (nextTile.state) {
					// TODO: what to do if another system has this tile ??
					continue;
				}

				var obstruction = new Obstruction(nextTile, pressure, direction);
				this.tiles[hash] = obstruction;
				if (pressure > 1) {
					this.activeTiles.push(obstruction);
				}
			}
		}
	};

	if (_.isNumber(properties.totalObstructionsP)) {

		var totalObstructions = parseInt(totalPaths * properties.totalObstructionsP / 100),
			candidates = [];
		for (var tileHash in this.tiles) {
			var tile = this.tiles[tileHash];
			if (tile.state == 0) {
				candidates.push(tile);
			}
		}

		var count = 0;
		while (count < totalObstructions) {
			var i = parseInt(Math.random() * candidates.length),
				tile = candidates[i];
			candidates.splice(i, 1);

			tile.state = STATE_HIGHLIGHTED;
			if (tile.nw && tile.nw.state != STATE_HIGHLIGHTED) ++count;
			if (tile.n  && tile.n.state != STATE_HIGHLIGHTED)  ++count;
			if (tile.ne && tile.ne.state != STATE_HIGHLIGHTED) ++count;
			if (tile.sw && tile.sw.state != STATE_HIGHLIGHTED) ++count;
			if (tile.s  && tile.s.state != STATE_HIGHLIGHTED)  ++count;
			if (tile.se && tile.se.state != STATE_HIGHLIGHTED) ++count;
		}

	} else {

		// pick a random number of wall spots (small number)
		var nSystems = parseInt(Math.random() * (properties.maxObstructionSystems - properties.minObstructionSystems)) + properties.minObstructionSystems;

		for (var i=0; i<nSystems; ++i) {
			// TODO: pick evenly spaced points for each system to start (weighted towards the center, away from other
			// 		systems, and away from start/goal tiles)
			var systemTile = null;

			iterations = 0;
			while (!systemTile) {
				var heightFactor = parseInt(properties.height * 0.2),
					widthFactor  = parseInt(properties.width * 0.1),
					yOffset = parseInt(2 * Math.random() * heightFactor) - heightFactor,
					xOffset = parseInt(2 * Math.random() * widthFactor) - widthFactor;
				systemTile = findNearestTileTo(center.x + xOffset, center.y + yOffset);
				if (systemTile && systemTile.state) systemTile = null;

				if (++iterations > maxIterations && !systemTile) {
					//console.error("FAILED TO FIND OBSTRUCTION SYSTEM TILE!");
					return;
				}
			}

			var system = new ObstructionSystem(systemTile);
			obstructionSystems.push(system);
		}

	}
});
