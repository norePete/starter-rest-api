const sleep = async (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const hoveredNode = createSlice([]);
const parentNode = createSlice([]);
const childNode = createSlice([]);

Array.prototype.indexOf2d = function(item) {
	let arrCoords = this.map(function(a){return a[0] + "|" + a[1]});
	return arrCoords.indexOf(item[0] + "|" + item[1]);
}

function createConnection(parentXY, childXY, refLoc, refThi, refPar, refCon) {
	let locations = refLoc();

	let parentIndex = locations.indexOf2d(parentXY);

	let childIndex = locations.indexOf2d(childXY);

	let thickness = refThi();
	thickness[parentIndex][childIndex] = 9;
	refThi(thickness);

	let connections = refCon();
	connections[parentIndex].push(childIndex);
	refCon(connections);

	let parents = refPar();
	parents[childIndex].push(parentIndex);
	refPar(parents);
}

function appendToColors(ref) {
	let colors = ref();
	const size = colors.length;
	colors.push([[0,0,0]]);
	for (let i = 0; i < size; i++) {
		colors[i].push([0,0,0]);
		colors[size].push([0,0,0]);
	}
	ref(colors);
}
function appendToLocations(ref, x, y) {
	let locations = ref();
	locations.push([x,y]);
	ref(locations);
}
function appendToRadii(ref, size) {
	let radii = ref();
	radii.push(size);
	ref(radii);
}

 async function generateNode(x, y, refLoc, refRad, refRGB, refThi, refPar, refCon) {

	appendToColors(refRGB);
	appendToLocations(refLoc, x, y);
	appendToRadii(refRad, 50);

	let thickness = refThi();
	let lastLine = new Array(thickness.length).fill(0);
	thickness.push(lastLine);
	for (let i = 0; i < thickness.length; i++) {
		thickness[i].push(0)
	}

	let parents = refPar();
	parents.push([]);

	let con = refCon();
	con.push([]);
}

let start = async () => {};
let stop = async () => {};

function createSlice(d) {
	let internalRef = d;
	const ref = (newData) => {
		if (newData === undefined) {
			return internalRef;
		} else {
			internalRef = newData;
		}
		return;
	}
	return ref
}

function toHeight(d) {
	let canvas = document.getElementById('canvas');
	let height = canvas.offsetHeight;
	let calculatedHeight = (height / 100) * d;
	return calculatedHeight;
}

function toWidth(d) {
	let canvas = document.getElementById('canvas');
	let width = canvas.offsetWidth;
	let calculatedWidth = (width / 100) * d;
	return calculatedWidth;
}

function controlPoints(d) {
	let points = {
		"x1": d.x2,
		"y1": d.y1,
		"x2": d.x1,
		"y2": d.y2
	};
	return points;
}

// locations
// radius
// connections
// thickness
function convert(l,r,c, thickness, rgb) {
	let data = [];
	let paths = [];
	for (let i = 0; i < l.length; i++) {
		data.push({"x": l[i][0], "y": l[i][1], "radius": r[i], "color": "black"});
		if (c.length > i) {
			for (let j = 0; j < c[i].length; j++) {
				let red = rgb[i][c[i][j]][0];
				let green = rgb[i][c[i][j]][1];
				let blue = rgb[i][c[i][j]][2];
				paths.push({
					"x1": l[i][0], 
					"y1": l[i][1], 
					"x2": l[c[i][j]][0], 
					"y2": l[c[i][j]][1], 
					"thickness": thickness[i][c[i][j]],
					"color": `rgba(${red},${green},${blue},1)`
				});

			}
		}
	}
	return [data, paths];
}

function incrementExitPaths(parentNode, children, thickness) {
	for (let i = 0; i < children.length; i++) {
		let size = parseInt(thickness[parentNode][children[i]], 10);
		thickness[parentNode][children[i]] = (size + 2) % Number.MAX_SAFE_INTEGER;
	}
	return thickness;
}

function incrementRadius(radius, index) {
	let step = 0.1;
	let size = radius[index];
	radius[index] = (size + step) //% Number.MAX_SAFE_INTEGER;
	return radius;
}

function decrementParents(radius, parents) {
	let step = 0;
	if (parents.length === 0) {
	}
	for (let i = 0; i < parents.length; i++) {
		let size = radius[parents[i]];
		radius[parents[i]] = (size - (Math.floor(step/parents.length))) //% Number.MAX_SAFE_INTEGER;
	}
	if (parents.length === 0) {
	}
	return radius;
}
function findSiblings(excluded, parents, connections) {
	let siblings = [];
	// for each parent
	for (let i = 0; i < parents.length; i++) {
		// get paths
		let destinations = connections[parents[i]];
		for (let k = 0; k < destinations.length; k++) {
			if (destinations[k] !== excluded) {
				siblings.push([parents[i], destinations[k]]);
			}
		}
	}
	return siblings;
}
function decrementSiblings(siblings, thickness) {
	for (let i = 0; i < siblings.length; i++) {
		let size = parseInt(thickness[siblings[i][0]][siblings[i][1]], 10);
		thickness[siblings[i][0]][siblings[i][1]] = (size - 2) % Number.MAX_SAFE_INTEGER;
	}
	return thickness;
}
function forwardPassColors(colors, connections, index) {
	for (let i = 0; i < connections.length; i++) {
		let red = colors[index][connections[i]][0]; 
		let green = colors[index][connections[i]][1]; 
		let blue = colors[index][connections[i]][2]; 

		colors[index][connections[i]][0] = Math.max(red - 3, 0);
		colors[index][connections[i]][1] = Math.min(green + 3, 255);
		colors[index][connections[i]][2] = Math.min(blue + 1, 255);
	}
	return colors;

}

function backPassColors(colors, parents, index) {
	for (let i = 0; i < parents.length; i++) {
		let red = colors[parents[i]][index][0]; 
		let green = colors[parents[i]][index][1]; 
		let blue = colors[parents[i]][index][2]; 

		colors[parents[i]][index][0] = Math.min(red + 3, 255);
		colors[parents[i]][index][1] = Math.max(green - 3, 0);
		colors[parents[i]][index][2] = Math.max(blue - 1, 0);
	}
	return colors;

}

function processEvent(e, radius, connections, thickness, parents, colors) {
	let index = e;

	radius = incrementRadius(radius, index);
	radius = decrementParents(radius, parents[index]);

        let siblings = findSiblings(index, parents[index], connections);
	colors = forwardPassColors(colors, connections[index], index);
	colors = backPassColors(colors, parents[index], index);

	thickness = incrementExitPaths(index, connections[index], thickness);

	thickness = decrementSiblings(siblings, thickness);

	return [radius, connections, thickness, parents, colors];
}

function eventQueue(locations) {
	let e =  Math.floor(Math.random() * (locations.length - 1));
	return e;
}

document.addEventListener("DOMContentLoaded", (event) => {
	console.log("DOM fully loaded and parsed");

	let locations = [
		//[30,30],
		//[35,60]
//		[40,90],
//		[50,10],
//		[60,40],
//		[70,10],
//		[90,50]
	]

	let radius = [
		//50,
		//50
//		10,
//		10,
//		10,
//		10,
//		10	
	]
	let connections = [
		//[],
		//[]
//		[1,2,3],
//		[2],
//		[3,4,5],
//		[4,5],
//		[5],
//		[6],
//		[]
	]
	let colors = [
		//[[0,0,0],[0,0,0]],
		//[[0,0,0],[0,0,0]]
	]
	//let colors = [
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
	//	[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
	//]
	let parents = [
		//[],
		//[]
	//	[0,1],
	//	[2],
	//	[2,3],
	//	[3,4],
	//	[5]
	]
	let thickness = [
		//[0,0],
		//[0,0]
	]
	//let thickness = [
	//	[0,9,9,9,0,0,0],
	//	[0,0,9,0,0,0,0],
	//	[0,0,0,9,9,9,0],
	//	[0,0,0,0,9,9,0],
	//	[0,0,0,0,0,9,0],
	//	[0,0,0,0,0,0,9],
	//	[0,0,0,0,0,0,0],
	//]

	let refLoc = createSlice(locations);
	let refRad = createSlice(radius);
	let refCon = createSlice(connections);
	let refThi = createSlice(thickness);
	let refPar = createSlice(parents);
	let refRGB = createSlice(colors);

	//main.js
	let svgWidth = '100%';
	let svgHeight = '100%';

	const svg = d3
	  .select('.canvas')
	  .append('svg')
	  .attr('width',svgWidth)
	  .attr('height',svgHeight)
	  .style('border', '2px solid gray'); // Chart border

	const chart = svg
	  .append('g')
	  .attr('width', svgWidth)
	  .attr('height', svgHeight)
	//main.js
	const update = (data, thePaths) => {
		console.log(data, thePaths)

		function drawTo(context, d){

		  let cp = controlPoints(d);

		  context.moveTo(toWidth(d.x1),toHeight(d.y1));
		  context.bezierCurveTo(
			  toWidth(cp.x1),
			  toHeight(cp.y1),
			  toWidth(cp.x2),
			  toHeight(cp.y2),
			  toWidth(d.x2),
			  toHeight(d.y2));
		  return context;
		}


		const circles = chart.selectAll('circle').data(data)
		circles
		.transition()
		.duration(250)
		.attr("cx", (d) => { return `${d.x}%`; })
		.attr("cy", (d) => { return `${d.y}%`; })
		.attr("r", (d) => { return d.radius; })
		.style("fill", (d) => { return d.color; })
		.style("opacity", 0.8)
		circles.enter().append('circle')
		.attr("cx", (d) => { return `${d.x}%`; })
		.attr("cy", (d) => { return `${d.y}%`; })
		.attr("r", (d) => { return 50; })
		.style("fill", (d) => { return d.color; })
		.style("opacity", 0.8)
		circles.on("mouseover", function(){
			d3.select(this)
			// add this location to parent hovered
			.style("opacity", 1);
			let x = parseFloat(this.attributes[0].nodeValue)
			let y = parseFloat(this.attributes[1].nodeValue)
			hoveredNode([x,y]);
		})
		.on("mouseout", function(){
			d3.select(this)
			// remove this location to parent hovered
			.style("opacity", 0.8);
			let x = parseFloat(this.attributes[0].nodeValue)
			let y = parseFloat(this.attributes[1].nodeValue)
			hoveredNode([]);
		})
		.on("click", function(){
			d3.select(this)
			let x = parseFloat(this.attributes[0].nodeValue)
			let y = parseFloat(this.attributes[1].nodeValue)

			let parentXY = parentNode();
			let childXY = childNode();

			// if parent node === this, clear all
			
			if (parentXY.length === 0) {
				// no selection
				parentNode([x,y]);
			} else if (parentXY[0] === x && parentXY[1] === y) {
				parentNode([]);
				childNode([]);
			} else if (childXY.length === 0) {
				// parent only selection
				childNode([x,y]);
				createConnection(parentNode(), childNode(), refLoc, refThi, refPar, refCon);
				// clear all selections
				parentNode([]);
				childNode([]);
				update(...convert(refLoc(), refRad(), refCon(), refThi(), refRGB()));
			}
		})
		circles.exit().remove()

		//d3.select(".canvas")
		let path = chart.selectAll('path').data(thePaths)
		path.attr('d', (d) => { return drawTo(d3.path(), d)})
		.style('stroke-width', (d) => { return 4})
		.style('stroke', (d) => { return d.color; })
		.style('fill', 'none');
		path.enter().append('path').attr('d', (d) => { return drawTo(d3.path(), d)})
		.style('stroke-width', 4)
		.style('stroke', (d) => { return d.color; })
		.style('fill', 'none');
		path.exit().remove()
	};


	var wasStopped = false;

	stop = async () => {
		wasStopped = !wasStopped;
	}

	update(...convert(refLoc(), refRad(), refCon(), refThi(), refRGB()));
	start = async () => {
		let M = 0;
		while (!wasStopped) {
			// get current data
			let thick = refThi();
			let loc = refLoc();
			let con = refCon();
			let radius = refRad();
			let parents = refPar();

			// get event 
			//let e = eventQueue(loc);

			//let m = M % 7;

			/**
		      5 0 -- 1 1
			0 -- 2 3
			0 -- 3 1
			

		      1	1 -- 2 1

		      4 2 -- 3 2
		        2 -- 4 1
		        2 -- 5 1

		      3 3 -- 4 2
		        3 -- 5 1

		      3 4 -- 5 3

		      5 5 -- 6 5
		      **/
			// process event 
			for (let a = 0; a < 5; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(0, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			for (let a = 0; a < 3; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(1, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			for (let a = 0; a < 2; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(2, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			for (let a = 0; a < 7; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(3, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			for (let a = 0; a < 1; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(4, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			for (let a = 0; a < 3; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(5, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			for (let a = 0; a < 7; a++) {
				let thick = refThi();
				let loc = refLoc();
				let con = refCon();
				let radius = refRad();
				let parents = refPar();
				let rgb = refRGB();
				let [r, c, t, p, rgb_new] = processEvent(6, radius, con, thick, parents, rgb);
				// save new data
				refCon(c);
				refRad(r);
				refThi(t);
				refPar(p);
				refRGB(rgb_new);
			}
			update(...convert(refLoc(), refRad(), refCon(), refThi(), refRGB()));

			// call update with converted data
			await sleep(50);
		}
		//wasStopped = !wasStopped;
	}

	window.addEventListener("click", async (event) => {
		let current = hoveredNode();
		if (current.length === 0) {
			let svg_ = document.getElementById('canvas');
			let coord = svg_.getBoundingClientRect();
		//	console.log("offsets ", event.offsetX, event.offsetY);
		//	console.log("clients ", event.clientX, event.clientY);
		//	console.log("coords ", coord);
			let Xpos = Math.floor(((event.clientX - coord.left) / (coord.right - coord.left)) * 100);
			let Ypos = Math.floor(((event.clientY - coord.top) / (coord.bottom - coord.top)) * 100);
			await generateNode(Xpos, Ypos, refLoc, refRad, refRGB, refThi, refPar, refCon);
			update(...convert(refLoc(), refRad(), refCon(), refThi(), refRGB()));
		}
	});
});


