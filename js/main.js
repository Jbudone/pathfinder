
var Settings = {

		updateTime: 20,
		doNotRedraw: false,

		grid: {
			width: 45,
			height: 42,
			total: null
		}, 
		canvas: {
			scale: 36
		},
		pathfinding: {
			iterationTime: 10,
			hideTests: false   // Don't draw tests/iterations to canvas (speeds up testing)
		}

},	grid = null,
	canvas = null;

Settings.grid.width = parseInt(window.innerWidth / (0.75 * Settings.canvas.scale));
Settings.grid.height = parseInt(window.innerHeight / (0.5 * Settings.canvas.scale));
Settings.canvas.width = Settings.grid.width * 0.75 * Settings.canvas.scale;
Settings.canvas.height = Settings.grid.height * 0.5 * Settings.canvas.scale;

var changed = true;
var pathfinder = null;
var startup = function(){


	// Initialize the grid
	// NOTE: the grid MAY resize its provided dimensions (in the case that we need to increase the rows to fit
	// the expected total # tiles). Therefore we should set the canvas size immediately after creating the
	// grid
	grid = new Grid(Settings.grid);
	Settings.canvas.width = Settings.grid.width * 0.75 * Settings.canvas.scale;
	Settings.canvas.height = Settings.grid.height * 0.5 * Settings.canvas.scale;

	canvas = new Canvas(grid, Settings.canvas);

};

var shutdown = function(){

	if (grid) {
		delete grid;
	}

	if (canvas) {
		delete canvas;
	}
};

var startEventHandlers = function(){

	var hovering = null,
		holdingTile = null,
		canHold = false,
		_el = $('#canvas');

	var triggerGrid = function(mouse){

		// Chrome: uses mouse.which
		// FF: uses mouse.buttons
		if (mouse.buttons === 0 ||
			(mouse.buttons === undefined && mouse.which == 0)) return; // FIXME: only left mouse
		if (pathfinder) {
			pathfinder.cancel();
		}

		var qLen = 0.25,
			offsetOnGrid = {
				x: 2*qLen,
				y: 2*qLen },
			positionOnCanvas = {
				x: parseInt(mouse.clientX - _el.offset().left),
				y: parseInt(mouse.clientY - _el.offset().top) },
			positionOnGrid = {
				x: parseInt(positionOnCanvas.x / Settings.canvas.scale / (3*qLen) + offsetOnGrid.x),
				y: parseInt(positionOnCanvas.y / Settings.canvas.scale / (2*qLen) + offsetOnGrid.y) }, 
			tileOnGrid = {
				x: positionOnGrid.x,
				y: (positionOnGrid.x & 0x01) ? positionOnGrid.y : (positionOnGrid.y - 1) },
			tileHash = grid.hashTile(tileOnGrid.x, tileOnGrid.y);

		// tileOnGrid provides us with the rectangular coordinates; however a hexagonal grid has 2 hexagons
		// per cell in the rectangular grid, hence this provides us with a guess in where to look for the
		// actual hexagon that we're hovering
		var guesses = { };
		for (var yOffset = -1; yOffset <= 1; ++yOffset) {
			for (var xOffset = -1; xOffset <= 1; ++xOffset) {
				var	y = tileOnGrid.y + yOffset,
					x = tileOnGrid.x + xOffset,
					hash = null;

				if (y < 0 || y >= Settings.height) break;
				if (x < 0 || x >= Settings.width) continue;
				hash = grid.hashTile(tileOnGrid.x + xOffset, tileOnGrid.y + yOffset);
				if (grid.tiles.hasOwnProperty(hash)) {
					guesses[hash] = grid.tiles[hash];
				}
			}
		}

		var closestGuess = null,
			closestDist  = 999999999;
		for (var hash in guesses) {
			var hexagon = guesses[hash],
				distance = 0;

			distance =  Math.pow(positionOnGrid.x - hexagon.x, 2) +
						Math.pow(positionOnGrid.y - hexagon.y, 2);
			if (distance < closestDist) {
				closestGuess = hexagon;
				closestDist = distance;
			}
		}

		if (closestGuess) {
			if (hovering && closestGuess == hovering) {
				return; // Already hovering this
			}

			hovering = closestGuess;
			if (holdingTile) {
				if (!closestGuess.state) {
					closestGuess.state = holdingTile.state;
					holdingTile.state = 0;
					holdingTile = closestGuess;
					changed = true;

					if (holdingTile.state === STATE_START) {
						grid.start = holdingTile;
					} else {
						grid.goal = holdingTile;
					}
				}
			} else {
				if (closestGuess.state === STATE_START) {
					if (canHold) holdingTile = closestGuess;
				} else if (closestGuess.state === STATE_GOAL) {
					if (canHold) holdingTile = closestGuess;
				} else {
					closestGuess.trigger();
					changed = true;
				}
			}
		} else {
			hovering = null;
		}

	};

	$('#canvas').on('mousemove', triggerGrid);
	$('#canvas').on('mousedown', function(mouse){
		canHold = true;
		hovering = null;
		triggerGrid(mouse);
		canHold = false;
	});
	$('#canvas').on('mouseup', function(mouse){
		canHold = false;
		hovering = null;
		holdingTile = null;
	});
};

