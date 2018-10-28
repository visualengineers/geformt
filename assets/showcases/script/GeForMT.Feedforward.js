/**
 * @namespace
 * Feedforward module
 */
GeForMT.Feedforward = (function(){
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
    var _feedforwardCanvas = null;
    var _feedforwardTouchCanvas = null;
    var _feedMenuCanvas = null;  
    /**
     * List of all registererd gestures
     * @type Array
     * @default empty array
     * @private
     */
    var _rawModels = [];
    /**
     * Current touch points.
     * @type Array
     * @default empty array
     * @private
     */
    var _touches = [];
    var _touchPoints = [];
    var _pathHistory = [];
    var _nextVis = {};
    var _commandNames = [];
    var _relation = null; // GeForMT Type
    var _pathEndP = {x:0,y:0};
    var _startP = {x:0,y:0};
    var _labelP = {x:0,y:0};
    var _touchEndP = {x:0,y:0};
    var _start = false;
    var _holder = null;
    var _id = null;
    var _rec = false;
    var _num = 0;
    var _menu = false;
    var _next = 0;
    var _pathColor = '#696969';
    /**
     * List of possible gesture pathes for display.
     * @type Array
     * @default empty array
     * @private
     */
    var _possAtom = [];
    /**
     * All touch points of the current gesture saved in list.
     * @type Array
     * @default empty array
     * @private
     */
    var _gestureTouches = [];
    /**
     * List of performed gesture pathes.
     * @type Array
     * @default empty array
     * @private
     */
    var _gesturePathes = [];
    /**
     * Define length of the atomar gesture path for lines
     * @type Number
     * @default 55
     * @private
     */
    var _messureLine = 60;
    /**
     * Define length of the atomar gesture path for circle and semicircle
     * @type Number
     * @default 40
     * @private
     */
    var _messureCircle = 45;
    /**
     * Define thickness of the atomar gesture path
     * @type Number
     * @default 12
     * @private
     */
    var _strokeWidth = 12;
    /**
     * Recognition started?
     * @type Boolean
     * @default false
     */
     var _recognitionStarted=false;
    
    /**
     * Integrate layer for dynamic gesture menu.
     * @private
     */
    function _createFeedMenu(){
        
        _feedMenuCanvas = Raphael(0,0, '100%', '100%'); // Attach Raphael   
        var feedStyle = _feedMenuCanvas.canvas.style;
        feedStyle.position = 'fixed';
        feedStyle.id = '_feedMenuCanvas';
        
        // make the layer "click-through" // kontextsensitiv
        if (typeof feedStyle.pointerEvents !== 'undefined') {
            feedStyle.pointerEvents = "none";
        }
              
        _rect = _feedMenuCanvas.rect(0, 0, '100%', '100%');
        _rect.attr('fill', '#CCCCCC'); 
				_rect.attr('fill-opacity', 0.8);
				_rect.attr('stroke-width', 0);
				_rect.node.id = '_markMenuRec';
        
        _menu = true;    
        _possAtom = [];
        _gestureList = [];
        _gesturePathes = [];
        _pathHistory = [];
        _touches = [];
        _nextVis = [];
        _commandNames = [];              
    }
    /**
     * Update possible pathes of the gestures for the Visualization.
     * @param {Array} gestureList, list of current _rawModels.object
     * @private
     * */
    function _updatePossPathes(gestureList){
        var pNum = _pathHistory.length;
        
        for(var g = 0; g < gestureList.length; g++){            
                // List with all options of the gesture
                var options = gestureList[g].options;
                var next = {};         
                // only first option, TODO: all options
                var complexGes = options[0].gestures;
                // get atomic gestures
                if (complexGes.length == 1 && gestureList[g].online) {
                    var atGesture = complexGes[0].atomfocus;         
                    for(var at = 0; at < atGesture.length; at++){
                        if (_next == at) {
                            var atom = atGesture[at].atom;
                            // test if the path exist to avoid overlay pathes
                            for (var p = 0; p < _nextVis.length; p++){
                                 var eA = _nextVis[0];
                            }
                            next.path = atom;
                        }                            
                    }
                    // gesture command for each atomic gesture path
                    next.name = gestureList[g].id;
                    _nextVis.push(next);
                }
      }
      _next += 1;
    }
    /**
     * Function to visualize the gesture pathes.
     * @private     
     */         
    function _visualizePathes(){      
        
        for(var cp = 0; cp < _nextVis.length; cp++){
            var nextP = _nextVis[cp];
            var cName = nextP.name;    
            var nPath = nextP.path;
            var exist = false;

            var startP;
            if(_start)
              startP = {x:_touches[0].clientX, y:_touches[0].clientY};
            else{
                // get end point of the path in _pathHistory with the same id
                for (var s = 0; s < _pathHistory.length; s++){
                    var z = _pathHistory[s];
                    if (z.node.id === cName){
                        startP = {x:z.getPointAtLength(z.getTotalLength()+5).x, y:z.getPointAtLength(z.getTotalLength()+5).y};
                    }
                }
            } 
            
            var newP;        
            if (nPath.type === GeForMT.VECTOR_TYPES.LINE) {
                newP = _setLine(startP, nPath.direction);     
            }
            else if (nPath.type === GeForMT.SHAPE_TYPES.CIRCLE){
                newP = _setCircle(startP, nPath.direction, nPath.rotation);
            }
            else if (nPath.type === GeForMT.SHAPE_TYPES.SEMICIRCLE){
                newP = _setSemiCircle(startP, nPath.direction, nPath.rotation);
            }
            newP.node.id = cName;
            _possAtom.push(newP);
            _commandNames.push(_setCommandLabel(cName, _pathEndP));
        }         
    }
    /**
     * Function for visualize feedback for recognized path and delete the rest
     * @param {Array} recognized candidates     
     */         
    function _recognizedAtom(candidates){
    
        _gestureList = [];
        var num = _pathHistory.length;
        
        for(var r = 0; r < _rawModels.length; r++){
            var can = _rawModels[r];
            // get model for recognized candidates
            for (var c = 0; c < candidates.length; c++) {
                if(can.id === candidates[c]){
                    var op = _rawModels[r].options[0];  // TODO: all options
                    // for(var a = 0; a < op.gestures.length; a++){}
                        
                    for (var p = 0; p < _possAtom.length; p++){
                        var posG = _possAtom[p];
                        
                        if (posG.node.id === can.id){
                            // save in History and change color                 
                            posG.attr('opacity', 1);     
                            _pathHistory.push(posG);
                            _possAtom.splice(p, 1);
                        }
                    }
                    _gestureList.push(can);
                }
            }  
        }
        // remove not recognized pathes
        for (var a = 0; a < _possAtom.length; a++){
            _possAtom[a].remove();
        }        
        _possAtom = [];
        _nextVis = [];            
    }
    
    /**
     * Integrate the feedforward layer into the website for gesture visualization.
     * @private
     */
    function _createVisualizationEnvironment(){
        
        if(_holder === null || typeof _holder == 'undefined'){
            _feedforwardCanvas = Raphael(0,0, '100%', '100%');
            _feedforwardTouchCanvas = Raphael(0,0, '100%', '100%');
        }
        else{
            _feedforwardCanvas = Raphael(_holder, '100%', '100%');
            _feedforwardCanvas.canvas.style.position = 'absolute';
            
            _feedforwardTouchCanvas = Raphael(_holder, '100%', '100%');         
            _feedforwardTouchCanvas.canvas.style.position = 'absolute';
            _feedforwardTouchCanvas.canvas.style.zIndex = 1000;           
        }  
        
        _feedforwardTouchCanvas.canvas.id = '_feedforwardTouchCanvas';
        // focuslist für Gesten erweitern
        
        //$(_holder).append(_feedforwardCanvas);  
        //$('body').append(_feedforwardTouchCanvas);
             
        _startP = {x: _feedforwardCanvas.canvas.offsetWidth/2-150, y: _feedforwardCanvas._top+150};       
    }
    
    /**
     * Set the visualization for the gesture with the given id
     * @param {String} id of the gesture     
     * @private
     */
    function _visualizeGesture(id){
    
        var startP = _startP;
        _feedforwardCanvas.clear();
        _feedforwardTouchCanvas.clear();
         
        for(var r = 0; r < _rawModels.length; r++){
            var can = _rawModels[r]; 
            
            // get model for gesture with given id
            if(can.id === id){                 
                   
                // nur erste option TODO: all options
                var op = _rawModels[r].options[0];
                var bbox;    

                for(var ag = 0; ag < op.gestures.length; ag++){
                    
                    var atGes = op.gestures[ag].atomfocus;
                    var atSet = _feedforwardCanvas.set();
                    var offset = 60;
                    
                    var tnum;      
                    if (op.gestures[ag].funct === null)
                        tnum = 1;
                    else
                        tnum = op.gestures[ag].funct.number;
                    
                    for(var n = 0 ; n < tnum; n++){     
                         for(var b = 0; b < atGes.length; b++){
                            var atm = atGes[b].atom;
                            // only for the start of the gesture path
                            if(b === 0){
                                // check relation and set next VisPoint //GeForMT.RELATION_TYPES 
                                if(op.gestures[ag].operation === GeForMT.OPERATION_TYPES.SEMICOLON){
                        
                                if (bbox !== null || typeof bbox != 'undefined'){
                                    var x = bbox.x + bbox.width/2;
                                    var y = bbox.y + bbox.height/2;
                                    var x2 = bbox.x2;
                                    var y2 = bbox.y2;
                                }
                        
                                switch(op.relation){
					                        case GeForMT.RELATION_TYPES.AMONG:
					                           // y2 boundingbox of previous atomic gesture 
						                         startP = {x: x, y:y2+60}
						                         break;
					                        case GeForMT.RELATION_TYPES.ASIDE:
					                           // x2 boundingbox of previous atomic gesture
                                     if(atm.direction === GeForMT.DIRECTION_TYPES.WEST)
                                         x2 += 50;
                                     if(atm.direction === GeForMT.DIRECTION_TYPES.SOUTH || 
                                      atm.direction === GeForMT.DIRECTION_TYPES.SOUTHWEST || 
                                      atm.direction === GeForMT.DIRECTION_TYPES.SOUTHEAST){
                                         x2 += 65;
                                         y = bbox.y;
                                     }
						                         startP = {x:x2+70, y: y}
						                         break;
						                      case GeForMT.RELATION_TYPES.CROSS:
						                         startP = {x:_pathEndP.x, y:_pathEndP.y-45}
						                         break;
						                      default:
                                     startP = {x:_pathEndP.x+115, y: bbox.y} 
                                }
                              } 
                              if(atm.direction === GeForMT.DIRECTION_TYPES.WEST && ag === 0){
                                  startP = {x:_startP.x+70, y: _startP.y} 
                              }
                              if(ag === 0)
                                _setTouchPoint(startP);
                              
                            }
                        
                            if (atm.type === GeForMT.VECTOR_TYPES.LINE) {
                              atSet.push(_setLine(startP, atm.direction)); 
                            }
                            else if (atm.type === GeForMT.SHAPE_TYPES.CIRCLE){
                              atSet.push(_setCircle(startP, atm.direction, atm.rotation));
                            }
                            else if (atm.type === GeForMT.SHAPE_TYPES.SEMICIRCLE){
                              atSet.push(_setSemiCircle(startP, atm.direction, atm.rotation));
                            }
                            else if (atm.type === GeForMT.CONTACT_TYPES.POINT){
                              atSet.push(_setPoint(startP));
                            }
                            else if (atm.type === GeForMT.CONTACT_TYPES.HOLD){
                              atSet.push(_setHold(startP));
                            }
                            startP = _pathEndP;
                        }
                        startP = {x:_startP.x+offset, y:_startP.y};
                        offset += offset; 
                        _gesturePathes.push(atSet);     
                    }
                    bbox = atSet.getBBox();   
                }    
            }
        } 
    }
    
    /**
     * Draw the description of the gesture.        
     * @private
     * */
    function _setDescription(){
        var info = GeForMT.GestureModel.getGestureById(_id).description;
        if(info !== null && typeof info != 'undefined'){
              var top = _feedforwardCanvas._top+10;
              var end = _feedforwardCanvas.canvas.offsetWidth - 200;
              _touchEndP = {x: end, y: top};
              _setInfoLabel(info);
        }
    } 
     
    /**
     * Draw lines for the gesture pathes
     * @param tPoint - Point of the current touch
     * @param {GeForMT.DIRECTION_TYPES} direction          
     * @private
     * */
    function _setLine(tPoint, direction){
    
        var line, arrow;
				var x = tPoint.x;
				var y = tPoint.y;

				// generate strings for directions
				var up = (y - _messureLine*2).toString();
				var down = (y + _messureLine*2).toString();
				var left = (x - _messureLine*2).toString();
				var right = (x + _messureLine*2).toString();
				
				// diagonale
				var upup = (y - _messureLine).toString();
				var downd = (y + _messureLine).toString();
				var leftl = (x - _messureLine).toString();
				var rightr = (x + _messureLine).toString();

				// draw line in the right direction
				switch(direction) {
					case GeForMT.DIRECTION_TYPES.NORTH:
						line = 'M'+x+','+y+'V'+up;
						break;
					case GeForMT.DIRECTION_TYPES.EAST:
						line = 'M'+x+','+y+'H'+right;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTH:
						line = 'M'+x+','+y+'V'+down;
						break;
					case GeForMT.DIRECTION_TYPES.WEST:
						line = 'M'+x+','+y+'H'+left;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHEAST:
						line = 'M'+x+','+y+'L'+rightr+','+upup;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHWEST:
						line = 'M'+x+','+y+'L'+leftl+','+upup;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHEAST:
						line = 'M'+x+','+y+'L'+rightr+','+downd;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHWEST:
						line = 'M'+x+','+y+'L'+leftl+','+downd;
						break;
					default:
						line = 'M'+x+','+y+'H'+right;
				}

				// draw arrow
				if (_menu){
            arrow = _feedMenuCanvas.path(line);
        }
        else
				    arrow = _feedforwardCanvas.path(line);
				    
				_pathEndP = {x:Math.round(arrow.getPointAtLength(arrow.getTotalLength()).x), y:Math.round(arrow.getPointAtLength(arrow.getTotalLength()).y)};
				arrow.attr('stroke-width', _strokeWidth);
				arrow.attr('stroke', _pathColor);
				arrow.attr('opacity', 0.4);
				arrow.attr('arrow-end', 'block-narrow-short');	
				
				return arrow;
    }
    
    /**
     * Draw lines for the gesture pathes
     * @param tPoint - Point of the current touch
     * @param {GeForMT.DIRECTION_TYPES} direction          
     * @private
     * */
    function _setCircle(tPoint, direction, rotation){
    
        var path;
        var x = tPoint.x;
				var y = tPoint.y;
				var y2 = y - 0.1;				

				// calculate correct position of circle
				var angle;
				switch(direction) {
				  case GeForMT.DIRECTION_TYPES.NORTH:
						angle = 1.5*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.EAST:
						angle = 2*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTH:
						angle = 0.5*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.WEST:
						angle = 1*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHEAST:
						angle = 1.75*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHWEST:
						angle = 1.25*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHEAST:
						angle = 0.25*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHWEST:
						angle = 0.75*Math.PI;
						break;
					default:
						angle = 0;
				}		
				var pointX = Math.cos(angle)*(_messureCircle)+x;
				var pointY = Math.sin(angle)*(_messureCircle)+y;

				var diff = {
					x: (x - pointX),
					y: (y - pointY)
				};

				var xTrans = x + _messureCircle + diff.x;
				var yTrans = y + diff.y;
				var y2Trans = y2 + diff.y;

				// draw circle
				if (_menu){
            path = _feedMenuCanvas.path('M'+xTrans+','+yTrans+'A'+_messureCircle+','+_messureCircle+',0,1,1,'+xTrans+','+y2Trans+'Z');
        }
        else
				    path = _feedforwardCanvas.path('M'+xTrans+','+yTrans+'A'+_messureCircle+','+_messureCircle+',0,1,1,'+xTrans+','+y2Trans+'Z');

				path.attr('stroke-width', _strokeWidth);
				path.attr('stroke', _pathColor);
				path.attr('opacity', 0.4);

				// draw arrow
				if (rotation === GeForMT.ROTATION_TYPES.CLOCKWISE ||
          rotation == GeForMT.ROTATION_TYPES.CW) {
					path.attr({ 'arrow-end': 'block-narrow-short' });
				} else {
					path.attr({ 'arrow-start': 'block-narrow-short' });
				}
				
				_pathEndP = tPoint;
				
				return path;
    }
    
    /**
     * Draw semi circle for the gesture pathes
     * @param tPoint - Point of the current touch
     * @param {GeForMT.DIRECTION_TYPES} direction 
     * @param {GeForMT.ROTATION_TYPES} rotation               
     * @private
     * */
    function _setSemiCircle(tPoint, direction, rotation){

				var semicircle;
				var transform;
				var path;

				var x = tPoint.x;
				var y = tPoint.y;

				// generate strings for directions
				var up = (y - _messureCircle*2).toString();
				var down = (y + _messureCircle*2).toString();
				var left = (x - _messureCircle*2).toString();
				var right = (x + _messureCircle*2).toString();

				// change directions if rotation is counterclock
				if (rotation === GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE ||
          rotation === GeForMT.ROTATION_TYPES.CCW) {
					if (direction === GeForMT.DIRECTION_TYPES.NORTH || 
            direction === GeForMT.DIRECTION_TYPES.SOUTH) {
						var l = left;
						left = right;
						right = l;
					} else if (direction == GeForMT.DIRECTION_TYPES.EAST ||
            direction == GeForMT.DIRECTION_TYPES.WEST) {
						var u = up;
						up = down;
						down = u;
					}
				}
				
				// calculate start/end point
				var angle;
				switch(direction) {
				  case GeForMT.DIRECTION_TYPES.NORTH:
						angle = 1.5*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.EAST:
						angle = 2*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTH:
						angle = 0.5*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.WEST:
						angle = 1*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHEAST:
						angle = 1.75*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHWEST:
						angle = 1.25*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHEAST:
						angle = 0.25*Math.PI;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHWEST:
						angle = 0.75*Math.PI;
						break;
					default:
						angle = 0;
				}				
				
				var pointX = Math.cos(angle)*(_messureCircle*2-_strokeWidth)+x;
				var pointY = Math.sin(angle)*(_messureCircle*2-_strokeWidth)+y;

				switch(direction) {
					case GeForMT.DIRECTION_TYPES.NORTH:
						semicircle = 'M'+x+','+y+'C'+left+','+y+','+left+','+up+','+x+','+up;
						break;
					case GeForMT.DIRECTION_TYPES.EAST:
						semicircle = 'M'+x+','+y+'C'+x+','+up+','+right+','+up+','+right+','+y;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTH:
						semicircle = 'M'+x+','+y+'C'+right+','+y+','+right+','+down+','+x+','+down;
						break;
					case GeForMT.DIRECTION_TYPES.WEST:
						semicircle = 'M'+x+','+y+'C'+x+','+down+','+left+','+down+','+left+','+y;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHEAST:
					  if (rotation === GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE ||
                rotation === GeForMT.ROTATION_TYPES.CCW)
                semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',1,1,0,'+pointX+','+pointY;
            else
						    semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',1,1,1,'+pointX+','+pointY;
						break;
					case GeForMT.DIRECTION_TYPES.NORTHWEST:
					  if (rotation === GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE ||
                rotation === GeForMT.ROTATION_TYPES.CCW)
                semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',0,1,0,'+pointX+','+pointY;
            else    
						    semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',0,1,1,'+pointX+','+pointY;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHEAST:
					  if (rotation === GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE ||
                rotation === GeForMT.ROTATION_TYPES.CCW)
                semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',0,1,0,'+pointX+','+pointY;
            else 
						    semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',0,1,1,'+pointX+','+pointY;
						break;
					case GeForMT.DIRECTION_TYPES.SOUTHWEST:
					  if (rotation === GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE ||
                rotation === GeForMT.ROTATION_TYPES.CCW)
                semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',1,1,0,'+pointX+','+pointY;
            else 
						    semicircle = 'M'+x+','+y+'A'+_messureCircle+','+_messureCircle+',1,1,1,'+pointX+','+pointY;
						break;
					default:
						semicircle = 'M'+x+','+y+'C'+left+','+y+','+left+','+up+','+x+','+up;
				}

			 
        if (_menu){
            // draw arrow
				    var subPath = _feedMenuCanvas.path(semicircle); 				
				    _pathEndP = {x:Math.round(subPath.getPointAtLength(subPath.getTotalLength()-15).x), y:Math.round(subPath.getPointAtLength(subPath.getTotalLength()-15).y)};
            
            path = _feedMenuCanvas.path(subPath.getSubpath(0, subPath.getTotalLength()-15));
        }
        else {
            // draw arrow
				    var subPath = _feedforwardCanvas.path(semicircle); 				
				    _pathEndP = {x:Math.round(subPath.getPointAtLength(subPath.getTotalLength()-15).x), y:Math.round(subPath.getPointAtLength(subPath.getTotalLength()-15).y)};
            
				    path = _feedforwardCanvas.path(subPath.getSubpath(0, subPath.getTotalLength()-15));
				}

        subPath.remove();
				path.attr('stroke-width', _strokeWidth);
				path.attr('stroke', _pathColor);
				path.attr('opacity', 0.4);
				path.attr('arrow-end', 'block-narrow-short');
				
				//arrow.type = GeForMT.SHAPE_TYPES.SEMICIRCLE;
				//arrow.direction = direction;
				//arrow.rotation = rotation;
				//arrow.end = endP;
						
				//_gesturePathes.push(arrow);
				
				return path;
    }
    
    /**
     * Draw point for POINT expression
     * @param {Point} tPoint - point where the next gesture path begins            
     * @private
     * */
    function _setPoint(tPoint){
    
        var x = tPoint.x;
				var y = tPoint.y;
    
        var pointCircle = _feedforwardCanvas.circle(x, y, 30);
				pointCircle.attr('fill', _pathColor);
				pointCircle.attr('fill-opacity', 0);
				pointCircle.attr('stroke-width', 8);
				pointCircle.attr('stroke', _pathColor);
				pointCircle.attr('opacity', 0.4);
				
				pointCircle.startP = tPoint;
				//_gesturePathes.push(pointCircle);
				return pointCircle; 
    }
    
    /**
     * Draw touch for HOLD expression
     * @param {Point} tPoint - point where the next gesture path begins            
     * @private
     * */
    function _setHold(tPoint){
    
        var x = tPoint.x;
				var y = tPoint.y;
    
        var holdCircle = _feedforwardCanvas.circle(x, y, 30);
				holdCircle.attr('fill', _pathColor);
				holdCircle.attr('fill-opacity', 0);
				holdCircle.attr('stroke-width', 2);
				holdCircle.attr('stroke', _pathColor);
				
				holdCircle.startP = tPoint;
				//_gesturePathes.push(pointCircle);
				return holdCircle;
    }
    
    /**
     * Draw touch points for interaction
     * @param {Point} tPoint - point where the current gesture path begins            
     * @private
     * */
    function _setTouchPoint(tPoint){
    
        var x = tPoint.x;
				var y = tPoint.y;
    
        var touchCircle = _feedforwardTouchCanvas.circle(x, y, 30);
				touchCircle.attr('fill', '#0076B0');
				touchCircle.attr('fill-opacity', 0.4);
				touchCircle.attr('stroke-width', 2);
				touchCircle.attr('stroke', '#696969');
				
				var drag_touchstart = function () {
              touchCircle.ox = touchCircle.attr("cx");
              touchCircle.oy = touchCircle.attr("cy");
              touchCircle.animate({r: 40, 'fill-opacity': 1}, 400);
              GeForMT.stopHandler(true); 
        },
        drag_move = function (dx, dy) {
              touchCircle.attr({cx: this.ox + dx, cy: this.oy + dy});
        },
        drag_up = function () {
              touchCircle.animate({r: 30, 'fill-opacity': .4}, 400);
        };	
				touchCircle.drag(drag_move, drag_touchstart, drag_up);
				
				// save for each touch point the start position
				touchCircle.startP = tPoint;		
				_touchPoints.push(touchCircle);
    }
    
    /**
     * Function, which gives additional information of the gesture.
     * @param {String} information
     */              
    function _setInfoLabel(info){
        _feedforwardCanvas.setStart();
				
        var theight	= 25;	
				var twidth = info.length * 7;
				if (info.length === 1)
				    twidth += 10;
				else if (info.length > 25)
				    twidth = 150; 
				var x = _touchEndP.x + 35;  
				var y = _touchEndP.y + 20;
        
        // set line break if info is too long
        for(var l = 25; l < info.length; l += 25 ){
            var sub = info.substring(0, l);
            var last = sub.lastIndexOf(" ");
            sub = info.substring(0, last);
            var sub2 = info.substr(last, info.length - last);
            info = sub + '\n' + sub2;
             
            theight += 8;
        }

				// draw command
				var eltext = _feedforwardCanvas.set();
				
        var label = _feedforwardCanvas.rect(0,0,twidth,theight);
        label.attr('fill', '#FFFFFF');
        label.attr('fill-opacity', 0);
				label.attr('stroke-width', 1);			
				label.attr('stroke', '#696969');
        var text = _feedforwardCanvas.text(twidth/2, theight/2, info).attr({fill: '#696969'});
        
        eltext.push(label);
        eltext.push(text);
        eltext.translate(x,y);

				var set = _feedforwardCanvas.setFinish();
				return eltext;
    }
    
    /**
     * Shows the name of the gesture.
     * @param {String} info
     */              
    function _setCommandLabel(info, point){
        _feedMenuCanvas.setStart();
				
        var theight	= 25;	
				var twidth = info.length * 7;
				if (info.length === 1)
				    twidth += 10;
				else if (info.length > 25)
				    twidth = 150;
 
				var x = point.x + 10;  
				var y = point.y + 10;
				
				// set line break if info is too long
        for(var l = 25; l < info.length; l += 25 ){
            var sub = info.substring(0, l);
            var last = sub.lastIndexOf(" ");
            sub = info.substring(0, last);
            var sub2 = info.substr(last, info.length - last);
            info = sub + '\n' + sub2;
             
            theight += 8;
        }
        
				// draw command
				var eltext = _feedMenuCanvas.set();
				
        var label = _feedMenuCanvas.rect(0,0,twidth,theight);
        label.attr('fill', '#FFFFFF');
        label.attr('stroke-width', 4);			
				label.attr('stroke', '#696969');
        var text = _feedMenuCanvas.text(twidth/2, theight/2, info).attr({fill: '#696969'});
        
        eltext.push(label);
        eltext.push(text);
        eltext.translate(x,y);

				var set = _feedMenuCanvas.setFinish();
				return eltext;
    }
    
    /**
     * Get the raw model from registered gestures and set the id for each model.
     * @param {GeForMT.GestureModel-Gesture} gesture    
     * @private
     * */
    function _filterGestures(gesture){
        // temporary gesture object
        var currentGesture = gesture;
        // raw model from parser
        var rawModel = null;
        // if its lexical or symbolic gesture
        var lexGesture = true;
        // current expression
        var expression = currentGesture.expr;
        
        // filter out Move, Pinch, Tap and Hold gestures
        if ((expression.indexOf("MOVE")!= -1) ||
          (expression.indexOf("JOIN")!= -1) ||
          (expression.indexOf("SPLIT")!= -1) ||
          (expression === "1F(POINT)") ||
          (expression === "POINT") ||
          (expression === "1F(HOLD)"))
          var lexGesture = false;  
       
        if (lexGesture) {  
            rawModel = currentGesture.rawModel;
              
            var opt = rawModel.options
            var ges = opt[0].gestures;
            if(ges.length === 1){
                var at = ges[0];
                if(at.atomfocus.length === 1){
                    if(at.atomfocus[0].atom.type === GeForMT.CONTACT_TYPES.POINT ||
                      at.atomfocus[0].atom.type === GeForMT.CONTACT_TYPES.HOLD){
                        lexGesture = false;
                    }          
                }
            }
            if(lexGesture){
                rawModel.id = currentGesture.identifier;
                rawModel.online = currentGesture.online;
                _rawModels.push(rawModel);
            }
        }
    }
    
    /**
     * Compares the sequence of two array, return true if they match.
     * @param {Array} atomare gesture with atoms
     * @param {Array} possible gesture path with atoms
     * @return {Boolean} same             
     */         
    function _compareSeq(atGes, posG){
    
        if(atGes.length != posG.length)
          return false;
          
        var same = false;
        var t = 0;
        for(var b = 0; b < atGes.length; b++){
            var atm = atGes[b].atom;
            var type = atm.type;
            var dir = atm.direction;
              
            for(var pA = 0; pA < posG.length; pA++){                  
                if (type === posG[pA].type &&
                  dir === posG[pA].direction && b === pA){
                  t = t+1;  //pro durchlauf 1 richtiges Atom
                }            
            }
        }       
        same = (t === posG.length);   
        return same;
    }
    
    /**
     * Event handler for the custom event 'gesturestart' set up by GeForMT.Observation.
     * @param {UIEvent} e The assigned event.
     * @private
     */
    function _gesturestart(e){
        if(_menu){
            _touches = e.touches;
            _start = true;
            GeForMT.stopHandler(true);
         
            if(!_recognitionStarted){
                _updatePossPathes(_rawModels);
                _visualizePathes();
            }
        }
        else {
            // if touch start is inside _feedforwardTouchCanvas
            if(e.target.id === _feedforwardTouchCanvas.canvas.id){
                GeForMT.stopHandler(true);      
            }
            else {
                GeForMT.stopHandler(false);
            }
        }     
    }
    
    /**
     * Event handler for the custom event 'gesturechange' set up by GeForMT.Observation.
     * @param {UIEvent} e The assigned event.
     * @private
     */
    function _gesturechange(e){
        //_touches = e.touches; 
        //console.log(e);    
    }
    
    /**
     * Event handler for the custom event 'gestureend' set up by GeForMT.Observation.
     * @param {UIEvent} e The assigned event.
     * @private
     */
    function _gestureend(e){
        _touches = [];
        _touchEndP.x = e.touches[0].pageX;
        _touchEndP.y = e.touches[0].pageY;
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
        if(_menu){
            for (var c = 0; c < _commandNames.length; c++){
                _commandNames[c].remove();
            }
            _feedMenuCanvas.remove();
            _createFeedMenu();
            _next = 0;
            
            var label = _setCommandLabel('Die Geste wurde nicht erkannt', _touchEndP);
            window.setTimeout(function(){
                label.remove();   
            }, 2000);
        }
        // start position
        else if(!_rec){
            for (var t = 0; t < _touchPoints.length; t++){
                var startP = _touchPoints[t].startP;          
                _touchPoints[t].attr({cx: startP.x, cy: startP.y});
            } 
            for (var p = 0; p < _gesturePathes.length; p++){
                _gesturePathes[p].attr('opacity', 0.4);
                _gesturePathes[p].attr('fill-opacity', 0);
            }
            _num = 0;
        }
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
            if(_menu){
            
                var result = [];
                result.push(e.identifier);
                _recognizedAtom(result);
                _next = 0; 
                
                window.setTimeout(function(){
                    _feedMenuCanvas.remove();
                    _createFeedMenu();   
                }, 3000);
            }
            else if(e.identifier === _id){
                for (var t = 0; t < _touchPoints.length; t++){
                    _touchPoints[t].remove();
                }
                for (var p = 0; p < _gesturePathes.length; p++){
                    _gesturePathes[p].attr('opacity', 1);
                    _gesturePathes[p].attr('fill-opacity', 1);
                }
                _touchPoints = [];
                _num = 0;
                _rec = true;
            }
        }
        else {
            for (var t = 0; t < _touchPoints.length; t++){
                var startP = _touchPoints[t].startP;            
                _touchPoints[t].attr({cx: startP.x, cy: startP.y});
            }
        }
        _recognitionStarted=false;
    }
    
    /**
     * Event handler of 'candidatesrecognized' events.
     * @param {GeForMT.GestureRecognition.GestureRecognitionCandidatesEvent} e
     * @private
     */
    function _candidatesrecognized(e){
        // marking menu
        if (_menu){
            if(e.candidates.length < _commandNames.length){
            for (var c = 0; c < _commandNames.length; c++){
                _commandNames[c].remove();
            }
            _commandNames = [];
            _start = false;
            _recognizedAtom(e.candidates);
            _updatePossPathes(_gestureList);
            _visualizePathes();
            }
        } // gesture animation
        else {
        // set next touch point for atomic gesture         
        for (var c = 0; c < e.candidates.length; c++){
            if(e.candidates[c] === _id){
                _gesturePathes[_num].attr('opacity', 1);
                _gesturePathes[_num].attr('fill-opacity', 1);
                _num += 1;

                if (_num < _gesturePathes.length){
                    for (var t = 0; t < _touchPoints.length; t++){
                        if(_gesturePathes[_num].items[0].type === "circle")
                            var startP = {x:_gesturePathes[_num].items[0].attr("cx"), y: _gesturePathes[_num].items[0].attr("cy")};  
                        else
                            var startP = _gesturePathes[_num].items[0].getPointAtLength(0);            
                        _touchPoints[t].attr({cx: startP.x, cy: startP.y});
                    }
                }    
            } 
        }
        }
    }
    
    return {
        /**
         * Initialize feedforward module. Setup the feedforward layer and its properties.
         * @param {GeForMT.Observation} observationModule
         * @param {GeForMT.GestureRecognition} recognitionModule
         */
        init: function(observationModule, recognitionModule){
            _observationModule = observationModule;
            _recognitionModule = recognitionModule;
            
            //register for interaction events
            _observationModule.registerDocumentEventListener('gesturestart', _gesturestart);
            _observationModule.registerDocumentEventListener('gesturechange', _gesturechange);
            _observationModule.registerDocumentEventListener('gestureend', _gestureend);
        
            //register for recognition events
            _recognitionModule.registerGestureRecognitionEventListener('recognitionstarted', _recognitionstarted);
            _recognitionModule.registerGestureRecognitionEventListener('recognitionfailed', _recognitionfailed);
            _recognitionModule.registerGestureRecognitionEventListener('gesturerecognized', _recognitionsuccess);
            _recognitionModule.registerGestureRecognitionEventListener('candidatesrecognized', _candidatesrecognized);    
        
            // Filter all registered gestures    
            var gestList =  GeForMT.GestureModel.getAllGestures();          
            for (var i=0; i<gestList.length; i++) {
                var gesture = gestList[i];
                gesture = _filterGestures(gesture);     
            }                           
        },
        /**
         * Configure and open the Feedforward-System
         * @param {id} canvas for visualization
         * @param {String} pathColor          
         */
        setFeedforwardVis: function(canvas, pathColor){
        
            if(canvas !== null){
              _holder = canvas;    
            }
            _pathColor = typeof pathColor !== 'undefined' ? pathColor : '#696969';
            
            _createVisualizationEnvironment()              
        },    
        /**
         * Visualize the gesture with given id.
         * @param {String} id of the gesture         
         */
        animateGesture: function(id){
            _gesturePathes = [];
            _touchPoints = [];
            _rec = false;
            _menu = false;
            
            _id = id;
            _start = true; 
            _visualizeGesture(id);
            _setDescription();
            
            //_observationModule.registerGestureRecognitionForAnim();  
        },
        /**
         * Open the dynamic Feedforward-Menu for 1F symbolic gestures         
         */
        startFeedMenu: function(){
            _createFeedMenu();
        }     
    };   
})();