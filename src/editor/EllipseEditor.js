/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define */

define(['Editor','CSSUtils'], function(Editor, CSSUtils){
    "use strict";
    
    var _defaults = {
        path: {
            stroke: 'black',
            fill: 'rgba(0,0,0,0)' // tricks transform editor to accept self-drag
        },
        cxUnit: 'px',
        cyUnit: 'px',
        rxUnit: 'px',
        ryUnit: 'px'
    }
    
    function EllipseEditor(target, value, options){
        Editor.apply(this, arguments);
        
        // coordinates for circle: cx, cy, x and y radii and corresponding units
        this.coords = null
        
        // TODO: extend with options
        this.config = _defaults;
        
        this.setup();
        this.applyOffsets();
        this.draw()
        
        this.toggleFreeTransform()
    }
    
    EllipseEditor.prototype = Object.create(Editor.prototype);
    EllipseEditor.prototype.constructor = EllipseEditor

    EllipseEditor.prototype.setup = function(){
        // Sets up: this.holder, this.paper, this.snap, this.offsets
        Editor.prototype.setup.call(this);
        
        this.coords = this.parseShape(this.value);
        
        if (!this.coords){
            this.coords = this.inferShapeFromElement(this.target)
        }
        
        this.shape = this.paper.ellipse().attr(this.config.path);
        
        // TODO: throttle sensibly
        window.addEventListener('resize', this.refresh.bind(this));
    };
    
    EllipseEditor.prototype.refresh = function(){
        this.removeOffsets();
        this.setupOffsets();
        this.applyOffsets();
        this.draw();
    };
    
    /*
        Add the element's offsets to the ellipse center coordinates.
        
        The editor surface covers 100% of the viewport and we're working 
        with absolute units while editing.
        
        @see EllipseEditor.removeOffsets()
    */
    EllipseEditor.prototype.applyOffsets = function(){
        var cx = this.coords.cx + this.offsets.left,
            cy = this.coords.cy + this.offsets.top;
        
        this.coords.cx = cx;
        this.coords.cy = cy;
    };
    
    /*
        Subtract the element's offsets from the ellipse center coordinates.
        
        @see EllipseEditor.applyOffsets()
    */
    EllipseEditor.prototype.removeOffsets = function(){
        var cx = this.coords.cx - this.offsets.left,
            cy = this.coords.cy - this.offsets.top;
        
        this.coords.cx = cx;
        this.coords.cy = cy;
    };
    
    /*
        Parse ellipse string into object with coordinates for center, radii and units.
        Returns undefined if cannot parse shape.
        
        TODO: account for upcoming notation: http://dev.w3.org/csswg/css-shapes/#funcdef-ellipse
        
        @example:
        {
            cx: 0,          // ellipse center x
            cxUnit: 'px',
            cy: 0,          // ellipse center y
            cyUnit: 'px',
            rx: 50,          // ellipse x radius
            rxUnit: '%',
            ry: 50,          // ellipse y radius
            ryUnit: '%'
        }
        
        @param {String} shape CSS ellipse function shape
        
        @return {Object | undefined}
    */
    EllipseEditor.prototype.parseShape = function(shape){
        var element = this.target,
            coords,
            infos,
            args;

        // superficial check for ellipse declaration
        if (typeof shape != 'string' || !/^ellipse\(.*?\)/i.test(shape.trim())){

            // remove editor DOM saffolding
            this.remove();

            throw Error('No ellipse() function definition in provided value');
            return
        }
        
        if (infos = /ellipse\s*\(((\s*[-+0-9.]+[a-z%]*\s*,*\s*){4})\s*\)/i.exec(shape.trim())){
            if (!infos[1]){
                return
            }
            
            args = infos[1].replace(/\s+/g, '').split(',');
            
            // incomplete ellipse definition
            if (args.length < 4){
                return
            }
            
            args = args.map(function(arg, i){
                
                // third argument is the radius. special case for circle & ellipse
                var isHeightRelated = !!(i%2);
                
                return CSSUtils.convertToPixels(arg, element, isHeightRelated);
            })
            
            coords = {
                cx: args[0].value,
                cxUnit: args[0].unit,
                cy: args[1].value,
                cyUnit: args[1].unit,
                rx: args[2].value,
                rxUnit: args[2].unit,
                ry: args[3].value,
                ryUnit: args[3].unit
            }
        } 
        
        return coords
    };
    
    /*
        Attempt to infer the coordinates for an ellipse that fits within the element.
        The center is at the element's center. The x radius is half the element's width.
        The y radius is half the element's height.
        
        @throws Error if the element has no width or height.
        
        @param {HTMLElement} element Element from which to infer the shape.
        @return {Object} coordinates for ellipse. @see EllipseEditor.parseShape()
    */
    EllipseEditor.prototype.inferShapeFromElement = function(element){
        if (!(element instanceof HTMLElement)){
            throw TypeError('inferShapeFromElement() \n Expected HTMLElement, got: ' + typeof element + ' ' + element)
        }
        
        var box = CSSUtils.getContentBoxOf(element);

        if (!box.height || !box.width){
            throw Error('inferShapeFromElement() \n Cannot infer shape from element because it has no width or height')
        }
        
        // TODO: also infer unit values
        return {
            cx: box.width / 2,
            cxUnit: this.config.cxUnit,
            cy: box.height / 2,
            cyUnit: this.config.cyUnit,
            rx: box.width / 2,
            rxUnit: this.config.rxUnit,
            ry: box.height / 2,
            ryUnit: this.config.ryUnit
        }
    };
    
    EllipseEditor.prototype.getCSSValue = function(){
        var cx = this.coords.cx - this.offsets.left,
            cy = this.coords.cy - this.offsets.top,
            rx = this.coords.rx,
            ry = this.coords.ry;
            
        cx = CSSUtils.convertFromPixels(cx, this.coords.cxUnit, this.target, false);
        cy = CSSUtils.convertFromPixels(cy, this.coords.cyUnit, this.target, false);
        rx = CSSUtils.convertFromPixels(rx, this.coords.rxUnit, this.target, true);
        ry = CSSUtils.convertFromPixels(ry, this.coords.ryUnit, this.target, true);
        
        return 'ellipse(' + [cx, cy, rx, ry].join(', ') + ')'
    };
    
    EllipseEditor.prototype.toggleFreeTransform = function(){
        
        // make a clone to avoid compound tranforms
        var coordsClone = (JSON.parse(JSON.stringify(this.coords)));
        
        function _transformPoints(){
            var matrix = this.shapeClone.transform().localMatrix;
            
            this.coords.cx = matrix.x(coordsClone.cx, coordsClone.cy);
            this.coords.cy = matrix.y(coordsClone.cx, coordsClone.cy);
            this.coords.rx = this.transformEditor.attrs.scale.x * coordsClone.rx;
            this.coords.ry = this.transformEditor.attrs.scale.y * coordsClone.ry;
            
            this.draw()
        }
        
        if (this.transformEditor){
            this.shapeClone.remove();
            this.transformEditor.unplug();
            delete this.transformEditor
            
            return;
        }
        
        // using a phantom shape because we already redraw the path by the transformed coordinates.
        // using the same path would result in double transformations for the shape
        this.shapeClone = this.shape.clone().attr('stroke', 'none')
        
        this.transformEditor = Snap.freeTransform(this.shapeClone, {
            draw: ['bbox'],
            drag: ['self','center'],
            keepRatio: ['bboxCorners'],
            rotate: [], // ellipses do not rotate
            scale: ['bboxCorners','bboxSides'],
            distance: '0.6'
        }, _transformPoints.bind(this));
    };
    
    
    EllipseEditor.prototype.draw = function(){
        // draw the ellipse shape
        this.shape.attr(this.coords);
        
        this.trigger('shapechange', this);
    };
    
    return EllipseEditor
})