/*
 * Heavily inspired on the code from
 *
 *   https://kingdesignllc.com/blog/snow-globe-how-we-made-it/
 *
 * Hail to the king!
 */

// Request animation frame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

var canvas = document.getElementById('canvas');

// Make some snow!
function SnowFlakes(canvas) {
	this.canvas = canvas;
	this.context = canvas.getContext('2d');
	this.flakes = [];
	this.snow_pile = [];
	this.snow_curve = [];
	this.middle = Math.floor(canvas.width / 2);
	this.images = [];
	this.image_curves = {
		'narrow_arc': {
			'y_pos': [],
			'x_curve': 310
		},
		'narrow_low_arc': {
			'y_pos': [],
			'x_curve': 364
		},
		'narrow_mid_arc': {
			'y_pos': [],
			'x_curve': 279
		},
		'narrow_high_arc': {
			'y_pos': [],
			'x_curve': 336
		},
		'medium_arc': {
			'y_pos': [],
			'x_curve': 204
		},
		'medium_low_arc': {
			'y_pos': [],
			'x_curve': 284
		},
		'medium_high_arc': {
			'y_pos': [],
			'x_curve': 221
		},
		'wide_arc': {
			'y_pos': [],
			'x_curve': 94
		},
		'wide_low_arc': {
			'y_pos': [],
			'x_curve': 180
		},
		'wide_mid_arc': {
			'y_pos': [],
			'x_curve': 116
		},
		'wide_high_arc': {
			'y_pos': [],
			'x_curve': 164
		}
	};

	// Calculate Y offsets to make the snow pile curve
	for (var s = 0; s < this.canvas.width; s += 1) {
		this.snow_curve.push( Math.floor( Math.pow(s - this.middle, 2) * 0.00055 ) + 140 );
	}

	// Calculate the different curved paths for the images
	for (var s = 0; s < this.canvas.width; s += 1) {
		this.image_curves.narrow_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.05 ) + 200 );
		this.image_curves.narrow_mid_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.02 ) + 300 );
		this.image_curves.narrow_low_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.05 ) + 530 );
		this.image_curves.narrow_high_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.05 ) + 400 );
		this.image_curves.medium_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.01055 ) + 200 );
		this.image_curves.medium_low_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.01555 ) + 400 );
		this.image_curves.medium_high_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.01555 ) + 100 );
		this.image_curves.wide_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.004 ) + 200 );
		this.image_curves.wide_low_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.004 ) + 400 );
		this.image_curves.wide_mid_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.001 ) + 500 );
		this.image_curves.wide_high_arc.y_pos.push( Math.floor( Math.pow(s - this.middle, 2) * 0.01 ) + 75 );
	}
}

// Adds an image object
SnowFlakes.prototype.addImage = function (width, height, x_pos, y_pos, animation_curve, animating_direction, rotate_amount, rotate_change, image_stopped, image_moving) {
	var newImage = {
		width: width,
		height: height,
		x_pos: x_pos,
		y_pos: y_pos,
		x_curve: 0,
		animation_curve: animation_curve,
		animating_image: false,
		animating_direction: animating_direction,
		rotate_amount: rotate_amount,
		rotate_change: rotate_change,
		image_stopped_name: image_stopped,
		image_moving_name: image_moving
	},
	imageResource = new Image(),
	imageResource2 = new Image();

	imageResource.src = image_stopped;
        imageResource.width = width;
        imageResource.height = height;
	newImage.image_stopped = imageResource;

	imageResource2.src = image_moving;
        imageResource2.width = width;
        imageResource2.height = height;
	newImage.image_moving = imageResource2;

	if (animating_direction > 0) {
		newImage.x_curve = this.image_curves[animation_curve].x_curve;
	} else {
		newImage.x_curve = this.canvas.width - this.image_curves[animation_curve].x_curve;
	}

	this.images.push(newImage);
}

