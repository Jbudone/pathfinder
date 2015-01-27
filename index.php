<!DOCTYPE html>
<?php
	/****
	 * Pathfinding
	 *
	 **************************/

	/* TODO
	 *
	 *	- algorithms: Hill Climbing
	 *  - test Firefox
	 *  - documentation
	 *  - git & website
	 *  - README
	 *  - Bug: interrupting tests
	 **/
?>
<head>

	<title>Pathfinding</title>

	<!-- Disable the evil cache -->
	<meta http-equiv="cache-control" content="max-age=0" />
	<meta http-equiv="cache-control" content="no-cache" />
	<meta http-equiv="expires" content="0" />
	<meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
	<meta http-equiv="pragma" content="no-cache" />

	<!-- Scripts -->
	<script src="js/libs/jquery-2.1.3.js"></script>
	<script src="js/libs/underscore.js"></script>
	<script src="js/hexagon.js"></script>
	<script src="js/grid.js"></script>
	<script src="js/canvas.js"></script>
	<script src="js/pathfinder.js"></script>
	<script src="js/main.js"></script>

	<!-- Styles -->
	<link rel="stylesheet" href="styles/main.css" />

</head>
<body>

	<div id="options">
		<a href="#" id="hide">Hide</a>
		<div class="section">
			<span class="section-title">Layout</span>
			<div class="details">
				<input type="radio" name="layout" id="layout-fullscreen" checked /><label for="layout-fullscreen" class="option-text">Fullscreen</label><br/>
				<input type="radio" name="layout" id="layout-fixed" /><label for="layout-fixed" class="option-text">Fixed: </label><input type="number" id="layout-fixed-number" min="10" max="10000" value="1000" class="number" /><span class="option-text"> hexagons</span><br/>
			</div>
		</div>
		<div class="section">
			<span class="section-title">Obstacles</span>
			<div class="details">
				<input type="radio" name="obstacle" id="obstacle-none" /><label for="obstacle-none" class="option-text">None</label><br/>
				<input type="radio" name="obstacle" id="obstacle-few" /><label for="obstacle-few" class="option-text">Few</label><br/>
				<input type="radio" name="obstacle" id="obstacle-moderate" checked /><label for="obstacle-moderate" class="option-text">Moderate</label><br/>
				<input type="radio" name="obstacle" id="obstacle-lots" /><label for="obstacle-lots" class="option-text">Lots</label><br/>
				<input type="radio" name="obstacle" id="obstacle-ridiculous" /><label for="obstacle-ridiculous" class="option-text">Ridiculous</label><br/>
				<input type="radio" name="obstacle" id="obstacle-fixed" /><label for="obstacle-fixed" class="option-text">Fixed: </label><input type="number" id="obstacle-fixed-number" min="0" max="80" value="0" class="number" /><span class="option-text">% obstacles</span><br/>
			</div>
		</div>
		<div class="section">
			<span class="section-title">Algorithms</span>
			<div class="details">

				<a href="#" class="alg-option" id="algorithm-bfs"><span class="button"></span><span class="option-text">Breadth First Search</span></a><br/>
				<a href="#" class="alg-option" id="algorithm-dfs"><span class="button"></span><span class="option-text">Depth First Search</span></a><br/>
				<a href="#" class="alg-option" id="algorithm-iterative"><span class="button"></span><span class="option-text">Iterative Deepening</span></a><br/>
				<a href="#" class="alg-option" id="algorithm-A"><span class="button"></span><span class="option-text">A*</span></a><br/>
				<a href="#" class="alg-option" id="algorithm-greedy"><span class="button"></span><span class="option-text">Greedy Seach</span></a><br/>
				<a href="#" class="alg-option" id="algorithm-hillclimbing"><span class="button"></span><span class="option-text">Hill Climbing Seach</span></a><br/>
			</div>
		</div>
		<hr/>
		<div id="algorithm" class="section hidden">
			<span id="result-title" class="section-title"></span>
			<div class="details">
				<span class="option-text">Iterations: </span><span class="option-value" id="result-iterations">0</span><br/>
				<span class="option-text">Nodes Searched: </span><span class="option-value" id="result-nodes">0</span><br/>
				<span class="option-text">Path Length: </span><span class="option-value" id="result-path">0</span><br/>
				<hr/>
				<a href="#" id="begin-test" class="button"></a><span class="option-text">Automate </span><input type="number" id="test-number" min="1" max="1000" value="10" class="number" /><span class="option-text">tests</span><br/>
				<span class="option-text">Tests: </span><span class="option-value" id="result-tests">0</span><br/>
				<span class="option-text">Average Iterations: </span><span class="option-value" id="result-avg-iterations">0</span><br/>
				<span class="option-text">Average Nodes Searched: </span><span class="option-value" id="result-avg-nodes">0</span><br/>
				<span class="option-text">Total Running Time: </span><span class="option-value" id="result-total-time">0</span> seconds<br/>
			</div>
			<hr/>
			<div class="details">
				<a href="#" class="alg_button" id="start">Start Search</a>
				<a href="#" class="alg_button" id="recreate">New Grid</a>
				<a href="#" class="alg_button" id="clear">Clear Walls</a>
			</div>
		</div>
	</div>

	<canvas id="canvas"> </canvas>
</body>
</html>
