/**
 * @fileOverview This file has functions related to documenting JavaScript.
 * @author <a href="mailto:dana.henkens@gmail.com">Dana Henkens</a>
 * @version 1.0
 */
/**
 * @namespace Main module and Namespace declaration
 * @requires GeForMT.GestureModel
 * @requires GeForMT.Parser
 * @requires GeForMT.SelectorEngine
 * @requires GeForMT.Observation
 * @requires GeForMT.GestureRecognizer
 * @requires GeForMT.TemplateBuilder
 * @requires GeForMT.Types
 * @requires Sizzle
 * @requires PEG.GeneratedGeForMTParser
 */
var GeForMT = (function(){

    /**
     * Gesture model module.
     * @type GeForMT.GestureModel
     * @default GeForMT.GestureModel
     */
    var _modelModule = null;
    /**
     * Gesture model module.
     * @type GeForMT.Parser
     * @default null
     */
    var _parserModule = null;
    /**
     * Visual feedback module.
     * @type GeForMT.VisualFeedback
     * @default null
     */
    var _feedbackModule = null;
    /**
     * Default generated parser component PEG.GeneratedGeForMTParser.
     * @type Object Contains a method that ist refereing to concrete parser implementation.
     */
    var _defaultParser = {
        identifier: 'PEGParser',
        adapter: function(expr){
            return PEG.GeneratedGeForMTParser.parse(expr);
        }
    };
    /**
     * Default selector engine component Sizzle.
     * @type Object Contains method that is refering to Sizzle.
     *
     */
    var _defaultEngine = {
            identifier: 'Sizzle',
            adapter: function(selector){
                return Sizzle(selector, document);
            }
    };
    /**
     * TemplateBuilder module.
     * @type GeForMT.TemplateBuilding
     * @default null
     */
    var _templateBuilder = null;
    
    /**
     * Recognition module.
     * @type GeForMT.GestureRecognition
     * @default null
     */
    var _recognitionModule = null;
    /**
     * Selector Engine module.
     * @type GeForMT.SelectorEngine
     * @default null
     */
    var _selectorEngineModule = null;
    /**
     * Observation module.
     * @type GeForMT.Observation
     * @default null
     */
    var _observationModule = null;
    
    /**
     * Components already initialized?
     * @type Boolean
     * @default false
     */
    var _componentsInitialized = false;
    /**
     * Default settings.
     * @type Object
     * @private
     */
    var _defaultSettings = {
        /**
         * Setting to prevent the browser's default behaviour while catching user input events.
         * @type Boolean
         * @default true
         */
        preventDefault: true,
        /**
         * Setting to enable or disable visual feedback while drawing a gesture.
         * @type Boolean
         * @default true
         */
        feedback: true,
        /**
         * Contiguity interval in milliseconds. Time listening on subsequent compound interaction
         * after a performed gesture.
         */
        contiguityInterval: 1000
    
    };
    
    /**
     * Custom settings.
     * @private
     * @default null
     * @type Object
     */
    var _customSettings = null;
    
    /**
     * Custom gestures.
     * @private
     * @default null
     * @type Object
     */
    var _customGestures = null;
    
    /**
     * Initialize modules and classes for gesture recognition.
     * @private
     */
    function _initComponents(){
    
        // Initialize parser component
        _parserModule = GeForMT.Parser;
        _parserModule.registerParser(_defaultParser.identifier, _defaultParser.adapter);
        _parserModule.init(_defaultParser.identifier);
        
        // Initialize gesture model module
        _modelModule = GeForMT.GestureModel;
        _modelModule.init();
        
        // Initialize Selector Engine
        _selectorEngineModule = GeForMT.SelectorEngine;
        var defaultSelectorEngine = _defaultEngine;
            _selectorEngineModule.registerEngine(defaultSelectorEngine.identifier, defaultSelectorEngine.adapter);
            _selectorEngineModule.init(defaultSelectorEngine.identifier);
        
        //Initialize observation module
        _observationModule = GeForMT.Observation;
        
        var preventDefault = _defaultSettings.preventDefault;
        if (typeof _customSettings != 'undefined') {
            if (typeof _customSettings.preventDefault != 'undefined') {
                preventDefault = _customSettings.preventDefault;
            }
        }
        _observationModule.init(preventDefault);
        
        // Initialize template builder component
        _templateBuilder = GeForMT.TemplateBuilder;
        _templateBuilder.init();
        
        
        // Initialize gesture recognizer
        _recognitionModule = GeForMT.GestureRecognition;
        var contiguity = _defaultSettings.contiguityInterval;
        if (typeof _customSettings != 'undefined') {
            if (typeof _customSettings.contiguityInterval != 'undefined') {
                contiguity = _customSettings.contiguityInterval;
            }
        }
        _recognitionModule.init(_modelModule, _observationModule, _templateBuilder, contiguity);
        _recognitionModule.registerGestureRecognitionEventListener('gesturerecognized', _gestureRecognized);
        
        // Initialize visual feedback
        _feedbackModule = GeForMT.VisualFeedback;
        _feedbackModule.init(_observationModule, _recognitionModule);
        if (typeof _customSettings != 'undefined') {
            if (typeof _customSettings.feedback != 'undefined') {
            
                _feedbackModule.setVisualFeedback(_customSettings.feedback);
            }
            else {
            
                _feedbackModule.setVisualFeedback(_defaultSettings.feedback);
            }
        }
        
    }
    
    /**
     * Initialize a set of custom gestures.
     * @private
     */
    function _initGestures(){
        var gestureSets = [];
        
        //add custom gestures
        if (typeof _customGestures != 'undefined') {
            gestureSets.push(_customGestures);
        }
        for (var i in gestureSets) {
            var gestureSet = gestureSets[i];
            for (var key in gestureSet) {
                var gestureConfig = gestureSet[key];
                // overwrite identifier with key if not defined
                if (typeof gestureConfig.identifier == 'undefined') {
                    gestureConfig.identifier = key;
                }
                var gesture=_checkExpressionForReusedIdentifier(gestureConfig);
                gesture = _initSingleGesture(gesture);
                _addToGestureModel(gesture);
            }
            
        }
        
  }
    
    /**
     * Initialize a single gesture.
     * @param {String} name  The identifier of the gesture. Must be unique.
     * @param {String} expression  Formal expression according to GeForMT grammar.
     * @param {Function} eventhandler Callback function as gesture event listener.
     * @private
     */
    function _initSingleGesture(config){
        // temporary gesture object
        var GestureConfig = config;
        // raw model from parser
        GestureConfig.rawModel = null;
        // adapted model
        GestureConfig.model = null;
        
        var identifier = config.identifier;
        
        // parse GeForMT expression and get a raw model from generated parser
        try {
            GestureConfig.rawModel = _parserModule.parse(GestureConfig.expr);
        } 
        catch (e) {
            // throw own exception with additional information
            throw "Exception while parsing the expression [" +
            GestureConfig.expr +
            "] of gesture with identifier [" +
            identifier +
            "]: \n " +
            e;
        }
        
        // create an adapted gesture object model from raw model of the parser
        GestureConfig.model = _modelModule.createGestureObjectModel();
        var options = GestureConfig.rawModel.options;
        
        
        for (var i = 0; i < options.length; i++) {
            var rawComplex = options[i];
            // var complexGesture=null;
            // console.debug(complexGesture);
            var complexGesture = _modelModule.createComplexGesture(rawComplex.relation);
            
            GestureConfig.model.addOption(complexGesture);
            
            var multistrokeGesture = false;
            var synchronousMultitouchGesture = false;
            var asynchronousMultitouchGesture = false;
            
            // iterate through list of composed gestures first time to find out the type of composition and summerize	
            for (var m = 0; m < rawComplex.gestures.length; m++) {
                var gst_current = rawComplex.gestures[m + 1];
                var gst_next = rawComplex.gestures[m + 1];
                
                //check whether a second gesture exists, that is connected with a COMMA operation and has the same function
                if (typeof gst_next !== 'undefined') {
                
                    switch (gst_next.operation) {
                        case GeForMT.OPERATION_TYPES.COMMA:
                            if (gst_current.funct.number == gst_next.funct.number &&
                            gst_current.funct.type == gst_next.funct.type) {
                                // in this part all gestures that are connected with COMMA will be
                                // summerized
                                
                                
                                //add content of next gesture to current gesture path to create a continous gesture path
                                rawComplex.gestures[m].atomfocus = rawComplex.gestures[m].atomfocus.concat(rawComplex.gestures[m + 1].atomfocus);
                                // delete next gesture
                                rawComplex.gestures.splice(m + 1, 1);
                            }
                            else {
                            // this will be not supported in this version!!!
                            //TODO: Exception
                            }
                            break;
                        case GeForMT.OPERATION_TYPES.SEMICOLON:
                            if (synchronousMultitouchGesture || asynchronousMultitouchGesture) {
                            //TODO: mixed composition not supported!
                            // Exception.
                            }
                            else {
                                multistrokeGesture = true;
                                complexGesture.isMultistrokeGesture = multistrokeGesture;
                                
                            }
                            break;
                        case GeForMT.OPERATION_TYPES.ASTERISK:
                            if (multistrokeGesture) {
                            //TODO: mixed composition not supported in this version!
                            // Exception.
                            }
                            else {
                                synchronousMultitouchGesture = true;
                                complexGesture.isSynchronousComposedGesture = synchronousMultitouchGesture;
                            //???
                            }
                            break;
                        case GeForMT.OPERATION_TYPES.PLUS:
                            if (multistrokeGesture) {
                            //TODO: mixed composition not supported in this version!
                            // Exception.
                            }
                            else {
                                asynchronousMultitouchGesture = true;
                                complexGesture.isAsynchronousComposedGesture = synchronousMultitouchGesture;
                                
                            //???
                            }
                            break;
                    }
                    
                }
                else {
                    //only one gesture exist in the definition
                    // TODO: set info in model
                }
            }
            
            //iterate through adapted list of composed gestures
            for (var gestureKey = 0; gestureKey < rawComplex.gestures.length; gestureKey++) {
                var rawGesture = rawComplex.gestures[gestureKey];
                
                // create atomic gesture
                var functNum = rawGesture.funct !== null ? rawGesture.funct.number : null;
                var functType = rawGesture.funct !== null ? rawGesture.funct.type : null;
                var rawGestureSequence = rawGesture.atomfocus;
                
                var rotationInvariant = true;
                
                var tmpGestureTemplates = null;
                var numOfGesturesInGestureSequenceTemplate = 0;
                var tmpFocuslist = [];
                
                for (var j = 0; j < rawGestureSequence.length; j++) {
                
                    //get gesture type and create type objects
                    var rawAtomType = rawGestureSequence[j].atom;
                    var atomicGestureType = rawAtomType.type;
                    
                    var additionalFocuslist = rawGestureSequence[j].focuslist;
                    
                    if (atomicGestureType === GeForMT.CONTACT_TYPES.POINT ||
                    atomicGestureType === GeForMT.CONTACT_TYPES.HOLD ||
                    atomicGestureType === GeForMT.CONTACT_TYPES.DEPOINT ||
                    atomicGestureType === GeForMT.CONTACT_TYPES.MOVE) {
                        // case if a POINT,HOLD, DEPOINT or MOVE gesture was found in the gesture sequence
                        var elementPartList = null;
                        var atomicPartGesture = null;
                        
                        
                        //save last gesture sequence						
                        if (tmpGestureTemplates !== null) {
                            // get elements by selector engine
                            elementPartList = tmpFocuslist.length !== 0 ? _selectorEngineModule.getElements(tmpFocuslist) : null;
                            
                            if (numOfGesturesInGestureSequenceTemplate > 1) {
                                atomicGestureType = GeForMT.SHAPE_TYPES.COMPLEX_SHAPE;
                                rotationInvariant = true;
                            }
                            else {
                                rotationInvariant = typeof rawAtomType.direction == 'undefined' ? false : true;
                            }
                            
                            // create and register atomic gesture
                            atomicPartGesture = _modelModule.createAtomicGesture(atomicGestureType, elementPartList, functType, functNum, tmpGestureTemplates, rotationInvariant);
                            complexGesture.composite.push(atomicPartGesture);
                            
                            // register observation of Node objects that belong
                            // to the gesture
                            _observationModule.addEventObservation(identifier, atomicPartGesture.elementList);
                            
                        }
                        
                        // get elements by selector engine
                        elementPartList = additionalFocuslist !== null ? _selectorEngineModule.getElements(additionalFocuslist) : null;
                        
                        // create and register atomic gesture like POINT, HOLD, DEPOINT or MOVE
                        atomicPartGesture = _modelModule.createAtomicGesture(atomicGestureType, elementPartList, functType, functNum, null, null);
                        complexGesture.composite.push(atomicPartGesture);
                        
                        // register observation of Node objects that belong to
                        // the gesture
                        _observationModule.addEventObservation(identifier, atomicPartGesture.elementList);
                        
                        tmpGestureTemplates = null;
                        numOfGesturesInGestureSequenceTemplate = 0;
                        tmpFocuslist = [];
                    }
                    else {
                        // case if an atomic path gesture was found 
                        // create template representing the gesture path
                        
                        if (rawGestureSequence.length == 1) {
                            //if only one atom of a gesture exist in the gesture sequence
                            //then the strategy of rotation invariance can be used
                            rotationInvariant = false;
                        }
                        else {
                            rotationInvariant = true;
                        }
                        
                        
                        tmpGestureTemplates = _templateBuilder.createListOfTemplatesBasedOnFormalization(atomicGestureType, rawAtomType.direction, rawAtomType.rotation, tmpGestureTemplates, rotationInvariant);
                        
                        numOfGesturesInGestureSequenceTemplate++;
                        tmpFocuslist = tmpFocuslist.concat(additionalFocuslist);
                    }
                    
                }
                
                //create an atomic gesture
                if (tmpGestureTemplates !== null) {
                    // get elements by selector engine
                    var elementList = tmpFocuslist.length !== 0 ? _selectorEngineModule.getElements(tmpFocuslist) : null;
                    
                    if (numOfGesturesInGestureSequenceTemplate > 1) {
                        atomicGestureType = GeForMT.SHAPE_TYPES.COMPLEX_SHAPE;
                        rotationInvariant = true;
                    }
                    else {
                        rotationInvariant = typeof rawAtomType.direction == 'undefined' ? false : true;
                    }
                    
                    
                    //create and register atomic gesture
                    var atomicGesture = _modelModule.createAtomicGesture(atomicGestureType, elementList, functType, functNum, tmpGestureTemplates, rotationInvariant);
                    complexGesture.composite.push(atomicGesture);
                    
                    
                    
                    // register observation of Node objects that belong to the
                    // gesture
                    _observationModule.addEventObservation(identifier, atomicGesture.elementList);
                    
                }
                
            }
            
            
        }       
        //console.debug(GestureConfig);
        //console.debug("ID: "+identifier+", GeForMT: "+GestureConfig.expr+", Template: "+tmpGestureTemplate.points.length);
        
        
        // addtemplate
        // _recognitionModule.registerTemplate(gestureSet[key].identifier,
        // template);
        
        // register complete gesture object in gesture model module
        return GestureConfig;
    }
    /**
     * Replace all reused gesture identifier in GeForMT expressions.
     * Reused identifiers in an expression must start and end with symbols '<' and '>'.
     * Example gesture definition: LINE_N;&lt;gestureIdentifier&gt;;LINE_N. Only gestures that already have been registered can be used.
     * @param {Object} gestureConfig
     */
    function _checkExpressionForReusedIdentifier(gestureConfig){
        var gestureId = gestureConfig.identifier;
        var gestureExpr = gestureConfig.expr;
        var registeredGestures = _modelModule.getAllGestures();
        
        for (var i = 0; i < registeredGestures.length; i++) {
			var regex=new RegExp("<"+registeredGestures[i].identifier+">","g");
			var repl=registeredGestures[i].expr;
        	gestureExpr=gestureExpr.replace(regex, repl);
        }
		gestureConfig.expr=gestureExpr;
		return gestureConfig;
    }
    
    /**
     * Add a single gesture to gesture model.
     * @param {Object} gesture A single custom gesture.
     * @return {Boolean}
     * @private
     */
    function _addToGestureModel(gesture){
        var success = (_modelModule !== null) ? _modelModule.addGesture(gesture) : false;
        return success;
    }
    
    /**
     * Event handler receiving events if a gesture has been recognized
     * @param {GeForMT.GestureRecognition.GestureRecognizedEvent} e
     */
    function _gestureRecognized(e){
        var gesture = _modelModule.getGestureById(e.identifier);
        gesture.handler(e);
    }
    /**
     * Helper class to setup the object structure for the gesture that has to be registered.
     * @class
     * @param {String} id
     * @param {String} expression
     * @param {Function} eventhandler
     * @param {Boolean} on 
     * @param {String} descr
     */
    function GestureConfig(id, expression, eventhandler, on, descr){
        return {
            identifier: id,
            expr: expression,
            handler: eventhandler,
            online: on,
            description: descr
        };
    }
    
    return {
    
        /**
         * Initialize framework components.
         * @param {Object} customSettings Custom defined settings.
         * @param {Object} customGestures Custom defined gestures.
         * @public
         */
        init: function(customGestures, customSettings){
        	 if (!_componentsInitialized) {
            _customSettings = customSettings;
            _customGestures = customGestures;
            
            _initComponents();
            _initGestures();
            _componentsInitialized = true;
        	 }
        },
        
        /**
         * Initialize gesture.
         * @param  {GeForMT.GestureConfig} gestureConfig Object literal that contains gesture definition parameters.
         */
        addGesture: function(gestureConfig){
            if (!_componentsInitialized) {
                //Warning/ Exception
            }
            else {
               var gesture= _checkExpressionForReusedIdentifier(gestureConfig);
               gesture = _initSingleGesture(gesture);
                _addToGestureModel(gesture);
            }
            
        },
         /**
         * Remove a gesture.
         * @param  {String} identifier Identifier of the gesture
         */
        removeGesture: function(identifier){
            if (!_componentsInitialized) {
                //Warning/ Exception
            }
            else {
               _observationModule.removeGestureFromEventObservation(identifier);
               _modelModule.removeGesture(identifier);
            }
            
        },
        /**
         * Register for an atomic GestureEvent, representing a generelized event for mouse and touch interaction,
         * dispatched by the GeForMT.Observation module.
         * @param  {String} name The type name of the event. Must be gesturestart, gesturemove or gestureend.
         * @param  {Function} eventhandler Callback function as gesture event listener.
         */
        addGestureEventListener: function(type, eventhandler){
            if (_observationModule !== null &&
            typeof _observationModule != "undefined") {
                _observationModule.registerGestureEventListener(type, eventhandler);
            }
        },
        /**
         * Register for 'recognitionfailed'-Event of gesture recognition module.
         * @param {Function} eventhandler Callback function.
         */
        addRecognitionFailedEventListener: function(eventhandler){
            if (_recognitionModule !== null &&
            typeof _recognitionModule != "undefined") {
                _recognitionModule.registerGestureRecognitionEventListener("recognitionfailed", eventhandler);
            }
        },
        /**
         * Register for 'recognitionstarted'-Event of gesture recognition module.
         * @param {Function} eventhandler Callback function.
         */
        addRecognitionStartedEventListener: function(eventhandler){
            if (_recognitionModule !== null &&
            typeof _recognitionModule != "undefined") {
                _recognitionModule.registerGestureRecognitionEventListener("recognitionstarted", eventhandler);
            }
        },
        /**
         * Register for 'candidatesrecognized'-Event of gesture recognition module.
         * @param {Function} eventhandler Callback function.
         */
        addRecognizedCandidatesEventListener: function(eventhandler){
            if (_recognitionModule !== null &&
            typeof _recognitionModule != "undefined") {
                _recognitionModule.registerGestureRecognitionEventListener("candidatesrecognized", eventhandler);
            }
        },
        /**
         * Constructor of gesture configuration refering to GeForMT.GestureConfig.
         * @class
         * @param {String} id Identifier of the gesture. (Must be unique!) (required)
         * @param {Object} expression Formal GeForMT expression. (required)
         * @param {Function} eventhandler Event handler that will be notified, if the gesture has been recognized. (required)
         * @param {Boolean} on Online or Offline recognition. (optional)
         * @param {String} descr Description of the gesture. (optional)
         */
        Gesture: GestureConfig
    
    };
})();