var update = function(){

	if (changed && !Settings.doNotRedraw) {
		changed = canvas.redraw();
	}

	setTimeout(update, Settings.updateTime);
};


var setupOptions = function(){


	// Hide the options
	$('#hide').on('click', function(){
		var status = $(this).data('showing');
		if (status) {
			$('#options').addClass('hide');
		} else {
			$('#options').removeClass('hide');
		}

		$(this).data('showing', !status);
		return false;
	}).data('showing', true);


	//
	// Change Layout
	//

	var updateLayout = function(){

		changed = false;
		shutdown();
		startup();
		changed = true;
	};

	var updateFixedLayout = function(total){
		var count = total,
			ratio = window.innerWidth / (window.innerHeight * 2),
			height = parseInt(Math.sqrt(count / ratio)) + 1,
			width  = parseInt(2 * ratio * height * 0.85) + 1;

		Settings.grid.total = total;
		Settings.grid.width = width;
		Settings.grid.height = height;
		updateLayout();
	};

	$('#layout-fullscreen').on('change', function(){
		if (this.checked) {
			Settings.grid.width = parseInt(window.innerWidth / (0.75 * Settings.canvas.scale));
			Settings.grid.height = parseInt(window.innerHeight / (0.5 * Settings.canvas.scale));
			Settings.grid.total = null;
			updateLayout();
		}
	});

	$('#layout-fixed').on('change', function(){
		if (this.checked) {
			var total = $('#layout-fixed-number').val();
			if (isNaN(total)) {
				total = 1000;
				$('#layout-fixed-number').val(total);
			}
			updateFixedLayout(total);
		}
	});

	$('#layout-fixed-number').on('input', function(){
		if ($('#layout-fixed')[0].checked) {
			var total = $(this).val();
			if (isNaN(total)) {
				total = 1000;
				$(this).val(total);
			}
			updateFixedLayout(total);
		}
	});



	//
	// Change Obstacles
	//

	$('#obstacle-none').on('change', function(){
		Settings.grid.minObstructionSystems  = 0;
		Settings.grid.maxObstructionSystems  = 0;
		Settings.grid.minObstructionPressure = 0;
		Settings.grid.maxObstructionPressure = 0;
		Settings.grid.obstructionTurnChance  = 0.0;
		Settings.grid.totalObstructionsP = 0;

		updateLayout();
	});

	$('#obstacle-few').on('change', function(){
		Settings.grid.minObstructionSystems  = 2;
		Settings.grid.maxObstructionSystems  = 4;
		Settings.grid.minObstructionPressure = 4;
		Settings.grid.maxObstructionPressure = 8;
		Settings.grid.obstructionTurnChance  = 0.4;
		Settings.grid.totalObstructionsP = null;

		updateLayout();
	});

	$('#obstacle-moderate').on('change', function(){
		Settings.grid.minObstructionSystems  = 3;
		Settings.grid.maxObstructionSystems  = 8;
		Settings.grid.minObstructionPressure = 12;
		Settings.grid.maxObstructionPressure = 20;
		Settings.grid.obstructionTurnChance  = 0.2;
		Settings.grid.totalObstructionsP = null;

		updateLayout();
	});

	$('#obstacle-lots').on('change', function(){
		Settings.grid.minObstructionSystems  = 8;
		Settings.grid.maxObstructionSystems  = 14;
		Settings.grid.minObstructionPressure = 8;
		Settings.grid.maxObstructionPressure = 24;
		Settings.grid.obstructionTurnChance  = 0.4;
		Settings.grid.totalObstructionsP = null;

		updateLayout();
	});

	$('#obstacle-ridiculous').on('change', function(){
		Settings.grid.minObstructionSystems  = 14;
		Settings.grid.maxObstructionSystems  = 24;
		Settings.grid.minObstructionPressure = 45;
		Settings.grid.maxObstructionPressure = 54;
		Settings.grid.obstructionTurnChance  = 0.4;
		Settings.grid.totalObstructionsP = null;

		updateLayout();
	});


	$('#obstacle-fixed').on('change', function(){
		if (this.checked) {
			var total = $('#obstacle-fixed-number').val();
			if (isNaN(total)) {
				total = 50;
				$('#obstacle-fixed-number').val(total);
			}
			Settings.grid.totalObstructionsP = parseInt(total);
			updateLayout();
		}
	});

	$('#obstacle-fixed-number').on('input', function(){
		if ($('#obstacle-fixed')[0].checked) {
			var total = $(this).val();
			if (isNaN(total)) {
				total = 50;
				$(this).val(total);
			}
			Settings.grid.totalObstructionsP = parseInt(total);
			updateLayout();
		}
	});




	//
	// Pathfinding
	//

	var resetPathfind = function(){
		if (pathfinder) {
			pathfinder.cancel();
		}

		$('#algorithm').addClass('hidden');
		$('#result-title').text('');
		$('#result-iterations').text('');
		$('#result-path').text('');
		$('#result-tests').text('');
		$('#result-avg-iterations').text('');

	};

	var pathProperties = null;
	var setupPathfind = function(properties){

		pathProperties = properties;
		pathfinder = new Pathfinder(grid, properties.scheme, Settings.pathfinding);

		pathfinder.onNewIteration = function(tile){
			if (tile.state == 0) {
				tile.state = STATE_GRAY;
				changed = true;
			}
		};

		pathfinder.onClearTile = function(tile){
			if (tile.state === STATE_GRAY ||
				tile.state === STATE_PATH) {

				tile.state = 0;
				changed = true;
			}
		};

		pathfinder.onSolvedPath = function(path, iterations, nodes){
			console.log("Solved path in "+iterations+" iterations");

			for (var i=0; i<path.length; ++i) {
				var tile = path[i];
				if (tile.state === STATE_GRAY) {
					tile.state = STATE_PATH;
				}
			}

			$('#result-iterations').text(iterations);
			$('#result-nodes').text(nodes);
			$('#result-path').removeClass('failed-path').text(path.length);

			changed = true;
		};

		pathfinder.onFailedPath = function(iterations, nodes){
			console.log("Failed path in "+iterations+" iterations");

			$('#result-iterations').text(iterations);
			$('#result-nodes').text(nodes);
			$('#result-path').addClass('failed-path').text('Failed');
		};



		$('#algorithm').removeClass('hidden');
		$('#result-title').text(properties.title);

	};
	var recreate = function(){
		resetPathfind();

		grid = new Grid(Settings.grid);
		Settings.canvas.width = Settings.grid.width * 0.75 * Settings.canvas.scale;
		Settings.canvas.height = Settings.grid.height * 0.5 * Settings.canvas.scale;

		canvas = new Canvas(grid, Settings.canvas);

		setupPathfind(pathProperties);
		changed = true;
	};


	$('#start').click(function(){
		pathfinder.cancel();
		pathfinder.solve();
		return false;
	});

	$('#recreate').click(function(){
		recreate();
		return false;
	});

	$('#clear').click(function(){
		pathfinder.cancel();

		for (var tileHash in grid.tiles) {
			var tile = grid.tiles[tileHash];
			if (tile.state == STATE_HIGHLIGHTED) tile.state = 0;
		}
		changed = true;

		return false;
	});

	$('#begin-test').click(function(){
		var nTests        = parseInt($('#test-number').val()),
			avgIts        = 0,
			avgNodes      = 0,
			totIts        = 0,
			totNodes      = 0,
			finishedTests = 0,
			solvedTests   = 0,
			iterTime      = Settings.pathfinding.iterationTime,
			startTime     = (new Date()).getTime();

		Settings.pathfinding.iterationTime = 0;
		Settings.doNotRedraw = Settings.pathfinding.hideTests;
		var onCurTestSolved = null,
			onCurTestFailed = null,
			nextTest = function(){

				recreate();
				onCurTestSolved = pathfinder.onSolvedPath;
				onCurTestFailed = pathfinder.onFailedPath;
				reportTotals();

				pathfinder.onSolvedPath = function(path, iterations, nodes){
					onCurTestSolved(path, iterations);
					++finishedTests;
					totIts += iterations;
					avgIts = totIts / finishedTests;
					totNodes += nodes;
					avgNodes = totNodes / finishedTests;
					++solvedTests;

					if (finishedTests < nTests) {
						nextTest();
					} else {
						reportTotals();
						finished();
					}
				};

				pathfinder.onFailedPath = function(iterations, nodes){
					onCurTestFailed(iterations);
					++finishedTests;
					totIts += iterations;
					avgIts = totIts / finishedTests;
					totNodes += nodes;
					avgNodes = totNodes / finishedTests;

					if (finishedTests < nTests) {
						nextTest();
					} else {
						reportTotals();
						finished();
					}
				};

				pathfinder.solve();
			},
			reportTotals = function(){
				$('#result-tests').text(solvedTests + '/' + finishedTests);
				$('#result-avg-iterations').text(parseInt(avgIts));
				$('#result-avg-nodes').text(parseInt(avgNodes));
			},
			finished = function(){
				Settings.pathfinding.iterationTime = iterTime;
				Settings.doNotRedraw = false;
				var finishedTime = (new Date()).getTime(),
					totalTime = Math.round((finishedTime - startTime)/1000);
				$('#result-total-time').text(totalTime);
			};

		reportTotals();
		nextTest();

		return false;
	});

	$('#algorithm-bfs').click(function(){
		resetPathfind();
		setupPathfind({
			title: "Breadth First Search",
			scheme: Pathfind_BFS
		});
		return false;
	});

	$('#algorithm-dfs').click(function(){
		resetPathfind();
		setupPathfind({
			title: "Depth First Search",
			scheme: Pathfind_DFS
		});
		return false;
	});

	$('#algorithm-iterative').click(function(){
		resetPathfind();
		setupPathfind({
			title: "Iterative Deepening Search",
			scheme: Pathfind_ID
		});
		return false;
	});

	$('#algorithm-A').click(function(){
		resetPathfind();
		setupPathfind({
			title: "A* Search",
			scheme: Pathfind_A
		});
		return false;
	});

	$('#algorithm-greedy').click(function(){
		resetPathfind();
		setupPathfind({
			title: "Greedy Search",
			scheme: Pathfind_Greedy
		});
		return false;
	});

	$('#algorithm-hillclimbing').click(function(){
		resetPathfind();
		setupPathfind({
			title: "Hill Climbing Search",
			scheme: Pathfind_Hillclimbing
		});
		return false;
	});
	

};


$(document).ready(function(){
	setupOptions();
	startup();
	startEventHandlers();
	update();
});
