const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const shapes = {
    line: {
        name: "line",
        draw: function (ctx, x, y, size, color) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y + size);
            ctx.strokeStyle = color;
            ctx.stroke();
        }
    },
    circle: {
        "name": "circle",
        "draw": function (ctx, x, y, size, color) {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        }
    },
    square: {
        "name": "square",
        "draw": function (ctx, x, y, size, color) {
            ctx.fillStyle = color;
            ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
    },
    triangle: {
        "name": "triangle",
        "draw": function (ctx, x, y, size, color) {
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
};

let currentShape = null;
// get shapes from local storage or empty array
let existingShapes = JSON.parse(localStorage.getItem("shapes")) || [];

Object.defineProperty(existingShapes, "push", {
    value: function () {
        for (var i = 0, n = this.length, l = arguments.length; i < l; i++, n++) {
            this[n] = arguments[i];
            localStorage.setItem("shapes", JSON.stringify(existingShapes));
        }
        return n;
    }
});

/**
 * Initialize the canvas.
 * 
 * @returns {void}
 */
function initializeCanvas() {
    var canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Initialize the background of the page.
 * 
 * @returns {void}
 */
function initializeBackground() {
    // fill canvas with squares grid
    for (var x = 0; x < canvas.width; x += 25) {
        for (var y = 0; y < canvas.height; y += 25) {
            context.fillStyle = (x + y) % 50 ? "#F7F7F7" : "#fff";
            context.fillRect(x, y, 25, 25);
        }
    }
}

/**
 * Initialize shapes menu.
 * 
 * @returns {void}
 * 
 * @throws {Error} If the shape is not supported.  
 */
function initializeShapesMenu() {
    var canvas = document.getElementById("shapes");
    
    // foreach shapes object
    for (var shape in shapes) {
        // create a new canvas
        var canvas = document.createElement("canvas");
        canvas.id = shapes[shape].name;
        canvas.width = 100;
        canvas.height = 100;
        canvas.style = "background: red; border-radius: 20px; padding: 20px; border: 1px solid black; margin: 10px; cursor:pointer;";
        canvas.addEventListener("click", function (event) {
            currentShape = event.target.id;
        });
        
        // draw the shape on the canvas
        var context = canvas.getContext("2d");
        shapes[shape].draw(context, 50, 50, 50, "white");
        
        // add the canvas to the page
        document.getElementById("shapes").appendChild(canvas);
    }
}

/**
 * Initialize existing shapes.
 * 
 * @returns {void}
 */
function initializeExistingShapes() {
    for (var i = 0; i < existingShapes.length; i++) {
        shapes[existingShapes[i].shape].draw(context, existingShapes[i].x, existingShapes[i].y, existingShapes[i].size, existingShapes[i].color);

        // add event listener to the shape
        var shape = document.getElementById(existingShapes[i].shape);
        shape.addEventListener("click", toggleQuickEdit);
    }
}

/**
 * Draw a shape on the canvas.
 * 
 * @returns {void}
 * @throws {Error} If the shape is not supported.
 * 
 */
function drawShapeOnCanvas() {
    if (currentShape === null) {
        return;
    }

    // if the shape is not supported
    if (!shapes[currentShape]) {
        throw new Error("Shape not supported.");
    }
    
    // draw the shape on the canvas at the mouse position 
    shapes[currentShape].draw(context, event.clientX, event.clientY, 50, "black");

    canvas.addEventListener("click", toggleQuickEdit);

    existingShapes.push({
        shape: currentShape,
        x: event.clientX,
        y: event.clientY,
        size: 50,
        color: "black"
    });

    currentShape = null;
}

/**
 * Display quick edit tooltip.
 * 
 * @returns {void}
 */
function toggleQuickEdit() {
    // create quick edit tooltip above the shape
    var quickEdit = document.createElement("div");
    quickEdit.id = "quick-edit";
    quickEdit.style = "position: absolute; top: " + (event.clientY - 100) + "px; left: " + (event.clientX - 100) + "px; background: white; border: 1px solid black; padding: 10px; border-radius: 10px;";
    quickEdit.innerHTML = "<h3>Quick edit</h3>";
    console.log("quickEdit");
}


/**
 * Initialize shape-related features.
 */
function initializeShapes() {
    initializeShapesMenu();
    initializeExistingShapes();
}

document.addEventListener("DOMContentLoaded", function(event) {
    initializeCanvas();
    initializeBackground();
    initializeShapes();

    canvas.addEventListener("click", drawShapeOnCanvas);
});