// Adds a snow flake object
SnowFlakes.prototype.addFlake = function (width, height, x_pos, y_pos, move_y, move_x, move_x_speed, stop_chance, rotate_amount, front_flake, color) {
	var newFlake = {
		width: 					width,													// Pixel value of width
		height: 				height,													// Pixel value of height
		x_pos:  				x_pos,													// X position to draw flake on canvas
		y_pos:  				y_pos, 													// Y position to drawn flake on cavnas
		move_y: 				move_y,													// Downward movement speed in pixels per tick
		move_x: 				move_x,													// Wander amount in the X direction
		move_x_speed: 			move_x_speed,											// Left and right movement speed in pixels per tick
		move_x_max: 			x_pos + move_x,											// Max movement distance to the right in pixels
		move_x_min: 			x_pos - move_x,											// Max movement distance to the left in pixels
		move_x_dir: 			!Math.floor((Math.random() * 2) + 0), 					// X movement direction - true == right, false == left
		stop_chance: 			stop_chance,											// 1 out of stop_chance for flake to pile at the bottom
		stopped_falling: 		false,													// Flag when flake has stopped falling and piled at the bottom
		returning: 				false,													// Flag when flake is moving upward when globe is shook
		move_y_return_height: 	Math.floor((Math.random() * this.canvas.height) + 0), 	// Y position for flake to travel to when globe is shook
		move_y_return: 			-Math.floor((Math.random() * 2) + 2),					// Y speed in pixels per tick flake travels when globe is shook
		move_x_speed_return: 	Math.floor((Math.random() * 2) + 2),					// X speed in pixesl per tick flake travels when globe is shook
		rotate_amount: 			rotate_amount,											// Roation amount of flake
		rotate_change: 			rotate_amount,											// Rotation change amount per tick
		front_flake: 			front_flake,											// Flag if flake should render in front of images
		color:  				color													// Color of flake
	}
	this.flakes.push(newFlake);
};

// Render all snow flakes
SnowFlakes.prototype.render = function () {
	var num_flakes = this.flakes.length,
		num_images = this.images.length,
		image;

	// Clear the canvas
	this.canvas.width = this.canvas.width;

	// Draw back layer snow flakes
	for (var a = 0; a < num_flakes; a += 1) {
		if (this.flakes[a].front_flake === false) {
			// Flake has stopped falling
			if (this.flakes[a].stopped_falling) {
				this.context.fillStyle = 'rgba(255,255,255,0.5)';
			// Flake is still falling
			} else {
				this.context.fillStyle = this.flakes[a].color;
			}
			this.context.fillRect(this.flakes[a].x_pos, this.flakes[a].y_pos, this.flakes[a].width, this.flakes[a].height);
		}
	}

	// Draw images
	for (var b = 0; b < num_images; b += 1) {
		image = this.images[b];
		x = image.x_pos + (image.width / 2);
		y = image.y_pos + (image.height / 2);

		this.context.translate(x, y);
		this.context.rotate(image.rotate_amount);
		this.context.translate(-x, -y);

		// Draw animating image
		if (image.animating_image === true) {
			this.context.drawImage(image.image_moving, image.x_pos, image.y_pos, image.width, image.height);
		} else {
			this.context.drawImage(image.image_stopped, image.x_pos, image.y_pos, image.width, image.height);
		}

		this.context.translate(x, y);
		this.context.rotate(-image.rotate_amount);
		this.context.translate(-x, -y);

		// Draw resting image
		if (image.animating_image === true) {
			image.rotate_amount += image.rotate_change;
		}
	}

	// Draw front layer snow flakes
	for (var a = 0; a < num_flakes; a += 1) {
		if (this.flakes[a].front_flake === true) {
			// Flake has stopped falling
			if (this.flakes[a].stopped_falling) {
				this.context.fillStyle = 'rgba(255,255,255,0.5)';
			// Flake is still falling
			} else {
				this.context.fillStyle = this.flakes[a].color;
			}
			this.context.fillRect(this.flakes[a].x_pos, this.flakes[a].y_pos, this.flakes[a].width, this.flakes[a].height);
		}
	}
};

// Sets the initial position for all images
SnowFlakes.prototype.initImagePosition = function () {
	var num_images = this.images.length,
		image, new_x, x_pos, y_pos;

	for (var a = 0; a < num_images; a += 1) {
		image = this.images[a],
		new_x = image.x_curve,
		x_pos = new_x - (image.width / 2);
		y_pos = this.image_curves[image.animation_curve].y_pos[new_x] - (image.height / 2);
		this.images[a].x_pos = x_pos;
		this.images[a].y_pos = y_pos;
		this.images[a].x_curve = new_x;
	}
};

// Updates the position of all images
SnowFlakes.prototype.updateImagePosition = function () {
	var num_images = this.images.length,
		image, new_x, x_pos, y_pos;

	for (var a = 0; a < num_images; a += 1) {
		image = this.images[a],
		new_x = image.x_curve + (1 * image.animating_direction),
		x_pos = new_x - (image.width / 2);
		y_pos = this.image_curves[image.animation_curve].y_pos[new_x] - (image.height / 2);

		// Image is moving
		if (image.animating_image === true) {
			if ((image.animating_direction === 1 && new_x < this.canvas.width - this.image_curves[image.animation_curve].x_curve) || (image.animating_direction === -1 && new_x > this.image_curves[image.animation_curve].x_curve) ) {
				this.images[a].x_pos = x_pos;
				this.images[a].y_pos = y_pos;
				this.images[a].x_curve = new_x;
			} else {
				image.animating_image = false;
				image.animating_direction *= -1;
			}
		}
	}
};

