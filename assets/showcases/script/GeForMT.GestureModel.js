/**
 * @namespace
 * GestureModel module
 */
GeForMT.GestureModel = (function(){

    /**
     * All registered gestures.
     * @type Array
     * @default empty list
     * @private
     */
    var _gestures = [];   
    
    /**
     * Template builder module
     * @type GeForMT.TemplateBuilder
     * @default null
     * @private
     */
    var _templateBuilder = null;
    
    /**
     * Constructor of a gesture.
     * @exports Gesture as GeForMT.GestureModel.Gesture
     * @class
     */
     var Gesture=function(){
    
    };
    
    Gesture.prototype = /** @lends GeForMT.GestureModel-Gesture */ {
    
        /**
         * Identifier
         * @type String
         * @default null
         * @public
         */
        identifier: null,
        
        /**
         * Formal expression according to GeForMT grammar.
         * @type String
         * @default null
         * @public
         */
        expr: null,
        
        /**
         * Description
         * @type String
         * @default null
         * @public
         */
        description: null,
        
        /**
         * The event handler function.
         * @type Function
         * @default function
         * @public
         */
        handler: function(){
            //throw an exception or write a warning to console
        },
        /** 
         * Recognize as online or offline gestures.
         * @type Boolean
         * @default false
         */
        online: false,
        
        /**
         * Object model of according to the formal gesture expression.
         * @type GeForMT.GestureModel.GestureDefinition
         * @default null
         */
        model: null
    };
    
    /**
     *
     * Object model of a parsed gesture.
     * @exports GestureObjectModel as GeForMT.GestureModel.GestureObjectModel
     * @class
     */
    function GestureObjectModel(){
    	this.options=[];
    }
    
    GestureObjectModel.prototype = /** @lends GeForMT.GestureModel-GestureObjectModel */ {
        /**
         * Array of possible gestures to be recognized. Array consists objects of type ComplexGesture.
         * @type Array
         * @default null
         */
        options: null,
        /**
         * Add a complex gesture to list of options.
         * @param {GeForMT.GestureModel.ComplexGesture} complexGesture
         */
        addOption: function(complexGesture){
            this.options.push(complexGesture);
        }	
    };
    
    
    /**
     * ComplexGesture
     * @exports ComplexGesture as GeForMT.GestureModel.ComplexGesture
     * @param {String} relation Type of defined relation as String.
     * @class
     */
     function ComplexGesture(relation){
        this.relationType = relation;
		this.composite=[];
		this.compositeChecklist=[];
        
    }
    ComplexGesture.prototype = /** @lends GeForMT.GestureModel-ComplexGesture*/ {
        /**
         * Type of relation. If a relation is not defined relationType is null.
         * @type GeForMT.GeForMT.RELATION_TYPE
         * @default null
         */
        relationType: null,
        
        /**
         * List of atomic gestures.
         * @type Array
         * @default null
         */
        composite: null,
		/**
		 * A multistroke gesture is a sequential composite of two or more unistroke gestures.
		 * The composite list ist greater than one.
		 * @type Boolean
		 * @default false
		 */
		isMultistrokeGesture: false,
		/**
		 * A multitouch gesture that is performed synchronous.
		 * @type Boolean
		 * @default false
		 */
		isSynchronousComposedGesture: false,
		/**
		 * A multitouch gesture that is performed asynchronous.
		 * @type Boolean
		 * @default false
		 */
		isAsynchronousComposedGesture: false
    };
    
    /**
     * AtomicGesture
     * @exports AtomicGesture as GeForMT.GestureModel.AtomicGesture
     * @param  {GeForMT.CONTACT_TYPES|GeForMT.SHAPE_TYPES|GeForMT.VECTOR_TYPES} gestureType Type of gesture to recognize
     * @param  {GeForMT.FUNCTION_TYPE} functionType Type of contact to recognize.
     * @param  {Integer} numberOfContacts Number of contacts to recognize.
     * @param  {Array} templates List of templates representing gesture path. Can be null or an empty Array,  if the gesture is not representable by a path.
     * @class
     */
    function AtomicGesture(gestureType, elementList, functionType, numberOfContacts,templates,rotationInvariant){
        if (typeof numberOfContacts != this.numberOfContacts) {
            this.numberOfContacts = numberOfContacts;
        }
        if (functionType != this.functionType && functionType !== null) {
            this.functionType = functionType;
        }
        if (this.numberOfContacts != numberOfContacts && numberOfContacts !== null) {
            this.numberOfContacts = numberOfContacts;
        }
        if (gestureType != this.gestureType) {
            this.gestureType = gestureType;
        }
        
        if (typeof elementList != 'undefined' && elementList !== null && elementList.length !== 0) {
            this.elementList = elementList;
        }

		if (typeof templates != 'undefined' && templates !== null) {
            this.templates = templates;
			this.isPathGesture=true;
        }

		if (typeof rotationInvariant != 'undefined' && rotationInvariant !== null && rotationInvariant !== this.rotationInvariant) {
            this.rotationInvariant = rotationInvariant;
        }
        
    }
    
    AtomicGesture.prototype = /** @lends GeForMT.GestureModel-AtomicGesture*/ {
        /**
         * Type of function.
         * @type GeForMT.FUNCTION_TYPE
         * @default GeForMT.FUNCTION_TYPE.FINGER
         */
        functionType: GeForMT.FUNCTION_TYPES.FINGER,
        /**
         * Number of contacts.
         * @type Integer
         * @default 1
         */
        numberOfContacts: null,
        /**
         * Type of gesture. Can be a contact gesture, a vector gesture or a shape gesture.
         * @type GeForMT.VECTOR_TYPES|GeForMT.SHAPE_TYPES|GeForMT.CONTACT_TYPES
         * @default null
         */
        gestureType: null,
		/**
		 * True if tendencies has to be regarded in gesture recognition. 
		 * !Not supported in this version!
		 * @type Boolean
		 * @default false
		 */
		regardTendency: false,
		/**
		 * True, if the rotation has to be regarded in recognition process. 
		 * False, if rotation of the gesture doesn't matter.
		 * @type Boolean
		 * @default true
		 */
		rotationInvariant: true,
        /**
         * List of elements that are focused.
         * @type Array
         * @default Array with 'html' as element
         */
        elementList: document.getElementsByTagName("html"),
        /**
         * List of Point objects that represents the gesture path.
         * Exception: If the atomic gesture is type of GeForMT.CONTACT_TYPES it is null.
         * @type Array List with items of type GeForMT.TemplateBuilding.Template
         * @default null
         */
        templates: null,
		/**
		 * Is true, if the atomic gesture can be described by a path.
		 * @type Boolean
		 * @default false
		 */
		isPathGesture: false
    };
    
    
    
    return {
        /**
         * Initialize the model module.
         */
        init: function(){
        
        },
        
        /**
         * Adds a single gesture to data model.
         * @type Gesture
         * @param  {Object} gestureConfig Gesture configuration as object literal.
         * @return {GeForMT.GestureModel.Gesture} Returns the registered gesture. Returns null if registration and model creating failes.
         * @public
         */
        addGesture: function(gestureConfig){
        	var object=gestureConfig;
            if (typeof object != 'undefined') {
                var gesture = new Gesture();
                
                // check object variables and copy to internal gesture object
                if (object.identifier!==null && object.identifier !=="" && typeof object.identifier !== 'undefined') {
                    gesture.identifier = object.identifier;
                }
                else {
					throw  "Exception while initializing the gesture with identifier [" + object.identifier
					+ "]: \n Identifier is '', null or undefined!";
                    //console.debug("No Identifier!");
                }
                if (object.expr !==null && object.expr !=="" && typeof object.expr !== 'undefined') {
                    gesture.expr = object.expr;
                }
                else {
					throw  "Exception while initializing the gesture with identifier [" + object.identifier
					+ "]: \n No expression that defines the gesture!";
                    //console.debug("No expression that defines the gesture!");
                }
                if (object.handler !==null && object.handler !== "" && typeof object.handler !== 'undefined') {
                    gesture.handler = object.handler;
                }
                else {
					throw  "Exception while initializing the gesture with identifier [" + object.identifier
					+ "]: \n No event handler defined for this gesture!";
                    //console.debug("No Event Handler!");
                }
                if (typeof object.description !== 'undefined') {
                    gesture.description = object.description;
                }
                if (typeof object.model !== 'undefined') {
                    gesture.model = object.model;
                }
                else {
                    console.debug("Object model not defined!");
                    return null;
                }
                if (typeof object.online !== 'undefined') {
                    gesture.online = object.online;
                }
                if (typeof object.rawModel !== 'undefined') {
                    gesture.rawModel = object.rawModel;
                }
                
                
                for (var key in _gestures) {
                	//gesture with this identifier exists?
                if (_gestures[key].identifier == gesture.identifier) {
                    _gestures.splice(key,1);
                    break;
                }
            	}
                
                // add gesture to list
                _gestures.push(gesture);
                
                return gesture;
                
            }
            else {
                return null;
            }
            
        },
        /**
         * Remove gesture from gesture model.
         * @param {String} identifier Unique identifier of the gesture that has to be removed.
         */
        removeGesture: function(identifier){
        	for (var key in _gestures) {
                if (_gestures[key].identifier == identifier) {
                    _gestures.splice(key,1);
                    break;
                }
            }
        },
        
        /**
         * Get gesture by identifier.
         * @param identifier {String} Identifier of the gesture.
         * @public
         * @return {GeForMT.GestureModel.Gesture} Returns object Gesture. Return null, if no gesture with the given identifier was found.
         */
        getGestureById: function(identifier){
            var gesture = null;
            for (var key in _gestures) {
                if (_gestures[key].identifier == identifier) {
                    gesture = _gestures[key];
                    break;
                }
            }
            return gesture;
        },
        
        /**
         * Get gestures by formal expression.
         * @param  {String} expr Identifier of the gesture.
         * @return {Array} Returns an array of Gesture objects. Return null, if no gesture with the given identifier was found.
         * @public
         */
        getGesturesByExpr: function(expr){
            var gestures = null;
            for (var key in _gestures) {
                if (_gestures[key].expr == expr) {
                    gestures.push(_gestures[key]);
                    
                }
            }
            return gesture;
        },
        
        /**
         * Returns all gestures in an array.
         * @return {Array} Set of all gestures.
         * @public
         */
        getAllGestures: function(){
            return _gestures;
        },
        
        /**
         * Create object model representing a formalized gesture (type GeForMT.GestureModel.GestureObjectModel).
         */
        createGestureObjectModel: function(){
            return new GestureObjectModel();
        },
        /**
         * Create a complex gesture of type GeForMT.GestureModel.ComplexGesture.
         */
        createComplexGesture: function(relation){
            return new ComplexGesture(relation);
        },
		/**
		 * Create atomic gesture of type GeForMT.GestureModel.AtomicGesture.
		 * @param {Object} atomicGestureType
		 * @param {Object} elementList
		 * @param {Object} functionType
		 * @param {Integer} functionNum
		 * @param {Array} templates
		 */
        createAtomicGesture: function(atomicGestureType, elementList, functionType, functionNum, templates,rotationInvariant){
        
            return new AtomicGesture(atomicGestureType, elementList, functionType, functionNum,templates,rotationInvariant);
        }
        
        
        
    };
    
})();
