var canvas = null;
var ctx = null;
var gridBlocks = [];
var blockSize = 30;
var shipList_dragItem = null;
var shipLists = []; // Ships in shipList
var gridShips = []; // Ships on grid
var deployBlocks = [];
var selectedShip = null;
var mouseIsDown = false;

$(function() {
	init();
});

function getCanvasWidth() {
	return $("#bc").width();
}

function init() {
	canvas = document.getElementById('bc');
	ctx = canvas.getContext("2d");
	var width = $(document).width();
	var height = $(document).height();
	
	var smallestDimension = (width <= height ? width : height);

	canvas.setAttribute("width", smallestDimension / 2);
	canvas.setAttribute("height", smallestDimension / 2);
	
	$("#bc").css({'height': smallestDimension / 2 + "px"});
	$("#bc").css({'width': smallestDimension / 2 + "px"});
	
	$("#shipList").css({'height': $("#bc").height()});

	drawGrid();

	$(function() {
    	$( "#shipList > *" ).draggable({
    		revert: true,
    		opacity: 0.99,
    		drag: function(event, ui) { shipList_drag(ui); },
    	});
 	});

 	$("#shipList > *").mouseup(function(event){
 		shipList_mouseup();
 	});

 	$(document).mousedown(function(event){
    	mouseDown(event.clientX, event.clientY);
	});

	$(document).mousemove(function(event){
    	mouseMove(event.clientX, event.clientY);
	});

	$(document).mouseup(function(event){
    	mouseUp(event.clientX, event.clientY);
	});


	mapShipListItems(); // construct a list of ship objects from shipList div
}

function mapShipListItems() {
	shipList = [];
	$("#shipList > img").each(function(index, obj){
		var ship = new Ship(0);
		ship.orientation = "horizontal";
		ship.imgId = obj.id;
		switch(obj.alt) {
			case 'small':
				ship.blocks = new Array(2);
				break;
			case 'medium1':
				ship.blocks = new Array(3);
				break;
			case 'medium2':
				ship.blocks = new Array(4);
				break;
			case 'large':
				ship.blocks = new Array(5);
				break;
		}
		shipList[shipList.length] = ship;
	});
}

function drawGridShips(){
	drawGrid();
	for(var i=0;i<gridShips.length;i++){
		var img = document.getElementById(gridShips[i].imgId);
		ctx.drawImage(img, gridShips[i].x,gridShips[i].y);
	}
}

function shipList_drag(uiItem) {
	shipList_dragItem = shipList.filter(function(item){return item.imgId == uiItem.helper.context.id;})[0];
	$('body').css('cursor', 'pointer');
}

function removeShipFromGrid(ship){
	for(var i=0;i<gridShips.length;i++){
		if(gridShips[i].id == ship.id) {
			gridShips.splice(i, 1);
			drawGridShips(); // update the grid
		}
	}
}

