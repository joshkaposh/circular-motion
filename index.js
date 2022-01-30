const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
const paths = document.getElementById("paths");

const entities = [];
const squares = [];

const mouse = {
	x: null,
	y: null,
};

const drawRect = (x, y, width, height, fillBool) => {
	c.beginPath();
	c.rect(x, y, width, height);
	fillBool ? c.fill() : c.stroke();
	c.closePath();
};

const drawCircle = (x, y, radius, fillBool) => {
	c.beginPath();
	c.arc(x, y, radius, 0, Math.PI * 2, false);
	fillBool ? c.fill() : c.stroke();
	c.closePath();
};

const drawLine = (p1, p2) => {
	c.beginPath();
	c.moveTo(p1.x, p1.y);
	c.lineTo(p2.x, p2.y);
	c.stroke();
	c.closePath();
};

const randIntFromRange = (min, max) => Math.floor(Math.random() * (max - min) + min);

const circleRect = (circle, rect) => {
	// temporary variables to set edges for testing
	let testX = circle.pos.x;
	let testY = circle.pos.y;

	// which edge is closest?
	if (circle.pos.x < rect.pos.x) testX = rect.pos.x;
	// test left edge
	else if (circle.pos.x > rect.pos.x + rect.width) testX = rect.pos.x + rect.width; // right edge
	if (circle.pos.y < rect.pos.y) testY = rect.pos.y;
	// top edge
	else if (circle.pos.y > rect.pos.y + rect.height) testY = rect.pos.y + rect.height; // bottom edge

	// get distance from closest edges
	let distX = circle.pos.x - testX;
	let distY = circle.pos.y - testY;
	let distance = Math.sqrt(distX * distX + distY * distY);

	// if the distance is less than the radius, collision!
	if (distance <= circle.radius) {
		return true;
	}
	return false;
};

canvas.addEventListener("mousemove", (e) => {
	mouse.x = e.x;
	mouse.y = e.y;
});

paths.onchange = function (e) {
	console.log(e.target.value);
	for (let i = 0; i < entities.length; i++) {
		console.log(entities[i]);
		entities[i].path = e.target.value;
	}
};

class Vect2 {
	constructor(x, y, radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
	}
}

class CircularMovement {
	constructor(x, y, radius, radians) {
		this.pos = new Vect2(x, y);
		this.rotatePoint = new Vect2(x, y);
		this.radius = radius;
		this.distFromCenter = randIntFromRange(50, 150);
		this.radians = radians;
		this.velocity = 0.05;
	}

	translateX() {
		this.pos.x = this.rotatePoint.x + Math.cos(this.radians) * this.distFromCenter;
	}

	translateY() {
		this.pos.y = this.rotatePoint.y + Math.sin(this.radians) * this.distFromCenter;
	}
}

class Square extends CircularMovement {
	constructor(x, y, size, color) {
		super(x, y, size, Math.random() * Math.PI * 2);
		this.width = size;
		this.height = size;
		this.color = color;
		this.path = "circle";
	}

	drawLine(p1, p2) {
		c.moveTo(p1.x, p1.y);
		c.lineTo(p2.x, p2.y);
		c.stroke();
	}

	drawPath() {
		let p1, p2;

		c.fillStyle = this.color;
		c.strokeStyle = this.color;
		c.lineWidth = 2;
		drawCircle(this.rotatePoint.x, this.rotatePoint.y, 5, true);

		switch (this.path) {
			case "circle":
				p1 = this.rotatePoint;
				p2 = new Vect2(
					this.rotatePoint.x + Math.cos(this.radians) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(this.radians) * this.distFromCenter
				);
				drawLine(p1, p2);
				drawCircle(this.rotatePoint.x, this.rotatePoint.y, this.distFromCenter, false);
				break;
			case "x-axis":
				c.beginPath();
				p1 = new Vect2(
					this.rotatePoint.x + Math.cos(0) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(0) * this.distFromCenter
				);
				p2 = new Vect2(
					this.rotatePoint.x + Math.cos(Math.PI) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(Math.PI) * this.distFromCenter
				);

				drawLine(this.rotatePoint, p1);
				drawLine(this.rotatePoint, p2);

				break;
			case "y-axis":
				c.beginPath();
				p1 = new Vect2(
					this.rotatePoint.x + Math.cos(Math.PI / 2) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(Math.PI / 2) * this.distFromCenter
				);

				p2 = new Vect2(
					this.rotatePoint.x + Math.cos(3 * (Math.PI / 2)) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(3 * (Math.PI / 2)) * this.distFromCenter
				);

				drawLine(this.rotatePoint, p1);
				drawLine(this.rotatePoint, p2);

				c.closePath();
				break;
		}
	}

