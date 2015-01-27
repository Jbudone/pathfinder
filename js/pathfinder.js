
var Tile = function(cell, direction, cost){
	this.cell = cell;
	this.prevDirection = direction;
	this.cost = cost;
};

var Pathfinder = function(grid, scheme, _settings){

	var settings = _.defaults(_settings,
			{
				iterationTime: 100
			});

	var scheme = new scheme(grid),
		nextIteration = null;

	this.solve = function(){
		this.initialize();
		this.iterate();
	};

	this.iterate = function(){
		var stillGoing = scheme.iterate.bind(this)();

		if (stillGoing) {
			nextIteration = setTimeout(this.iterate.bind(this), settings.iterationTime);
		}
	};

	this.cancel = function(){
		for (var tileHash in this.tiles) {
			var tile = this.tiles[tileHash];
			this.onClearTile(tile.cell);
		}

		this.tiles = {};
		this.openTiles = [];
		this.iterations = 0;

		clearTimeout(nextIteration);
		nextIteration = null;
	};

	this.onClearTile = new Function();
	this.onNewIteration = new Function();
	this.onSolvedPath = new Function();
	this.onFailedPath = new Function();






	this.tiles = {},
	this.openTiles = [],
	this.iterations = 0;

	this.initialize = function(){
		var start = new Tile(grid.start, null, 0);
		this.tiles[grid.hashTile(grid.start.x, grid.start.y)] = start;
		this.openTiles.push(start);
		scheme.initialize.bind(this)();
	};

	this.buildPath = function(fromTile){
		var headTile = fromTile,
			path = [fromTile];
		while (headTile.prevDirection) {
			var prevCell = null,
				hash = null;
			     if (headTile.prevDirection == DIR_NW) prevCell = headTile.cell.se;
			else if (headTile.prevDirection == DIR_N)  prevCell = headTile.cell.s;
			else if (headTile.prevDirection == DIR_NE) prevCell = headTile.cell.sw;
			else if (headTile.prevDirection == DIR_SW) prevCell = headTile.cell.ne;
			else if (headTile.prevDirection == DIR_S)  prevCell = headTile.cell.n;
			else if (headTile.prevDirection == DIR_SE) prevCell = headTile.cell.nw;

			hash = grid.hashTile(prevCell.x, prevCell.y);
			headTile = this.tiles[hash];
			path.unshift(headTile.cell);
		}

		return path;
	};
};


var Pathfind_BFS = function(grid){

	this.initialize = function(){};
	this.iterate = function(){
		++this.iterations;
		var tile = this.openTiles.shift(),
			neighbours = [];

		this.onNewIteration(tile.cell);

		if (tile.cell.nw) neighbours.push({ cell: tile.cell.nw, dir: DIR_NW });
		if (tile.cell.n)  neighbours.push({ cell: tile.cell.n,  dir: DIR_N });
		if (tile.cell.ne) neighbours.push({ cell: tile.cell.ne, dir: DIR_NE });
		if (tile.cell.sw) neighbours.push({ cell: tile.cell.sw, dir: DIR_SW });
		if (tile.cell.s)  neighbours.push({ cell: tile.cell.s,  dir: DIR_S });
		if (tile.cell.se) neighbours.push({ cell: tile.cell.se, dir: DIR_SE });

		for (var i=0; i<neighbours.length; ++i) {
			var neighbour = neighbours[i],
				hash = grid.hashTile(neighbour.cell.x, neighbour.cell.y);

			// Is this a wall?
			if (neighbour.cell.state === STATE_HIGHLIGHTED) {
				continue;
			}

			// Already searched this tile...is our new path faster?
			if (this.tiles.hasOwnProperty(hash)) {
				var newCost = tile.cost + 1;
				if (newCost < neighbour.cost) {
					neighbour.cost = newCost;
					neighbour.prevDirection = neighbour.dir; // FIXME: is there a point to this???
				}
				
				continue;
			}
			
			var newTile = new Tile(neighbour.cell, neighbour.dir, tile.cost + 1);

			// Is this the end goal?
			if (neighbour.cell == grid.goal) {
				var path = this.buildPath(newTile);
				this.onSolvedPath(path, this.iterations);
				return false;
			}

			// Add this to our open tiles
			this.tiles[hash] = newTile;
			this.openTiles.push(newTile);
		}

		if (!this.openTiles.length) {
			this.onFailedPath(this.iterations);
			return false;
		}

		return true;
	};

};


