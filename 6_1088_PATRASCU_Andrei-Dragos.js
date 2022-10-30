/**
 * SVG editor project for Multimedia @ ASE.
 * 
 * Disclaimer
 * Wasn't allowed to use typescript, multiple files, or any other best practice idea.
 * 
 * @author Andrei-Dragos Patrascu <andrei.patrascu@codestage.ro>
 * @version 1.0 
 */

const svg = document.getElementById('svg');

let isDragging = false;
var preview = null; // global

// create shapes skeleton object
const shapes = {
    circle: {
        name: 'circle',
        cx: 0,
        cy: 0,
        r: 0,
        fill: 'red'
    },
    rectangle: {
        name: 'rectangle',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        fill: 'red'
    },
    line: {
        name: 'line',
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        stroke: 'red'
    },
    polygon: {
        name: 'polygon',
        points: '',
        fill: 'red'
    },
    polyline: {
        name: 'polyline',
        points: '',
        fill: 'red'
    },
    ellipse: {
        name: 'ellipse',
        cx: 0,
        cy: 0,
        rx: 0,
        ry: 0,
        fill: 'red'
    },
    path: {
        name: 'path',
        d: '',
        fill: 'red',
        stroke: 'red',
        "stroke-width": 1,
        "stroke-dasharray": 5
    },
};

let existingShapes = JSON.parse(localStorage.getItem('shapes')) || [];

Object.defineProperties(existingShapes, {
    push: {
        value: function () {
            arguments[0].id = existingShapes.length + 1;
            console.log(arguments[0]);
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
    fillShapesMenu();

    drawExistingShapes();

    // set width and height of svg
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);

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
    const ctx = canvas.getContext("2d");
    const img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        const canvasdata = canvas.toDataURL("image/" + type);
        const pngimg = '<img src="' + canvasdata + '">';
        const a = document.createElement("a");
        a.download = "image." + type;
        a.href = canvasdata;
        document.body.appendChild(a);
        a.click();
    };
}

const fillShapesMenu = () => {
    const shapesMenu = document.getElementById('shapesMenu');

    for (let shape in shapes) {
        const option = document.createElement('div');
        option.classList.add('option');
        option.innerText = shapes[shape].name;
        option.addEventListener('click', () => {
            drawShape(shape);
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
const drawShape = (shape) => {
    // set cursor to crosshair
    svg.style.cursor = 'crosshair';

    // when clicked
    svg.addEventListener('click', svg.click = (e) => {
        // get mouse position
        const startPosition = getMousePosition(e);

        console.log(isDragging, preview);

        if (!isDragging) {

            isDragging = true;

            // create a preview of the shape
            window.preview = document.createElementNS('http://www.w3.org/2000/svg', shapes[shape].name);
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
            const newShape = shapes[shape];

            // get attributes of window.preview
            const attributes = window.preview.attributes;

            // set attributes to newshape
            for (let i = 0; i < attributes.length; i++) {
                // if attributes[i].name in array of shapeAttributes
                if (Object.keys(shapeAttributes(shape, { width, height, startPosition, endPosition })).includes(attributes[i].name)) {
                    newShape[attributes[i].name] = attributes[i].value;
                }
            }

            // draw shape
            createShape(shape, newShape);

            // add to array
            existingShapes.push(shapes[shape]);

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
const toggleToolbar = (shape) => {
    // get shape position
    const position = shape.getBoundingClientRect();

    // put editMenu above
    editMenu.style.top = `${position.top - 100}px`;
    editMenu.style.left = `${position.left}px`;

    document.getElementById('delete').addEventListener('click', () => {
        // find shape in existingShapes
        const index = existingShapes.findIndex((s) => s.id === shape.id);

        // remove shape
        existingShapes.splice(index, 1);

        // remove shape from svg
        svg.removeChild(shape);

        // remove toolbar
        svg.removeChild(toolbar);
    });

    // move toolbar as shape is moved
    shape.addEventListener('mousemove', shape.mousemove = (e) => {
        const position = shape.getBoundingClientRect();

        editMenu.style.top = `${position.top - 100}px`;
        editMenu.style.left = `${position.left}px`;
    });

};

/**
 * Enable draggable state.
 * 
 * @param {*} shape 
 */
const enableDrag = (shape) => {
    // set cursor to move
    shape.style.cursor = 'move';

    // when dragged with mouse
    shape.addEventListener('mousedown', (e) => {
        // get shape position
        const position = shape.getBoundingClientRect();

        // get mouse position
        const mousePosition = {
            x: e.clientX,
            y: e.clientY
        };

        // get shape position relative to mouse
        const shapePosition = {
            x: position.x - mousePosition.x,
            y: position.y - mousePosition.y
        };

        // when mouse moves
        const mouseMove = (e) => {
            // get mouse position
            const mousePosition = {
                x: e.clientX,
                y: e.clientY
            };

            // set shape position
            shape.setAttribute('transform', `translate(${mousePosition.x + shapePosition.x}, ${mousePosition.y + shapePosition.y})`);
        };

        // when mouse is released
        const mouseUp = () => {
            // remove mousemove event
            document.removeEventListener('mousemove', mouseMove);

            // remove mouseup event
            document.removeEventListener('mouseup', mouseUp);

            // get transform attribute
            const transform = shape.getAttribute('transform');

            // add transform attr to current shape coords in existingShapes
            const index = existingShapes.findIndex((s) => s.id == shape.id);
            //existingShapes[index].transform = transform;

            const proxyShape = createProxy(existingShapes[index]);
            proxyShape.transform = transform;
        };

        // add mousemove event
        document.addEventListener('mousemove', mouseMove);

        // add mouseup event
        document.addEventListener('mouseup', mouseUp);
    });
};

/**
 * 
 * @param {*} shape 
 * @param {*} attrs 
 */
const createShape = (shape, attrs = null) => {
    const newShape = document.createElementNS('http://www.w3.org/2000/svg', shapes[shape].name);

    let attributes = attrs || shapes[shape];

    for (let attr in attributes) {
        newShape.setAttribute(attr, attributes[attr]);
    }

    newShape.addEventListener('click', () => {
        toggleToolbar(newShape);
        enableDrag(newShape);
    });

    svg.appendChild(newShape);
};

/**
 * Draw existing shapes.
 * 
 * @returns {void}
 */
const drawExistingShapes = () => {
    existingShapes.forEach((shape) => {
        createShape(shape.name, shape);
    });
};