	draw(offsetX, offsetY) {
		c.fillStyle = this.color;
		this.drawPath();
		drawRect(offsetX, offsetY, this.width, this.height, true);
	}

	update() {
		this.radians += this.velocity;

		switch (this.path) {
			case "circle":
				this.translateX();
				this.translateY();
				break;
			case "x-axis":
				this.translateX();
				break;
			case "y-axis":
				this.translateY();
				break;
			default:
				this.translateX();
				this.translateY();
				break;
		}

		this.draw(this.pos.x - this.width / 2, this.pos.y - this.height / 2);
	}
}

class Circle extends CircularMovement {
	constructor(x, y, radius, color) {
		super(x, y, radius, Math.random() * Math.PI * 2);
		this.minRadius = radius;
		this.color = color;
		this.overlaps = false;
		this.path = "circle";
	}

	intersects(circle, rect) {
		if (circleRect(circle, rect)) {
			this.overlaps = true;
			return true;
		} else {
			this.overlaps = false;
			return false;
		}
	}

	drawPath() {
		let p1, p2;

		c.fillStyle = this.color;
		c.strokeStyle = this.color;
		c.lineWidth = 2;
		drawCircle(this.rotatePoint.x, this.rotatePoint.y, 5, true);

		switch (this.path) {
			case "circle":
				p1 = this.rotatePoint;
				p2 = new Vect2(
					this.rotatePoint.x + Math.cos(this.radians) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(this.radians) * this.distFromCenter
				);
				drawLine(p1, p2);
				drawCircle(this.rotatePoint.x, this.rotatePoint.y, this.distFromCenter, false);
				break;
			case "x-axis":
				c.beginPath();
				p1 = new Vect2(
					this.rotatePoint.x + Math.cos(0) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(0) * this.distFromCenter
				);
				p2 = new Vect2(
					this.rotatePoint.x + Math.cos(Math.PI) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(Math.PI) * this.distFromCenter
				);

				drawLine(this.rotatePoint, p1);
				drawLine(this.rotatePoint, p2);
				c.closePath();

				break;
			case "y-axis":
				c.beginPath();
				p1 = new Vect2(
					this.rotatePoint.x + Math.cos(Math.PI / 2) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(Math.PI / 2) * this.distFromCenter
				);

				p2 = new Vect2(
					this.rotatePoint.x + Math.cos(3 * (Math.PI / 2)) * this.distFromCenter,
					this.rotatePoint.y + Math.sin(3 * (Math.PI / 2)) * this.distFromCenter
				);

				drawLine(this.rotatePoint, p1);
				drawLine(this.rotatePoint, p2);

				c.closePath();
				break;
		}
	}

	draw() {
		c.fillStyle = this.color;
		drawCircle(this.pos.x, this.pos.y, this.radius, true);
		this.drawPath();
	}

	update() {
		// ? hit detection
		this.radians += this.velocity;

		switch (this.path) {
			case "circle":
				this.translateX();
				this.translateY();
				break;
			case "x-axis":
				this.translateX();
				break;
			case "y-axis":
				this.translateY();
				break;
			default:
				this.translateX();
				this.translateY();
				break;
		}

		this.draw();
	}
}

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.addEventListener("resize", init);

function animate() {
	c.clearRect(0, 0, canvas.width, canvas.height);
	c.fillStyle = "black";
	c.fillRect(0, 0, canvas.width, canvas.height);

	for (let i = 0; i < entities.length; i++) {
		entities[i].update();
	}

	window.requestAnimationFrame(animate);
}

function init() {
	resize();

	entities.length = 0;
	const rotationPoint = new Vect2(canvas.width / 2, canvas.height / 2);

	entities.push(new Circle(rotationPoint.x, rotationPoint.y, randIntFromRange(5, 25), "blue"));
	entities.push(new Square(rotationPoint.x, rotationPoint.y, 50, "red"));

	animate();
}

init();
