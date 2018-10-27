/**
 * @namespace GestureRecognizer module
 */
GeForMT.GestureRecognition = (function(){

    /**
     *	Holds a list for a specific event of this module with callback methods of listeners.
     *	Listeners must register for these events via API method.
     *
     *  Possible event types:
     *  'recognitionstarted': Event if recognition processor begins to process input data.;
     *  'recognitionfailed': Event if recognition processor couldn't recognize any gesture.;
     *  'gesturerecognized': Event if gesture has been recognized.;
     *  'candidatesrecognized': Event if gesture has been recognized but further gestures are expected.
     *	@type Object
     */
    var GestureRecognitionEventListener = {
        recognitionstarted: [],
        recognitionfailed: [],
        candidatesrecognized: [],
        gesturerecognized: []
    
    };
    
    /**
     * Registered module handling the gesture model as database for gesture
     * recognition.
     *
     * @type GeForMT.GestureModel
     * @default null
     * @private
     */
    var _gestureModelModule = null;
    /**
     * Template builder module.
     * @type GeForMT.TemplateBuilder
     * @default null
     * @private
     */
    var _templateBuilder = null;
    /**
     * Recognition task manager, that manages the recognition process.
     *
     * @type GeForMT.GestureRecognition.RecognitionTaskManager
     * @default null
     */
    var _recognitionProcessManager = null;
    /**
     * TimeStamp of the first received touch event.
     * @default null
     */
    var _firstEventTimeStamp = null;
    /**
     * Contiguity interval in milliseconds. Represents the time interval to
     * expected gesture events and assert the official end of a complex
     * gestures.
     * @type Number
     * @default 1000
     */
    var _gestureContiguityInterval = 1000;
    /**
     * Set contiguity interval with the timeout function of JavaScript. This
     * Timeout is needed to assert the official end of a gesture.
     * @type Object
     * @default null
     */
    var _gestureContiguityIntervalTimer = null;
    
    /**
     * Event handler that listens to 'gesturestart' events of the Observation
     * module.
     *
     * @param {UIEvent}
     *            e Touch event.
     */
    function _gesturestart(e){
        // e.stopPropagation();
        // clear contiguity timer if set
        if (_gestureContiguityIntervalTimer !== null) {
            window.clearTimeout(_gestureContiguityIntervalTimer);
        }
        
        // check timestamp to recognize the start of this gesture
        if (_firstEventTimeStamp === null) {
            // set timestamp
            _firstEventTimeStamp = e.timeStamp;
        }
        
        //task creation at first touch point of a gesture
        if (_firstEventTimeStamp == e.timeStamp) {
        
            // create recognition task  
            _recognitionProcessManager.createEventProfiles(e);
            
            // start recognizing
            if (!_recognitionProcessManager.isWorking) {
                // a gesture starts with the first touch event
                _recognitionProcessManager.start();
            }
        }
        else {
            _recognitionProcessManager.updateEventProfiles(e);
        }
        
    }
    /**
     * Event handler that listens to 'gesturechange' events of the Observation module.
     * @param {Event} e Touch event.
     */
    function _gesturechange(e){
        //e.stopPropagation();
        // reset contiguity interval
        if (_gestureContiguityIntervalTimer !== null) {
            window.clearTimeout(_gestureContiguityIntervalTimer);
        }
        _gestureContiguityIntervalTimer = window.setTimeout(_cancelRecognitionProcess, _gestureContiguityInterval);
        
        // update event profile
        _recognitionProcessManager.updateEventProfiles(e);
        
    }
    /**
     * Event handler that listens to 'gestureend' events of the Observation module.
     * @param {Event} e Touch event.
     */
    function _gestureend(e){
        e.stopPropagation();
        // update event profile
        _recognitionProcessManager.updateEventProfiles(e);
        
        // reset contiguity interval
        if (_gestureContiguityIntervalTimer !== null) {
            window.clearTimeout(_gestureContiguityIntervalTimer);
        }
        _gestureContiguityIntervalTimer = window.setTimeout(_cancelRecognitionProcess, _gestureContiguityInterval);
        // console.debug(_recognitionProcessManager.eventProfiles);
    }
    /**
     * Stop and reset the recognition process including the recognition
     * task manager and all corresponding components and tasks.
     * This function is called when a timeout occurs caused by the contiguity interval timer.
     */
    function _cancelRecognitionProcess(){
        _firstEventTimeStamp = null;
        window.clearTimeout(_gestureContiguityIntervalTimer);
        
        if (_recognitionProcessManager.isWorking) {
            //check for noted already recognized gestures
            //console.debug(_recognitionProcessManager.recognizedGestures);
            if (_recognitionProcessManager.recognizedGestures.length > 0) {
                var gestureRecognizedEvent = _recognitionProcessManager.recognizedGestures[0];
                /*
                 * var gestureId = gestureRecognizedEvent.identifier; var
                 * gesture = _gestureModelModule.getGestureById(gestureId);
                 * gesture.handler(gestureRecognizedEvent);
                 */
                // notify listeners that gesture has been recognized
                var callbacks = GestureRecognitionEventListener.gesturerecognized;
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](gestureRecognizedEvent);
                }
            }
            else {
            
                //create GestureRecognitionFailedEvent
                var recognitionFailedEvent = new GestureRecognitionFailedEvent();
                // notify listeners that recognition failed
                var callbacks = GestureRecognitionEventListener.recognitionfailed;
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](recognitionFailedEvent);
                }
            }
        }
        
        //reset recognition processor
        _recognitionProcessManager.reset();
        console.debug("Recognition stopped.");
    }
    
    /**
     * Constructor of the recognition failed event
     * @class
     */
    function GestureRecognitionFailedEvent(){
    
    }
    GestureRecognitionFailedEvent.prototype =/*@lends*/ {};
    
    /**
     * Event interface of the recognitionstarted event.
     * @class
     */
    function GestureRecognitionStartedEvent(){
    
    }
    GestureRecognitionStartedEvent.prototype =/*@lends*/ {};
    
    /**
     * Event interface of the candidatesrecognized event.
     * @param {Array}
     *            candidateIds List of candidates.
     */
    function GestureRecognitionCandidatesEvent(candidateIds){
        this.candidates = candidateIds;
    }
    GestureRecognitionCandidatesEvent.prototype =/*@lends*/ {
        /**
         * List of candidates, represented by their identifier.
         * @type Array
         * @default empty array
         */
        candidates: []
    };
    
    /**
     * Event interface gesturerecognized event.
     * @param {String} identifier Identifier of the gesture
     * @param {GeForMT.GestureModel.Gesture} model
     * @param {Array} eventProfileHistory Nested lists of all events representing the gesture. Structure: The list contains gesture sequences. Every sequence represents a sequentially performed gesture. A sequence is a list of events that occured while performing the gesture.
     * @param {Array} gesturePathes Nested list of templates representing the gesture. Structure: The list contains gesture sequences. Every sequence represents a sequentially performed gesture. A sequence is a list of template objects (type GeForMT.TemplateBuilder.Template). Every template represents a single stroke. More than one template in the sequence means, that a Multitouch gesture has been performed.
     */
    function GestureRecognizedEvent(identifier, model, eventProfileHistory, gesturePathes){
    
        var currentStrokeEventProfile = eventProfileHistory[eventProfileHistory.length - 1];
        this.currentEvent = currentStrokeEventProfile[currentStrokeEventProfile.length - 1];
        this.identifier = identifier;
        this.events = eventProfileHistory;
        this.pathes = gesturePathes;
        this.expr = model.expr;
        this.online = model.online;
        this.target = this.currentEvent.target;
        
        var gestureStartEvent = currentStrokeEventProfile[0];
        var lastEvent = this.currentEvent;
        this.duration = (lastEvent.timeStamp / 1000) -
        (gestureStartEvent.timeStamp / 1000);
        
    }
    GestureRecognizedEvent.prototype = /*@lends*/ {
        /**
         * Last Event, that has been recognized.
         * @type UIEvent
         * @default null
         */
        currentEvent: null,
        /**
         * Target of current event.
         * @type Element
         * @default null
         */
        target: null,
        /**
         * List of lists containing all events of a gesture.
         * @type Array
         * @default []
         */
        events: [],
        /**
         * List of lists of template objects representing the pathes of the performed gesture.
         * @type Array
         * @default []
         */
        pathes: [],
        /**
         * Identifier of the recognized gesture.
         * @type String
         * @default null
         */
        identifier: null,
        /**
         * GeForMT expression of the recognized gesture.
         * @type String
         * @default null
         */
        expr: null,
        /**
         * Duration in seconds between start of the gesture and last event of the event list.
         */
        duration: 0,
        /**
         * Recognition online or offline? True, if online.
         * @type Boolean
         * @default false
         */
        online: false
    };
    /**
     * Controller of the recognition process.
     * @param {GeForMT.GestureRecognition.Recognizer} recognizer Recognition processor.
     * @class
     */
    function RecognitionProcessManager(recognizer){
        this.recognizer = recognizer;
    }
    
    RecognitionProcessManager.prototype = /*@lends*/ {
        /**
         * Recognition processor.
         * @type GeForMT.GestureRecognition.Recognizer
         */
        recognizer: null,
        /**
         * State of the task manager. True if recognition process is running.
         * False if task manager has stopped working.
         * @type Boolean
         */
        isWorking: false,
        /**
         * Contains a data structure which is similar to gesture model, but contains boolean values.
         * It's a representation of a task list for recognizer. Structure: gestureId => GeForMT.GestureRecognition.Checkmodel
         * @type Object
         */
        checkmodels: {},
        /**
         * List of gesture identifiers ordered by their priority.
         * @type Array
         */
        priorities: [],
        /**
         * Map of event profiles to be recognized. The map key is the gesture identifier. The map value is an array that represents the event profile assigned to that gesture.
         * Structure: GestureId => EventProfile
         * @type Object
         * @default empty object
         */
        eventProfiles: {},
        /**
         * Map of event profiles that have been recognized.
         * Especially in case of sequential composed gestures, all previously recognized gesture strokes are saved in this representation.
         * Structure: GestureId => EventProfileHistory
         * @type Object
         */
        eventProfilesHistory: {},
        /**
         * Gesture pathes extracted from event profile. Contains a template for every path of performed gesture.
         * Representations are templates of type GeForMT.TemplateBuilder.Template.
         * Structure: GestureId => ListOfTemplates
         * @type gesturePathes
         */
        gesturePathes: {},
        /**
         * Map of gesture pathes that already have been recognized.
         * Especially in case of sequential composed gestures, all previously recognized gesture strokes are saved in this representation.
         * Format: gestureId => listOfGestureSequences with nested list of templates representing synchronous gesture pathes.
         * @type Object
         */
        gesturePathesHistory: {},
        /**
         * Recognized gestures that are earmarked to hand it to application layer.
         * This is necessary in case of sequentially composed gestures containing atomic gestures with the same
         * List of noted gestures, that has been recognized successfully -> Items of type GestureRecognizedEvent.
         * @type Array
         * @default empty list
         */
        recognizedGestures: [],
        /**
         * Map of model profiles to be compared with the event profile. The map key is the gesture identifier. The map value is the formal gesture model.
         * A key value pair has the following type structure: [GestureId => GeForMT.GestureModel.Gesture]
         * @type Object
         * @default empty object
         */
        models: {},
        /**
         * True, if online gestures have been registered.
         * @default false
         * @type Boolean
         */
        online: false,
        /**
         * Create profile for all gestures assigned to the given event and get the dedicated gesture model.
         * @param {UIEvent} event
         */
        createEventProfiles: function(event){
        
            var gesturesToRecognize = event.relatedGestures;
            var gestureIdListLength = event.relatedGestures.length;
            var onlineGesturesToRecognize = [];
            
            // check for online gestures
            for (var o = 0; o < gestureIdListLength; o++) {
                var model = _gestureModelModule.getGestureById(gesturesToRecognize[o]);
                if (model.online && event.target === event.currentTarget) {
                    onlineGesturesToRecognize.push(gesturesToRecognize[o]);
                    this.online = true;
                }
            }
            
            //if online gestures are related to that event or online gestures already registered --> only online gestures on top UI element will be recognized
            if (onlineGesturesToRecognize.length > 0 || this.online) {
                gesturesToRecognize = onlineGesturesToRecognize;
            }
            
            var gesturesToRecognizeListLength = gesturesToRecognize.length;
            for (var i = 0; i < gesturesToRecognizeListLength; i++) {
                var gestureId = gesturesToRecognize[i];
                var gestureModel = _gestureModelModule.getGestureById(gestureId);
                if (typeof this.models[gestureId] == 'undefined') {
                    this.models[gestureId] = gestureModel;
                }
                if (typeof this.eventProfiles[gestureId] == 'undefined') {
                    this.eventProfiles[gestureId] = [event];
                    this.eventProfilesHistory[gestureId] = [];
                    // this.gesturePathes[gestureId]=[];
                    // this._extractAndUpdateGesturePathes(event,gestureId);
                }
                
                if (typeof this.gesturePathes[gestureId] == 'undefined') {
                    //this.gesturePathes[gestureId] = [];
                    // build gesture pathes object structure
                    
                    var templates = _templateBuilder.createTemplatesBasedOnEventProfile([event]);
                    this.gesturePathes[gestureId] = templates;
                    this.gesturePathesHistory[gestureId] = [];
                    
                }
                if (typeof this.checkmodels[gestureId] == 'undefined') {
                
                    var checkModel = new CheckModel(_gestureModelModule.getGestureById(gestureId).model);
                    this.checkmodels[gestureId] = checkModel;
                    
                }

                this.priorities.push(gestureId);
                
            }
        },
        /**
         * Update the event profile of the corresponding gestures.
         * @param {UIEvent} event
         */
        updateEventProfiles: function(event){      
            if (this.isWorking) {
                var gestureIdListLength = event.relatedGestures.length;
                for (var i = 0; i < gestureIdListLength; i++) {
                    var gestureId = event.relatedGestures[i];
                    if (typeof this.eventProfiles[gestureId] !== 'undefined' &&
                    this.eventProfiles[gestureId] !== null) {
                        this.eventProfiles[gestureId].push(event);
                    }
                    
                    if (typeof this.gesturePathes[gestureId] !== 'undefined' &&
                    this.gesturePathes[gestureId] !== null) {
                        var updatedTemplates = _templateBuilder.updateTemplatesBasedOnEventProfile([event], this.gesturePathes[gestureId]);
                        // console.debug(updatedTemplates);
                        this.gesturePathes[gestureId] = updatedTemplates;
                    }
                    
                }
                if (!this.recognizer.busy && this.priorities.length !== 0) {
                    if (this.online) {
                  
                        var recognitionContext = new RecognitionContext(this.priorities, this.eventProfiles, this.eventProfilesHistory, this.gesturePathes, this.gesturePathesHistory, this.models, this.checkmodels, this.recognitionCallback, this.online);
                        
                        this.recognizer.recognize(recognitionContext);
                    	
                    }
                    else {
                    
                        if (event.type == 'touchend') {
                            var recognitionContext = new RecognitionContext(this.priorities, this.eventProfiles, this.eventProfilesHistory, this.gesturePathes, this.gesturePathesHistory, this.models, this.checkmodels, this.recognitionCallback, this.online);
                            
                            this.recognizer.recognize(recognitionContext);
                        }
                    }
                }
            }
            
        },
        /**
         * Remove recognition task for a specific gesture. Rejects gesture candidates that doesn't fit to performed gesture.
         * @param  {String} identifier Identifier of the gesture.
         */
        excludeGestureFromRecognition: function(identifier){
        
            var gestureProfile = this.eventProfiles[identifier];
            var eventProfileHistory = this.eventProfilesHistory[identifier];
            var model = this.models[identifier];
            var checkmodel = this.checkmodels[identifier];
            var templates = this.gesturePathes[identifier];
            var pathesHistory = this.gesturePathesHistory[identifier];
            
            if (typeof gestureProfile !== 'undefined') {
                gestureProfile = null;
            }
            if (typeof eventProfileHistory !== 'undefined') {
                eventProfileHistory = null;
            }
            if (typeof model !== 'undefined') {
                model = null;
            }
            if (typeof templates !== 'undefined') {
                templates = null;
            }
            if (typeof pathesHistory !== 'undefined') {
                pathesHistory = null;
            }
            if (typeof checkmodel !== 'undefined') {
                checkmodel = null;
            }
            
            //remove from priority list
            for (var i = 0; i < this.priorities.length; i++) {
                if (this.priorities[i] == identifier) {
                    this.priorities.splice(i, 1);
                }
            }
            
        },
        /**
         * Start recognition process.
         */
        start: function(){
        
            this.isWorking = true;
            
            // create GestureRecognitionFailedEvent
            var recognitionStartedEvent = new GestureRecognitionStartedEvent();
            // notify listeners that recognition failed
            var callbacks = GestureRecognitionEventListener.recognitionstarted;
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](recognitionStartedEvent);
            }
            
            // create recognition context (a parameter object for the
            // recognizer)
            // var recognitionContext = new RecognitionContext(this.priorities,
            // this.eventProfiles, this.models, this._gestureRecognized,
            // this._gestureRecognitionFailed);
        
            // this.recognizer.recognize(recognitionContext);
        
        },
        /**
         * Stop recognition process.
         */
        stop: function(){
            this.isWorking = false;
        },
        /**
         * Resets the recognition process.
         * Stops recognition and removes all tasks.
         */
        reset: function(){
            this.isWorking = false;
            
            // reset checklists
            // for (var i = 0; i < this.priorities.length; i++) {
            // this.models[this.priorities[i]].model.resetChecklists();
            // }
            
            this.eventProfiles = {};
            this.eventProfilesHistory = {};
            this.gesturePathes = {};
            this.gesturePathesHistory = {};
            this.recognizedGestures = [];
            this.checkmodels = {};
            this.models = {};
            this.priorities = [];
            this.online = false;
            
        },
        /**
         * Gesture has been recognized. Dispatches an GeForMT.GestureRecognition.GestureRecognizedEvent.
         * @param {String} identifier Gesture identifier.
         * @param {Array} eventProfileHistory
         * @param {Array} gesturePathes
         */
        gestureRecognized: function(identifier, eventProfileHistory, gesturePathes){
        
            var model = this.models[identifier];
            
            var lastStrokeEventProfile = eventProfileHistory[eventProfileHistory.length - 1];
            var gestureRecognizedEvent = new GestureRecognizedEvent(identifier, model, eventProfileHistory, gesturePathes);
            
            // notify listeners that gesture has been recognized
            var callbacks = GestureRecognitionEventListener.gesturerecognized;
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i](gestureRecognizedEvent);
            }
            
            //reset timer and gesture sets
            if (!model.online) {
                _firstEventTimeStamp = null;
                window.clearTimeout(_gestureContiguityIntervalTimer);
                this.reset();
            }
            else {
                if (lastStrokeEventProfile[lastStrokeEventProfile.length - 1].type == 'touchend') {
                    _firstEventTimeStamp = null;
                    window.clearTimeout(_gestureContiguityIntervalTimer);
                    this.reset();
                }
            }
            // _cancelRecognitionProcess();
        
        },
        /**
         * Wrapper of the function '_recognitionCallback', that is called, if the recongizer has finished processing.
         * @param {Array} List of identifier gestures that fits
         * @param {GeForMT.GestureRecognition.RecognitionContext} recognitionContext
         */
        recognitionCallback: function(identifierList, recognitionContext){
        
            _recognitionProcessManager._recognitionCallback(identifierList, recognitionContext);
        },
        /**
         * Function that is called, if the recongizer has finished processing.
         * @param {GeForMT.GestureRecognition.RecognitionContext} recognitionContext
         */
        _recognitionCallback: function(recognitionContext){
        
            //recognizedGestures is an object structure of following format: {gestureId => optionId, ..}
            var recognizedGestures = recognitionContext.recognizedGestures;
            var recognizedGesturesKeys = Object.keys(recognizedGestures);
            
            //console.debug("Recognized: " + recognizedGesturesKeys);
            if (recognizedGesturesKeys.length === 0) {
                //recognition failed/ no gestures recognized!
                _firstEventTimeStamp = null;
                window.clearTimeout(_gestureContiguityIntervalTimer);
                this.reset();
                // create GestureRecognitionFailedEvent
                var recognitionFailedEvent = new GestureRecognitionFailedEvent();
                // notify listeners that recognition failed
                var callbacks = GestureRecognitionEventListener.recognitionfailed;
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i](recognitionFailedEvent);
                }
            }
            else {
                //recognition succeed
                
                // create Feedback event about recognized candidates
                var recognitionCandidatesEvent = new GestureRecognitionCandidatesEvent(recognizedGesturesKeys);
                // notify listeners that recognition failed
                var callbacks = GestureRecognitionEventListener.candidatesrecognized;
                for (var k = 0; k < callbacks.length; k++) {
                    callbacks[k](recognitionCandidatesEvent);
                }
                
                //reset list of noted gestures
                this.recognizedGestures = [];
                // notice gestures to exclude
                var gesturesToExclude = [];
                
                for (var p = 0; p < this.priorities.length; p++) {
                    var pGestureId = this.priorities[p];
                    var exclude = true;
                    
                    for (var i = 0; i < recognizedGesturesKeys.length; i++) {
                        var rGestureId = recognizedGesturesKeys[i];
                        if (pGestureId == rGestureId) {
                        
                            exclude = false;
                            
                            // prepare gesture for further recognition steps
                            var model = recognitionContext.models[rGestureId];
                            
                            // get events of recognition context
                            var eventProfile = recognitionContext.eventProfiles[rGestureId];
                            var gesturePathes = recognitionContext.gesturePathes[rGestureId];
                            var events = this.eventProfilesHistory[pGestureId].slice();
                            events.push(eventProfile);
                            var pathes = this.gesturePathesHistory[rGestureId].slice();
                            pathes.push(gesturePathes);
                            // console.debug(model.model.isMultistrokeGesture);
                            
                            if (!model.online) {
                                // save history
                                this.eventProfilesHistory[rGestureId].push(eventProfile);
                                // delete checked events from event profile
                                this.eventProfiles[rGestureId] = [];
                                
                                this.gesturePathesHistory[rGestureId].push(gesturePathes);
                                // delete checked gesturePathes
                                this.gesturePathes[rGestureId] = [];
                                
                                // all subtasks of one option processed?
                                if (recognitionContext.checkmodels[rGestureId].oneOptionProcessedSuccessfully()) {
                                    //more than one candidate --> wait for next input
                                    if (recognizedGesturesKeys.length > 1) {
                                    
                                        var gestureRecognizedEvent = new GestureRecognizedEvent(pGestureId, model, events, pathes);
                                        
                                        this.recognizedGestures.push(gestureRecognizedEvent);
                                        
                                    }
                                    else 
                                        if (recognizedGesturesKeys.length == 1) {
                                            // create gesture recognized event and handle it to application layer
                                            // unambiguous gesture recognized
                                            this.gestureRecognized(rGestureId, events, pathes);
                                        }
                                    
                                    exclude = true;
                                }
                                
                            }
                            else {
                                // online recognition
                                
                                this.gestureRecognized(rGestureId, events);
                                exclude = true;
                                
                            }
                        }
                        
                    }
                    if (exclude && !this.online) {
                        gesturesToExclude.push(pGestureId);
                    }
                }
                // remove this gestures saved in from gesturesToExclude list,
                // because recognition failed
                for (var j = 0; j < gesturesToExclude.length; j++) {
                    this.excludeGestureFromRecognition(gesturesToExclude[j]);
                }
                
            }
        }
    };
    /**
     * Recognition processor component. Recognizes a gesture with its adapted
     * strategies for GeForMT gesture recognition.
     * @namespace
     */
    var Recognizer = (function(){
    
        /**
         * Recognizes the relation between gesture pathes.
         * @class
         */
        function RelationRecognizer(){
        
        }
        RelationRecognizer.prototype = /*lends*/ {
            /**
             * Tolerance threshold for CONNECT relations. (px)
             * @type Number
             * @default 25
             */
            connectTolerance: 25,
            /**
             * Offset of horizontal range for AMONG relation. (px)
             * @type Number
             * @default 30
             */
            horizontalLimitOffset: 30,
            /**
             * Offset of vertical range for ASIDE relation. (px)
             * @type Number
             * @default 20
             */
            verticalLimitOffset: 20,
            /**
             * Offset representing the valid area for SYNC relation. (px)
             * @type Number
             * @default 10
             */
            synchroThreshold: 10,
            /**
             * Offset representing the minimal average distance to recognize a SPLIT or JOIN relationship.
             * @type Number
             * @default: 25
             */
            minDistanceOffset: 25,
            /**
             * Recognize parameters in time and space to check relations between
             * gesture. Implemented relation types are: CROSS, SPLIT, JOIN, ASIDE, AMONG, CONNECT_START and CONNECT_END.
             *
             * @param {Object}
             *            gesturePathes
             * @param {Object}
             *            gesturePathesHistory
             * @param {Object}
             *            relationCheckContext Object of following format:
             *            (gestureId => (relation => relationType of type
             *            GeForMT.RELATION_TYPES, option => optionIndex, isMultistroke=> true/false, isMultitouch => true/false))
             * @return {Object} Structure: (gestureId => optionIndex)
             */
            recognize: function(gesturePathes, gesturePathesHistory, relationCheckContext){
                var gesturesKeys = Object.keys(relationCheckContext);
                var result = {};
                for (var i = 0; i < gesturesKeys.length; i++) {
                    var gestureId = gesturesKeys[i];
                    var relation = relationCheckContext[gestureId].relation;
                    var optionIndex = relationCheckContext[gestureId].option;
                    var templates = gesturePathes[gestureId];
                    var previousStrokeTemplates = gesturePathesHistory[gestureId][gesturePathesHistory[gestureId].length - 1];
                    var templateCollection = templates.concat(previousStrokeTemplates);
                    var isMultistroke = relationCheckContext[gestureId].isMultistroke;
                    var isMultitouch = relationCheckContext[gestureId].isMultitouch;
                    var relationRecognized = false;
                    switch (relation) {
                        case GeForMT.RELATION_TYPES.CROSS:
                            if (isMultistroke &&
                            typeof previousStrokeTemplates !== 'undefined' &&
                            previousStrokeTemplates.length > 0) {
                                var ptPoints = previousStrokeTemplates[0].points;
                                var tPoints = templates[0].points;
                                var pointsOfIntersection = [];
                                for (var pt = 0; pt < ptPoints.length - 1; pt++) {
                                    var x1 = ptPoints[pt].x;
                                    var x2 = ptPoints[pt + 1].x;
                                    var y1 = ptPoints[pt].y;
                                    var y2 = ptPoints[pt + 1].y;
                                    var pBoundingBox = this._getBoundingBox(x1, x2, y1, y2);
                                    if (relationRecognized) {
                                        break;
                                    }
                                    for (var t = 0; t < tPoints.length - 1; t++) {
                                        var xt1 = tPoints[t].x;
                                        var xt2 = tPoints[t + 1].x;
                                        var yt1 = tPoints[t].y;
                                        var yt2 = tPoints[t + 1].y;
                                        var tBoundingBox = this._getBoundingBox(xt1, xt2, yt1, yt2);
                                        var intersectionBoundingBox = this._getIntersectionBoundingBox(pBoundingBox, tBoundingBox);
                                        if (intersectionBoundingBox !== null) {
                                        
                                            //calculate parameters of linear functions
                                            var linearFunc1 = this._calcLinearFunction(x1, y1, x2, y2);
                                            var linearFunc2 = this._calcLinearFunction(xt1, yt1, xt2, yt2);
                                            // calculate point of intersection
                                            var pointOfIntersection = this._calcPointOfIntersection(linearFunc1, linearFunc2);
                                            
                                            // point of intersection in valid range?
                                            // if true, then pathes are crossing
                                            var poiX = pointOfIntersection.x;
                                            var poiY = pointOfIntersection.y;
                                            if (!isNaN(poiX) && !isNaN(poiY)) {
                                            
                                                if (poiY >= intersectionBoundingBox.top &&
                                                poiY <= intersectionBoundingBox.bottom &&
                                                poiX >= intersectionBoundingBox.left &&
                                                poiX <= intersectionBoundingBox.right) {
                                                    //part of pathes are crossing
                                                    relationRecognized = true;
                                                    break;
                                                // pointsOfIntersection.push(pointOfIntersection);
                                                }
                                            }
                                        }
                                    }
                                    
                                }
                                
                            }
                            else {
                                if (!isMultistroke) {
                                
                                }
                                relationRecognized = true;
                            }
                            break;
                        case GeForMT.RELATION_TYPES.JOIN:
                            if (typeof templates !== 'undefined' &&
                            templates.length > 1 &&
                            isMultitouch) {
                                var deltaBeginX = templates[0].points[0].x - templates[templates.length - 1].points[0].x;
                                var deltaEndX = templates[0].points[templates[0].points.length - 1].x - templates[templates.length - 1].points[templates[templates.length - 1].points.length - 1].x;
                                var deltaBeginY = templates[0].points[0].y - templates[templates.length - 1].points[0].y;
                                var deltaEndY = templates[0].points[templates[0].points.length - 1].y - templates[templates.length - 1].points[templates[templates.length - 1].points.length - 1].y;
                                var distanceAtBeginning = Math.sqrt(deltaBeginX * deltaBeginX + deltaBeginY * deltaBeginY);
                                var distanceAtEnd = Math.sqrt(deltaEndX * deltaEndX + deltaEndY * deltaEndY);
                                if (distanceAtBeginning > distanceAtEnd && Math.abs(distanceAtBeginning - distanceAtEnd) > this.minDistanceOffset) {
                                    relationRecognized = true;
                                }
                                else {
                                    relationRecognized = false;
                                }
                                
                            }
                            else {
                                relationRecognized = true;
                            }
                            break;
                        case GeForMT.RELATION_TYPES.SYNC:
                            if (typeof templates !== 'undefined' &&
                            templates.length > 1 &&
                            isMultitouch) {
                                //resample points
                                var resampledPathes = [];
                                var n = 6;
                                for (var t = 0; t < templates.length; t++) {
                                    var newPoints = this._resample(templates[t].points, n);
                                    resampledPathes.push(newPoints);
                                }
                                
                                //calculate distances between points
                                var avgDistances = [];
                                for (var pi = 0; pi < n; pi++) {
                                    //check point i of n
                                    for (var rp = 1; rp < resampledPathes.length; rp++) {
                                        if (typeof avgDistances[pi] == 'undefined') {
                                            avgDistances[pi] = this._distance(resampledPathes[0][pi], resampledPathes[rp][pi]);
                                        }
                                        else {
                                            avgDistances[pi] = avgDistances[pi] + this._distance(resampledPathes[0][pi], resampledPathes[rp][pi]);
                                        }
                                    }
                                    avgDistances[pi] = avgDistances[pi] / (resampledPathes.length - 1);
                                    //check for almost constant distances
                                    console.debug(Math.abs(avgDistances[0] - avgDistances[pi]));
                                    if (avgDistances.length > 1 && Math.abs(avgDistances[0] - avgDistances[pi]) > this.synchroThreshold) {
                                        relationRecognized = false;
                                        break;
                                    }
                                    else {
                                        relationRecognized = true;
                                    }
                                }
                                console.debug(relationRecognized);
                            }
                            relationRecognized = true;
                            break;
                        case GeForMT.RELATION_TYPES.SPLIT:
                            if (typeof templates !== 'undefined' &&
                            templates.length > 1 &&
                            isMultitouch) {
                            
                                var deltaBeginX = templates[0].points[0].x - templates[templates.length - 1].points[0].x;
                                var deltaEndX = templates[0].points[templates[0].points.length - 1].x - templates[templates.length - 1].points[templates[templates.length - 1].points.length - 1].x;
                                var deltaBeginY = templates[0].points[0].y - templates[templates.length - 1].points[0].y;
                                var deltaEndY = templates[0].points[templates[0].points.length - 1].y - templates[templates.length - 1].points[templates[templates.length - 1].points.length - 1].y;
                                
                                var distanceAtBeginning = Math.sqrt(deltaBeginX * deltaBeginX + deltaBeginY * deltaBeginY);
                                var distanceAtEnd = Math.sqrt(deltaEndX * deltaEndX + deltaEndY * deltaEndY);
                                if (distanceAtBeginning < distanceAtEnd && Math.abs(distanceAtBeginning - distanceAtEnd) > this.minDistanceOffset) {
                                    relationRecognized = true;
                                }
                                else {
                                    relationRecognized = false;
                                }
                                
                            }
                            else {
                                relationRecognized = true;
                            }
                            break;
                        case GeForMT.RELATION_TYPES.CONNECT_START:
                            if (typeof previousStrokeTemplates !== 'undefined' &&
                            previousStrokeTemplates.length > 0 &&
                            isMultistroke) {
                                //previous stroke pathes
                                var refX = 0;
                                var refY = 0;
                                for (var pcst = 0; pcst < previousStrokeTemplates.length; pcst++) {
                                    refX += previousStrokeTemplates[pcst].points[0].x;
                                    refY += previousStrokeTemplates[pcst].points[0].y;
                                }
                                refX = refX / previousStrokeTemplates.length;
                                refY = refY / previousStrokeTemplates.length;
                                
                                // current stroke pathes
                                var x = 0;
                                var y = 0;
                                for (var cst = 0; cst < templates.length; cst++) {
                                    x += templates[cst].points[0].x;
                                    y += templates[cst].points[0].y;
                                }
                                x = x / templates.length;
                                y = y / templates.length;
                                
                                var isConnected = true;
                                
                                var dx = refX - x;
                                var dy = refY - y;
                                var a = Math.sqrt(dx * dx + dy * dy);
                                if (a < this.connectTolerance) {
                                    relationRecognized = true;
                                }
                                else {
                                    relationRecognized = false;
                                }
                                
                            }
                            else {
                                relationRecognized = true;
                            }
                            break;
                        case GeForMT.RELATION_TYPES.CONNECT_END:
                            if (typeof previousStrokeTemplates !== 'undefined' &&
                            previousStrokeTemplates.length > 0 &&
                            isMultistroke) {
                                // previous stroke pathes
                                var refX = 0;
                                var refY = 0;
                                for (var pcet = 0; pcet < previousStrokeTemplates.length; pcet++) {
                                    var strokeLength = previousStrokeTemplates[pcet].points.length;
                                    refX += previousStrokeTemplates[pcet].points[strokeLength - 1].x;
                                    refY += previousStrokeTemplates[pcet].points[strokeLength - 1].y;
                                }
                                refX = refX / previousStrokeTemplates.length;
                                refY = refY / previousStrokeTemplates.length;
                                // current stroke pathes
                                var x = 0;
                                var y = 0;
                                for (var cet = 0; cet < templates.length; cet++) {
                                    x += templates[cet].points[0].x;
                                    y += templates[cet].points[0].y;
                                }
                                x = x / templates.length;
                                y = y / templates.length;
                                
                                var isConnected = true;
                                
                                var dx = refX - x;
                                var dy = refY - y;
                                var a = Math.sqrt(dx * dx + dy * dy);
                                if (a < this.connectTolerance) {
                                    relationRecognized = true;
                                }
                                else {
                                    relationRecognized = false;
                                }
                                
                            }
                            else {
                                //recognize this relation in next recognition step
                                relationRecognized = true;
                            }
                            break;
                        case GeForMT.RELATION_TYPES.AMONG:
                            if (typeof previousStrokeTemplates !== 'undefined' &&
                            previousStrokeTemplates.length > 0 &&
                            isMultistroke) {
                                var minX = +Infinity;
                                var maxX = 0;
                                var minY = +Infinity;
                                var maxY = 0;
                                // calc bounding box
                                for (var pta = 0; pta < previousStrokeTemplates.length; pta++) {
                                    var points = previousStrokeTemplates[pta].points;
                                    for (var p = 0; p < points.length; p++) {
                                        var x = points[p].x;
                                        var y = points[p].y;
                                        if (x < minX) {
                                            minX = x;
                                        }
                                        if (y < minY) {
                                            minY = y;
                                        }
                                        if (x > maxX) {
                                            maxX = x;
                                        }
                                        if (y > maxY) {
                                            maxY = y;
                                        }
                                    }
                                }
                                
                                //offset for tolerance
                                minX = minX - this.horizontalLimitOffset;
                                maxX = maxX + this.horizontalLimitOffset;
                                relationRecognized = true;
                                // check current added gesture strokes
                                for (var t = 0; t < templates.length; t++) {
                                    var template = templates[t];
                                    for (var tp = 0; tp < template.points.length; tp++) {
                                        var px = template.points[tp].x;
                                        var py = template.points[tp].y;
                                        var pointInValidRange = (px > minX &&
                                        px < maxX &&
                                        py < minY ||
                                        py > maxY);
                                        if (!pointInValidRange) {
                                            relationRecognized = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                //recognize this relation in next recognition step
                                relationRecognized = true;
                            }
                            break;
                        case GeForMT.RELATION_TYPES.ASIDE:
                            if (typeof previousStrokeTemplates !== 'undefined' &&
                            previousStrokeTemplates.length > 0 &&
                            isMultistroke) {
                                var minX = +Infinity;
                                var maxX = 0;
                                var minY = +Infinity;
                                var maxY = 0;
                                
                                // calc bounding box
                                for (var pta = 0; pta < previousStrokeTemplates.length; pta++) {
                                    var points = previousStrokeTemplates[pta].points;
                                    for (var p = 0; p < points.length; p++) {
                                        var x = points[p].x;
                                        var y = points[p].y;
                                        if (x < minX) {
                                            minX = x;
                                        }
                                        if (y < minY) {
                                            minY = y;
                                        }
                                        if (x > maxX) {
                                            maxX = x;
                                        }
                                        if (y > maxY) {
                                            maxY = y;
                                        }
                                    }
                                }
                                
                                //offset for tolerance
                                minY = minY - this.verticalLimitOffset;
                                maxY = maxY + this.verticalLimitOffset;
                                relationRecognized = true;
                                // check current added gesture strokes
                                for (var t = 0; t < templates.length; t++) {
                                    var template = templates[t];
                                    for (var tp = 0; tp < template.points.length; tp++) {
                                        var px = template.points[tp].x;
                                        var py = template.points[tp].y;
                                        var pointInValidRange = (px < minX ||
                                        px > maxX &&
                                        py > minY &&
                                        py < maxY);
                                        if (!pointInValidRange) {
                                            relationRecognized = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                //recognize this relation in next recognition step
                                relationRecognized = true;
                            }
                            break;
                    }
                    if (relationRecognized) {
                        result[gestureId] = optionIndex;
                    }
                }
                return result;
            },
            /**
             * Helper method to calculate the bounding box (a rectangle) based on two points.
             * @param {Number} x1
             * @param {Number} x2
             * @param {Number} y1
             * @param {Number} y2
             * @return {Objects} Object that represents the bounding box. It has the following properties: top, right, left and bottom.
             */
            _getBoundingBox: function(x1, x2, y1, y2){
                var top = Math.min(y1, y2);
                var right = Math.max(x1, x2);
                var bottom = Math.max(y1, y2);
                var left = Math.min(x1, x2);
                return {
                    top: top,
                    right: right,
                    bottom: bottom,
                    left: left
                };
            },
            /**
             * Helper method to calculate intersection area of two bounding boxes (rectangles).
             * @param {Object} boundingBox1
             * @param {Object} boundingBox2
             * @return {Objects} Object that represents the intersection area. It has the following properties: top, right, left and bottom.
             */
            _getIntersectionBoundingBox: function(boundingBox1, boundingBox2){
                var top = Math.max(boundingBox1.top, boundingBox2.top);
                var bottom = Math.min(boundingBox1.bottom, boundingBox2.bottom);
                var right = Math.min(boundingBox1.right, boundingBox2.right);
                var left = Math.max(boundingBox1.left, boundingBox2.left);
                
                if (top > bottom || left > right) {
                    return null;
                }
                return {
                    top: top,
                    right: right,
                    bottom: bottom,
                    left: left
                };
            },
            /**
             * Helper method that calculates main parameter of a linear function based on two points.
             * @param {Number} x1
             * @param {Number} y1
             * @param {Number} x2
             * @param {Number} y2
             * @return Object containing 'gradient' and 'offset' that represents the main parameter of a line.
             */
            _calcLinearFunction: function(x1, y1, x2, y2){
            
                var m = (y2 - y1) / (x2 - x1);
                var b = y2 - x2 * m;
                return {
                    gradient: m,
                    offset: b
                };
            },
            /**
             * Calculates the point of intersection of two linear functions.
             * @param {Object} linearContext1 Parameter of first linear function.
             * @param {Object} linearContext2 Parameter of second linear function.
             * @return Object point of intersection represented by x and y coordiante.
             */
            _calcPointOfIntersection: function(linearContext1, linearContext2){
                var poiX = (linearContext2.offset - linearContext1.offset) /
                (linearContext1.gradient - linearContext2.gradient);
                var poiY = linearContext1.gradient * poiX +
                linearContext1.offset;
                return {
                    x: poiX,
                    y: poiY
                };
            },
            /**
             * Resample performed gesture pathes.
             * @param {Array} points List of points.
             * @param {Number} n Number of points
             * @return {Array} Resampled points
             */
            _resample: function(points, n){
            
                var I = this._pathLength(points) / (n - 1); // interval length
                var D = 0.0;
                var newpoints = [points[0]];
                
                for (var i = 1; i < points.length; i++) {
                
                    var d = this._distance(points[i - 1], points[i]);
                    
                    if ((D + d) >= I) {
                        var qx = points[i - 1].x +
                        ((I - D) / d) *
                        (points[i].x - points[i - 1].x);
                        
                        var qy = points[i - 1].y +
                        ((I - D) / d) *
                        (points[i].y - points[i - 1].y);
                        var q = {
                            x: qx,
                            y: qy
                        };
                        newpoints[newpoints.length] = q; // append new point
                        // 'q'
                        points.splice(i, 0, q); // insert 'q' at position i in
                        // points s.t. 'q' will be the next
                        // i
                        D = 0.0;
                        
                    }
                    else {
                        D += d;
                    }
                }
                return newpoints;
            },
            /**
             * Calculate distance between two points.
             * @param {GeForMT.Templatebuilder.Point} p1 First point.
             * @param {GeForMT.Templatebuilder.Point} p1 Second point.
             * @return {Number} Distance between points.
             */
            _distance: function(p1, p2){
                var dx = p2.x - p1.x;
                var dy = p2.y - p1.y;
                return Math.sqrt(dx * dx + dy * dy);
            },
            /**
             * Calculate path length.
             * @param {Array} points
             * @return {Number} Path length.
             */
            _pathLength: function(points){
                var d = 0.0;
                for (var i = 1; i < points.length; i++) {
                    d += this._distance(points[i - 1], points[i]);
                }
                return d;
            }
            
        };
        
        /**
         * StaticGestureRecognizer Recognizes static gestures like POINT. In
         * this version only simple POINT gestures are implemented!
         * @class
         */
        function StaticGestureRecognizer(){
        
        }
        
        StaticGestureRecognizer.prototype = /*@lends*/ {
        
            /**
             * Maximum of movement range, where a point gesture can bee recognized.
             * @type Number
             * @default 10
             */
            movementRadius: 10,
            /**
             * Main function to compare performed gestures and candidate gestures.
             * @param {Object} performedGestures
             * @param {Object} candidateGestures
             * @return {Object} Structure: (gestureId => optionIndex)
             */
            recognize: function(performedGestures, candidateGestures){
                var candidateGestureKeys = Object.keys(candidateGestures);
                var result = {};
                for (var i = 0; i < candidateGestureKeys.length; i++) {
                
                    var candidateId = candidateGestureKeys[i];
                    var candidate = candidateGestures[candidateId];
                    var optionKeys = Object.keys(candidate);
                    var options = candidateGestures[candidateId];
                    var templates = performedGestures[candidateId]; // check for
                    // simultanous
                    // contacts
                    for (var o = 0; o < optionKeys.length; o++) {
                        var atomicGestures = options[optionKeys[o]];
                        var optionRecognized = false;
                        for (var t = 0; t < templates.length; t++) {
                            // single contact
                            var points = templates[t].points;
                            var events = templates[t].events;
                            var dx = points[points.length - 1].x - points[0].x;
                            var dy = points[points.length - 1].y - points[0].y;
                            var movementDistance = Math.sqrt(dx * dx + dy * dy);
                            if (movementDistance < this.movementRadius && atomicGestures[0].gestureType == GeForMT.CONTACT_TYPES.POINT) {
                                // POINT recognized
                                optionRecognized = true;
                            }
                            else {
                                optionRecognized = false;
                                // case MOVE gesture definition
                                if (atomicGestures[0].gestureType == GeForMT.CONTACT_TYPES.MOVE) {
                                    optionRecognized = true;
                                }
                                break;
                            }
                        }
                        if (optionRecognized) {
                            result[candidateId] = {};
                            result[candidateId] = parseInt(optionKeys[o]);
                            break;
                        }
                    }
                }
                return result;
            }
        };
        
        /**
         * Gesture recognition algorithm based on '$1-Recognizer' by WOBBROCK et al. and 'Protractor' by LI.
         * Recognizes unistroke gesture ist adapted for multitouch gesture recognition.
         * @param {Boolean} useProtractor Set true, if you want to use protractor as recognition strategy.
         * @param {Number} numberOfPoints Number of points for resampling.
         * @param {Number} squareSize Init square size.
         * @param {Number} recognitionThreshold Init a recognition threshold.
         * @class
         */
        function DollarRecognizer(useProtractor, numberOfPoints, squareSize, recognitionThreshold){
            if (typeof useProtractor !== 'undefined' && useProtractor !== null) {
                this.useProtractor = useProtractor;
            }
            if (typeof numberOfPoints !== 'undefined' &&
            numberOfPoints !== null) {
                this.numberOfPoints = numberOfPoints;
            }
            if (typeof squareSize !== 'undefined' && squareSize !== null) {
                this.squareSize = squareSize;
            }
            if (typeof recognitionThreshold !== 'undefined' &&
            recognitionThreshold !== null) {
                if (this.useProtractor) {
                    this.protractorRecognitionThreshold = recognitionThreshold;
                }
                else {
                    this.dollarOneRecognitionThreshold = recognitionThreshold;
                }
            }
            this.angleRange = this._deg2Rad(45.0);
            this.anglePrecision = this._deg2Rad(2.0);
        }
        
        DollarRecognizer.prototype = /*@lends*/ {
            /**
             * If true, Protractor algorithm is used. Else $1 recognizer algorithm of Wobbrock et al. is used.
             */
            useProtractor: false,
            /**
             * Maximum of average distance where a gesture can be recognized.
             * This restriction is necessary since $1 and Proctractor are calculating the best fit.
             * @type Number
             * @default 0.6
             */
            protractorRecognitionThreshold: 0.6,
            /**
             * Maximum of average distance where a gesture can be recognized.
             * This restriction is necessary since $1 and Proctractor are calculating the best fit.
             * @type Number
             * @default 50.0
             */
            dollarOneRecognitionThreshold: 50.0,
            /**
             * Number of points for resampling.
             * @type Number
             * @default 64
             */
            numberOfPoints: 64,
            /**
             * Square size.
             * @type Number
             * @default 250.0
             */
            squareSize: 250.0,
            /**
             * Threshold to recognize unidimensional gestures.
             * // customize to desired gesture set (usually 0.20-0.35)
             * @type Number
             * @default 20.0
             */
            oneDThreshold: 0.20,
            /**
             * Reference point represented by x and y coordinate.
             * @type Object
             * @default x=0 and y=0
             */
            origin: {
                x: 0,
                y: 0
            },
            /**
             * Diagonal of the square size.
             * @type Number
             */
            diagonal: Math.sqrt(this.squareSize * this.squareSize +
            this.squareSize * this.squareSize),
            /**
             * Half diagonal of the square size.
             * @type Number
             */
            halfDiagonal: 0.5 * this.diagonal,
            /**
             * Angle range.
             * @type Number
             * @default null
             */
            angleRange: null,
            /**
             * Angle precision.
             * @type Number
             * @default null
             */
            anglePrecision: null,
            /**
             * Golden Ratio.
             * @type Number
             */
            phi: 0.5 * (-1.0 + Math.sqrt(5.0)),
            /**
             * Main function of this recognition strategy.
             * @param {Object} performedGesturePathes
             * @param {Object} candidateGestures
             * @return {Object} Recognized gestures. Structure: (gestureId => optionIndex,..)
             */
            recognize: function(performedGesturePathes, candidateGestures){
                var candidateGestureKeys = Object.keys(candidateGestures);
                // calculate minimal distance between template and candidate
                var b = +Infinity;
                var t = 0;
                // dList contains calculated distances corresponding to
                // priorityList
                var dList = [];
                // distances data structure will be overwritten with calculated
                // distances
                var distances = {};
                var d;
                // each relevant gesture of priority list
                for (var i = 0; i < candidateGestureKeys.length; i++) {
                    var candidateId = candidateGestureKeys[i];
                    var candidate = candidateGestures[candidateId];
                    var optionKeys = Object.keys(candidate);
                    var options = candidateGestures[candidateId];
                    distances[candidateId] = {};
                    
                    for (var o = 0; o < optionKeys.length; o++) {
                        var atomicGestures = options[optionKeys[o]];
                        distances[candidateId][optionKeys[o]] = +Infinity;
                        var averageDistanceOfSynchrounousperformedGestures = null;
                        for (var ag = 0; ag < atomicGestures.length; ag++) {
                            var atomicGesture = atomicGestures[ag];
                            var atomicGestureVariants = atomicGestures[ag].templates;
                            var performedPathes = performedGesturePathes[candidateId];
                            var performedGestureVectors;
                            var performedGesturePoints;
                            
                            var bestFitDistanceOfPerformedPath = +Infinity;
                            for (var pg = 0; pg < performedPathes.length; pg++) {
                                if (this.useProtractor) {
                                    if (atomicGesture.rotationInvariant) {
                                        performedGestureVectors = this.getNormalizedVectors(performedPathes[pg], true);
                                    }
                                    else {
                                        performedGestureVectors = this.getNormalizedVectors(performedPathes[pg], false);
                                    }
                                }
                                else {
                                    if (atomicGesture.rotationInvariant) {
                                        performedGesturePoints = this.getNormalizedPoints(performedPathes[pg], true);
                                    }
                                    else {
                                        performedGesturePoints = this.getNormalizedPoints(performedPathes[pg], false);
                                    }
                                }
                                
                                // var atomicGestureVariants =
                                // atomicGesture.templates;
                                // every variant of this atomic gesture
                                var minVariantDistance = +Infinity;
                                for (var v = 0; v < atomicGestureVariants.length; v++) {
                                    var variant = atomicGestureVariants[v];
                                    var variantVectors;
                                    var variantPoints;
                                    
                                    if (this.useProtractor) {
                                        if (atomicGesture.rotationInvariant) {
                                            variantVectors = this.getNormalizedVectors(variant, true);
                                        }
                                        else {
                                            variantVectors = this.getNormalizedVectors(variant, false);
                                        }
                                    }
                                    else {
                                        if (atomicGesture.rotationInvariant) {
                                        
                                            variantPoints = this.getNormalizedPoints(variant, true);
                                            
                                        }
                                        else {
                                            variantPoints = this.getNormalizedPoints(variant, false);
                                        }
                                    }
                                    if (this.useProtractor) {
                                        d = this.optimalCosineDistance(variantVectors, performedGestureVectors);
                                    }
                                    else {
                                        // Golden Section Search (original $1)
                                        d = this.distanceAtBestAngle(performedGesturePoints, variantPoints, -this.angleRange, +this.angleRange, this.anglePrecision);
                                    }
                                    if (d < minVariantDistance) {
                                        minVariantDistance = d;
                                    }
                                }
                                if (minVariantDistance < bestFitDistanceOfPerformedPath) {
                                    bestFitDistanceOfPerformedPath = minVariantDistance;
                                    
                                }
                            }
                            
                            if (averageDistanceOfSynchrounousperformedGestures == null) {
                                averageDistanceOfSynchrounousperformedGestures = bestFitDistanceOfPerformedPath;
                            }
                            else {
                                averageDistanceOfSynchrounousperformedGestures = averageDistanceOfSynchrounousperformedGestures +
                                bestFitDistanceOfPerformedPath;
                            }
                            
                        }
                        
                        d = averageDistanceOfSynchrounousperformedGestures;
                        
                        // overwrite distance model
                        var distanceModel = distances[candidateId][optionKeys[o]];
                        if (typeof distanceModel === 'number') {
                            if (d < distanceModel) {
                                distances[candidateId][optionKeys[o]] = d;
                            }
                        }
                        else {
                            distances[candidateId][optionKeys[o]] = d;
                        }
                        //is distance lower?
                        if (d < b) {
                            b = d; // best (least) distance
                            t = i; // unistroke template
                        }
                        //}
                    }
                    
                }
                
                var recognitionThreshold = this.useProtractor ? this.protractorRecognitionThreshold : this.dollarOneRecognitionThreshold;
                if (b < recognitionThreshold) {
                    // get all gestures with best (least) distance
                    var recognizedGestures = {};
                    for (var r = 0; r < candidateGestureKeys.length; r++) {
                        var options = distances[candidateGestureKeys[r]];
                        for (var m = 0; m < Object.keys(options).length; m++) {
                            var atomicGestures = options[Object.keys(options)[m]];
                            if (atomicGestures == b) {
                                recognizedGestures[candidateGestureKeys[r]] = parseInt(Object.keys(options)[m]);
                                
                            }
                        }
                    }
                    return recognizedGestures;
                }
                else {
                    return {};
                }
                
            },
            /**
             * Calculate distance between candidate and template based on vectors.
             * Protractor algorithm.
             * @param {Array} v1 List of template vectors.
             * @param {Array} v2 List of candidate vectors.
             */
            optimalCosineDistance: function(v1, v2){
                var a = 0.0;
                var b = 0.0;
                for (var i = 0; i < v1.length; i += 2) {
                    a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
                    b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
                }
                var angle = Math.atan(b / a);
                return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
            },
            /**
             * Calculate distance between candidate and template based on vectors.
             * $1-Algorithm.
             * @param {Array} points
             * @param {Array} variantPoints
             * @param {Number} a
             * @param {Number} b
             * @param {Number} threshold
             */
            distanceAtBestAngle: function(points, variantPoints, a, b, threshold){
                var x1 = this.phi * a + (1.0 - this.phi) * b;
                var f1 = this._distanceAtAngle(points, variantPoints, x1);
                var x2 = (1.0 - this.phi) * a + this.phi * b;
                var f2 = this._distanceAtAngle(points, variantPoints, x2);
                while (Math.abs(b - a) > threshold) {
                    if (f1 < f2) {
                        b = x2;
                        x2 = x1;
                        f2 = f1;
                        x1 = this.phi * a + (1.0 - this.phi) * b;
                        f1 = this._distanceAtAngle(points, variantPoints, x1);
                    }
                    else {
                        a = x1;
                        x1 = x2;
                        f1 = f2;
                        x2 = (1.0 - this.phi) * a + this.phi * b;
                        f2 = this._distanceAtAngle(points, variantPoints, x2);
                    }
                }
                return Math.min(f1, f2);
                
            },
            /**
             * Normalizes templates and returns a list of vectors representing a compareable gesture data structure.
             * @param {Object} template
             * @param {Boolean} useBoundedRotationInvariance
             * @return {Array} List of vectors.
             */
            getNormalizedVectors: function(template, useBoundedRotationInvariance){
                var points = template.points.slice();
                points = this._resample(points, this.numberOfPoints);
                var radians = this._indicativeAngle(points);
                if (!useBoundedRotationInvariance) {
                    points = this._rotateBy(points, -radians);
                }
                points = this._scaleTo(points, this.squareSize, this.oneDThreshold);
                // if (useBoundedRotationInvariance) {
                // this.Points = this._rotateBy(points, +radians); // restore
                // }
                points = this._translateTo(points, this.origin);
                var vectors = this._vectorize(points, useBoundedRotationInvariance);
                return vectors;
            },
            /**
             * Normalizes templates and returns a list of points representing a compareable gesture data structure.
             * @param {Object} template
             * @param {Boolean} useBoundedRotationInvariance
             * @return {Array} Normalized points.
             */
            getNormalizedPoints: function(template, useBoundedRotationInvariance){
            
                var points = template.points.slice();
                points = this._resample(points, this.numberOfPoints);
                var radians = this._indicativeAngle(points);
                if (!useBoundedRotationInvariance) {
                    points = this._rotateBy(points, -radians);
                }
                points = this._scaleTo(points, this.squareSize, this.oneDThreshold);
                points = this._translateTo(points, this.origin);
                return points;
            },
            /**
             * Calculate distance at best angle.
             * @param {Array} points
             * @param {Array} variantPoints
             * @param {Number} radians
             * @return {Number} Distance
             */
            _distanceAtAngle: function(points, variantPoints, radians){
                var newpoints = this._rotateBy(points, radians);
                return this._pathDistance(newpoints, variantPoints);
            },
            /**
             * Resample points based on number of points n.
             * @param {Array} points
             * @param {Number} n
             * @param {Array} Resampled points.
             */
            _resample: function(points, n){
            
                var I = this._pathLength(points) / (n - 1); // interval length
                var D = 0.0;
                var newpoints = [points[0]];
                
                for (var i = 1; i < points.length; i++) {
                
                    var d = this._distance(points[i - 1], points[i]);
                    
                    if ((D + d) >= I) {
                        var qx = points[i - 1].x +
                        ((I - D) / d) *
                        (points[i].x - points[i - 1].x);
                        
                        var qy = points[i - 1].y +
                        ((I - D) / d) *
                        (points[i].y - points[i - 1].y);
                        var q = {
                            x: qx,
                            y: qy
                        };
                        newpoints[newpoints.length] = q; // append new point
                        // 'q'
                        points.splice(i, 0, q); // insert 'q' at position i in
                        // points s.t. 'q' will be the next
                        // i
                        D = 0.0;
                        
                    }
                    else {
                        D += d;
                    }
                }
                
                // somtimes we fall a rounding-error short of adding the last point, so add it if so
                if (newpoints.length == n - 1) {
                    newpoints[newpoints.length] = {
                        x: points[points.length - 1].x,
                        y: points[points.length - 1].y
                    };
                }
                return newpoints;
            },
            /**
             * Calculate indicative angle.
             * @param {Array} points
             * @return {Number}
             */
            _indicativeAngle: function(points){
                var c = this._centroid(points);
                return Math.atan2(c.y - points[0].y, c.x - points[0].x);
            },
            /**
             * Rotates points around centroid.
             * @param {Array} points
             * @param {Number} radians
             * @return {Array} Points.
             */
            _rotateBy: function(points, radians){
                var c = this._centroid(points);
                var cos = Math.cos(radians);
                var sin = Math.sin(radians);
                
                var newpoints = [];
                for (var i = 0; i < points.length; i++) {
                    var qx = (points[i].x - c.x) * cos -
                    (points[i].y - c.y) *
                    sin +
                    c.x;
                    var qy = (points[i].x - c.x) * sin +
                    (points[i].y - c.y) *
                    cos +
                    c.y;
                    newpoints[newpoints.length] = {
                        x: qx,
                        y: qy
                    };
                }
                return newpoints;
            },
            /**
             * Scales bbox uniformly for 1D, non-uniformly for 2D
             * @param {Array} points
             * @param {Number} size
             * @param {Number} oneDratio
             * @return {Array} Scaled point path.
             */
            _scaleTo: function(points, size, oneDratio){
                var B = this._boundingBox(points);
                var uniformly = Math.min(B.width / B.height, B.height / B.width) <=
                oneDratio; // 1D
                // or
                // 2D
                // gesture
                // test
                var newpoints = [];
                for (var i = 0; i < points.length; i++) {
                    var qx = (uniformly) ? points[i].x *
                    (size / Math.max(B.width, B.height)) : points[i].x * (size / B.width);
                    var qy = (uniformly) ? points[i].y *
                    (size / Math.max(B.width, B.height)) : points[i].y * (size / B.height);
                    newpoints[newpoints.length] = {
                        x: qx,
                        y: qy
                    };
                }
                return newpoints;
            },
            /**
             * Translates points' centroid.
             * @param {Array} points
             * @param {Object} pt Reference point
             * @return {Array} Translated point path.
             */
            _translateTo: function(points, pt){
                var c = this._centroid(points);
                var newpoints = [];
                for (var i = 0; i < points.length; i++) {
                    var qx = points[i].x + pt.x - c.x;
                    var qy = points[i].y + pt.y - c.y;
                    newpoints[newpoints.length] = {
                        x: qx,
                        y: qy
                    };
                }
                return newpoints;
            },
            /**
             * Calculates path distance based on two points.
             * @param {Object} pts1
             * @param {Object} pts2
             * @return {Number} Distance
             */
            _pathDistance: function(pts1, pts2){
                var d = 0.0;
                for (var i = 0; i < pts1.length; i++) 
                    // assumes pts1.length == pts2.length
                    d += this._distance(pts1[i], pts2[i]);
                return d / pts1.length;
            },
            /**
             * Calculates path length.
             * @param {Array} points
             * @return {Number} Path length.
             */
            _pathLength: function(points){
                var d = 0.0;
                for (var i = 1; i < points.length; i++) {
                    d += this._distance(points[i - 1], points[i]);
                }
                return d;
            },
            /**
             * Calculate centroid.
             * @param {Array} points
             * @return {Object} Centroid point.
             */
            _centroid: function(points){
                var x = 0.0, y = 0.0;
                for (var i = 0; i < points.length; i++) {
                    x += points[i].x;
                    y += points[i].y;
                }
                x /= points.length;
                y /= points.length;
                return {
                    x: x,
                    y: y
                };
            },
            /**
             * Calculate bounding box of the gesture.
             * @param {Array} points
             * @return {Object} Bounding box represented by the following parameters: x,y, width and height.
             */
            _boundingBox: function(points){
                var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
                for (var i = 0; i < points.length; i++) {
                    if (points[i].x < minX) {
                        minX = points[i].x;
                    }
                    if (points[i].x > maxX) {
                        maxX = points[i].x;
                    }
                    if (points[i].y < minY) {
                        minY = points[i].y;
                    }
                    if (points[i].y > maxY) {
                        maxY = points[i].y;
                    }
                }
                //return new Rectangle(minX, minY, maxX - minX, maxY - minY);
                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                };
            },
            /**
             * Vectorize gesture path.
             * @param {Array} points
             * @param {Boolean} useBoundedRotationInvariance
             * @return {Array} List of vectors.
             */
            _vectorize: function(points, useBoundedRotationInvariance){
                /*var cos = 1.0;
                 var sin = 0.0;
                 if (useBoundedRotationInvariance) {
                 var iAngle = Math.atan2(points[0].y, points[0].x);
                 var baseOrientation = (Math.PI / 4.0)
                 * Math
                 .floor((iAngle + Math.PI / 8.0)
                 / (Math.PI / 4.0));
                 cos = Math.cos(baseOrientation - iAngle);
                 sin = Math.sin(baseOrientation - iAngle);
                 }*/
                var sum = 0.0;
                var vector = [];
                /*
                 * for ( var i = 0; i < points.length; i++) { var newX =
                 * points[i].x * cos - points[i].y * sin; var newY = points[i].y *
                 * cos + points[i].x * sin; vector[vector.length] = newX;
                 * vector[vector.length] = newY; sum += newX * newX + newY *
                 * newY; }
                 */
                for (var i = 0; i < points.length; i++) {
                    vector[vector.length] = points[i].x;
                    vector[vector.length] = points[i].y;
                    sum += points[i].x * points[i].x +
                    points[i].y *
                    points[i].y;
                }
                var magnitude = Math.sqrt(sum);
                for (var j = 0; j < vector.length; j++) {
                    vector[j] /= magnitude;
                }
                return vector;
            },
            /**
             * Calculate distance between two points.
             * @param {Object} p1
             * @param {Object} p2
             * @return {Number} Distance between points.
             */
            _distance: function(p1, p2){
                var dx = p2.x - p1.x;
                var dy = p2.y - p1.y;
                return Math.sqrt(dx * dx + dy * dy);
            },
            /**
             * Convert degree to radian.
             * @param {Number} d Degrees.
             * @return {Number} Radian.
             */
            _deg2Rad: function(d){
                return (d * Math.PI / 180.0);
            },
            /**
             * Convert radian to degree.
             * @param {Number} r Radian.
             * @return {Number} Degrees.
             */
            _rad2Deg: function(r){
                return (r * 180.0 / Math.PI);
            }
        };
        
        return {
            /**
             * Initialize recognizer settings and recognition strategies.
             */
            init: function(){
            
                // init recognition strategies
                this.Strategy.DollarRecognizer = new DollarRecognizer();
                this.Strategy.StaticGestureRecognizer = new StaticGestureRecognizer();
                this.Strategy.RelationRecognizer = new RelationRecognizer();
            },
            /**
             * Possible strategies of gesture recognition.
             * a) Strategy.DollarRecognizer
             * b) Strategy.StaticGestureRecognizer
             * c) Strategy.RelationRecognizer
             */
            Strategy: {
                DollarRecognizer: null,
                StaticGestureRecognizer: null,
                RelationRecognizer: null
            },
            /**
             * True if the recognizer is busy, else false.
             * @type Boolean
             * @default false
             */
            busy: false,
            /**
             * Start recognizing a gesture with the given recognition context.
             * @param {GeForMT.GestureRecognition.RecognitionContext} recognitionContext
             */
            recognize: function(recognitionContext){
            
                this.busy = true;
                
                var atomicPathGestureCandidates = {};
                var atomicStaticGestureCandidates = {};
                
                var priorities = recognitionContext.priorities;
                var gesturePathes = recognitionContext.gesturePathes;
                var gesturePathesHistory = recognitionContext.gesturePathesHistory;
                var onlineRecognition = recognitionContext.online;
                
                for (var i = 0; i < priorities.length; i++) {
                    var gestureId = priorities[i];
                    var gestureModel = recognitionContext.models[gestureId].model;
                    var templates = recognitionContext.gesturePathes[gestureId];
                    var checkmodel = recognitionContext.checkmodels[gestureId];
                    
                    // option checked?
                    var options = gestureModel.options;
                    for (var j = 0; j < options.length; j++) {
                        if (!checkmodel.optionProcessed(j)) {
                        
                            var composite = options[j].composite;
                            if (options[j].isSynchronousComposedGesture ||
                            options[j].isAsynchronousComposedGesture) {
                                //synchronous and asynchronous gestures							
                                // atomicPathGestureCandidates[gestureId][j] =
                                // composite;
                                // get expected number of contacts and check for
                                // path or static
                                var numberOfContacts = 0;
                                var allPathGestures = true;
                                for (var at = 0; at < composite.length; at++) {
                                    if (composite[at].numberOfContacts == null) {
                                        numberOfContacts = null;
                                        break;
                                    }
                                    else {
                                        numberOfContacts = numberOfContacts +
                                        composite[at].numberOfContacts;
                                    }
                                    if (!composite[at].isPathGesture &&
                                    !allPathGestures) {
                                        allPathGestures = false;
                                    }
                                }
                                
                                // check number of contacts
                                if (numberOfContacts == null ||
                                numberOfContacts == templates.length) {
                                
                                    if (allPathGestures) {
                                        //atomic gesture is path
                                        if (typeof atomicPathGestureCandidates[gestureId] == 'undefined') {
                                            atomicPathGestureCandidates[gestureId] = {};
                                        }
                                        atomicPathGestureCandidates[gestureId][j] = composite;
                                    }
                                    else {
                                        //atomic gestures are static
                                        if (typeof atomicStaticGestureCandidates[gestureId] == 'undefined') {
                                            atomicStaticGestureCandidates[gestureId] = {};
                                        }
                                        atomicStaticGestureCandidates[gestureId][j] = composite;
                                    }
                                }
                            }
                            else {
                                // unistroke gesture (can also be a part of multistroke gesture)
                                var compTaskIdx = checkmodel.getNextTaskIdx(j);
                                var atom = composite[compTaskIdx];
                                // check number of contacts
                                if (atom.numberOfContacts == null ||
                                atom.numberOfContacts == templates.length) {
                                    if (atom.isPathGesture) {
                                        //atomic gesture is path
                                        if (typeof atomicPathGestureCandidates[gestureId] == 'undefined') {
                                            atomicPathGestureCandidates[gestureId] = {};
                                        }
                                        atomicPathGestureCandidates[gestureId][j] = [atom];
                                        
                                    }
                                    else {
                                        //atomic gesture is static
                                        if (typeof atomicStaticGestureCandidates[gestureId] == 'undefined') {
                                            atomicStaticGestureCandidates[gestureId] = {};
                                        }
                                        atomicStaticGestureCandidates[gestureId][j] = [atom];
                                    }
                                }
                                
                            }
                            
                        }
                    }
                }
                
                var offlineRecognizerResult = {};
                var staticRecognizerResult = {};
                var recognitionResult = {};
                
                // recognize offline path gestures
                if (Object.keys(atomicPathGestureCandidates).length > 0) {
                    offlineRecognizerResult = this.Strategy.DollarRecognizer.recognize(gesturePathes, atomicPathGestureCandidates);
                }

                //recognize point gestures
                if (Object.keys(atomicStaticGestureCandidates).length > 0) {
                    staticRecognizerResult = this.Strategy.StaticGestureRecognizer.recognize(gesturePathes, atomicStaticGestureCandidates);
                }
                
                if (Object.keys(offlineRecognizerResult).length > 0) {
                    recognitionResult = offlineRecognizerResult;
                }
                else 
                    if (Object.keys(staticRecognizerResult).length > 0) {
                        recognitionResult = staticRecognizerResult;
                    }

                var recognitionResultKeys = Object.keys(recognitionResult);
                // check relation properties
                if (recognitionResultKeys.length > 0) {
                    var relationCheckContext = {};
                    var newRecognitionResult = {};
                    
                    for (var r = 0; r < recognitionResultKeys.length; r++) {
                        var id = recognitionResultKeys[r];
                        var model = recognitionContext.models[id].model;
                        var option = model.options[recognitionResult[id]];
                        var relation = option.relationType;
                        if (relation !== null) {
                            relationCheckContext[id] = {
                                option: recognitionResult[id],
                                relation: relation,
                                isMultistroke: option.isMultistrokeGesture,
                                isMultitouch: option.isSynchronousComposedGesture || option.isAsynchronousComposedGesture || option.composite[0].numberOfContacts !== 1
                            };
                        }
                        else {
                            newRecognitionResult[id] = recognitionResult[id];
                        }
                        
                    }
                    
                    var relationCheckResult = {};
                    if (Object.keys(relationCheckContext).length > 0) {
                        //check relations
                        relationCheckResult = this.Strategy.RelationRecognizer.recognize(gesturePathes, gesturePathesHistory, relationCheckContext);
                        
                    }
                    var relationCheckResultKeys = Object.keys(relationCheckResult);
                    
                    // add recognizedRelations of checkResult
                    for (var rc = 0; rc < relationCheckResultKeys.length; rc++) {
                        newRecognitionResult[relationCheckResultKeys[rc]] = relationCheckResult[relationCheckResultKeys[rc]];
                    }
                    recognitionResult = newRecognitionResult;
                }
                if (!onlineRecognition) {
                    // update checklists
                    var recognitionResultKeys = Object.keys(recognitionResult);
                    for (var r = 0; r < recognitionResultKeys.length; r++) {
                        var gestureId = recognitionResultKeys[r];
                        var optionId = recognitionResult[gestureId];
                        var option = recognitionContext.models[gestureId].model.options[optionId];
                        if (option.isSynchronousComposedGesture ||
                        option.isAsynchronousComposedGesture) {
                            recognitionContext.checkmodels[gestureId].setOtherOptionsToFalse(optionId);
                            recognitionContext.checkmodels[gestureId].setAllAtomsOfOptionTrue(optionId);
                        }
                        else {
                            var taskIdx = recognitionContext.checkmodels[gestureId].getNextTaskIdx(optionId);
                            recognitionContext.checkmodels[gestureId].setOtherOptionsToFalse(optionId);
                            recognitionContext.checkmodels[gestureId].checkmodel[optionId][taskIdx] = true;
                        }
                    }
                }
                // call process manager back
                recognitionContext.recognizedGestures = recognitionResult;
                recognitionContext.recognitionCallback(recognitionContext);
                
                this.busy = false;
            }
        };
    })();
    
    /**
     * A task is managed by RecognitionTaskManager. The task object bundles the
     * formal criteria of a gesture and recognized events, that must be
     * compared.
     * @param {Array} priorities
     * @param {Object} eventProfiles
     * @param {Object} eventProfilesHistory
     * @param {Object} gesturePathes
     * @param {Object} gesturePathesHistory
     * @param {Object} models
     * @param {Object} checkmodels
     * @param {Function} recognitionCallback
     * @param {Boolean} online
     */
    function RecognitionContext(priorities, eventProfiles, eventProfilesHistory, gesturePathes, gesturePathesHistory, models, checkmodels, recognitionCallback, online){
        this.priorities = priorities;
        this.eventProfiles = eventProfiles;
        this.gesturePathes = gesturePathes;
        this.eventProfilesHistory = eventProfilesHistory;
        this.gesturePathesHistory = gesturePathesHistory;
        this.models = models;
        this.recognizedGestures = {};
        this.checkmodels = checkmodels;
        this.recognitionCallback = recognitionCallback;
        if (typeof online !== 'undefined') {
            this.online = online;
        }
    }
    /**
     *
     */
    RecognitionContext.prototype = /*@lends*/ {
        /**
         * List of gesture identifiers.
         * @type Array
         * @default null
         */
        priorities: null,
        /**
         * Reference to the model of the formal gesture.
         * @type Object
         * @default null
         */
        models: null,
        /**
         * Event profile of the gesture.
         * @type Object
         * @default null
         */
        eventProfiles: null,
        /**
         * Event profile passed gesture strokes.
         * @type Object
         * @default null
         */
        eventProfilesHistory: null,
        /**
         * Gesture pathes extracted from eventProfiles.
         * @type Object
         * @default null
         */
        gesturePathes: null,
        /**
         * Gesture pathes of the past.
         * @type Object
         * @default null
         */
        gesturePathesHistory: null,
        /**
         * List of gesture IDs.
         * Can be filled by recognition processor, if he recognized something.
         * @type Array
         * @default null
         */
        recognizedGestures: null,
        /**
         * Checklists.
         * @type Object
         * @default null
         */
        checkmodels: null,
        /**
         * Callback function if the recognition was successfull.
         * @type Function
         * @default null
         */
        recognitionCallback: null,
        /**
         * Online recognition?
         * @type Boolean
         * @default false
         */
        online: false
    
    };
    /**
     * Represents a checklist according to the options and composite items of
     * the gesture model.
     * @param {GeForMT.GestureModel.GestureObjectModel}
     *            model
     *  @class
     */
    function CheckModel(model){
        var checklists = [];
        for (var o = 0; o < model.options.length; o++) {
            var option = model.options[o];
            var compositeChecklist = [];
            for (var a = 0; a < option.composite.length; a++) {
                var gestureAtom = option.composite[a];
                compositeChecklist.push(null);
            }
            checklists.push(compositeChecklist);
        }
        this.checkmodel = checklists;
    }
    
    CheckModel.prototype = /*@lends*/ {
        /**
         * Checkmodel representing checklists for options and atomic gestures.
         * Is generated based on the gesture model.
         * @type Array
         * @default null.
         */
        checkmodel: null,
        /**
         * Option at position idx processed? Items can be true or false
         * @param {Object} idx
         * @return Returns false, if the option contains null values.
         */
        optionProcessed: function(idx){
            var option = this.checkmodel[idx];
            for (var i = 0; i < option.length; i++) {
                var atom = option[i];
                if (atom === null) {
                    return false;
                }
            }
            return true;
        },
        /**
         * Returns the index of the next task for recongizer based on the given option index.
         * @param {Object} optionIdx
         */
        getNextTaskIdx: function(optionIdx){
            var option = this.checkmodel[optionIdx];
            var taskIdx = 0;
            for (var i = 0; i < option.length; i++) {
                var atom = option[i];
                if (atom !== null) {
                    taskIdx++;
                }
                else {
                    break;
                }
            }
            
            return taskIdx;
        },
        /**
         * Returns true, if all atomic gestures and options has been recognized successfully (all check items true?).
         * @return Boolean
         */
        processedSuccessfully: function(){
            var check = true;
            for (var i = 0; i < this.checkmodel.length; i++) {
                var composite = this.checkmodel[i];
                for (var j = 0; j < composite.length; j++) {
                    var atom = composite[j];
                    if (atom === null) {
                        return false;
                    }
                    else 
                        if (!atom) {
                            return false;
                        }
                }
            }
            return true;
        },
        /**
         * Returns true, if all atomic gestures of one option has been recognized successfully (all check items of option true?).
         * @return Boolean
         */
        oneOptionProcessedSuccessfully: function(){
            for (var i = 0; i < this.checkmodel.length; i++) {
                var option = this.checkmodel[i];
                var optionProcessedSuc = false;
                for (var j = 0; j < option.length; j++) {
                    var atom = option[j];
                    if (atom === null) {
                        optionProcessedSuc = false;
                        break;
                    }
                    else 
                        if (!atom) {
                            optionProcessedSuc = false;
                            break;
                        }
                        else 
                            if (atom) {
                                optionProcessedSuc = true;
                            }
                }
                
                if (optionProcessedSuc) {
                    return true;
                }
            }
            return false;
        },
        /**
         * Set all values of all options except the option at the given position to false.
         * @param {Object} optionIdx
         */
        setOtherOptionsToFalse: function(optionIdx){
            for (var i = 0; i < this.checkmodel.length; i++) {
                var option = this.checkmodel[i];
                if (i !== optionIdx) {
                    for (var j = 0; j < option.length; j++) {
                        option[j] = false;
                        
                    }
                }
            }
        },
        /**
         * Set status 'recognized' on all atomic gesture of a specific option.
         * @param {Number} optionIdx
         */
        setAllAtomsOfOptionTrue: function(optionIdx){
            var option = this.checkmodel[optionIdx];
            for (var a = 0; a < option.length; a++) {
                option[a] = true;
            }
        }
    };
    
    /**
     * Notify all observers that are registered for that event. See
     * GeForMT.GestureREcognition.RegisteredGestureRecognizedEventListener for
     * possible event types.
     *
     * @param {String}
     *            eventName Type of the event.
     * @param {Object}
     *            event
     */
    function _notifyAllGestureRecognizedEventListener(eventName, event){
        var handlerList = GestureRecognitionEventListener[eventName];
        var listLength = handlerList.length;
        for (var i = 0; i < listLength; i++) {
            var callback = handlerList[i];
            if (callback != 'undefined') {
                callback(event);
            }
        }
    }
    
    return {
    
        /**
         * Initialize the recognition module.
         * @param {GeForMT.GestureModel} gestureModelModule
         * @param {GeForMT.Observation} observationModule
         * @param {GeForMT.TemplateBuilder} templateBuilder
         * @param {Number} contiguityInterval
         */
        init: function(gestureModelModule, observationModule, templateBuilder, contiguityInterval){
            //_recognizer = Recognizer[identifier];
            _gestureModelModule = gestureModelModule;
            _templateBuilder = templateBuilder;
            
            // settings
            if (typeof contiguityInterval !== 'undefined' &&
            contiguityInterval !== null) {
                _gestureContiguityInterval = contiguityInterval;
            }
            
            // register event listener
            observationModule.registerGestureEventListener('gesturestart', _gesturestart);
            observationModule.registerGestureEventListener('gesturechange', _gesturechange);
            observationModule.registerGestureEventListener('gestureend', _gestureend);
            
            // initialize recognition components
            var recognitionProcessor = Recognizer;
            recognitionProcessor.init();
            _recognitionProcessManager = new RecognitionProcessManager(recognitionProcessor);
            
        },
        /**
         * Register listener that wants to be notified states of recognition process. See GeForMT.GestureRecognition.GestureRecognitionEventListener.
         * events.
         * @param  {String} eventName Type of the event.
         * @param  {Function} callback Callback function that handels the event.
         */
        registerGestureRecognitionEventListener: function(eventName, callback){
            if (typeof GestureRecognitionEventListener[eventName] != 'undefined') {
                GestureRecognitionEventListener[eventName].push(callback);
            }
        },
        /**
         * Remove listener that wants to be notified states of recognition process. See GeForMT.GestureRecognition.GestureRecognitionEventListener.
         * @param  {String} eventName Type of the event.
         * @param  {Function} callback Callback function that handels the event.
         */
        removeGestureRecognitionEventListener: function(eventName, callback){
            if (typeof GestureRecognitionEventListener[eventName] != 'undefined') {
                var list = GestureRecognitionEventListener[eventName];
                for (var i = 0; i < list.length; i++) {
                    if (list[i] === callback) {
                        list.splice(i, 1);
                    }
                }
            }
        }
        
    };
})();
