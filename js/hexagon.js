var STATE_HIGHLIGHTED = 1,
	STATE_START       = 2,
	STATE_GOAL        = 3,
	STATE_GRAY        = 4,
	STATE_PATH        = 5;

var Hexagon = (function(properties){

	this.x = properties.x;
	this.y = properties.y;
	this.state = 0;
	this.triggering = 0.0;
	this.triggerTime = null;

	
	this.trigger = function(){
		if (this.state === STATE_HIGHLIGHTED) {
			this.state = 0;
			this.triggering = 1.0;
			this.triggerTime = (new Date()).getTime();
		} else {
			if (this.state) {
				return; // Cannot set collision on end/start state
			}

			this.state = STATE_HIGHLIGHTED;
			this.triggering = 1.0;
			this.triggerTime = (new Date()).getTime();
		}
	};

	this.step = function(){
		if (this.triggering > 0.0) {
			var now = (new Date()).getTime(),
				delta = now - this.triggerTime;
			this.triggering -= delta * 0.02;
			this.triggerTime = now;
			
			if (this.triggering < 0.0) {
				this.triggering = 0.0;
			}
		}
	};

	this.nw = null;
	this.n  = null;
	this.ne = null;
	this.sw = null;
	this.s  = null;
	this.se = null;
});
