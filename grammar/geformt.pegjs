definition = complex:complex opt:(option complex)*
 		{	var definition={options: []};
 			definition.options.push(complex);
 			for (var i=0;i<opt.length;i++){
 				definition.options.push(opt[i][1]);
 			}
 			return definition;
		}
 	
complex = gesture:gesture gestures:(operator gesture)*
 		{	var complex = {relation:null,gestures:[]};
			complex.gestures.push(gesture);
			for(var i=0;i<gestures.length;i++){		
				complex.gestures.push(gestures[i][1]);
				gestures[i][1].operation=gestures[i][0];
			}
		return complex;		
		}
	/rel:relation'[' gesture:gesture gestures:(operator gesture)*']'
		{	var complex = {relation:rel,gestures:[]};
			complex.gestures.push(gesture);
			for(var i=0;i<gestures.length;i++){
				complex.gestures.push(gestures[i][1]);
				gestures[i][1].operation=gestures[i][0];
			}
			return complex;
		}

gesture = func:function'('afo:atomfocus afos:(','atomfocus)*')'
		{	var gesture={funct:func,atomfocus: []};
			gesture.atomfocus.push(afo);
			for(var i=0;i<afos.length;i++){
				gesture.atomfocus.push(afos[i][1]);
			}
			return gesture;
		}
	/afo:atomfocus afos:(','atomfocus)*   
		{	var gesture= {funct:null,atomfocus: []};
			gesture.atomfocus.push(afo);
			for(var i=0;i<afos.length;i++){
				gesture.atomfocus.push(afos[i][1]);
			}
			return gesture;
		}
				
relation = 'CROSS' {return GeForMT.RELATION_TYPES.CROSS;}
	/'JOIN' {return GeForMT.RELATION_TYPES.JOIN;}
	/'SYNC' {return GeForMT.RELATION_TYPES.SYNC;}
	/'SPLIT' {return GeForMT.RELATION_TYPES.SPLIT;}
	/'CONNECT_START' {return GeForMT.RELATION_TYPES.CONNECT_START;}
        /'CONNECT_END' {return GeForMT.RELATION_TYPES.CONNECT_END;}
       /'AMONG' {return GeForMT.RELATION_TYPES.AMONG;}
        /'ASIDE' {return GeForMT.RELATION_TYPES.ASIDE;}
       /'CLOSE' {return GeForMT.RELATION_TYPES.CLOSE;}

atomfocus = atom:atom'('focus:focuslist')'
		{	return {atom:atom,focuslist:focus};}
	/atom:atom
		{	return {atom:atom,focuslist:[]};}
		
focuslist = focus:focus list:(','focus)*
		{	var focuslist=[];
			focuslist.push(focus);
			for(var i=0;i<list.length;i++){
				focuslist.push(list[i][1]);
			}
			return focuslist;
		}
		
focus = focus:[A-Za-z0-9#.:=\|\[\]\*_-]+
		{	return focus.join("");}
		
function = num:integer?functionType:'F'
		{	var func = {type:GeForMT.FUNCTION_TYPES.FINGER,number:null};
			if(typeof num != 'undefined') func['number']=num;
			return func;
		}
	/num:integer?functionType:'H'
		{	var func = {type:GeForMT.FUNCTION_TYPES.HAND,number:null};
			if(typeof num != 'undefined') func['number']=num;
			return func;
		}
	/num:integer?functionType:'B'
		{	var func = {type:GeForMT.FUNCTION_TYPES.BLOB,number:null};
			if(typeof num != 'undefined') func['number']=num;
			return func;
		}
		
operator = '*' {  return GeForMT.OPERATION_TYPES.ASTERISK;}
	/'+' {  return GeForMT.OPERATION_TYPES.PLUS;}
	/',' {  return GeForMT.OPERATION_TYPES.COMMA;}
	/';' {  return GeForMT.OPERATION_TYPES.SEMICOLON;}

option = '|' {  return GeForMT.OPERATION_TYPES.OPTION;}

atom = identifier:identifier 
		{	var atom = {type:identifier};
			return atom;
		}
	/vector:vector directionType:('_'direction)? 
		{	var atom={type: vector, direction: null};
			if(typeof directionType != 'undefined') 
				atom['direction']=directionType[1];
			return atom;
		}
	/shape:shape directionType:('_'direction)?rotationType:('_'rotation)?
		{	var atom={type: shape, direction: null, rotation: null};
			if(typeof directionType != 'undefined')
				atom['direction']=directionType[1];
			if(typeof rotationType != 'undefined') 
				atom['rotation']=rotationType[1];
			return atom;
		}
		
identifier = 'MOVE' {return GeForMT.CONTACT_TYPES.MOVE;}
	/ 'POINT' {return GeForMT.CONTACT_TYPES.POINT;}
	/ 'DEPOINT' {return GeForMT.CONTACT_TYPES.DEPOINT;}
	/ 'HOLD' {return GeForMT.CONTACT_TYPES.HOLD;}

vector = 'LINE' {return GeForMT.VECTOR_TYPES.LINE;}

shape =	'CIRCLE' {return GeForMT.SHAPE_TYPES.CIRCLE;}
	/ 'SEMICIRCLE' {return GeForMT.SHAPE_TYPES.SEMICIRCLE;}

direction =	'NORTH' {return GeForMT.DIRECTION_TYPES.NORTH;}
	/'NORTHEAST' {return GeForMT.DIRECTION_TYPES.NORTHEAST;}
	/'EAST' {return GeForMT.DIRECTION_TYPES.EAST;}
	/'SOUTHEAST' {return GeForMT.DIRECTION_TYPES.SOUTHEAST;}
	/'SOUTH' {return GeForMT.DIRECTION_TYPES.SOUTH;}
	/'SOUTHWEST' {return GeForMT.DIRECTION_TYPES.SOUTHWEST;}
	/'WEST' {return GeForMT.DIRECTION_TYPES.WEST;}
	/'NORTHWEST' {return GeForMT.DIRECTION_TYPES.NORTHWEST;}
	/'NE' {return GeForMT.DIRECTION_TYPES.NORTHEAST;}
	/'SE' {return GeForMT.DIRECTION_TYPES.SOUTHEAST;}
	/'SW' {return GeForMT.DIRECTION_TYPES.SOUTHWEST;}
	/'NW' {return GeForMT.DIRECTION_TYPES.NORTHWEST;}
	/'N°' {return GeForMT.DIRECTION_TYPES.TEND_NORTH;}
	/'N' {return GeForMT.DIRECTION_TYPES.NORTH;}
	/'E°' {return GeForMT.DIRECTION_TYPES.TEND_EAST;}
	/'E' {return GeForMT.DIRECTION_TYPES.EAST;}
	/'W°' {return GeForMT.DIRECTION_TYPES.TEND_WEST;}
	/'W' {return GeForMT.DIRECTION_TYPES.WEST;}
	/'S°' {return GeForMT.DIRECTION_TYPES.TEND_SOUTH;}
	/'S' {return GeForMT.DIRECTION_TYPES.SOUTH;}

rotation = 'CLOCKWISE' {return GeForMT.ROTATION_TYPES.CLOCKWISE;}
	/'CW' {return GeForMT.ROTATION_TYPES.CLOCKWISE;}
	/'COUNTERCLOCKWISE' {return GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE;}
	/'CCW' {return GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE;}

integer = first_digit:[1-9] last_digits:[0-9]*  
		{	var digits=String(first_digit)+String(last_digits.join(""));
			return parseInt(digits,10);
		}