function addShipToGrid(ship){
	ship.id = guid();
	gridShips[gridShips.length] = ship;
	drawGridShips();
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function shipList_mouseup() {

	if(shipList_dragItem != null && deployBlocks != null){
		var startShipBlock = deployBlocks.sort(function(a,b){return (a.x - b.x);})[0]; // find the block with the left most coordinates
		shipList_dragItem.x = startShipBlock.x;
		shipList_dragItem.y = startShipBlock.y;
		shipList_dragItem.blocks = deployBlocks;
		addShipToGrid(shipList_dragItem);
		
		$("#" + shipList_dragItem.imgId.toString()).hide();
		$("#" + shipList_dragItem.imgId.toString() + "br").hide();
		deployBlocks = null;
	}
	else{
		$('#shipList > *').css({'border':'1px solid #000'});
		drawGridShips();
	}
	shipList_dragItem = null;
	$('body').css('cursor', 'default');
}


function shipList_select(shipImg) {
	$('#shipList > *').css({'border':'1px solid #000'});
	$("#" + shipImg).css({'border':'1px solid #00FF00'});
}

function mouseUp(x, y) {
	mouseIsDown = false;
	if (shipList_dragItem != null) {
		shipList_dragItem.blocks = deployBlocks;
		addShipToGrid(shipList_dragItem);
		shipList_dragItem = null;
		deployBlocks = null;
	}
}

function mouseDown(x, y) {
	mouseIsDown = true;
	if (selectedShip != null) { // remove the ship from the grid if it's selected (to redeploy?)
		removeShipFromGrid(selectedShip);
	}

}

function drawDeployableShip(x, y, blocksAmount){
	var drawBlocks = getDeployableShipBlocks(x, y, blocksAmount, true); // Find the list of blocks we can draw to deploy the ship on the grid. 
	if (drawBlocks != null){  
		drawGridShips();
		for(var i=0;i<drawBlocks.length;i++){
			ctx.beginPath();
			ctx.fillStyle="rgba(102, 255, 51, 0.4)";
			ctx.fillRect(drawBlocks[i].x, drawBlocks[i].y, drawBlocks[i].width, drawBlocks[i].height);
			ctx.stroke();	
		}
	}
	deployBlocks = drawBlocks;
}

function mouseMove(x, y) {
	
	var x = x - canvas.getBoundingClientRect().left;
	var y = y - canvas.getBoundingClientRect().top;

	if (shipList_dragItem != null) {
		var block = getIntersectingBlock(x, y); 
		if (block != null){
			shipList_dragItem.x = block.x;
			shipList_dragItem.y = block.y;
			drawDeployableShip(x, y, shipList_dragItem.blocks.length);
		}
		else { 
			deployBlocks = null;
			drawGridShips(); 
		}
	}
	else{
		//allow the user to reshuffle existing ships
		var block = getIntersectingBlock(x, y); 
		if (block != null){
			if (mouseIsDown && selectedShip != null){ 
				shipList_dragItem = selectedShip;
				drawDeployableShip(block.x, block.y, selectedShip.blocks.length);
			}
			else {
				var shipBlock = getShipBlock(block.x, block.y);
				if (shipBlock != null){
					selectedShip = shipBlock;
					drawGridShips();
					ctx.strokeStyle = "rgba(102, 255, 51, 0.99)";
					ctx.strokeRect(shipBlock.x, shipBlock.y, shipBlock.width(), shipBlock.height());
					$('body').css('cursor', 'pointer');
					shipList_dragItem = null;
				}
				else{
					selectedShip = null;
					$('body').css('cursor', 'default');	
					shipList_dragItem = null;
					drawGridShips();
				}
			}
		}
	}

}

function getShipBlock(x, y){
	for(var i=0;i<gridShips.length;i++){
		for(var j=0;j<gridShips[i].blocks.length;j++){
			if (x == gridShips[i].blocks[j].x && y == gridShips[i].blocks[j].y){
				return gridShips[i];
			}	
		}
		
	}
	return null;
}

function getDeployableShipBlocks(startX, startY, blocks, deployHorizontally){
	// Try to deploy all blocks to the left or top. Failing that, deploy them to the right or bottom. 
	var currentBlock = new GridBlock(startX, startY, blockSize, blockSize);
	var deploymentBlocks = []
	if (deployHorizontally) {
		var moveLeft = true;
		for(var i=0;i<blocks;i++){
			var intersectingBlock = getIntersectingBlock(currentBlock.x, currentBlock.y);
			if (intersectingBlock == null ) { 
				moveLeft = false;
				currentBlock.x += blockSize; 
				i = 0;
			}
			else if (getShipBlock(intersectingBlock.x, intersectingBlock.y) == null) { // Don't allow a drop on another ship
				deploymentBlocks[deploymentBlocks.length] = intersectingBlock;
			}
			if (moveLeft) { 
				currentBlock.x -= blockSize; 
			}
			else {
				currentBlock.x += blockSize;
			}
		}
	}
	else {

	}
	
	if (deploymentBlocks.length < blocks) { // If we were only able to find less deployable blocks than required, fail entirely.
		deploymentBlocks = null;
	}
	return deploymentBlocks;
}

function getIntersectingBlock(x, y) {
	for(var i=0;i<gridBlocks.length;i++) {
		var block = gridBlocks[i];
		if ( (x >= block.x && x <= (block.x + block.width)) && (y >= block.y && y <= (block.y + block.height)) ){
			return block;
		}
	}
}

function drawGrid() {

	var bcWidth = getCanvasWidth();
	ctx.clearRect(0, 0, bcWidth, bcWidth);
	var boundaryBuffer = ((bcWidth / blockSize) * 0.5); // to make sure we always draw the last row of blocks

	var bgImage = document.getElementById('background');
	ctx.drawImage(bgImage, 1, 1, bcWidth, bcWidth);

	gridBlocks = [];
	
	var done = false;
	var startX = 0.5;
	var startY = 0.5;
	
	// draw blocks horizontally until we need to drop a row. stop when we've reached both bounds
	while(!done) {
		ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
		ctx.strokeRect(startX, startY, blockSize, blockSize);
		gridBlocks[gridBlocks.length] = new GridBlock(startX, startY, blockSize, blockSize);

		startX += blockSize;
		if ( (startX + blockSize) - 5 > bcWidth ) {
			startY += blockSize;
			startX = 0.5;
		}

		if ( (startY + blockSize) - 5 > bcWidth )
			done = true;

	}

	

}	

function GridBlock(x, y, width, height){
   this.x = x;
   this.y = y;
   this.width = width;
   this.height = height;
}

function Ship(blocks) {
	this.blocks = blocks;
	
}

Ship.prototype.width = function() {
	return (this.orientation == "horizontal" ? this.blocks.length * blockSize : blockSize);
}
Ship.prototype.height = function() {
	return (this.orientation == "vertical" ? this.blocks.length * blockSize : blockSize);
}