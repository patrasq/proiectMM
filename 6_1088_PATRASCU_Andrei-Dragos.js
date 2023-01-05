/**
 * SVG editor project for Multimedia @ ASE.
 * 
 * Disclaimer
 * Wasn't allowed to use typescript, multiple files, or any other best practice idea.
 * 
 * @author Andrei-Dragos Patrascu <andrei.patrascu@codestage.ro>
 * @version 1.0 
 */

/**
 * Main SVG element.
 */
const svg = document.getElementById('svg');

/**
 * Toolbar.
 */
const toolbar = document.getElementById('toolbar');

/**
 * Shapes menu.
 */
const shapesMenu = document.getElementById('shapesMenu');

/**
 * Is drag enabled.
 */
let isDragging = false;

/**
 * Shape preview.
 */
var preview = null; // global

/**
 * @type Array<Shape>|null
 */
let existingShapes = JSON.parse(localStorage.getItem('shapes')) || [];

/**
  * 
  */
let lastId = existingShapes.length > 0 ? existingShapes[existingShapes.length - 1].id : 0;

/**
 * 
 */
const movementBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

/**
 * 
 */
const movementRotate = document.createElementNS('http://www.w3.org/2000/svg', 'text');

/**
 * 
 */
const fillColorPicker = document.getElementById('fillColorPicker');

/**
 * 
 */
const strokeFill = document.getElementById('strokeFill');

/**
 * 
 */
const strokeWidth = document.getElementById('strokeWidth');

/**
 * 
 */
let currentShapeEdit = null;

/**
 * Going to use classes even if it's plain js.
 */
class Shape extends Object {
    constructor(type) {
        super();
        this.type = type;
        
        // find unique id
        this.id = ++lastId;
    }

    /**
     * Serialization.
     * 
     * @returns {string} 
     */
    json() {
        return JSON.stringify(this);
    }
}

class Rectangle extends Shape {
    constructor(x, y, width, height, fill) {
        super('rectangle');

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.fill = fill;
    }
}

class Circle extends Shape {
    constructor(cx, cy, r, fill) {
        super('circle');

        this.cx = cx;
        this.cy = cy;
        this.r = r;
        this.fill = fill;
    }
}

class Ellipse extends Shape {
    constructor(cx, cy, rx, ry, fill) {
        super('ellipse');

        this.cx = cx;
        this.cy = cy;
        this.rx = rx;
        this.ry = ry;
        this.fill = fill;
    }
}

class Line extends Shape {
    constructor(x1, y1, x2, y2, stroke) {
        super('line');
        
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.stroke = stroke;
    }
}

class Polygon extends Shape {
    constructor(points, fill) {
        super('polygon');

        this.points = points;
        this.fill = fill;
    }
}

class Polyline extends Shape {
    constructor(points, stroke) {
        super('polyline');

        this.points = points;
        this.stroke = stroke;
    }
}

class Path extends Shape {
    constructor(d, fill, stroke) {
        super('path');
        
        this.d = d;
        this.fill = fill;
        this.stroke = stroke;
    }
}

class Text extends Shape {
    constructor(x, y, text, fill) {
        super('text');

        this.x = x;
        this.y = y;
        this.text = text;
        this.fill = fill;
    }
}


// create shapes skeleton object
const shapes = {
    circle: new Circle(0, 0, 0, 'black'),
    rectangle: new Rectangle(0, 0, 0, 0, 'black'),
    line: new Line(0, 0, 0, 0, 'black'),
    polygon: new Polygon('', 'black'),
    polyline: new Polyline('', 'black'),
    ellipse: new Ellipse(0, 0, 0, 0, 'black'),
    path: new Path('', 'black', 'black'),
};

