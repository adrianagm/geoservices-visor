/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. 
 * 
 * Edited by Joao Duarte
 * 
 * Edited and adapted by Moisés Arcos <marcos@emergya.com>
 * */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/Feature.js
 */

/**
 * Class: Sapo.Control.DragFeature
 * Move a feature with a drag.  Create a new control with the
 *     <OpenLayers.Control.DragFeature> constructor.
 *
 * Inherits From:
 *  - <OpenLayers.Control>
 */
SiceCAT.Control.SapoDragFeature = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict dragging to a limited set of geometry types,
     *     send a list of strings corresponding to the geometry class names.
     */
    geometryTypes: null,
    
    /**
     * APIProperty: onStart
     * {Function} Define this function if you want to know when a drag starts.
     *     The function should expect to receive two arguments: the feature
     *     that is about to be dragged and the pixel location of the mouse.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that is about to be
     *     dragged.
     * pixel - {<OpenLayers.Pixel>} The pixel location of the mouse.
     */
    onStart: function(feature, pixel) {},

    /**
     * APIProperty: onDrag
     * {Function} Define this function if you want to know about each move of a
     *     feature. The function should expect to receive two arguments: the
     *     feature that is being dragged and the pixel location of the mouse.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that was dragged.
     * pixel - {<OpenLayers.Pixel>} The pixel location of the mouse.
     */
    onDrag: function(feature, pixel) {},

    /**
     * APIProperty: onComplete
     * {Function} Define this function if you want to know when a feature is
     *     done dragging. The function should expect to receive two arguments:
     *     the feature that is being dragged and the pixel location of the
     *     mouse.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that was dragged.
     * pixel - {<OpenLayers.Pixel>} The pixel location of the mouse.
     */
    onComplete: function(feature, pixel) {},
    
    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>}
     */
    feature: null,
	
	/**
	 * Property: features
	 * {Array<OpenLayers.Feature.Vector>} The features that shoud be draggable
	 */
	features: null,
	
	layer: null,
	
	currentLayer: null,
	
	/**
	 * Property: listeners
	 * {Object} Object with the listeners for each event
	 * 
	 * Object structure:
	 * {
	 * 	'evtName': {callback: function, context: Object}
	 * }
	 * 
	 * Supported evtNames:
	 * - dragstart
	 * - dragend
	 * - drag
	 */
	listeners: null,
	
	/**
	 * Property: isDragging
	 * {Boolean} Indicates if the dragging is happening
	 */
	isDragging: false,

    /**
     * Property: dragCallbacks
     * {Object} The functions that are sent to the drag handler for callback.
     */
    dragCallbacks: {},

    /**
     * Property: featureCallbacks
     * {Object} The functions that are sent to the feature handler for callback.
     */
    featureCallbacks: {},
    
    /**
     * Property: lastPixel
     * {<OpenLayers.Pixel>}
     */
    lastPixel: null,

    /**
     * Constructor: OpenLayers.Control.DragFeature
     * Create a new control to drag features.
     *
     * Parameters:
     * features - {Array<OpenLayers.Feature.Vector>} The features that shoud be draggable
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     */
    initialize: function(features, listeners, options) {
		this.features = features;
		this.listeners = listeners;
		
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.handlers = {
            drag: new OpenLayers.Handler.Drag(
                this, OpenLayers.Util.extend({
                    down: this.downFeature,
                    move: this.moveFeature,
                    up: this.upFeature,
                    out: this.cancel,
                    done: this.doneDragging
                }, this.dragCallbacks)
            ),
            feature: new SiceCAT.Control.SapoDragHandler(
                this, OpenLayers.Util.extend({
                    over: this.overFeature,
                    out: this.outFeature
                }, this.featureCallbacks),
                {geometryTypes: this.geometryTypes}
            )
        };
    },
    
    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass
     */
    destroy: function() {
        OpenLayers.Control.prototype.destroy.apply(this, []);
    },

    /**
     * APIMethod: activate
     * Activate the control and the feature handler.
     * 
     * Returns:
     * {Boolean} Successfully activated the control and feature handler.
     */
    activate: function() {
    	var control = this;
    	// Recorrer las features de la capa actual y añadirlas al array de features
    	if(this.currentLayer){
    		Ext.each(this.currentLayer.features, function(item){
    			if(item !=null){
    				control.addFeature(item);
    			}
    		});
    	}
        return (this.handlers.feature.activate() &&
                OpenLayers.Control.prototype.activate.apply(this, arguments));
    },

    /**
     * APIMethod: deactivate
     * Deactivate the control and all handlers.
     * 
     * Returns:
     * {Boolean} Successfully deactivated the control.
     */
    deactivate: function() {
        // the return from the handlers is unimportant in this case
        this.handlers.drag.deactivate();
        this.handlers.feature.deactivate();
        this.feature = null;
        this.features = [];
        this.dragging = false;
        this.lastPixel = null;
        return OpenLayers.Control.prototype.deactivate.apply(this, arguments);
    },

    /**
     * Method: overFeature
     * Called when the feature handler detects a mouse-over on a feature.
     *     This activates the drag handler.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The selected feature.
     */
    overFeature: function(feature) {
        if(!this.handlers.drag.dragging) {
            this.feature = feature;
            this.handlers.drag.activate();
            this.over = true;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "move";
        } else {
            if(this.feature.id == feature.id) {
                this.over = true;
            } else {
                this.over = false;
            }
        }
    },

    /**
     * Method: downFeature
     * Called when the drag handler detects a mouse-down.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} Location of the mouse event.
     */
    downFeature: function(pixel) {
        this.lastPixel = pixel;
    },

    /**
     * Method: moveFeature
     * Called when the drag handler detects a mouse-move.  Also calls the
     *     optional onDrag method.
     * 
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} Location of the mouse event.
     */
    moveFeature: function(pixel) {
		//Check if its the first move, to also fire the dragstart event
		if(this.isDragging == false && this.lastPixel.equals(pixel) == false){
			this.isDragging = true;
			this.onStart(this.feature, pixel);
		}
		
        var res = this.map.getResolution();
        this.feature.geometry.move(res * (pixel.x - this.lastPixel.x),
                                   res * (this.lastPixel.y - pixel.y));
        this.feature.layer.drawFeature(this.feature);
        this.lastPixel = pixel;
        this.onDrag(this.feature, pixel);
    },

    /**
     * Method: upFeature
     * Called when the drag handler detects a mouse-up.  Also calls the
     *     optional onComplete method.
     * 
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} Location of the mouse event.
     */
    upFeature: function(pixel) {
        if(!this.over) {
            this.handlers.drag.deactivate();
            //this.feature = null;
            // TBD replace with CSS classes
            this.map.div.style.cursor = "default";
        } else {
            // the drag handler itself resetted the cursor, so
            // set it back to "move" here
            this.map.div.style.cursor = "move";
        }
    },

    /**
     * Method: doneDragging
     * Called when the drag handler is done dragging.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} The last event pixel location.  If this event
     *     came from a mouseout, this may not be in the map viewport.
     */
    doneDragging: function(pixel) {
        this.onComplete(this.feature, pixel);
    },

    /**
     * Method: outFeature
     * Called when the feature handler detects a mouse-out on a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that the mouse left.
     */
    outFeature: function(feature) {
        if(!this.handlers.drag.dragging) {
            this.over = false;
            this.handlers.drag.deactivate();
            // TBD replace with CSS classes
            this.map.div.style.cursor = "default";
            this.feature = null;
        } else {
            if(this.feature.id == feature.id) {
                this.over = false;
            }
        }
    },
	
	onStart: function(feature, pixel){
		if(this.listeners['dragstart'] != null){
			var context = this.listeners['dragstart'].context != null ? this.listeners['dragstart'].context : this;
			this.listeners['dragstart'].callback.apply(context, [feature, pixel]);
		}
	},
	
	onDrag: function(feature, pixel){
		if(this.listeners['drag'] != null){
			var context = this.listeners['drag'].context != null ? this.listeners['drag'].context : this;
			this.listeners['drag'].callback.apply(context, [feature, pixel]);
		}
	},
	
	onComplete: function(feature, pixel){
		this.isDragging = false;
		
		if(this.listeners['dragend'] != null){
			var context = this.listeners['dragend'].context != null ? this.listeners['dragend'].context : this;
			this.listeners['dragend'].callback.apply(context, [feature, pixel]);
		}
	},
	
	/**
	 * Method: addFeature
	 * Adds a feature as listener
	 */
	addFeature: function(feature){
		this.features.push(feature);
	},
	
	/**
	 * Method: removeFeature
	 * Removes a feature from being listener
	 */
	removeFeature: function(feature){
		var index = -1;
		for(var i = 0; i < this.features.length; ++i){
			if(feature == this.features[i]){
				index = i;
				break;
			}
		}
		if(index != -1){
			this.features.splice(index, 1);
		}
	},
	
	/**
	 * Method: addListeners
	 * Adds listeners to the feature events
	 */
	addListeners: function(newListeners){
		this.listeners = OpenLayers.Util.extend(newListeners, this.listeners);
	},
        
    /**
     * Method: cancel
     * Called when the drag handler detects a mouse-out (from the map viewport).
     */
    cancel: function() {
        this.handlers.drag.deactivate();
        this.over = false;
    },

    /**
     * Method: setMap
     * Set the map property for the control and all handlers.
     *
     * Parameters: 
     * map - {<OpenLayers.Map>} The control's map.
     */
    setMap: function(map) {
        this.handlers.drag.setMap(map);
        this.handlers.feature.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
    
    // Para obtener la capa sobre la que estoy haciendo el drag
    setLayer: function(layer){
    	this.currentLayer = layer;
    	this.layer = layer;
    },

    CLASS_NAME: "SiceCAT.Control.SapoDragFeature"
});