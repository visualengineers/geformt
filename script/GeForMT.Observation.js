/**
 * Observation module
 * @namespace 
 */
GeForMT.Observation = (function(){
    /**
     * List of objects of type GeForMT.Observation.EventObservation.
     * @type Array
     * @default null
     */
    var _registeredEventObservations = null;
    /**
     * Setting to prevent default behaviour on events.
     * @type Boolean
     * @default false
     */
    var _preventDefault = false;
    /**
     * Registered listeners that wants to be notified of all events on interface objects related to defined gestures.
     * Holds listener objects for specific events. Accordingly the object contains variables 'gesturestart', 
     * 'gesturechange' and 'gestureend' holding an array of callback functions.
     * @type Object
     */
    var RegisteredGestureEventListener = {
        gesturestart: [],
        gesturechange: [],
        gestureend: []
    };
    
    /**
     * Registered listener that wants to be notified of events on document only.
     * Holds listener objects for specific events. Accordingly the object contains variables like 'gesturestart', 
     * 'gesturechange' and 'gestureend' holding an array of callback functions.
     * @type Object
     */
    var RegisteredDocumentEventListener = {
        gesturestart: [],
        gesturechange: [],
        gestureend: []
    };
    
    /**
     * EventObservation for entire web interface. Events are registered on document object.
     * This is necessary to detect events beyond objects that registered
     * for gestures, especially for feedback visualization.
     * @type GeForMT.Observation.EventObservation
     * @default null
     */
    var _documentEventObservation = null;
    
    /**
     * Global attribute to enable/ disable mousemove events.
     * @type Boolean
     * @default false
     */
    var _mouseMoveEventEnabled = false;
    /**
     * Identifier that is incremented and is used for mouse-touch-emulation.
     */
    var _mouseStrokeId=0;
    /**
     * Enumeration of possible mouse and touch events. 
     * @type Object
     */
    var EVENT_TYPES = /*lends*/{
    	/**
    	 * Touchstart event
    	 * @constant
    	 */
        TOUCHSTART: 0,
         /**
    	 * Touchend event
    	 * @constant
    	 */
        TOUCHEND: 1,
         /**
    	 * Touchmove event
    	 * @constant
    	 */
        TOUCHMOVE: 2,
        /**
    	 * Touchenter event
    	 * @constant
    	 */
        TOUCHENTER: 3,
         /**
    	 * Touchleave event
    	 * @constant
    	 */
        TOUCHLEAVE: 4,
       /**
    	 * Touchcancel event
    	 * @constant
    	 */
        TOUCHCANCEL: 5,
            	/**
    	 * Mousedown event
    	 * @constant
    	 */
        MOUSEDOWN: 6,
            	/**
    	 * Mouseup event
    	 * @constant
    	 */
        MOUSEUP: 7,
            	/**
    	 * Mousemove event
    	 * @constant
    	 */
        MOUSEMOVE: 8,
            	/**
    	 * Mouseover event
    	 * @constant
    	 */
        MOUSEOVER: 9,
            	/**
    	 * Mouseout event
    	 * @constant
    	 */
        MOUSEOUT: 10
    };
    
	 /**
     * Contact object that generalizes a single mouse or touch contact point.
     * The object interface is based on the Touch Event API Recommendation of W3C.
     * @exports Contact as GeForMT.Observation.Contact
     * @class
     * @param {String} identifier
	 * @param {Number} screenX
	 * @param {Number} screenY
	 * @param {Number} clientX
	 * @param {Number} clientY
	 * @param {Number} pageX
	 * @param {Number} pageY
	 * @param {Number} radiusX
	 * @param {Number} radiusY
	 * @param {Number} rotationAngle
	 * @param {Float} force
     *
     * @see http://www.w3.org/TR/2011/CR-touch-events-20111215/
     * @see https://developer.mozilla.org/en/DOM/Touch
     */
     function Contact(identifier, screenX, screenY, clientX, clientY, pageX, pageY, radiusX, radiusY, rotationAngle, force){
        
		if (identifier !== 'undefined' && identifier !== null) {
            this.identifier = identifier;
        }
        if (screenX !== 'undefined' && screenX !== null) {
            this.screenX = screenX;
        }
        if (screenY !== 'undefined' && screenY !== null) {
            this.screenY = screenY;
        }
        if (clientX !== 'undefined' && clientX !== null) {
            this.clientX = clientX;
        }
        if (clientY !== 'undefined' && clientY !== null) {
            this.clientY = clientY;
        }
        if (pageX !== 'undefined' && pageX !== null) {
            this.pageX = pageX;
        }
        if (pageY !== 'undefined' && pageY !== null) {
            this.pageY = pageY;
        }
        if (radiusX !== 'undefined' && radiusX !== null) {
            this.radiusX = radiusX;
        }
        if (radiusY !== 'undefined' && radiusY !== null) {
            this.radiusY = radiusY;
        }
        if (rotationAngle !== 'undefined' && rotationAngle !== null) {
            this.rotationAngle = rotationAngle;
        }
        if (force !== 'undefined' && force !== null) {
            this.force = force;
        }
		
    }
    Contact.prototype = /** @lends GeForMT.Observation-Contact*/ {
        /**
         * Identifier of a contact.
         * Can be null: For example for Mouse-Events identifier is null.
         * @type String
         */
        identifier: null,
        /**
         * X-coordinate of a contact point relative to the screen.
         * @type Number
         * @default 0
         */
        screenX: 0,
        /**
         * Y-coordinate of a contact point relative to the screen.
         * @type Number
         * @default 0
         */
        screenY: 0,
        /**
         * X-coordinate of a contact point, excluding any scroll offset.
         * @type Number
         * @default 0
         */
        clientX: 0,
        /**
         * Y-coordinate of a contact point, excluding any scroll offset.
         * @type Number
         * @default 0
         */
        clientY: 0,
        /**
         * X-coordinate of a contact point, including any scroll offset.
         * @type Number
         * @default 0
         */
        pageX: 0,
        /**
         * Y-coordinate of a contact point, including any scroll offset.
         * @type Number
         * @default 0
         */
        pageY: 0,
        /**
         * The radius of the ellipse which most closely circumscribes the touching area (e.g. finger, stylus) along the x-axis, in pixels of the same scale as screenX; 1 if no value is known. The value must be positive.
         * @type Number
         * @default 1
         */
        radiusX: 1,
        /**
         * The radius of the ellipse which most closely circumscribes the touching area (e.g. finger, stylus) along the y-axis, in pixels of the same scale as screenY; 1 if no value is known. The value must be positive.
         * @type Number
         * @default 1
         */
        radiusY: 1,
        /**
         * The angle (in degrees) that the ellipse described by radiusX and radiusY is rotated clockwise about its center; 0 if no value is known. The value must be greater than or equal to 0 and less than 90
         */
        rotationAngle: 0,
        /**
         * a relative value of pressure applied, in the range 0 to 1, where 0 is no pressure, and 1 is the highest level of pressure the touch device is capable of sensing; 0 if no value is known.
         * @type Float
         * @default 0
         */
        force: 0
    };
    
	/**
	 * EventObservation
	 * @exports EventObservation as GeForMT.Observation.EventObservation
	 * @class
	 * @param {String} gestureId Identifier of the gesture
	 * @param {Element} element Element node of the DOM tree
	 * @param {Boolean} captureEvents Event flow: True for capturing or false for bubbling
	 */
     function EventObservation(gestureId, element, captureEvents){
    
        this.gestureIdList = [gestureId];
        
        
        this.element = element;
        //console.debug(this.element);
        try {
            // touch events
            _addEventListener(this.element, 'touchstart', this._getEventHandler(EVENT_TYPES.TOUCHSTART),captureEvents);
            _addEventListener(this.element, 'touchend', this._getEventHandler(EVENT_TYPES.TOUCHEND),captureEvents);
            _addEventListener(this.element, 'touchmove', this._getEventHandler(EVENT_TYPES.TOUCHMOVE),captureEvents);
            _addEventListener(this.element, 'touchcancel', this._getEventHandler(EVENT_TYPES.TOUCHCANCEL),captureEvents);
            _addEventListener(this.element, 'touchenter', this._getEventHandler(EVENT_TYPES.TOUCHENTER),captureEvents);
            _addEventListener(this.element, 'touchleave', this._getEventHandler(EVENT_TYPES.TOUCHLEAVE),captureEvents);
            
            // mouse events
            _addEventListener(this.element, 'mousedown', this._getEventHandler(EVENT_TYPES.MOUSEDOWN),captureEvents);
            _addEventListener(this.element, 'mousemove', this._getEventHandler(EVENT_TYPES.MOUSEMOVE),captureEvents);
            _addEventListener(this.element, 'mouseup', this._getEventHandler(EVENT_TYPES.MOUSEUP),captureEvents);
            _addEventListener(this.element, 'mouseover', this._getEventHandler(EVENT_TYPES.MOUSEOVER),captureEvents);
            _addEventListener(this.element, 'mouseout', this._getEventHandler(EVENT_TYPES.MOUSEOUT),captureEvents);
        } 
        catch (e) {
            // throw own exception with additional information
            throw "Exception while adding event listener on element [" +
            this.element +
            "] of gesture with key [" +
            gestureId +
            "]: /n " +
            e;
        }
        
    }
    
    EventObservation.prototype = /** @lends GeForMT.Observation-EventObservation*/{
        /**
         * Subject to observe.
         *
         * @type element
         * @default null
         */
        element: null,
        
        /**
         * Gesture Identifier the observed subject belongs to.
         *
         * @type Array
         * @default null
         */
        gestureIdList: null,
        /**
         * Adds a gesture identifier to the gestureIdList in this observation.
         *
         * @param gestureId
         *            {String} The identifier of the gesture.
         */
        addGestureId: function(gestureId){
            this.gestureIdList.push(gestureId);
        },
        /**
         * Check if the gesture id is already registered in this observation.
         *
         * @param gestureId
         *            {String} The identifier of the gesture.
         * @return {Boolean} True, if gesture identifier already exists. False,
         *         if not.
         */
        gestureIdExists: function(gestureId){
            for (var key=0; key<this.gestureIdList.length;key++) {
                if (this.gestureIdList[key] === gestureId) {
                    return true;
                }
            }
            return false;
        },
        /**
         * Remove gesture from identifier list.
         * @param {String} gestureId Identifier of the gesture.
         */
        removeGestureId: function(gestureId){
        	for (var key=0; key<this.gestureIdList.length;key++) {
                if (this.gestureIdList[key] == gestureId) {
                    this.gestureIdList.splice(key,1);
                    break;
                }
            }
        },
        /**
         * This method has to be called before destroying this event observation.
         * It removes all event handler from the element.
         */
        finalize: function(){
        	// touch events
            _removeEventListener(this.element, 'touchstart', this._getEventHandler(EVENT_TYPES.TOUCHSTART));
            _removeEventListener(this.element, 'touchend', this._getEventHandler(EVENT_TYPES.TOUCHEND));
            _removeEventListener(this.element, 'touchmove', this._getEventHandler(EVENT_TYPES.TOUCHMOVE));
            _removeEventListener(this.element, 'touchcancel', this._getEventHandler(EVENT_TYPES.TOUCHCANCEL));
            _removeEventListener(this.element, 'touchenter', this._getEventHandler(EVENT_TYPES.TOUCHENTER));
            _removeEventListener(this.element, 'touchleave', this._getEventHandler(EVENT_TYPES.TOUCHLEAVE));
            
            // mouse events
            _removeEventListener(this.element, 'mousedown', this._getEventHandler(EVENT_TYPES.MOUSEDOWN));
            _removeEventListener(this.element, 'mousemove', this._getEventHandler(EVENT_TYPES.MOUSEMOVE));
            _removeEventListener(this.element, 'mouseup', this._getEventHandler(EVENT_TYPES.MOUSEUP));
            _removeEventListener(this.element, 'mouseover', this._getEventHandler(EVENT_TYPES.MOUSEOVER));
            _removeEventListener(this.element, 'mouseout', this._getEventHandler(EVENT_TYPES.MOUSEOUT));
 
        },
        /**
         * Returns the event handler by type.
         * See GeForMT.Observation.EVENT_TYPES getting the implemented event types.
         *
         * @private
         * @param eventType
         *            GeForMT.Observation.EVENT_TYPES
         * @return {Function} Returns the event handler or null if the eventType
         *         is unknown.
         */
        _getEventHandler: function(eventType){
            var context = this;
            var handler = null;
			var i=0;
            
            switch (eventType) {
                case EVENT_TYPES.TOUCHSTART:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
						//create Contact Objects as representation of Touch
						// this is required, because these objects are pooled from API
						var contacts=[];
						for(var i=0;i<e.touches.length;i++){
							var touch=e.touches[i];
							var contact=new Contact(touch.identifier, touch.screenX, touch.screenY, touch.clientX, touch.clientY, touch.pageX, touch.pageY, touch.radiusX, touch.radiusY, touch.rotationAngle, touch.force);
							contacts.push(contact);
						}
						//e.touches=newTouches;
						e.contacts=contacts;
                        e.relatedGestures = context.gestureIdList;
                        if (context === _documentEventObservation) {
                            _notifyAllDocumentEventListener('gesturestart', e);
                        }
                        else {
                            _notifyAllGestureEventListener('gesturestart', e);
                        }
                    };
                    break;
                case EVENT_TYPES.TOUCHEND:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
						//create Contact Objects as representation of Touch
						// this is required, because these objects are pooled from API
						var contacts=[];
						for(var i=0;i<e.touches.length;i++){
							var touch=e.touches[i];
							var contact=new Contact(touch.identifier, touch.screenX, touch.screenY, touch.clientX, touch.clientY, touch.pageX, touch.pageY, touch.radiusX, touch.radiusY, touch.rotationAngle, touch.force);
							contacts.push(contact);
						}
						//e.touches=newTouches;
						e.contacts=contacts;
                        e.relatedGestures = context.gestureIdList;
                        if (context === _documentEventObservation) {
                            _notifyAllDocumentEventListener('gestureend', e);
                        }
                        else {
                            _notifyAllGestureEventListener('gestureend', e);
                        }
                        
                    };
                    break;
                case EVENT_TYPES.TOUCHMOVE:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
						//console.debug(e.touches[0].pageX);
					//create Contact Objects as representation of Touch
						// this is required, because these objects are pooled from API
                      var contacts=[];
						for(var i=0;i<e.touches.length;i++){
							var touch=e.touches[i];
							var contact=new Contact(touch.identifier, touch.screenX, touch.screenY, touch.clientX, touch.clientY, touch.pageX, touch.pageY, touch.radiusX, touch.radiusY, touch.rotationAngle, touch.force);
							contacts.push(contact);
						}
					//	console.debug(newTouches[0].pageX);
						//e.touches=newTouches;
						e.contacts=contacts;
                        e.relatedGestures = context.gestureIdList;
                        if (context === _documentEventObservation) {
                            _notifyAllDocumentEventListener('gesturechange', e);
                        }
                        else {
                            _notifyAllGestureEventListener('gesturechange', e);
                        }

                    };
                    break;
                case EVENT_TYPES.TOUCHENTER:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                       
                    };
                    break;
                case EVENT_TYPES.TOUCHLEAVE:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                       
                    };
                    break;
                case EVENT_TYPES.TOUCHCANCEL:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                    };
                    break;
                case EVENT_TYPES.MOUSEDOWN:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                        e.stopPropagation();

                        _createAndDispatchTouchEvent('touchstart', e);
                    // _notifyAllGestureEventListener('gesturestart', gestureEvent); 
                    };
                    break;
                case EVENT_TYPES.MOUSEUP:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                        //   var contacts = new ContactList([new Contact(null, e.screenX, e.screenY, e.clientX, e.clientY, null, null, null, null, null, null)]);
                        //  var gestureEvent = new GestureEvent(contacts, null, null, e.altKey, e.crtlKey, e.metaKey, e.shiftKey, e.button, e.target, e.currentTarget, e.relatedTarget, e.timestamp,e.type, e,context.gestureIdList);
                        _createAndDispatchTouchEvent('touchend', e);
                    // _notifyAllGestureEventListener('gestureend', gestureEvent);
                    };
                    break;
                case EVENT_TYPES.MOUSEMOVE:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                        _createAndDispatchTouchEvent('touchmove', e);
                    };
                    break;
                case EVENT_TYPES.MOUSEOVER:
                    handler = function(e){
                        if (_preventDefault) {
                            e.preventDefault();
                        }
                        _createAndDispatchTouchEvent('touchenter', e);
                    };
                    break;
                case EVENT_TYPES.MOUSEOUT:
                    handler = function(e){
                        if (_preventDefault && !(context === _documentEventObservation)) {
                            e.preventDefault();
                        }
                        _createAndDispatchTouchEvent('touchleave', e);
                    };
                    break;
                    
            }
            return handler;
        }
        
    };
    
    /**
     * Notify all registered gesture listener.
     * @param  {String} eventName Type name of the event.
     * @param  {UIEvent} event Adapted Touch Event.
     */
    function _notifyAllGestureEventListener(eventName, event){
        var handlerList = RegisteredGestureEventListener[eventName];
        var listLength = handlerList.length;
        for (var i = 0; i < listLength; i++) {
            var callback = handlerList[i];
            if (callback != 'undefined' && event.relatedGestures.length>0) {
                callback(event);
            }
        }
    }
	
	    
    /**
     * Notify all registered document event listener.
     * @param  {String} eventName Type name of the event.
     * @param  {UIEvent} event Adapted Touch Event.
     */
    function _notifyAllDocumentEventListener(eventName, event){
        var handlerList = RegisteredDocumentEventListener[eventName];
        var listLength = handlerList.length;
        for (var i = 0; i < listLength; i++) {
            var callback = handlerList[i];
            if (callback != 'undefined') {
                callback(event);
            }
        }
    }
    
    /**
     * Create and dispatch a TouchEvent to simulate a single touch with a mouse.
     * @param  {String} name Event type of event to dispatch.
     * @param  {MouseEvent} event Original event, that has to be adapted.
     */
    function _createAndDispatchTouchEvent(name, event){
        var srcEventName = event.type;
        // check that a mouse gesture starts
        if (srcEventName == 'mousedown') {
            this._mouseMoveEventEnabled = true;
            _mouseStrokeId++;
        }
        // check the end of a mouse gesture
        if (srcEventName == 'mouseup') {
            this._mouseMoveEventEnabled = false;
        }
        
        // prevent mousemove events beyond a gesture (that means events for positioning the cursor without clicking are excluded)
        if ((srcEventName == 'mousemove' || srcEventName == 'mouseover' || srcEventName == 'mouseout') && !this._mouseMoveEventEnabled) {
            return;
        }
        
        // create a custom event with touch event interface structure by the W3C
        var touchevent = document.createEvent('CustomEvent');
        touchevent.initEvent(name, true, false);
        var touch = {
            identifier: _mouseStrokeId,
            pageX: event.pageX,
            pageY: event.pageY,
            screenX: event.screenX,
            screenY: event.screenY,
            clientX: event.clientX,
            clientY: event.clientY,
            radiusX: 1,
            radiusX: 1,
            rotationAngle: 0,
            force: 0
        };
        var touches = [touch];
        touchevent.ctrlKey = event.ctrlKey;
        touchevent.shiftKey = event.shiftKey;
        touchevent.metaKey = event.metaKey;
        touchevent.touches = touches;
        touchevent.targetTouches = touches;
        touchevent.changedTouches = touches;
        touchevent.sourceEvent = event;
        
        // dispatch the created event to simulate a touch event
        if (event.target) {
            //	window.document.dispatchEvent(touchevent);
            event.target.dispatchEvent(touchevent);
        }
        else {
            window.document.dispatchEvent(touchevent);
        }
    }
    
	/**
	 * Helper method for cross-browser registering of event listeners.
	 * @param {Element} element
	 * @param {String} eventName
	 * @param {Function} handler
	 * @param {Boolean} captureEvents
	 */
    function _addEventListener(element, eventName, handler, captureEvents){
        if (document.addEventListener) {
            // W3C
            element.addEventListener(eventName, handler, captureEvents);
        }
        else 
            if (document.attachEvent) {
                // IE
                element.attachEvent('on' + eventName, handler);
            }
            else {
                element['on' + eventName] = handler;
            }
    }
    /**
	 * Helper method for cross-browser removing of event listeners.
	 * @param {Element} element
	 * @param {String} eventName
	 * @param {Function} handler
	 */
     function _removeEventListener(element, eventName, handler){
        if (document.removeEventListener) {
            // W3C
            element.removeEventListener(eventName, handler);
        }
        else 
            if (document.detachEvent) {
                // IE
                element.detachEvent('on' + eventName, handler);
            }
            else {
                element['on' + eventName] = null;
            }
    }
    
    return {
        /**
         * Initialize observation module.
         *
         * @param preventDefault
         *            {Boolean} Set to true for preventing the default behaviour
         *            on all events.
         */
        init: function(preventDefault){
            _preventDefault = preventDefault;
            _registeredGestureEventListener = [];
            _registeredEventObservations = [];
            
            //create EventObservation on 'document'-Object to get feedback on the entire interface
            _documentEventObservation = new EventObservation("feedback", document,true);
            
        },
        /**
         * Register an observation on the given list of elements get informed
         * about interaction on them.
         *
         * @param gestureId
         *            {String} Identifier of the gesture.
         * @param elementList
         *            {Array} List of all elements on which the events will be
         *            registered.
         */
        addEventObservation: function(gestureId, elementList){
            for (var i = 0; i < elementList.length; i++) {
                var alreadyRegisteredObservation = this.getObservationByElement(elementList[i]);
                if (alreadyRegisteredObservation !== null) {
                    if (!alreadyRegisteredObservation.gestureIdExists(gestureId)) {
                        alreadyRegisteredObservation.addGestureId(gestureId);
                    }
                }
                else {
                    _registeredEventObservations.push(new EventObservation(gestureId,elementList[i],false));
                }
            }
            //console.debug(_registeredEventObservations);
        },
        /**
         * Returns the observer that is already registered on the given element
         * node or null if it's not.
         *
         * @param {Element} element
         * @return GeForMT.Observation.EventObserver
         */
        getObservationByElement: function(element){
        
            var observationListLength = _registeredEventObservations.length;
            for (var i = 0; i < observationListLength; i++) {
                var registeredObservation = _registeredEventObservations[i];
                if (registeredObservation.element === element) {
                    return registeredObservation;
                }
                
            }
            return null;
        },
        /**
         * Removes a gesture identifier from an event observation.
         * @param {String} gestureId Identifier of the gesture, that has to be removed.
         */
         removeGestureFromEventObservation: function(gestureId){
         	var observationListLength = _registeredEventObservations.length;
         	
            for (var i in _registeredEventObservations) {
            	 var registeredObservation = _registeredEventObservations[i];       	 
                  registeredObservation.removeGestureId(gestureId);
            	 if(registeredObservation.gestureIdList.length===0){
            	 registeredObservation.finalize();
            	  _registeredEventObservations.splice(i,1);
            	  if(_registeredEventObservations.length==1){
            	  	_registeredEventObservations=[];
            	  }
            	 }
            }
         },
        /**
         * Register listener objects that wants to be notified about all interaction
         * events.
		 * @param {String} eventName
		 * @param {Function} callback
         */
        registerGestureEventListener: function(eventType, callback){
        
            if (typeof RegisteredGestureEventListener[eventType] != 'undefined') {
                RegisteredGestureEventListener[eventType].push(callback);
            }
            
        },
		/**
         * Remove listener that don't want to be notified about all interaction
         * events anymore.
		 * @param {String} eventName
		 * @param {Function} callback
		 */
        removeGestureEventListener: function(eventType, callback){
        
            if (typeof RegisteredGestureEventListener[eventType] != 'undefined') {
                var list = RegisteredGestureEventListener[eventType];
                for (var i = 0; i < list.length; i++) {
                    if (list[i] === callback) {
                        list.splice(i, 1);
                    }
                }
            }
            
        },
        
		/**
		 * Register listener objects that wants to be notified about
         * events that are registered on document object. (only on document)
		 * @param {String} eventName
		 * @param {Function} callback
		 */
        registerDocumentEventListener: function(eventName, callback){
        
            if (typeof RegisteredDocumentEventListener[eventName] != 'undefined') {
                RegisteredDocumentEventListener[eventName].push(callback);
            }
            
        },
		/**
         * Remove listener that don't want to be notified about
         * events on document object anymore. (only on document)
		 * @param {String} eventName
		 * @param {Function} callback
		 */
        removeDocumentEventListener: function(eventName, callback){
        
            if (typeof RegisteredDocumentEventListener[eventName] != 'undefined') {
                var list = RegisteredDocumentEventListener[eventName];
                for (var i = 0; i < list.length; i++) {
                    if (list[i] === callback) {
                        list.splice(i, 1);
                    }
                }
            }
            
        }
    };
})();
