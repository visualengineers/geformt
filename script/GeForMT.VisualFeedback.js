/**
 * @namespace
 * VisualFeedback module
 */
GeForMT.VisualFeedback = (function(){
    /**
     * The observation module GeForMT.Observation
     * @type GeForMT.Observation
     * @default null
     * @private
     */
    var _observationModule = null;
    /**
     * The observation module GeForMT.Observation
     * @type GeForMT.GestureRecognition
     * @default null
     * @private
     */
    var _recognitionModule = null;
    /**
     * Canvas element representing the feedback layer. Shows current contacts.
     * @type Element
     * @default null
     * @private
     */
    var _feedbackCanvas = null;
    /**
     * Canvas element representing a second feedback layer. Shows saved gesture pathes.
     * @type Element
     * @default null
     * @private
     */
    var _pathesFeedbackCanvas = null;
    /**
     * The context object of the feedback canvas to draw current contacts on it.
     * @type Object
     * @default null
     * @private
     */
    var _feedbackCanvasContext = null;
    /**
     * The context object of the canvas to draw saved gesture pathes on it.
     * @type Object
     * @default null
     * @private
     */
    var _pathesFeedbackCanvasContext = null;
    /**
     * The timer that manages the drawing process.
     * @Object
     * @default null
     * @private
     */
    var _updateTimer = null;
    /**
     * Interval of redrawing the feedback.
     * @type Number
     * @default 0
     * @private
     */
    var _updateInterval = 0;
    /**
     * Current touch points.
     * @type Array
     * @default empty array
     * @private
     */
    var _touches = [];
    /**
     * Visualize current touches
     * @type Boolean
     * @default true
     * @private
     */
    var _showCurrentTouch = true;
    /**
     * All touch points of the current gesture saved in list.
     * @type Array
     * @default empty array
     * @private
     */
    var _gestureTouches = [];
    /**
     * List of gesture pathes.
     * @type Array
     * @default empty array
     * @private
     */
    var _gesturePathes = [];
    /**
     * Has mouse gesture started?
     * @type Boolean
     * @default false
     * @private
     */
    var _mouseGestureStarted = false;
    /**
     * State of the update process.
     * @type Boolean
     * @default false
     * @private
     */
    var _busy = false;
    /**
     * Recognition started?
     * @type Boolean
     * @default false
     */
     var _recognitionStarted=false;
    /**
     * State that represents the global setting for drawing a feedback.
     * True if feedback should be displayed.
     * @type Boolean
     * @default false
     * @private
     */
    var _feedbackEnabled = false;
    /**
     * Create two canvas elements on top of the web content to draw visual feedback on it.
     * One canvas for updating current position of contacts, the other canvas for drawing gesture pathes on it.
     * Requirements for this feature:
     * 1. This feature requires HTML5.
     * 2. The browser must support the CSS property 'pointer-events'.
     * @private
     */
    function _createFeedbackEnvironment(){
        _feedbackCanvas = document.createElement("canvas");
        var canvasStyle = _feedbackCanvas.style;
        
        /*	canvasStyle.borderStyle = "solid";
         canvasStyle.borderColor = "black";
         canvasStyle.borderWidth = "1";*/
        // set position and size of the canvas
        canvasStyle.zIndex = "10000";
        canvasStyle.position = "absolute";
        canvasStyle.top = "0";
        canvasStyle.left = "0";
        canvasStyle.right = "0";
        canvasStyle.bottom = "0";
        // _feedbackCanvas.width = (window.innerWidth !== 0) ? window.innerWidth : 0;
        // _feedbackCanvas.height = (window.innerHeight !== 0) ? window.innerHeight : 0;
        
        _feedbackCanvas.width = (document.documentElement.scrollWidth !== 0) ? document.documentElement.scrollWidth : 0;
        _feedbackCanvas.height = (document.documentElement.scrollHeight !== 0) ? document.documentElement.scrollHeight : 0;
        
        _pathesFeedbackCanvas = document.createElement("canvas");
        var pathesCanvasStyle = _pathesFeedbackCanvas.style;
        
        /*	canvasStyle.borderStyle = "solid";
         canvasStyle.borderColor = "black";
         canvasStyle.borderWidth = "1";*/
        // set position and size of the canvas
        pathesCanvasStyle.zIndex = "10000";
        pathesCanvasStyle.position = "absolute";
        pathesCanvasStyle.top = "0";
        pathesCanvasStyle.left = "0";
        pathesCanvasStyle.right = "0";
        pathesCanvasStyle.bottom = "0";
        // _feedbackCanvas.width = (window.innerWidth !== 0) ? window.innerWidth : 0;
        // _feedbackCanvas.height = (window.innerHeight !== 0) ? window.innerHeight : 0;
        
        _pathesFeedbackCanvas.width = (document.documentElement.scrollWidth !== 0) ? document.documentElement.scrollWidth : 0;
        _pathesFeedbackCanvas.height = (document.documentElement.scrollHeight !== 0) ? document.documentElement.scrollHeight : 0;
        
        
        window.onresize = function(){
            _feedbackCanvas.width = (document.documentElement.scrollWidth !== 0) ? document.documentElement.scrollWidth : 0;
            _feedbackCanvas.height = (document.documentElement.scrollHeight !== 0) ? document.documentElement.scrollHeight : 0;
            
            _pathesFeedbackCanvas.width = (document.documentElement.scrollWidth !== 0) ? document.documentElement.scrollWidth : 0;
            _pathesFeedbackCanvas.height = (document.documentElement.scrollHeight !== 0) ? document.documentElement.scrollHeight : 0;
            
        };
        
        
        // make the feedback layers "click-through"
        if (typeof canvasStyle.pointerEvents !== 'undefined') {
            canvasStyle.pointerEvents = "none";
            pathesCanvasStyle.pointerEvents = "none";
        }
        
        // append default text 
        var canvasDefaultText = document.createTextNode("Sorry, the feedback feature requires HTML5 where canvas is implemented.");
        _feedbackCanvas.appendChild(canvasDefaultText);
        _pathesFeedbackCanvas.appendChild(canvasDefaultText);
        
        // get drawing context
        _feedbackCanvasContext = _feedbackCanvas.getContext("2d");
        _pathesFeedbackCanvasContext = _pathesFeedbackCanvas.getContext("2d");
        
        // set timer for redrawing in intervals
        _updateTimer = setInterval(_updateVisualFeedback, _updateInterval);
    }
    
    /**
     * Integrate the feedback layers into the website and register for events.
     * @private
     */
    function _addVisualFeedback(){
        document.getElementsByTagName("body")[0].appendChild(_feedbackCanvas);
        document.getElementsByTagName("body")[0].appendChild(_pathesFeedbackCanvas);
        
        //register for interaction events
        _observationModule.registerDocumentEventListener('gesturestart', _gesturestart);
        _observationModule.registerDocumentEventListener('gesturechange', _gesturechange);
        _observationModule.registerDocumentEventListener('gestureend', _gestureend);
        
        //register for recognition events
        _recognitionModule.registerGestureRecognitionEventListener('recognitionstarted', _recognitionstarted);
        _recognitionModule.registerGestureRecognitionEventListener('recognitionfailed', _recognitionfailed);
        _recognitionModule.registerGestureRecognitionEventListener('gesturerecognized', _recognitionsuccess);
        _recognitionModule.registerGestureRecognitionEventListener('candidatesrecognized', _candidatesrecognized);
    }
    /**
     * Remove feedback layers and events from the website.
     * @private
     */
    function _removeVisualFeedback(){
        _observationModule.removeDocumentEventListener('gesturestart', _gesturestart);
        _observationModule.removeDocumentEventListener('gesturechange', _gesturechange);
        _observationModule.removeDocumentEventListener('gestureend', _gestureend);
        
        _recognitionModule.removeGestureRecognitionEventListener('recognitionstarted', _recognitionstarted);
        _recognitionModule.removeGestureRecognitionEventListener('recognitionfailed', _recognitionfailed);
        _recognitionModule.removeGestureRecognitionEventListener('gesturerecognized', _recognitionsuccess);
        _recognitionModule.removeGestureRecognitionEventListener('candidatesrecognized', _candidatesrecognized);
        
        document.getElementsByTagName("body")[0].removeChild(_feedbackCanvas);
        document.getElementsByTagName("body")[0].removeChild(_pathesFeedbackCanvas);
    }
    /**
     * Updating the feedback layer by redrawing the current touch points (contacts) on the canvas.
     * This functions uses the _feedbackCanvas to draw current contact points and _feedbackCanvasContext to draw gesture pathes.
     * @private
     * */
    function _updateVisualFeedback(){
        if (_busy) 
            return;
        //return;
        _busy = true;
        
        
        _feedbackCanvasContext.clearRect(0, 0, _feedbackCanvas.width, _feedbackCanvas.height);
        
        var tl = _touches.length;
        for (var i = 0; i < tl; i++) {
        
            // get coordinates
            var touch = _touches[i];
            var id = touch.identifier;
            var x = touch.pageX;
            var y = touch.pageY;
            
           
            // save touches to visualize the gesture path
            if (_gesturePathes.length === 0) {
                // build gesture pathes
                _gesturePathes.push([{
                    id: id,
                    pageX: x,
                    pageY: y
                }]);
                
            }
            else {
                var pathIdExist = false;
                // try assigning touches
                for (var gp = 0; gp < _gesturePathes.length; gp++) {
                    var gesturePath = _gesturePathes[gp];
                    if (gesturePath[0].id === id) {
                        pathIdExist = true;
                        var gpx = x;
                        var gpy = y;
                        
                        var nextGpx = gesturePath[gesturePath.length - 1].pageX;
                        var nextGpy = gesturePath[gesturePath.length - 1].pageY;
                        
                        _pathesFeedbackCanvasContext.beginPath();
                        _pathesFeedbackCanvasContext.strokeStyle = 'rgba(0, 0, 200, 0.5)';
                        _pathesFeedbackCanvasContext.lineWidth = 4;
                        _pathesFeedbackCanvasContext.moveTo(nextGpx, nextGpy);
                        _pathesFeedbackCanvasContext.lineTo(gpx, gpy);
                        _pathesFeedbackCanvasContext.stroke();
                        _pathesFeedbackCanvasContext.closePath();
                        
                        gesturePath.push({
                            id: id,
                            pageX: x,
                            pageY: y
                        });
                    }
                    else {
                    
                    }
                }
                if (!pathIdExist) {
                    _gesturePathes.push([{
                        id: id,
                        pageX: x,
                        pageY: y
                    }]);
                }
            }
            
            // draw circle for current touch point
            _feedbackCanvasContext.beginPath();
            _feedbackCanvasContext.arc(x, y, 30, 0, 2 * Math.PI, true);
            _feedbackCanvasContext.closePath();
            _feedbackCanvasContext.fillStyle = "rgba(0, 0, 200, 0.2)";
            _feedbackCanvasContext.fill();
            
            _feedbackCanvasContext.lineWidth = 2.0;
            _feedbackCanvasContext.strokeStyle = "rgba(0, 0, 200, 0.8)";
            _feedbackCanvasContext.stroke();
        }
        _busy = false;
        
    }
    
    /**
     * Event handler for the custom event 'gesturestart' set up by GeForMT.Observation.
     * @param {UIEvent} e The assigned event.
     * @private
     */
    function _gesturestart(e){
    
        _touches = e.touches;
        _showCurrentTouch = true;
    }
    /**
     * Event handler for the custom event 'gesturechange' set up by GeForMT.Observation.
     * @param {UIEvent} e The assigned event.
     * @private
     */
    function _gesturechange(e){
        _touches = e.touches;
        _showCurrentTouch = true;
    }
    /**
     * Event handler for the custom event 'gestureend' set up by GeForMT.Observation.
     * @param {UIEvent} e The assigned event.
     * @private
     */
    function _gestureend(e){
        //   _canvasContext.clearRect(0, 0, _feedbackCanvas.width, _feedbackCanvas.height);	
        _touches = [];
        //_gestureTouches = [];
        if(!_recognitionStarted){
        	_pathesFeedbackCanvasContext.clearRect(0, 0, _pathesFeedbackCanvas.width, _pathesFeedbackCanvas.height);
       		_gesturePathes = [];
        }
    }
     /**
     * Event handler of 'recognitionstarted' events.
     * @param {GeForMT.GestureRecognition.GestureRecognitionStarted} e
     * @private
     */
    function _recognitionstarted(e){
        _recognitionStarted=true;       
    }
    
    /**
     * Event handler of 'recognitionfailed' events.
     * @param {GeForMT.GestureRecognition.GestureRecognitionFailedEvent} e
     * @private
     */
    function _recognitionfailed(e){
        //_recognitionfailed=true;
        
        _pathesFeedbackCanvasContext.clearRect(0, 0, _pathesFeedbackCanvas.width, _pathesFeedbackCanvas.height);
        _gesturePathes = [];
        _touches = [];
        _recognitionStarted=false;
    }
    
    /**
     * Event handler of 'gesturerecognized' events.
     * @param {GeForMT.GestureRecognition.GestureRecognizedEvent} e
     * @private
     */
    function _recognitionsuccess(e){
        //_recognitionsuccess=true;
        if(!e.online || e.online && e.currentEvent.type=='touchend'){
        	 _pathesFeedbackCanvasContext.clearRect(0, 0, _pathesFeedbackCanvas.width, _pathesFeedbackCanvas.height);
        _gesturePathes = [];
        _touches = [];
        }
       _recognitionStarted=false;
    }
    
    /**
     * Event handler of 'candidatesrecognized' events.
     * @param {GeForMT.GestureRecognition.GestureRecognitionCandidatesEvent} e
     * @private
     */
    function _candidatesrecognized(e){
    }
    
    return {
        /**
         * Initialize feedback module. Setup the feedback layer and its properties.
         * @param {GeForMT.Observation} observationModule
         * @param {GeForMT.GestureRecognition} recognitionModule
         * @param {Number} updateInterval Interval in which the feedback has to be updated.
         */
        init: function(observationModule, recognitionModule, updateInterval){
            if (typeof updateInterval !== 'undefined' && updateInterval !== null) {
                _updateInterval = updateInterval;
            }
            _observationModule = observationModule;
            _recognitionModule = recognitionModule;
            _createFeedbackEnvironment();
        },
        /**
         * Enable or disable visual feedback.
         * @param {Boolean} bool True to enable visual feedback, false to disable it.
         */
        setVisualFeedback: function(bool){
        
            if (bool) {
                _addVisualFeedback();
            }
            else {
                if (this._feedbackEnabled) {
                    _removeVisualFeedback();
                }
            }
            this._feedbackEnabled = bool;
        }        
    };
})();