// Updates the position of the snow flakes
SnowFlakes.prototype.updateFlakePosition = function () {
	var num_flakes = this.flakes.length,
		max_fall,
		new_y = 0,
		new_x = 0,
		lowest_pile,
		pile_height,
		stop_roll;

	// Update positions of all snow flakes
	for (var a = 0; a < num_flakes; a += 1) {

		// Check if snow flake is still moving
		if (this.flakes[a].stopped_falling === false) {

			// Move flake down
			new_y = this.flakes[a].y_pos + this.flakes[a].move_y;
			max_fall = this.canvas.height - this.snow_curve[Math.floor(this.flakes[a].x_pos)];
			if (new_y > max_fall) {

				// Roll if snow falls again or piles at bottom
				stop_roll = Math.floor((Math.random() * this.flakes[a].stop_chance) + 1);

				// Snow flake stops at bottom
				if (stop_roll === 1) {
					this.flakes[a].stopped_falling = true;

					// Find lowest pile flake lands on
					lowest_pile = this.snow_pile[Math.floor(this.flakes[a].x_pos) + c] || 0;
					for (var c = 0; c < this.flakes[a].width; c += 1) {
						pile_height = (this.snow_pile[Math.floor(this.flakes[a].x_pos) + c] || 0);
						if (lowest_pile > pile_height) {
							lowest_pile = pile_height;
						}
					}

					// Set new y position for snow flake
					this.flakes[a].y_pos = max_fall - this.flakes[a].height - lowest_pile;

					// Force x position to be whole number
					this.flakes[a].x_pos = Math.floor(this.flakes[a].x_pos);

					// Set pile heights
					pile_height = lowest_pile + this.flakes[a].height;
					for (var d = 0; d < this.flakes[a].width; d += 1) {
						if ((this.snow_pile[Math.floor(this.flakes[a].x_pos) + d] || 0) < pile_height) {
							this.snow_pile[Math.floor(this.flakes[a].x_pos) + d] = pile_height;
						}
					}
				} else {
					// Snow flake falls again from top
					this.flakes[a].y_pos = -1 * this.flakes[a].height;
				}
			} else {
				// Update snow flake Y position
				this.flakes[a].y_pos = new_y;
			}

			// Move flakes left and right
			if (this.flakes[a].move_x_dir) {
				// Move right
				new_x = this.flakes[a].x_pos + this.flakes[a].move_x_speed;
				if (new_x > this.flakes[a].move_x_max) {
					this.flakes[a].x_pos -= this.flakes[a].move_x_speed;
					this.flakes[a].move_x_dir = false;
				} else if (new_x > this.canvas.width) {
					this.flakes[a].x_pos = -this.flakes[a].width;
				} else {
					this.flakes[a].x_pos = new_x;
				}
			} else {
				// Move left
				new_x = this.flakes[a].x_pos - this.flakes[a].move_x_speed;
				if (new_x < this.flakes[a].move_x_min) {
					this.flakes[a].x_pos += this.flakes[a].move_x_speed;
					this.flakes[a].move_x_dir = true;
				} else if (new_x < 0) {
					this.flakes[a].x_pos = this.canvas.width + this.flakes[a].width;
				} else {
					this.flakes[a].x_pos = new_x;
				}
			}
		}

		// Check for upward moving snow flakes going out of bounds
		if (this.flakes[a].returning === true && this.flakes[a].y_pos < this.flakes[a].move_y_return_height) {
			this.flakes[a].returning = false;
			this.flakes[a].move_y /= this.flakes[a].move_y_return;
			this.flakes[a].move_x_speed /= this.flakes[a].move_x_speed_return;
		}
	}
};

