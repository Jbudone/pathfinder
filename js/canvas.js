
var Canvas = (function(grid, _settings){

	this.grid = grid;
	this.el   = $('#canvas');
	this.ctx  = this.el[0].getContext('2d');

	var settings = _.defaults(_settings,
			{
				scale: 20,
				lineWidth: 2
			});

	this.el[0].width = settings.width;
	this.el[0].height = settings.height;
	this.ctx.lineWidth = settings.lineWidth;
	this.ctx.strokeStyle = '#AAAAAA';
	this.ctx.fillStyle="red";

	this.redraw = function(){
		
		var hasChanged = false;
		this.ctx.clearRect(0, 0, this.el.width(), this.el.height());

		this.ctx.beginPath();
		var highlighted = [],
			triggering  = [];
		for (var hash in this.grid.tiles) {
			var hexagon = this.grid.tiles[hash];
			if (hexagon.triggering) {
				triggering.push(hexagon);
				hasChanged = true;
				continue;
			} else if (hexagon.state) {
				highlighted.push(hexagon);
				continue;
			}

			this.drawHexagon(hexagon);
		}
		this.ctx.stroke();

		for (var i=0; i<highlighted.length; ++i) {
			this.ctx.beginPath();
			var hexagon = highlighted[i];
			this.drawHexagon(hexagon);
		}
		this.ctx.stroke();

		for (var i=0; i<triggering.length; ++i) {
			this.ctx.beginPath();
			var hexagon = triggering[i];
			this.drawHexagon(hexagon);
		}
		this.ctx.stroke();

		return hasChanged;
	};

	this.drawHexagon = function(hexagon){

		var qLen   = settings.scale * 0.25, // Quarter length of the hexagon
			center = { x: hexagon.x * 3*qLen, y: hexagon.y * 2*qLen };


		if (hexagon.triggering) {
			qLen += 4 * hexagon.triggering;
			hexagon.step();
		}
		this.ctx.moveTo(center.x - 2*qLen, center.y);

		this.ctx.lineTo(center.x - qLen, center.y - 2*qLen);
		this.ctx.lineTo(center.x + qLen, center.y - 2*qLen);
		this.ctx.lineTo(center.x + 2*qLen, center.y);
		this.ctx.lineTo(center.x + qLen, center.y + 2*qLen);
		this.ctx.lineTo(center.x - qLen, center.y + 2*qLen);

		if (hexagon.triggering) {
			this.ctx.closePath();
		} else {
			this.ctx.lineTo(center.x - 2*qLen, center.y);
		}

		if (hexagon.triggering || hexagon.state) {
			this.ctx.save();
			if (hexagon.state === STATE_HIGHLIGHTED) {
				this.ctx.fillStyle = '#FF0000';
			} else if (hexagon.state === STATE_START) {
				this.ctx.fillStyle = '#FF00FF';
			} else if (hexagon.state === STATE_GOAL) {
				this.ctx.fillStyle = '#0000FF';
			} else if (hexagon.state === STATE_GRAY) {
				this.ctx.fillStyle = '#CCCCCC';
			} else if (hexagon.state === STATE_PATH) {
				this.ctx.fillStyle = '#22FF22';
			} else {
				this.ctx.fillStyle = '#FFFFFF';
			}
			this.ctx.fill();
			this.ctx.stroke();
			this.ctx.restore();
		}

	};
});