Object.defineProperties(existingShapes, {
    push: {
        value: function () {
            Array.prototype.push.apply(this, arguments);
            localStorage.setItem('shapes', JSON.stringify(this));
        }
    },
    pop: {
        value: function () {
            Array.prototype.pop.apply(this, arguments);
            localStorage.setItem('shapes', JSON.stringify(this));
        }
    },
    filter: {
        value: function () {
            Array.prototype.filter.apply(this, arguments);
            localStorage.setItem('shapes', JSON.stringify(this));
        }
    },
    splice: {
        value: function () {
            Array.prototype.splice.apply(this, arguments);
            localStorage.setItem('shapes', JSON.stringify(this));
        }
    }
});

// create proxy for member of existing shapes
const createProxy = (object) => {
    return new Proxy(object, {
        set: function (target, property, value) {
            target[property] = value;
            localStorage.setItem('shapes', JSON.stringify(existingShapes));
            return true;
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // Standardize the SVG element.
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('transform', 'scale(1)');

    svg.addEventListener('click', (e) => {
        if (e.target === svg) {
            toolbar.style.display = 'none';
        }
    });

    document.getElementById('clear').addEventListener('click', () => {
        localStorage.removeItem('shapes');
        location.reload();
    });

    document.getElementById('export_SVG').addEventListener('click', () => {
        exportSVG();
    });

    document.getElementById('export_PNG').addEventListener('click', () => {
        exportImage('png');
    });

    document.getElementById('export_JPEG').addEventListener('click', () => {
        exportImage('jpeg');
    });

    document.getElementById('undo').addEventListener('click', () => {
        undo();
    });

    fillShapesMenu();
    drawExistingShapes();

    document.getElementById('loadScreen').style.display = 'none';
});

/**
 * Undo last action
 * 
 * @returns {void}
 */
const undo = () => {
    if (existingShapes.length > 0) {
        existingShapes.pop();
        clear();
        drawExistingShapes();
    }
}

/**
 * Remove visible svg shapes.
 * 
 * @returns {void}
 */
const clear = () => {
    svg.innerHTML = '';
}

/**
 * Export SVG to file
 * 
 * @returns {void}
 */
const exportSVG = () => {
    const svg = document.getElementById('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    // emulate click on anchor
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = 'svg.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Export svg to raster.
 * 
 * @param {string} type 
 */
 const exportImage = (type) => {
    const svg = document.getElementById('svg');
    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    canvas.setAttribute("width", window.innerWidth);
    canvas.setAttribute("height", window.innerHeight);
    const ctx = canvas.getContext("2d");

    const img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        const canvasdata = canvas.toDataURL("image/" + type);
        const a = document.createElement("a");
        a.download = "image." + type;
        a.href = canvasdata;
        document.body.appendChild(a);
        a.click();
    };
}

const fillShapesMenu = () => {
    for (let shape in shapes) {
        const option = document.createElement('div');
        option.classList.add('option', 'px-2', 'py-1', 'text-left', 'text-black', 'rounded', 'cursor-pointer', 'hover:bg-gray-300');
        option.innerText = shapes[shape].type;
        option.addEventListener('click', () => {
            previewShape(shape);
        });

        shapesMenu.appendChild(option);
    }
};

/**
 * Get mouse position relative to the svg element.
 * 
 * @param {Event} e 
 * @returns {Object}
 */
const getMousePosition = (e) => {
    const CTM = svg.getScreenCTM();
    return {
        x: (e.clientX - CTM.e) / CTM.a,
        y: (e.clientY - CTM.f) / CTM.d
    };
};

/**
 * Return skeleton attributes for shapes.
 * @param {string} shapeType 
 * @param {Object} attrs 
 * @returns {Object|null} response
 */
const shapeAttributes = (shapeType, attrs) => {
    let response = null;
    switch (shapeType) {
        case 'circle':
            if (!attrs.hasOwnProperty('width') || !attrs.startPosition?.hasOwnProperty('x') || !attrs.startPosition?.hasOwnProperty('y')) {
                throw new Error('Invalid attributes object for circle.');
            }

            response = {
                r: Math.abs(attrs.width),
                cx: attrs.startPosition.x,
                cy: attrs.startPosition.y
            };
            
            break;
        case 'rectangle':
            if (!attrs.hasOwnProperty('width') || !attrs.hasOwnProperty('height')) {
                throw new Error('Invalid attributes object for rectangle.');
            }

            response = {
                width: Math.abs(attrs.width),
                height: Math.abs(attrs.height),
            };

            break;
        case 'ellipse':
            if (!attrs.hasOwnProperty('width') || !attrs.hasOwnProperty('height')) {
                throw new Error('Invalid attributes object for ellipse.');
            }

            response = {
                rx: attrs.width,
                ry: attrs.height,
                cx: attrs.startPosition.x,
                cy: attrs.startPosition.y
            };

            break;
        case 'line':
            if (!attrs.hasOwnProperty('width') || !attrs.endPosition?.hasOwnProperty('x') || !attrs.endPosition?.hasOwnProperty('y')) {
                throw new Error('Invalid attributes object for ellipse.');
            }

            response = {
                x2: attrs.endPosition.x,
                y2: attrs.endPosition.y
            };

            break;
        case 'polygon':
            if(!attrs.endPosition?.hasOwnProperty('x') || !attrs.endPosition?.hasOwnProperty('y') || !attrs.startPosition?.hasOwnProperty('x') || !attrs.startPosition?.hasOwnProperty('y')) {
                throw new Error('Invalid attributes object for polygon.');
            }

            response = {
                points: `${attrs.startPosition.x},${attrs.startPosition.y} ${attrs.endPosition.x},${attrs.startPosition.y} ${attrs.endPosition.x},${attrs.endPosition.y} ${attrs.startPosition.x},${attrs.endPosition.y}`
            }
            
            break;
        case 'polyline':
            if(!attrs.endPosition?.hasOwnProperty('x') || !attrs.endPosition?.hasOwnProperty('y') || !attrs.startPosition?.hasOwnProperty('x') || !attrs.startPosition?.hasOwnProperty('y')) {
                throw new Error('Invalid attributes object for polygon.');
            }

            response = {
                points: `${attrs.startPosition.x},${attrs.startPosition.y} ${attrs.endPosition.x},${attrs.startPosition.y} ${attrs.endPosition.x},${attrs.endPosition.y} ${attrs.startPosition.x},${attrs.endPosition.y}`
            };

            break;
        case 'path':

            if(!attrs.endPosition?.hasOwnProperty('x') || !attrs.endPosition?.hasOwnProperty('y') || !attrs.startPosition?.hasOwnProperty('x') || !attrs.startPosition?.hasOwnProperty('y')) {
                throw new Error('Invalid attributes object for polygon.');
            }

            response = {
                d: `M${attrs.startPosition.x},${attrs.startPosition.y} L${attrs.endPosition.x},${attrs.startPosition.y} L${attrs.endPosition.x},${attrs.endPosition.y} L${attrs.startPosition.x},${attrs.endPosition.y} Z`
            };

            break;

    }

    return response;
};

/**
 * Show preview of the shape on our svg.
 * Here the user drags the shape to the desired position.
 * 
 * 
 * @param {Element} shape 
 */
const previewShape = (shape) => {
    // set cursor to crosshair
    svg.style.cursor = 'crosshair';

    // when clicked
    svg.addEventListener('click', svg.click = (e) => {
        // get mouse position
        const startPosition = getMousePosition(e);

        if (!isDragging) {

            isDragging = true;

            // create a preview of the shape
            window.preview = document.createElementNS('http://www.w3.org/2000/svg', shapes[shape].type);
            for (let attr in shapes[shape]) {
                window.preview.setAttribute(attr, shapes[shape][attr]);
            }
            window.preview.setAttribute('fill', 'none');
            window.preview.setAttribute('stroke', 'black');
            window.preview.setAttribute('stroke-width', 2);
            window.preview.setAttribute('stroke-dasharray', '5,5');
            
            // add preview to svg
            svg.appendChild(window.preview);

            // when mouse is moved
            svg.addEventListener('mousemove', svg.mousemove = (e) => {
                // get mouse position
                const endPosition = getMousePosition(e);

                // calculate width and height
                const width = endPosition.x - startPosition.x;
                const height = endPosition.y - startPosition.y;

                // set attributes depending on shape
                let attributes = shapeAttributes(shape, { width, height, startPosition, endPosition });
                for(let attr in attributes) {
                    window.preview.setAttribute(attr, attributes[attr]);
                }

                // remove preview
                svg.removeChild(window.preview);

                // add preview to svg
                svg.appendChild(window.preview);
            });
        } else {
            // remove listeners
            svg.removeEventListener('mousemove', svg.mousemove);
            svg.removeEventListener('click', svg.click); // --> luati si invatati workarounduri

            // get mouse position
            const endPosition = getMousePosition(e);

            // calculate width and height
            const width = endPosition.x - startPosition.x;
            const height = endPosition.y - startPosition.y;

            // set width and height
            window.preview.setAttribute('width', width);
            window.preview.setAttribute('height', height);

            // set cursor to default
            svg.style.cursor = 'default';

            // save shape
            const shapeClass = shapes[shape].constructor;
            let newShape = new shapeClass({ width, height, startPosition, endPosition });

            // get attributes of window.preview
            const attributes = window.preview.attributes;

            // set attributes to newshape
            for (let i = 0; i < attributes.length; i++) {
                // if attributes[i].name in array of shapeAttributes
                if (Object.keys(shapeAttributes(shape, { width, height, startPosition, endPosition })).includes(attributes[i].name)) {
                    newShape[attributes[i].name] = attributes[i].value;
                }
            }

            // add to array
            existingShapes.push(newShape);

            // draw shape
            drawSVGShape(newShape);

            // remove preview
            svg.removeChild(window.preview);

            isDragging = false;
        }
    });
};

/**
 * Draw a toolbar above the shape.
 * 
 * @param {Element} shape
 */
const toggleToolbar = () => {

    toolbar.style.display = 'flex';

    // get shape position
    const position = currentShapeEdit.getBoundingClientRect();

    // put toolbar above
    toolbar.style.top = `${position.top - 100}px`;
    toolbar.style.left = `${position.left}px`;

    // set fillColorPicker to current fill
    fillColorPicker.value = currentShapeEdit.getAttribute('fill');
    strokeFill.value = currentShapeEdit.getAttribute('stroke');
    strokeWidth.value = currentShapeEdit.getAttribute('stroke-width');

    fillColorPicker.addEventListener('change', listenFillChange = (e) => {
        currentShapeEdit.setAttribute('fill', e.target.value);

        // find shape in existingShapes
        const index = existingShapes.findIndex((s) => s.id == currentShapeEdit.id);

        // update existingShapes
        const proxyShape = createProxy(existingShapes[index]);
        proxyShape.fill = e.target.value;
    });

    strokeFill.addEventListener('change', listenStrokeChange = (e) => {
        currentShapeEdit.setAttribute('stroke', e.target.value);

        // find shape in existingShapes
        const index = existingShapes.findIndex((s) => s.id == currentShapeEdit.id);

        // update existingShapes
        const proxyShape = createProxy(existingShapes[index]);
        proxyShape.stroke = e.target.value;
    });

    strokeWidth.addEventListener('change', listenStrokeWidthChange = (e) => {
        console.log(e.target.value);
        currentShapeEdit.setAttribute('stroke-width', e.target.value);

        // find shape in existingShapes
        const index = existingShapes.findIndex((s) => s.id == currentShapeEdit.id);

        // update existingShapes
        const proxyShape = createProxy(existingShapes[index]);
        proxyShape["stroke-width"] = e.target.value;
    });
    
    document.getElementById('delete').addEventListener('click', () => {
        // find shape in existingShapes
        const index = existingShapes.findIndex((s) => s.id === currentShapeEdit.id);

        // remove shape
        existingShapes.splice(index, 1);

        // remove shape from svg
        svg.removeChild(currentShapeEdit);

        // remove toolbar
        toolbar.style.display = 'none';

        // remove movementBox
        movementBox.style.display = 'none';

        // remove movementRotate
        movementRotate.style.display = 'none';
    });

    // move toolbar as shape is moved
    currentShapeEdit.addEventListener('mousemove', currentShapeEdit.mousemove = (e) => {
        const position = currentShapeEdit.getBoundingClientRect();

        toolbar.style.top = `${position.top - 100}px`;
        toolbar.style.left = `${position.left}px`;
    });

};

/**
 * Enable movement rotation.
 * 
 * @param {*} shape 
 */
const enableMovementRotation = (shapeElement, shapeObject, shapePosition) => {
    movementRotate.setAttribute('text-anchor', 'middle');
    movementRotate.setAttribute('dominant-baseline', 'middle');
    movementRotate.setAttribute('font-size', 20);
    movementRotate.setAttribute('fill', 'black');
    movementRotate.innerHTML = '↻';
     // put to bottom right corner
     movementRotate.setAttribute('x', shapePosition.left + shapePosition.width);
     movementRotate.setAttribute('y', shapePosition.top + shapePosition.height);
     // while holding this clicked, enable the possibility to rotate the shape
     movementRotate.addEventListener('mousedown', movementRotate.mousedown = (e) => {
         // get mouse position
         const startPosition = getMousePosition(e);
 
         // get shape position
         const shapePosition = shapeElement.getBoundingClientRect();
 
         // get shape center
         const shapeCenter = {
             x: shapePosition.left + shapePosition.width / 2,
             y: shapePosition.top + shapePosition.height / 2
         };
 
         // get angle between mouse and shape center
         const angle = Math.atan2(startPosition.y - shapeCenter.y, startPosition.x - shapeCenter.x);
         
         // check if shape got transform: rotate
         const transform = shapeElement.getAttribute('transform');
         const deg = transform ? transform.match(/rotate\((\d+)\)/) : null;
         const rotation = deg ? deg[1] : 0;

         // add mousemove listener
         svg.addEventListener('mousemove', svg.mousemove = (e) => {
             // get mouse position
             const endPosition = getMousePosition(e);
 
             // get angle between mouse and shape center
             const newAngle = Math.atan2(endPosition.y - shapeCenter.y, endPosition.x - shapeCenter.x);
 
             // calculate angle difference
             const angleDifference = newAngle - angle;
 
             // calculate new rotation
             const newRotation = rotation - angleDifference * 180 / Math.PI;
 
             // set rotation
             shapeElement.style.transform= `rotate(${newRotation}deg)`;
             movementBox.style.transform= `rotate(${newRotation}deg)`;
 
             // find shape in existingShapes
             const index = existingShapes.findIndex((s) => s.id == shapeElement.getAttribute('id'));
 
             // update existingShapes
             const proxyShape = createProxy(existingShapes[index]);
             proxyShape.transform = `rotate(${newRotation})`;
         });
 
         // add mouseup listener
         svg.addEventListener('mouseup', svg.mouseup = (e) => {
             // remove mousemove listener
             svg.removeEventListener('mousemove', svg.mousemove);
 
             // remove mouseup listener
             svg.removeEventListener('mouseup', svg.mouseup);
         });
    });

    svg.appendChild(movementRotate);
}

/**
 * Enable movement tools.
 * 
 * @param {*} shapeElement 
 * @param {*} shapeObject 
 */
const enableMovementTools = (shapeElement, shapeObject) => {
    if(!shapeObject instanceof Shape) {
        throw new Error('Invalid shape object.');
    }

    // get shape most left and top position
    const shapePosition = shapeElement.getBoundingClientRect();

    // create rect outside shape
    movementBox.setAttribute('x', shapePosition.left);
    movementBox.setAttribute('y', shapePosition.top);
    movementBox.setAttribute('width', shapePosition.width );
    movementBox.setAttribute('height', shapePosition.height );
    movementBox.setAttribute('fill', 'none');
    movementBox.setAttribute('stroke', 'black');
    movementBox.setAttribute('stroke-width', 2);
    movementBox.setAttribute('stroke-dasharray', '5,5');

    // add rect to svg
    svg.appendChild(movementBox);

    enableMovementRotation(shapeElement, shapeObject, shapePosition);
}

/**
 * Enable movement.
 * 
 * @param {*} shapeElement 
 * @param {Shape} shapeObject 
 */
const enableMovement = (shapeElement, shapeObject) => {
    if(!shapeObject instanceof Shape) {
        throw new Error('Invalid shape object.');
    }

    enableMovementTools(shapeElement, shapeObject);

    // set cursor to move
    shapeElement.style.cursor = 'move';

    // get initial position
    const initialPosition = shapeElement.getBoundingClientRect();

    // when dragged with mouse
    shapeElement.addEventListener('mousedown', (e) => {
        // when mouse moves
        const mouseMove = (e) => {
            // get mouse position
            const mousePosition = {
                x: e.clientX,
                y: e.clientY
            };

            // translate shape to mousePosition
            shapeElement.setAttribute('transform', `translate(${mousePosition.x - initialPosition.x}, ${mousePosition.y - initialPosition.y})`);

            // let currentPosition = shapeElement.getBoundingClientRect();

            // // set toolbar position
            // toolbar.style.top = `${currentPosition.y - 100}px`;
            // toolbar.style.left = `${currentPosition.x}px`;

            // move movementBox
            // movementBox.setAttribute('x', currentPosition.x);
            // movementBox.setAttribute('y', currentPosition.y);
        };

        // when mouse is released
        const mouseUp = () => {
            // remove mousemove event
            document.removeEventListener('mousemove', mouseMove);

            // remove mouseup event
            document.removeEventListener('mouseup', mouseUp);

            // get transform attribute
            const transform = shapeElement.getAttribute('transform');

            // add transform attr to current shape coords in existingShapes
            const index = existingShapes.findIndex((s) => s.id == shapeElement.getAttribute('id'));

            // remove rect
            if (svg.contains(movementBox)) {
                svg.removeChild(movementBox);
            }

            if (svg.contains(movementRotate)) {
                svg.removeChild(movementRotate);
            }

            const proxyShape = createProxy(existingShapes[index]);
            proxyShape.transform = transform;
        };

        // add mousemove event
        document.addEventListener('mousemove', mouseMove);

        // add mouseup event
        document.addEventListener('mouseup', mouseUp);
    });
}

/**
 * Enable edit state.
 * 
 * @param {*} shape 
 */
const editShape = (shape) => {
    // Find shape in existingShapes
    const index = existingShapes.findIndex((s) => s.id == shape.getAttribute('id'));

    if (index === -1) {
        throw new Error('Shape not found in existingShapes');
    }

    currentShapeEdit = shape;

    enableMovement(currentShapeEdit, existingShapes[index]);
    toggleToolbar();
};

/**
 * Draw SVG shape.
 * 
 * @param {Shape} shape 
 * @param {Object|null} attrs 
 */
const drawSVGShape = (shape, attrs = null) => {
    if(!shape instanceof Shape) {
        throw new Error('Given shape is not instance of Shape');
    }

    const svgShape = document.createElementNS('http://www.w3.org/2000/svg', shape.type);

    // attrs or get property names and values from shape
    const attributes = attrs ?? Object.keys(shape).reduce((acc, key) => {
        acc[key] = shape[key];
        return acc;
    }, {});

    for (let attr in attributes) {
        svgShape.setAttribute(attr, attributes[attr]);
    }

    svgShape.setAttribute('display', 'inline-block');

    svgShape.addEventListener('click', () => {
        editShape(svgShape);
    });

    svg.appendChild(svgShape);
};

/**
 * Draw existing shapes.
 * 
 * @returns {void}
 */
const drawExistingShapes = () => {
    existingShapes.forEach((shape) => {
        drawSVGShape(shape);
    });
};