// Shakes the globe
// Moves snow flakes up and images
// along their predetermined path
SnowFlakes.prototype.shake = function () {
	var num_flakes = this.flakes.length,
		num_images = this.images.length,
		random_sound = Math.floor((Math.random() * 4) + 2),
		image;

	// Move the flakes up
	for (var a = 0; a < num_flakes; a += 1) {
		if (this.flakes[a].returning === false) {
			this.flakes[a].move_y *= this.flakes[a].move_y_return;
			this.flakes[a].move_x_speed *= this.flakes[a].move_x_speed_return;
			this.flakes[a].returning = true;
			this.flakes[a].stopped_falling = false;
			if (this.flakes[a].move_y_return_height < 0) {
				this.flakes[a].move_y_return_height += (this.canvas.height / 2);
			}
			if (this.flakes[a].y_pos < this.flakes[a].move_y_return_height) {
				this.flakes[a].move_y_return_height -= (this.canvas.height / 2);
			}
		}
	}

	// Reset the snow pile
	this.snow_pile = [];

	// Start moving the images
	for (var b = 0; b < num_images; b += 1) {
		image = this.images[b];
		if (image.animating_image === false) {
			image.animating_image = true;
		}
	}
};

// Start the snow
SnowFlakes.prototype.startSnow = function () {
	var that = this;
	this.initImagePosition();
	function animate() {
		requestAnimationFrame(animate);
		that.updateFlakePosition();
		that.updateImagePosition();
		that.render();
	}
	animate();
};


// ----------- ----------- ----------- -----------

var snowShow = new SnowFlakes(canvas),
	total_flakes = 3000,
	flake_width = 5,
	flake_height = 5;

// Reduce the number of snow flakes and
// increase snow flake size on small screens
if ($(window).width() < 1025) {
	total_flakes = 1000;
	flake_width = 10;
	flake_height = 10;
}

// Create the snow flakes
for (var b = 0; b < total_flakes; b += 1) {
	var x_spread = Math.floor((Math.random() * 800) + 1),
		y_spread = Math.floor((Math.random() * 800) + 1),
		width = Math.floor((Math.random() * flake_width) + 1),
		height = Math.floor((Math.random() * flake_height) + 1),
		move_y = Math.floor((Math.random() * 150) + 50) / 100;
		move_x = Math.floor((Math.random() * 200) + 50),
		move_x_speed = Math.floor((Math.random() * 70) + 10) / 100;
		stop_chance = 2, // 1 out of X chance to stop
		rotate_amount = Math.floor((Math.random() * 5) + 5) * Math.PI / 180,
		front_flake = (Math.floor((Math.random() * 6) + 1) === 1) ? true : false,
		opacity = Math.floor((Math.random() * 10) + 1) / 10;

	snowShow.addFlake(width, height, x_spread, y_spread, move_y, move_x, move_x_speed, stop_chance, rotate_amount, front_flake, 'rgba(255, 255, 255, ' + opacity + ')');
}

// Add images
snowShow.addImage(126, 154, 0, 0, 'narrow_mid_arc', -1, 0, -0.07, 'img/klaas.png', 'img/klaas.png');
snowShow.addImage(126, 154, 0, 0, 'narrow_arc', 1, -2, 0.1, 'img/jeroen.png', 'img/jeroen.png');
snowShow.addImage(126, 154, 0, 0, 'narrow_high_arc', -1, 0.7, 0.15, 'img/simon.png', 'img/simon.png');
snowShow.addImage(126, 154, 0, 0, 'wide_arc', -1, 0.7, 0.01, 'img/erik.png', 'img/erik.png');
snowShow.addImage(126, 154, 0, 0, 'wide_high_arc', -1, 0.7, 0.02, 'img/michiel.png', 'img/michiel.png');
snowShow.addImage(126, 154, 0, 0, 'medium_arc', 1, 0.1, 0.05, 'img/karel.png', 'img/karel.png');
snowShow.addImage(126, 154, 0, 0, 'medium_low_arc', -1, -0.7, 0.03, 'img/harm.png', 'img/harm.png');
snowShow.addImage(126, 154, 0, 0, 'medium_high_arc', 1, 0, 0.0087, 'img/marcos.png', 'img/marcos.png');
snowShow.addImage(126, 154, 0, 0, 'wide_low_arc', 1, 0, -0.05, 'img/giorgio.png', 'img/giorgio.png');
snowShow.addImage(126, 154, 0, 0, 'wide_mid_arc', -1, 0, -0.05, 'img/isaura.png', 'img/isaura.png');
snowShow.addImage(126, 154, 0, 0, 'narrow_mid_arc', 1, 0, -0.05, 'img/mehmet.png', 'img/mehmet.png');
snowShow.addImage(126, 154, 0, 0, 'wide_mid_arc', 1, 0, -0.03, 'img/caroline.png', 'img/caroline.png');

// Start the snow globe
snowShow.startSnow();

// Shake the globe on click
canvas.onclick = function() {
	snowShow.shake();
};
document.getElementsByClassName('globe-img')[0].onclick = function() {
	snowShow.shake();
};