var Pathfind_DFS = function(grid){

	this.initialize = function(){};
	this.iterate = function(){
		++this.iterations;
		var tile = this.openTiles.pop(),
			neighbours = [];

		this.onNewIteration(tile.cell);

		if (tile.cell.nw) neighbours.push({ cell: tile.cell.nw, dir: DIR_NW });
		if (tile.cell.n)  neighbours.push({ cell: tile.cell.n,  dir: DIR_N });
		if (tile.cell.ne) neighbours.push({ cell: tile.cell.ne, dir: DIR_NE });
		if (tile.cell.sw) neighbours.push({ cell: tile.cell.sw, dir: DIR_SW });
		if (tile.cell.s)  neighbours.push({ cell: tile.cell.s,  dir: DIR_S });
		if (tile.cell.se) neighbours.push({ cell: tile.cell.se, dir: DIR_SE });

		for (var i=0; i<neighbours.length; ++i) {
			var neighbour = neighbours[i],
				hash = grid.hashTile(neighbour.cell.x, neighbour.cell.y);

			// Is this a wall?
			if (neighbour.cell.state === STATE_HIGHLIGHTED) {
				continue;
			}

			// Already searched this tile...is our new path faster?
			if (this.tiles.hasOwnProperty(hash)) {
				var newCost = tile.cost + 1;
				if (newCost < neighbour.cost) {
					neighbour.cost = newCost;
					neighbour.prevDirection = neighbour.dir; // FIXME: is there a point to this???
				}
				
				continue;
			}
			
			var newTile = new Tile(neighbour.cell, neighbour.dir, tile.cost + 1);

			// Is this the end goal?
			if (neighbour.cell == grid.goal) {
				var path = this.buildPath(newTile);
				this.onSolvedPath(path, this.iterations);
				return false;
			}

			// Add this to our open tiles
			this.tiles[hash] = newTile;
			this.openTiles.push(newTile);
		}

		if (!this.openTiles.length) {
			this.onFailedPath(this.iterations);
			return false;
		}

		return true;
	};

};

var Pathfind_ID = function(grid){

	var d=0;
	this.initialize = function(){
		d = 0;
	};

	this.iterate = function(){
		++this.iterations;
		var tile = null,
			neighbours = [];

		while (!tile) {
			for (var i=this.openTiles.length-1; i>=0; --i) {
				var openTile = this.openTiles[i];
				if (openTile.cost <= d) {
					tile = openTile;
					this.openTiles.splice(i, 1);
					break;
				}
			}

			if (!tile) ++d;
		}

		this.onNewIteration(tile.cell);

		if (tile.cell.nw) neighbours.push({ cell: tile.cell.nw, dir: DIR_NW });
		if (tile.cell.n)  neighbours.push({ cell: tile.cell.n,  dir: DIR_N });
		if (tile.cell.ne) neighbours.push({ cell: tile.cell.ne, dir: DIR_NE });
		if (tile.cell.sw) neighbours.push({ cell: tile.cell.sw, dir: DIR_SW });
		if (tile.cell.s)  neighbours.push({ cell: tile.cell.s,  dir: DIR_S });
		if (tile.cell.se) neighbours.push({ cell: tile.cell.se, dir: DIR_SE });

		for (var i=0; i<neighbours.length; ++i) {
			var neighbour = neighbours[i],
				hash = grid.hashTile(neighbour.cell.x, neighbour.cell.y);

			// Is this a wall?
			if (neighbour.cell.state === STATE_HIGHLIGHTED) {
				continue;
			}

			// Already searched this tile...is our new path faster?
			if (this.tiles.hasOwnProperty(hash)) {
				var newCost = tile.cost + 1;
				if (newCost < neighbour.cost) {
					neighbour.cost = newCost;
					neighbour.prevDirection = neighbour.dir; // FIXME: is there a point to this???
				}
				
				continue;
			}
			
			var newTile = new Tile(neighbour.cell, neighbour.dir, tile.cost + 1);

			// Is this the end goal?
			if (neighbour.cell == grid.goal) {
				var path = this.buildPath(newTile);
				this.onSolvedPath(path, this.iterations);
				return false;
			}

			// Add this to our open tiles
			this.tiles[hash] = newTile;
			this.openTiles.push(newTile);
		}

		if (!this.openTiles.length) {
			this.onFailedPath(this.iterations);
			return false;
		}

		return true;
	};

};



