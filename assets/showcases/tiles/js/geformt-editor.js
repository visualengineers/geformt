// load the application when DOM is ready (using jQuery)
$(function() {
	"use strict";

	// module pattern, uses own namespace
	var geformtEditor = (function() {

		/*
		 * GEFORMT ENUMERATION TYPES
		 * use these whenever possible
		 * avoid usage of entities as strings ("POINT", "SEQUENCE", ...),
		 * use Types.POINT, Operations.SEQUENCE etc. instead,
		 * use sign for generating GeForMT expressions
		 */

		/*
		 * Types Enumeration
		 */
		var Types = new Backbone.Collection([
			{ name: 'POINT', sign: 'POINT' },
			{ name: 'HOLD', sign: 'HOLD' },
			{ name: 'MOVE', sign: 'MOVE' },
			{ name: 'LINE', sign: 'LINE' },
			{ name: 'CIRCLE', sign: 'CIRCLE' },
			{ name: 'SEMICIRCLE', sign: 'SEMICIRCLE' }
		]);
		Types.each(function(type) {
			Types[type.get("name")] = type;
		});

		/*
		 * TouchFunctions Enumeration
		 */
		var TouchFunctions = new Backbone.Collection([
			{ name: 'FINGER', sign: 'F' },
			{ name: 'HAND', sign: 'H' },
			{ name: 'BLOB', sign: 'B' }
		]);
		TouchFunctions.each(function(touch) {
			TouchFunctions[touch.get("name")] = touch;
		});

		/*
		 * Operations Enumeration
		 */
		var Operations = new Backbone.Collection([
			{ name: 'CONCATENATE', sign: ',' },
			{ name: 'SYNCHRONOUS', sign: '+' },
			{ name: 'ASYNCHRONOUS', sign: '*' },
			{ name: 'SEQUENCE', sign: ';' }
		]);
		Operations.each(function(op) {
			Operations[op.get("name")] = op;
		});

		/*
		 * Directions Enumeration
		 */
		var Directions = new Backbone.Collection([
			{ name: 'NORTH', sign: 'N', angle: 1.5, deg: 270 },
			{ name: 'EAST', sign: 'E', angle: 2, deg: 0 },
			{ name: 'SOUTH', sign: 'S', angle: 0.5, deg: 90 },
			{ name: 'WEST', sign: 'W', angle: 1, deg: 180 },
			{ name: 'NORTHEAST', sign: 'NE', angle: 1.75, deg: 315 },
			{ name: 'NORTHWEST', sign: 'NW', angle: 1.25, deg: 225 },
			{ name: 'SOUTHEAST', sign: 'SE', angle: 0.25, deg: 45 },
			{ name: 'SOUTHWEST', sign: 'SW', angle: 0.75, deg: 135 }
		]);
		Directions.each(function(d) {
			Directions[d.get("name")] = d;
		});

		/*
		 * Rotations Enumeration
		 */
		var Rotations = new Backbone.Collection([
			{ name: 'CLOCKWISE', sign: 'CW' },
			{ name: 'COUNTERCLOCKWISE', sign: 'CCW' }
		]);
		Rotations.each(function(r) {
			Rotations[r.get("name")] = r;
		});

		/*
		 * Times Enumeration
		 */
		var Times = new Backbone.Collection([
			{ name: 'ON', sign: 'ON' },
			{ name: 'OFF', sign: 'OFF' }
		]);
		Times.each(function(t) {
			Times[t.get("name")] = t;
		});

		/*
		 * Spatial Relations Enumeration
		 */
		var SpatialRelations = new Backbone.Collection([
			{ name: 'CROSS', sign: 'CROSS' },
			{ name: 'JOIN', sign: 'JOIN' },
			{ name: 'SYNC', sign: 'SYNC' },
			{ name: 'SPREAD', sign: 'SPREAD' },
			{ name: 'SPLIT', sign: 'SPLIT' },
			{ name: 'CONNECT_START', sign: 'CONNECT_START' },
			{ name: 'CONNECT_END', sign: 'CONNECT_END' },
			{ name: 'ASIDE', sign: 'ASIDE' },
			{ name: 'AMONG', sign: 'AMONG' },
			{ name: 'CLOSE', sign: 'CLOSE' },
			{ name: 'ADJOIN_', sign: 'ADJOIN_' }
		]);
		SpatialRelations.each(function(sr) {
			SpatialRelations[sr.get("name")] = sr;
		});

		/*
		 * GEFORMT COLLECTION TYPES
		 * the complex gestures collection holds all registered complex gestures,
		 * every other collection type is only used by gesture models
		 */

		/*
		 * Atoms Collection
		 * holds atoms for usage in atomic gestures
		 */
		var Atoms = Backbone.Collection.extend({
			model: Atom
		});

		/*
		 * Atomic Gestures Collection
		 * holds atomic gestures for usage in complex gestures
		 */
		var AtomicGestures = Backbone.Collection.extend({
			model: AtomicGesture
		});

		/*
		 * Operation Mappings Collection
		 * holds operations for usage in complex gestures
		 */
		var OperationMappings = Backbone.Collection.extend({

		});

		/*
		 * Complex Gestures Collection
		 * holds all complex gestures
		 */
		var ComplexGestures = Backbone.Collection.extend({
			model: ComplexGesture
		});

		/*
		 * GEFORMT GESTURE MODELS
		 * complex gestures encapsulate atomic gestures,
		 * atomic gestures encapsulate atoms
		 */

		/*
		 * Atom Model
		 * describes the smallest gesture entity (movement or touch)
		 */
		var Atom = Backbone.Model.extend({
			defaults: {
				type: Types.POINT,	// type
				direction: '',		// direction | empty
				angle: '',			// angle | empty
				focus: '',			// focus | empty
				expression: ''		// the GeforMT expression, e.g. "LINE_NE(object)"
			},
			buildExpression: function() {
				if (this.get('expression') === '') {
					this.expression = this.get('type').get('name');
					if (this.get('direction')) {
						this.expression += '_'+this.get('direction').get('sign');
					}
					if (this.get('angle')) {
						this.expression += '_'+this.get('angle').get('sign');
					}
					if (this.get('focus')) {
						this.expression += '('+this.get('focus')+')';
					}
				}
			}
		});

		/*
		 * AtomicGesture Model
		 * describes a single gesture or concatenated gestures
		 */
		var AtomicGesture = Backbone.Model.extend({
			defaults: {
				touchFunction: TouchFunctions.FINGER,	// touch function | empty
				touchCount: 1,		// number of touches (does not matter if touchFuncton is empty)
				expression: ''		// the GeForMT expression, using expressions of atom objects, e.g. "2F(..., ...)"
			},
			initialize: function() {
				this.atoms = new Atoms();	// collection of atom objects, atoms inside an atomic gesture are always concatenated

				this.on('all', this.buildExpression);
			},
			addAtom: function(atom, position) {
				if (position) {
					atoms.add(atom, { at: position });
				} else {
					atoms.add(atom);
				}
			},
			buildExpression: function() {
				this.expression = '';
				if (this.atoms.models.length !== 0) {
					this.expression = this.get('touchCount')+''+this.get('touchFunction').get('sign')+' ( ';
					_.each(this.atoms.models, function(atom, key, list) {
						atom.buildExpression();
						this.expression += atom.expression+', ';
					}, this);

					this.expression = this.expression.substr(0, this.expression.length-2);
					this.expression += ' )';
				}
			}
		});

		/*
		 * ComplexGesture Model
		 * describes a complex gesture consisiting of gestures, operations,
		 * an expression and a optional spatial relation
		 */
		var ComplexGesture = Backbone.Model.extend({
			defaults: {
				name: '',									// gesture name
				spatialRelation: '',						// spatial relation | empty
				gestureTime: Times.ON,						// time | empty
				expression: ''								/* the GeForMT expression, using expressions of its atmoic gestures
															e.g. "CROSS[ ... + ... ; ... ]" */
			},
			initialize: function() {
				this.operationMapping = new OperationMappings();	/* collection of operations; first operation connects the
																	first and second gesture from the gestures collection,
																	second operation connects the second and third gesture, etc. */
				this.gestures = new AtomicGestures();				// collection of atomic gestures used by the complex gesture

				this.on('all', this.buildExpression);
			},
			addGesture: function(gesture, position) {		// make sure to always add an operation when adding a gesture
				this.gestures.add(gesture, { at: position });	// addGesture() and addOperation() are not responsible for
			},												// maintaining a correct order of gestures and operations
			addOperation: function(operation, position) {
				this.operationMapping.add(operation, { at: position });
			},
			buildExpression: function() {					// updates this.expression with geformt expressions
				this.expression = '<strong>'+this.get('name')+' = </strong>';
				if (this.gestures.at(0)) {
					if (this.get('spatialRelation') !== '' && this.get('spatialRelation')) {
						this.expression += this.get('spatialRelation').get('sign')+' [ ';
					}

					this.gestures.at(0).buildExpression();
					this.expression += this.gestures.at(0).expression;

					_.each(this.operationMapping.models, function(op, key, list) {
						if ((key+1) <= this.operationMapping.models.length) {
							this.gestures.at(key+1).buildExpression();
							this.expression += ' '+op.get('sign')+' '+this.gestures.at(key+1).expression;
						}
					}, this);

					if (this.get('spatialRelation') !== '' && this.get('spatialRelation')) {
						this.expression += ' ]';
					}

					this.expression += ' : '+this.get('gestureTime').get('sign');

					$('.expression').html(this.expression);
				}
			}
		});

		/*
		 * SVGGenerator Model
		 * generates raphael elements for the different gesture types
		 */
		var SVGGenerator = Backbone.Model.extend({
			initialize: function(settings) {
				settings = (typeof settings === "undefined") ? {} : settings;
				settings.strokeWidth = (typeof settings.strokeWidth === "undefined") ? 10 : settings.strokeWidth;
				settings.strokeColor = (typeof settings.strokeColor === "undefined") ? '#263239' : settings.strokeColor;
				settings.darkerStrokeColor = (typeof settings.darkerStrokeColor === "undefined") ? '#0076B0' : settings.darkerStrokeColor;
				settings.fillColor = (typeof settings.fillColor === "undefined") ? '#0076B0' : settings.fillColor;
				settings.messure = (typeof settings.messure === "undefined") ? 35 : settings.messure;
				settings.pointSize = (typeof settings.pointSize === "undefined") ? 15 : settings.pointSize;

				this.strokeWidth = settings.strokeWidth;
				this.strokeColor = settings.strokeColor;
				this.darkerStrokeColor = settings.darkerStrokeColor;
				this.fillColor = settings.fillColor;
				this.messure = settings.messure;
				this.pointSize = settings.pointSize;
			},
			getLine: function(canvas, startPoint, touches, direction) {
				var line;

				// parse startPoint to Integer
				var x = parseInt(startPoint[0], 10);
				var y = parseInt(startPoint[1], 10);

				// generate strings for directions
				var up = (y - this.messure*2).toString();
				var down = (y + this.messure*2).toString();
				var left = (x - this.messure*2).toString();
				var right = (x + this.messure*2).toString();

				canvas.setStart();

				// draw line in the right direction
				switch(direction) {
					case Directions.NORTH:
						line = canvas.path('M'+x+','+y+'V'+up);
						break;
					case Directions.EAST:
						line = canvas.path('M'+x+','+y+'H'+right);
						break;
					case Directions.SOUTH:
						line = canvas.path('M'+x+','+y+'V'+down);
						break;
					case Directions.WEST:
						line = canvas.path('M'+x+','+y+'H'+left);
						break;
					case Directions.NORTHEAST:
						line = canvas.path('M'+x+','+y+'L'+right+','+up);
						break;
					case Directions.NORTHWEST:
						line = canvas.path('M'+x+','+y+'L'+left+','+up);
						break;
					case Directions.SOUTHEAST:
						line = canvas.path('M'+x+','+y+'L'+right+','+down);
						break;
					case Directions.SOUTHWEST:
						line = canvas.path('M'+x+','+y+'L'+left+','+down);
						break;
					default:
						line = canvas.path('M'+x+','+y+'H'+right);
				}

				line.attr('stroke', this.strokeColor);
				line.attr('stroke-width', 0);

				// draw arrow
				var startP = [ Math.round(line.getPointAtLength(0).x), Math.round(line.getPointAtLength(0).y) ];
				var endP = [ Math.round(line.getPointAtLength(line.getTotalLength()-17).x), Math.round(line.getPointAtLength(line.getTotalLength()-17).y) ];
				var arrow = canvas.path('M'+startP[0]+','+startP[1]+'L'+endP[0]+','+endP[1]);
				arrow.attr('stroke-width', this.strokeWidth);
				arrow.attr('stroke', this.strokeColor);
				arrow.attr('arrow-end', 'block-narrow-short');

				// draw start point
				var startCircle = canvas.circle(x, y, this.pointSize);
				startCircle.attr('fill', this.fillColor);
				startCircle.attr('stroke-width', 4);
				startCircle.attr('stroke', this.darkerStrokeColor);

				// draw end point
				var endCircle = canvas.circle(line.getPointAtLength(line.getTotalLength()).x, line.getPointAtLength(line.getTotalLength()).y, this.pointSize);
				endCircle.attr('fill', this.fillColor);
				endCircle.attr('stroke-width', 4);
				endCircle.attr('stroke', this.darkerStrokeColor);

				var set = canvas.setFinish();
				return set;
			},
			getMove: function(canvas, startPoint, touches) {
				var x = parseInt(startPoint[0], 10);
				var y = parseInt(startPoint[1], 10);

				var endP = {
					x: x + this.messure*2,
					y: y
				};

				var midP = {
					x: x + this.messure,
					y: y
				};

				var controlP = {
					x: x + this.messure,
					y: y + this.messure
				};

				canvas.setStart();

				// draw free form bezier
				var path = canvas.path('M'+x+','+y+'S'+controlP.x+','+controlP.y+','+midP.x+','+midP.y+'S'+controlP.x+','+controlP.y+','+endP.x+','+endP.y);
				//console.log('M'+x+','+y+'C'+x+30+','+y-80+','+x+50+','+y+','+y+','+x);
				path.attr('stroke', this.strokeColor);
				path.attr('stroke-width', this.strokeWidth);

				// draw start point
				var startCircle = canvas.circle(path.getPointAtLength(0).x, path.getPointAtLength(0).y, this.pointSize);
				startCircle.attr('fill', this.fillColor);
				startCircle.attr('stroke-width', 4);
				startCircle.attr('stroke', this.darkerStrokeColor);

				// draw end point
				var endCircle = canvas.circle(path.getPointAtLength(path.getTotalLength()).x, path.getPointAtLength(path.getTotalLength()).y, this.pointSize);
				endCircle.attr('fill', this.fillColor);
				endCircle.attr('stroke-width', 4);
				endCircle.attr('stroke', this.darkerStrokeColor);

				var set = canvas.setFinish();
				return set;
			},
			getCircle: function(canvas, startPoint, touches, direction, rotation) {
				var x = startPoint[0];
				var y = startPoint[1];
				var y2 = y - 0.1;

				canvas.setStart();

				// calculate correct position of circle
				var angle = 0;
				if (direction) {
					angle = direction.get('angle')*Math.PI;
				}
				var pointX = Math.cos(angle)*(this.messure)+x;
				var pointY = Math.sin(angle)*(this.messure)+y;

				var diff = {
					x: (x - pointX),
					y: (y - pointY)
				};

				var xTrans = x + this.messure + diff.x;
				var yTrans = y + diff.y;
				var y2Trans = y2 + diff.y;

				// draw circle
				var path = canvas.path('M'+xTrans+','+yTrans+'A'+this.messure+','+this.messure+',0,1,1,'+xTrans+','+y2Trans+'Z');
				path.attr('stroke-width', this.strokeWidth);
				path.attr('stroke', this.strokeColor);

				// draw arrow
				if (rotation === Rotations.CLOCKWISE) {
					path.attr({ 'arrow-end': 'block-narrow-short' });
				} else {
					path.attr({ 'arrow-start': 'block-narrow-short' });
				}

				// draw start/end point
				var startCircle = canvas.circle(x, y, this.pointSize);
				startCircle.attr('fill', this.fillColor);
				startCircle.attr('stroke-width', 4);
				startCircle.attr('stroke', this.darkerStrokeColor);

				var set = canvas.setFinish();
				return set;
			},
			getSemiCricle: function(canvas, startPoint, touches, direction, rotation) {
				var semicircle;
				var transform;

				// parse startPoint to Integer
				var x = parseInt(startPoint[0], 10);
				var y = parseInt(startPoint[1], 10);

				// generate strings for directions
				var up = (y - this.messure*2).toString();
				var down = (y + this.messure*2).toString();
				var left = (x - this.messure*2).toString();
				var right = (x + this.messure*2).toString();

				// calculate start/end point
				var angle = 0;
				if (direction) {
					angle = direction.get('angle')*Math.PI;
				}
				var pointX = Math.cos(angle)*(this.messure*2-this.strokeWidth)+x;
				var pointY = Math.sin(angle)*(this.messure*2-this.strokeWidth)+y;

				// change directions if direction is counterclock
				if (rotation == Rotations.COUNTERCLOCKWISE) {
					if (direction == Directions.NORTH || direction == Directions.SOUTH) {
						var l = left;
						left = right;
						right = l;
					} else if (direction == Directions.EAST || direction == Directions.WEST) {
						var u = up;
						up = down;
						down = u;
					}
				}

				canvas.setStart();

				switch(direction) {
					case Directions.NORTH:
						semicircle = canvas.path('M'+x+','+y+'C'+left+','+y+','+left+','+up+','+x+','+up);
						break;
					case Directions.EAST:
						semicircle = canvas.path('M'+x+','+y+'C'+x+','+up+','+right+','+up+','+right+','+y);
						break;
					case Directions.SOUTH:
						semicircle = canvas.path('M'+x+','+y+'C'+right+','+y+','+right+','+down+','+x+','+down);
						break;
					case Directions.WEST:
						semicircle = canvas.path('M'+x+','+y+'C'+x+','+down+','+left+','+down+','+left+','+y);
						break;
					case Directions.NORTHEAST:
						//semicircle = canvas.path('M'+x+','+y+'A'+this.messure+','+this.messure+',1,0,0,'+pointX+','+pointY);
						break;
					case Directions.NORTHWEST:
						//semicircle = canvas.path('M'+x+','+y+'A'+this.messure+','+this.messure+',1,0,0,'+pointX+','+pointY);
						break;
					case Directions.SOUTHEAST:
						//semicircle = canvas.path('M'+x+','+y+'A'+this.messure+','+this.messure+',1,0,0,'+pointX+','+pointY);
						break;
					case Directions.SOUTHWEST:
						//semicircle = canvas.path('M'+x+','+y+'A'+this.messure+','+this.messure+',1,0,0,'+pointX+','+pointY);
						break;
					default:
						semicircle = canvas.path('M'+x+','+y+'C'+left+','+y+','+left+','+up+','+x+','+up);
				}

				semicircle.attr('stroke-width', 0);

				// draw arrow
				var subPath = semicircle.getSubpath(0, semicircle.getTotalLength()-17);
				var arrow = canvas.path(subPath);
				arrow.attr('stroke-width', this.strokeWidth);
				arrow.attr('stroke', this.strokeColor);
				arrow.attr('arrow-end', 'block-narrow-short');

				// draw start point
				var startCircle = canvas.circle(semicircle.getPointAtLength(0).x, semicircle.getPointAtLength(0).y, this.pointSize);
				startCircle.attr('fill', this.fillColor);
				startCircle.attr('stroke-width', 4);
				startCircle.attr('stroke', this.darkerStrokeColor);

				// draw end point
				var endCircle = canvas.circle(semicircle.getPointAtLength(semicircle.getTotalLength()).x, semicircle.getPointAtLength(semicircle.getTotalLength()).y, this.pointSize);
				endCircle.attr('fill', this.fillColor);
				endCircle.attr('stroke-width', 4);
				endCircle.attr('stroke', this.darkerStrokeColor);

				semicircle.attr('x', 100);

				var set = canvas.setFinish();
				return set;
			},
			getPoint: function(canvas, startPoint, touches) {
				canvas.setStart();

				var circle = canvas.circle(startPoint[0], startPoint[1], this.pointSize);
				circle.attr('fill', this.fillColor);
				circle.attr('stroke-width', 4);
				circle.attr('stroke', this.darkerStrokeColor);

				var set = canvas.setFinish();
				return set;
			},
			getHold: function(canvas, startPoint, touches) {
				canvas.setStart();

				var circle = canvas.circle(startPoint[0], startPoint[1], this.pointSize);
				circle.attr('fill', this.fillColor);
				circle.attr('stroke-width', 4);
				circle.attr('stroke', this.darkerStrokeColor);

				var circleOuter = canvas.circle(startPoint[0], startPoint[1], this.pointSize+7);
				circleOuter.attr('fill', 'transparent');
				circleOuter.attr('stroke-width', 4);
				circleOuter.attr('stroke', this.strokeColor);

				var set = canvas.setFinish();
				return set;
			}
		});

		/*
		 * VIEWS
		 * views represent a part of the ui (e.g. the sidebar or timeline)
		 * they also serve as controllers!
		 */

		/*
		* Compass Rose View
		* represents the compass rose to concatenate atoms
		*/
		var CompassRoseView = Backbone.View.extend({
			el: $('.rose-canvas'),
			events: {
				'click .concatenate':				'concatenate',
				'click .cancel-concatenate':		'hide'
			},
			initialize: function() {
				var _this = this;

				this.direction = true;
				$('.direction').click(function() {
					_this.direction = !$('.direction').is(':checked');
				});

				this.rotation = true;
				$('.rotation').click(function() {
					_this.rotation = !$('.rotation').is(':checked');
					console.log(_this.rotation);
				});

				// settings
				this.strokeColor = '#909090';
				this.strokeWidth = 4;

				// create canvas
				this.canvas = new Raphael(this.el, 240, 160);

				// create SVGGenerator
				this.gen = new SVGGenerator({
					pointSize: 5,
					fillColor: '#263239',
					darkerStrokeColor: '#263239',
					strokeColor: '#263239'
				});

				// current gesture displayed
				var currentVis;

				// set up GeForMTjs
				GeForMT.init({ }, { feedback: false, preventDefault: false, contiguityInterval: 500 });

				// register POINT
				GeForMT.addGesture({
					identifier: 'point',
					expr: 'POINT',
					handler: function(e) {
						var expr = e.expr;
						var touches = e.pathes[0].length;

						if ($(e.target).attr('class') !== $('.concatenate').attr('class')) {
							if (_this.currentVis) {
								_this.currentVis.remove();
							}
							_this.currentVis = _this.canvas.circle(120, 80, 5);

							_this.currentVis.attr({
								fill: '#233239'
							});

							// create atom
							_this.atom = new Atom({ type: Types.POINT });
						}
					}
				});

				// register HOLD
				GeForMT.addGesture({
					identifier: 'hold',
					expr: 'HOLD',
					handler: function(e) {
						var expr = e.expr;
						var touches = e.pathes[0].length;

						if ($(e.target).attr('class') !== $('.concatenate').attr('class')) {
							if (_this.currentVis) {
								_this.currentVis.remove();
							}

							_this.canvas.setStart();

							var circleInner = _this.canvas.circle(120, 80, 5);
							var circleOuter = _this.canvas.circle(120, 80, 8);

							circleInner.attr({
								fill: '#233239'
							});

							circleOuter.attr({
								stroke: '#233239',
								'stroke-width': 2
							});

							_this.currentVis = _this.canvas.setFinish();

							// create atom
							_this.atom = new Atom({ type: Types.HOLD });
						}
					}
				});

				// register MOVE
				GeForMT.addGesture({
					identifier: 'move',
					expr: 'MOVE',
					handler: function(e) {
						var expr = e.expr;
						var touches = e.pathes[0].length;

						if ($(e.target).attr('class') !== $('.concatenate').attr('class')) {
							if (_this.currentVis) {
								_this.currentVis.remove();
							}
							_this.currentVis = _this.canvas.path('M50,80C50,40,120,40,120,120S190,90,190,80');

							_this.currentVis.attr({
								stroke: '#233239',
								'stroke-width': 5,
								'arrow-end': 'block'
							});

							// create atom
							_this.atom = new Atom({ type: Types.MOVE });
						}
					}
				});

				_.each(Directions.models, function(direction, key, list) {
					// short version of current direction
					var sign = direction.get('sign');

					// register LINE_*
					GeForMT.addGesture({
						identifier: 'lineTo'+sign,
						expr: 'LINE_'+sign,
						handler: function(e) {
							var expr = e.expr;
							var touches = e.pathes[0].length;

							if ($(e.target).attr('class') !== $('.concatenate').attr('class')) {
								if (_this.currentVis) {
									_this.currentVis.remove();
								}
								_this.currentVis = _this.canvas.path('M50,80L190,80');

								_this.currentVis.rotate(Directions.at(key).get('deg'), 120, 80);
								_this.currentVis.attr({
									stroke: '#233239',
									'stroke-width': 5,
									'arrow-end': 'block'
								});

								// create atom
								if (_this.direction) {
									_this.atom = new Atom({ type: Types.LINE, direction: Directions.at(key) });
								} else {
									_this.atom = new Atom({ type: Types.LINE, direction: '' });
								}
							}
						}
					});

					_.each(Rotations.models, function(rotation, key2, list) {
						var rSign = rotation.get('sign');

						// register CIRCLE_*_*
						GeForMT.addGesture({
							identifier: 'circleTo'+sign+rSign,
							expr: 'CIRCLE_'+sign+'_'+rSign,
							handler: function(e) {
								var expr = e.expr;
								var touches = e.pathes[0].length;

								if ($(e.target).attr('class') !== $('.concatenate').attr('class')) {
									if (_this.currentVis) {
										_this.currentVis.remove();
									}
									_this.currentVis = _this.canvas.path("M190,80A70,70,0,1,1,190,79.999Z");

									_this.currentVis.rotate(Directions.at(key).get('deg'), 120, 80);
									_this.currentVis.attr({
										stroke: '#233239',
										'stroke-width': 5
									});

									if (Rotations.at(key2) === Rotations.CLOCKWISE) {
										_this.currentVis.attr({ 'arrow-end': 'block' });
									} else {
										_this.currentVis.attr({ 'arrow-start': 'block' });
									}

									// create atom
									_this.atom = new Atom({ type: Types.CIRCLE, direction: Directions.at(key), angle: Rotations.at(key2) });
								}
							}
						});

						// register SEMICIRCLE_*_*
						GeForMT.addGesture({
							identifier: 'semiCircleTo'+sign+rSign,
							expr: 'SEMICIRCLE_'+sign+'_'+rSign,
							handler: function(e) {
								var expr = e.expr;
								var touches = e.pathes[0].length;

								if ($(e.target).attr('class') !== $('.concatenate').attr('class')) {
									if (_this.currentVis !== null) {
										_this.currentVis.remove();
									}
									var circle = _this.canvas.path("M190,80A70,70,0,1,1,190,79.999");
									_this.currentVis = _this.canvas.path(circle.getSubpath(0, circle.getTotalLength()/2));

									_this.currentVis.rotate(Directions.at(key).get('deg'), 120, 80);
									_this.currentVis.attr({
										stroke: '#233239',
										'stroke-width': 5
									});

									if (Rotations.at(key2) === Rotations.CLOCKWISE) {
										_this.currentVis.attr({ 'arrow-end': 'block' });
										_this.currentVis.rotate(180, 120, 80);
									} else {
										_this.currentVis.attr({ 'arrow-start': 'block' });
									}

									// create atom
									var dir = Directions.at(key);
									if (!_this.direction) {
										dir = '';
									}
									var rot = Rotations.at(key2);
									if (!_this.rotation) {
										rot = '';
									}
									_this.atom = new Atom({ type: Types.SEMICIRCLE, direction: dir, angle: rot });
								}
							}
						});
					});
				});

				// render view
				this.render();
			},
			render: function() {
				// outer circle
				var circle = this.canvas.circle('50%', '50%', 70);
				circle.attr('stroke', this.strokeColor);
				circle.attr('stroke-width', this.strokeWidth);

				// directions
				var line1 = this.canvas.path('M40,80H200');
				line1.attr('stroke', this.strokeColor);
				line1.attr('stroke-width', this.strokeWidth);

				var line2 = this.canvas.path('M120,0V200');
				line2.attr('stroke', this.strokeColor);
				line2.attr('stroke-width', this.strokeWidth);

				var line3 = this.canvas.path('M60,20L180,140');
				line3.attr('stroke', this.strokeColor);
				line3.attr('stroke-width', this.strokeWidth);

				var line4 = this.canvas.path('M60,140L180,20');
				line4.attr('stroke', this.strokeColor);
				line4.attr('stroke-width', this.strokeWidth);
			},
			toggleDirection: function(e) {
				this.direction = !$('.direction').is(':checked');
			},
			toggle: function() {
				$('.compass-rose').toggle(500);
			},
			show: function(element, atomic) {
				// disable scrolling on compass rose
				$(document).bind('touchmove', function(e) {
					if (e.target.localName == 'svg') {
						return false;
					} else {
						return true;
					}
				});

				// enable recognition
				var timeout = setTimeout(function() {
					this.rec = true;
				}, 300);
				//this.rec = true;

				// set current atomic gesture
				this.currentAtomic = atomic;

				// enable visual feedback
				GeForMT.setFeedback(true);

				// calculate rose position
				var top = $(element).position().top + $(element).parent().position().top - 80;
				var left = $(element).position().left + $(element).parent().position().left + 316;


				// set offset of compass rose and fade in
				$('.compass-rose').css({ top: top, left: left });
				$('.compass-rose').fadeIn(500);
			},
			hide: function() {
				// enable scrolling on compass rose
				$(document).bind('touchmove', function(e) {
					return true;
				});

				// disable recognition
				this.rec = false;

				// disable visual feedback
				GeForMT.setFeedback(false);

				$('.compass-rose').offset({ top: 0, left: 0 });
				$('.compass-rose').hide();
			},
			visible: function() {
				return $('.compass-rose').is(':visible');
			},
			concatenate: function(e) {
				if (this.currentAtomic && this.atom) {
					if (!this.direction) {
						this.atom.set({ direction: '' });
					}
					if (!this.rotation) {
						this.atom.set({ angle: '' });
					}
					this.currentAtomic.atoms.add(this.atom);
				}
			}
		});

		/*
		* SlotView
		* represents a single slot of our timeline
		*/
		var SlotView = Backbone.View.extend({
			tagName: 'div',
			className: 'slot empty grid_4',		// default: "<div class="slot empty grid_4"
			row: -1,							// the slot's row number inside its timeline, set at initialize
			col: -1,							// the slot's column number
			events: {

			},
			initialize: function(attr) {
				// set empty atomic gesture for this slot
				this.model = new AtomicGesture();

				// create a raphael canvas for our slot
				this.canvas = new Raphael(this.el, '100%', '100%');

				// set the grid coordinates
				this.row = attr.row;
				this.col = attr.col;

				// render the view
				this.render();
			},
			render: function(atoms) {
				var gen = new SVGGenerator();
				var lastPath;
				var set = this.canvas.set();

				// iterate atoms and draw paths
				_.each(atoms, function(atom, key, list) {
					var currentCoordinate = [ 0, 0 ];
					if (key !== 0) {
						// get coordinates of last end point, for use as new start point of path
						currentCoordinate = [ lastPath.items[[lastPath.items.length-1]].attr('cx'), lastPath.items[[lastPath.items.length-1]].attr('cy') ];
					}

					// create the path according to its type
					var path;
					switch(atom.get('type')) {
						case Types.LINE:
							path = gen.getLine(this.canvas, currentCoordinate, atom.get('touches'), atom.get('direction'));
							lastPath = path;
							break;
						case Types.SEMICIRCLE:
							path = gen.getSemiCricle(this.canvas, currentCoordinate, atom.get('touches'), atom.get('direction'), atom.get('angle'));
							lastPath = path;
							break;
						case Types.POINT:
							path = gen.getPoint(this.canvas, currentCoordinate, atom.get('touches'));
							lastPath = path;
							break;
						case Types.HOLD:
							path = gen.getHold(this.canvas, currentCoordinate, atom.get('touches'));
							lastPath = path;
							break;
						case Types.CIRCLE:
							path = gen.getCircle(this.canvas, currentCoordinate, atom.get('touches'), atom.get('direction'), atom.get('angle'));
							lastPath = path;
							break;
						case Types.MOVE:
							path = gen.getMove(this.canvas, currentCoordinate, atom.get('touches'));
							lastPath = path;
							break;
					}
					set.push(path);
				}, this);

				// center elements in slot
				var centerSet = {
					x: set.getBBox().x + set.getBBox().width/2 | 0,
					y: set.getBBox().y + set.getBBox().height/2 | 0
				};

				var centerCanvas = {
					x: 150,
					y: 110
				};

				var translate = {
					x: Math.abs(centerSet.x - centerCanvas.x),
					y: Math.abs(centerSet.y - centerCanvas.y)
				};

				set.transform('t'+translate.x+','+translate.y);
			}
		});

		/*
		 * TimelineView
		 * represents the complete timeline, including all slots
		 */
		var TimelineView = Backbone.View.extend({
			el: $('.timeline'),
			events: {

			},
			initialize: function() {
				this.slots = [];
			},
			// creates or updates the timeline output (iterates all slots)
			// generates empty slots if necessary
			render: function() {
				// clear timeline
				this.$el.empty();

				// group slots by rows
				var rows = _.groupBy(this.slots, 'row');

				// sort rows
				rows = _.sortBy(rows, 'row');

				// iterate all rows, context: this.slots
				_.each(rows, function(row, key, list) {
					// iterate all slots inside of current row
					var currentCol = 0;

					// sort cols
					row = _.sortBy(row, 'col');

					// iterate all slots in current row
					_.each(row, function(slot, key, list) {
						// increase current col
						currentCol++;

						// fill empty columns if necessary
						for (currentCol; currentCol < slot.col; currentCol++) {
							$('.timeline').append('<div class="slot disabled grid_4"></div>');
						}

						// append markup of current slot to timeline
						slot.$el.appendTo('.timeline').hide(1, function() {
							slot.$el.fadeIn('slow');
						});
					});

					// append empty slot to current row
					if (key === (rows.length-1)) {
						$('.timeline').append('<div class="slot empty grid_4"></div>');
					}

					// start a new row
					$('.timeline').append('<hr />');
				}, this.slots);

				// add an empty row to the bottom
				var maxCol = _.max(this.slots, function(slot){ return slot.col; }).col;
				for (var i = 0; i < maxCol; i++) {
					if (i === (maxCol-1)) {
						$('.timeline').append('<div class="slot empty grid_4"></div>');
					} else {
						$('.timeline').append('<div class="slot disabled grid_4"></div>');
					}
				}
			},
			// add a new slot to the timeline
			// type = empty | used | active
			addSlot: function(type, row, col) {
				var emptySlot = new SlotView({ className: 'slot '+type+' grid_4', col: col, row: row });
				this.slots.push(emptySlot);
				this.render();
			},
			// takes a complex gesture and generates its slots
			buildTimeline: function(complexGesture) {
				var atomicGestures = complexGesture.gestures.models;
				var operations = complexGesture.operationMapping.models;
				var currentCoords, slot;

				// reset slots
				this.slots = [];

				if (atomicGestures.length === 0) {
					slot = new SlotView({ className: 'slot empty grid_4 id_0', col: 1, row: 1 });
					this.slots.push(slot);
					currentCoords = [1, 1];
				}

				// iterate atomic gestures
				_.each(atomicGestures, function(gesture, key, list) {
					// create slot at coordinate [ 1, 1 ] for the first atomic gesture...
					if (key === 0) {
						// create slot
						slot = new SlotView({ className: 'slot used grid_4 id_0', col: 1, row: 1 });
						this.slots.push(slot);
						currentCoords = [1, 1];

						// render slot
						slot.render(gesture.atoms.models);

					// ...create further slots
					} else {
						// iterate all operations
						var operation = operations[key-1];

						// evaluate operation and create slot
						switch(operation.get('name')) {
							case 'SEQUENCE':
								// set coordinates
								currentCoords = [ currentCoords[0]+1, currentCoords[1] ];
								break;
							case 'SYNCHRONOUS':
								// set coordinates
								currentCoords = [ currentCoords[0], currentCoords[1]+1 ];
								break;
							case 'ASYNCHRONOUS':
								// set coordinates
								currentCoords = [ currentCoords[0], currentCoords[1]+1 ];
								break;
						}

						// create slot
						slot = new SlotView({ className: 'slot used grid_4 id_'+key, col: currentCoords[0], row: currentCoords[1] });
						this.slots.push(slot);

						// render slot
						slot.render(gesture.atoms.models);
					}
				}, this);

				// render the timeline
				this.render();
			}
		});

		/*
		 * AppView
		 * the main view for our application
		 * manages the toolbar and sidebar
		 */
		var AppView = Backbone.View.extend({
			el: $('body'),
			events: {
				'click .button-delete':					'deleteCurrentGesture',
				'click .reset':							'resetCurrentGesture',
				'click .register':						'registerCurrenGesture',
				'touchstart .slot':						'activateSlot',
				'click .gesture-time':					'toggleGestureTime',
				'change .spatial-relation':				'switchSpatialRelation',
				'click .fullscreen':					'enableFullscreen',
				'click .disable-fullscreen':			'disableFullscreen',
				'click .enable-gesture-info':			'enableGestureInfo',
				'click .enable-gesture-test':			'enableGestureTest',
				'click .enable-registered-gestures':	'enableRegisteredGestures',
				'click .concatenate':					'render',
				'change .gesture-name':					'updateGestureName',
				'click .export':						'export',
				'click .close':							'closeExport',
				'click .finger':						'setFingerNumber'
			},
			initialize: function() {
				// direction status
				this.direction = true;

				// complex gesture collection
				this.complexGestures = new ComplexGestures();

				// create the compass rose
				this.rose = new CompassRoseView();

				// create the timeline
				this.timeline = new TimelineView();

				// create current gesture
				this.currentGesture = new ComplexGesture({ name: 'New Gesture' });
				this.currentGesture.on('change', this.render);

				// current atomic gesture
				this.currentAtomic = null;

				// custom selects
				$('.spatial-relation').customSelect();
				$('.fingernumber').customSelect();

				// render user interface
				this.render();

				// leave fullscreen on ESC
				$(document).keyup(function(event) {
					if (event.which == 27) {
						$('.toolbar, .sidebar').slideDown(500);
						$('.current-gesture').animate({top: 160}, 500);
						$('.timeline').animate({top: 260}, 500);
						$('.disable-fullscreen-button').fadeOut(500);
					}
				});

				// build the empty timeline
				this.timeline.buildTimeline(this.currentGesture);
			},
			render: function() {
				// show gesture name
				$('.gesture-name').val(this.currentGesture.get('name'));

				// show spatial relation
				$('.spatial-relation').val(this.currentGesture.get('spatialRelation'));

				// show gesture time
				$('.gesture-time').val(this.currentGesture.get('gestureTime').get('name'));

				// update timeline
				$('.timeline').empty();
				this.timeline.buildTimeline(this.currentGesture);

				// update gesture expression
				this.currentGesture.buildExpression();
			},
			deleteCurrentGesture: function() {
				// TODO
			},
			resetCurrentGesture: function() {
				var name = this.currentGesture.get('name');
				this.currentGesture.set({name: name});
				this.currentGesture.set({spatialRelation: ''});
				this.currentGesture.set({gestureTime: Times.ON});
				this.currentGesture.set({expression: ''});
				this.currentGesture.operationMapping = new OperationMappings();
				this.currentGesture.gestures = new AtomicGestures();
				this.currentGesture.buildExpression();
				this.timeline.buildTimeline(this.currentGesture);
				$('.expression').html("Current Gesture is Empty");
			},
			registerCurrenGesture: function() {
				// TODO
			},
			activateSlot: function(event) {
				if (!this.currentAtomic) {
					// create and add atomic gesture
					this.currentAtomic = new AtomicGesture({ touchFunction: TouchFunctions.FINGER });
					this.currentGesture.gestures.add(this.currentAtomic);
				}

				// if slot is already in use, thus has an id...
				if ($(event.currentTarget).attr('class').match(/ id_./)) {
					// extract atomic gesture key from class name
					var atomicKey = $(event.currentTarget).attr('class').match(/ id_./)[0];
					atomicKey = atomicKey.substr(4, atomicKey.length);
					this.currentAtomic = this.currentGesture.gestures.at(atomicKey);

					// set slot class to "used"
					event.currentTarget.className += ' used';
				// ... else create new slot by creating a new atomic gesture plus its operation
				} else if (!$(event.currentTarget).attr('class').match(/ id_./) || ($(event.currentTarget).attr('class').match(/ id_./) && !this.currentAtomic.gestures)) {
					// create and add atomic gesture
					this.currentAtomic = new AtomicGesture({ touchFunction: TouchFunctions.FINGER });
					this.currentGesture.gestures.add(this.currentAtomic);

					// add correct operation
					var operation = Operations.SEQUENCE.toJSON();
					if (!$(event.currentTarget).prev().hasClass('used')) {
						operation = Operations.ASYNCHRONOUS.toJSON();
					}
					this.currentGesture.operationMapping.add(operation);

					// set slot class to "used"
					event.currentTarget.className += ' used';
				}

				// remove active class on all slots
				$('.slot').removeClass('active');

				// add active class to clicked slot
				event.currentTarget.className += ' active';

				// show compass rose
				this.rose.show(event.currentTarget, this.currentAtomic);
			},
			toggleGestureTime: function() {
				if (this.currentGesture.get('gestureTime') === Times.ON) {
					this.currentGesture.set({ gestureTime: Times.OFF });
				} else {
					this.currentGesture.set({ gestureTime: Times.ON });
				}
			},
			switchSpatialRelation: function() {
				if ($('#spatial-relation').val() === SpatialRelations.CROSS.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.CROSS });
				} else if ($('#spatial-relation').val() === SpatialRelations.JOIN.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.JOIN });
				} else if ($('#spatial-relation').val() === SpatialRelations.SYNC.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.SYNC });
				} else if ($('#spatial-relation').val() === SpatialRelations.SPREAD.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.SPREAD });
				} else if ($('#spatial-relation').val() === SpatialRelations.SPLIT.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.SPLIT });
				} else if ($('#spatial-relation').val() === SpatialRelations.CONNECT_START.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.CONNECT_START });
				} else if ($('#spatial-relation').val() === SpatialRelations.CONNECT_END.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.CONNECT_END });
				} else if ($('#spatial-relation').val() === SpatialRelations.ASIDE.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.ASIDE });
				} else if ($('#spatial-relation').val() === SpatialRelations.AMONG.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.AMONG });
				} else if ($('#spatial-relation').val() === SpatialRelations.CLOSE.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.CLOSE });
				} else if ($('#spatial-relation').val() === SpatialRelations.ADJOIN_.get('sign')) {
					this.currentGesture.set({ spatialRelation: SpatialRelations.ADJOIN_ });
				} else if ($('#spatial-relation').val() === "") {
					this.currentGesture.set({ spatialRelation: '' });
				}
			},
			enableFullscreen: function() {
				$('.toolbar, .sidebar').slideUp(500);
				$('.current-gesture').animate({top: 0}, 500);
				$('.timeline').animate({top: 100}, 500);
				$('.disable-fullscreen-button').fadeIn(500);
			},
			disableFullscreen: function() {
				$('.toolbar, .sidebar').slideDown(500);
				$('.current-gesture').animate({top: 160}, 500);
				$('.timeline').animate({top: 260}, 500);
				$('.disable-fullscreen-button').fadeOut(500);
			},
			enableGestureInfo: function() {
				// slide
				$('.sidebar').css('z-index', 1);
				$('.gesture-info').css('z-index', 99).slideDown(500, function() {
					$('.registered-gestures').hide();
				});

				// highlight current panel in toolbar
				$('.tools ul li').removeClass('active-panel');
				$('.enable-gesture-info').parent().addClass('active-panel');
			},
			enableGestureTest: function() {
				if ($('.gesture-test-area').is(':visible')) {
					// hide overlay
					$('.gesture-test-area').slideUp(500);

					// enable scroling
					$(document).bind('touchmove', function(e) {
						return true;
					});

					// disable visual feedback for touch
					GeForMT.setFeedback(false);
				} else {
					// show overlay
					$('.gesture-test-area').slideDown(500);

					// disable scroling
					$(document).bind('touchmove', function(e) {
						return false;
					});

					// enable visual feedback for touch
					GeForMT.setFeedback(true);
				}

				// add gesture to GeForMTjs
				this.currentGesture.buildExpression();
				var name = this.currentGesture.get('name');
				var expression = $('.expression').html().replace('<strong>', '').replace('</strong>', '');
				var cut = expression.indexOf('=');
				expression = expression.substr(cut+1, expression.length);
				expression = expression.replace(/ /g,'').replace(':ON', '').replace(':OFF', '');

				GeForMT.addGesture({
					identifier: name,
					expr: expression,
					handler: function(e) {
						$('.recognition-overlay span').text(name);
						$('.recognition-overlay').fadeIn(500);

						var timer = setTimeout(function() {
							$('.recognition-overlay').fadeOut(500);
						}, 3000);
					}
				});
			},
			enableRegisteredGestures: function() {
				// slide
				$('.sidebar').css('z-index', 1);
				$('.registered-gestures').css('z-index', 99).slideDown(500, function() {
					$('.gesture-info').hide();
				});

				// highlight current panel in toolbar
				$('.tools ul li').removeClass('active-panel');
				$('.enable-registered-gestures').parent().addClass('active-panel');
			},
			updateGestureName: function() {
				this.currentGesture.set({ name: $('.gesture-name').val() });
			},
			export: function() {
				$('.export-overlay').fadeIn(500);

				var expression = $('.expression').html().replace('<strong>', '').replace('</strong>', '');
				var cut = expression.indexOf('=');
				expression = expression.substr(cut+1, expression.length);
				expression = expression.replace(/ /g,'');

				$('.geformt-expression').val(expression);

				var impl = 'GeForMT.addGesture({\n'+
				'\t identifier: \''+this.currentGesture.get('name')+'\',\n'+
				'\t expr: \''+expression+'\',\n'+
				'\t handler: function(e) {\n'+
				'\t\t // your code\n'+
				'\t }\n'+
				'});';
				$('.geformtjs-implementation').text(impl);
			},
			closeExport: function() {
				$('.export-overlay').fadeOut(500);
			},
			setFingerNumber: function(e) {
				$('.switch label').css({ 'background': '#909090' });
				$('label[for='+e.currentTarget.id+']').css({ 'background': '#263239' });
				var touches = e.currentTarget.id.substr(6, e.currentTarget.id.length);
				this.currentAtomic.set({ touchCount: touches });
			}
		});

		// fire up the the app
		var App = new AppView();

		return {
			// public functions go here
		};
	}());
});