var Pathfind_A = function(grid){

	// Hashtable of open paths
	// Key: heuristic cost
	// Value: array of paths with the given heuristic
	var paths = {};

	var heuristic = function(tile){
		return Math.abs(tile.cell.x - grid.goal.x) + Math.abs(tile.cell.y - grid.goal.y) + tile.cost;
	};

	var shiftCheapestPath = function(){

		// NOTE: Javascript object hash is done in such a way that if we iterate through the object, it will
		//		be done in order of the key integer value
		for (var cost in paths) {
			var cheapestPaths = paths[cost],
				path = cheapestPaths[0];
			cheapestPaths.splice(0, 1);
			if (cheapestPaths.length == 0) {
				delete paths[cost];
			}
			return path;
		}

		return null;
	};

	this.initialize = function(){
		paths = {};
		
		var start = this.openTiles[0],
			cost = heuristic(start);
		paths[cost] = [start];
	};

	this.iterate = function(){
		++this.iterations;
		var tile = shiftCheapestPath(),
			neighbours = [];

		this.onNewIteration(tile.cell);

		if (tile.cell.nw) neighbours.push({ cell: tile.cell.nw, dir: DIR_NW });
		if (tile.cell.n)  neighbours.push({ cell: tile.cell.n,  dir: DIR_N });
		if (tile.cell.ne) neighbours.push({ cell: tile.cell.ne, dir: DIR_NE });
		if (tile.cell.sw) neighbours.push({ cell: tile.cell.sw, dir: DIR_SW });
		if (tile.cell.s)  neighbours.push({ cell: tile.cell.s,  dir: DIR_S });
		if (tile.cell.se) neighbours.push({ cell: tile.cell.se, dir: DIR_SE });

		for (var i=0; i<neighbours.length; ++i) {
			var neighbour = neighbours[i],
				hash = grid.hashTile(neighbour.cell.x, neighbour.cell.y);

			// Is this a wall?
			if (neighbour.cell.state === STATE_HIGHLIGHTED) {
				continue;
			}

			// Already searched this tile
			if (this.tiles.hasOwnProperty(hash)) {
				continue;
			}
			
			var newTile = new Tile(neighbour.cell, neighbour.dir, tile.cost + 1),
				cost = heuristic(newTile);

			// Is this the end goal?
			if (neighbour.cell == grid.goal) {
				var path = this.buildPath(newTile);
				this.onSolvedPath(path, this.iterations);
				return false;
			}

			// Add this to our open tiles
			this.tiles[hash] = newTile;
			if (!paths.hasOwnProperty(cost)) paths[cost] = [];
			paths[cost].push(newTile);
		}

		if (_.isEmpty(paths)) {
			this.onFailedPath(this.iterations);
			return false;
		}

		return true;
	};

};


var Pathfind_Greedy = function(grid){

	// Hashtable of open paths
	// Key: heuristic cost
	// Value: array of paths with the given heuristic
	var paths = {};

	var heuristic = function(tile){
		return Math.abs(tile.cell.x - grid.goal.x) + Math.abs(tile.cell.y - grid.goal.y);
	};

	var shiftCheapestPath = function(){

		// NOTE: Javascript object hash is done in such a way that if we iterate through the object, it will
		//		be done in order of the key integer value
		for (var cost in paths) {
			var cheapestPaths = paths[cost],
				path = cheapestPaths[0];
			cheapestPaths.splice(0, 1);
			if (cheapestPaths.length == 0) {
				delete paths[cost];
			}
			return path;
		}

		return null;
	};

	this.initialize = function(){
		paths = {};
		
		var start = this.openTiles[0],
			cost = heuristic(start);
		paths[cost] = [start];
	};

	this.iterate = function(){
		++this.iterations;
		var tile = shiftCheapestPath(),
			neighbours = [];

		this.onNewIteration(tile.cell);

		if (tile.cell.nw) neighbours.push({ cell: tile.cell.nw, dir: DIR_NW });
		if (tile.cell.n)  neighbours.push({ cell: tile.cell.n,  dir: DIR_N });
		if (tile.cell.ne) neighbours.push({ cell: tile.cell.ne, dir: DIR_NE });
		if (tile.cell.sw) neighbours.push({ cell: tile.cell.sw, dir: DIR_SW });
		if (tile.cell.s)  neighbours.push({ cell: tile.cell.s,  dir: DIR_S });
		if (tile.cell.se) neighbours.push({ cell: tile.cell.se, dir: DIR_SE });

		for (var i=0; i<neighbours.length; ++i) {
			var neighbour = neighbours[i],
				hash = grid.hashTile(neighbour.cell.x, neighbour.cell.y);

			// Is this a wall?
			if (neighbour.cell.state === STATE_HIGHLIGHTED) {
				continue;
			}

			// Already searched this tile
			if (this.tiles.hasOwnProperty(hash)) {
				continue;
			}
			
			var newTile = new Tile(neighbour.cell, neighbour.dir, tile.cost + 1),
				cost = heuristic(newTile);

			// Is this the end goal?
			if (neighbour.cell == grid.goal) {
				var path = this.buildPath(newTile);
				this.onSolvedPath(path, this.iterations);
				return false;
			}

			// Add this to our open tiles
			this.tiles[hash] = newTile;
			if (!paths.hasOwnProperty(cost)) paths[cost] = [];
			paths[cost].push(newTile);
		}

		if (_.isEmpty(paths)) {
			this.onFailedPath(this.iterations);
			return false;
		}

		return true;
	};

};
