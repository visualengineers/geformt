/**
 * @namespace TemplateBuilding module
 */
GeForMT.TemplateBuilder = ( function() {

		/**
		 * Number of points.
		 * @type Number
		 * @default 64
		 */
	var numberOfPoints= 64;
		/**
		 * Distance between points.
		 * @type Number
		 * @default 1
		 */
 	var distanceOfPoints= 1;

	/**
	 * Constructor of a point, represented by x and y coordinate.
	 * @class
	 */
	function Point(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Gesture template represented by facts like a point path, events, vector or sequence
	 * of directions.
	 * @class
	 */
	function Template(points) {
		this.points = points;
		this.events=[];
		this.vectors=[]; 
		//this.directions=[] // not implemented
	}

	Template.prototype = {
		/**
		 * Identifier of this template.
		 */
		 identifier: null,
		/**
		 * List of points representing a gesture.
		 * @type Array
		 * @default null
		 */
		points : null,
		/**
		 * List of events representing a gesture path. Used for candidate templates.
		 * @type Array
		 * @default null
		 */
		events : null,
		/**
		 * List of vectors representing a gesture.
		 * @type Array
		 * @default null
		 */
		vectors : null,
		/**
		 * List of directiontypes represented by constants in GeForMT.Types.DIRECTION_TYPES.
		 * @type Array
		 * @default null
		 */
		directions : null
	};



				/**
		 * Get a list of template objects representing the path of a continous atomic gesture.
		 * In contrast to method createTemplateFromGestureDefinition it generates templates 
		 * even if direction or rotation are not defined. In this case a template for every direction and rotation will be created.
		 * In case of concatenation of templates all variations are build. 
		 * @param {GeForMT.CONTACT_TYPES|GeForMT.VECTOR_TYPES|GeForMT.SHAPE_TYPES} atomType The type of the atomic gesture.
		 * @param {GeForMT.DIRECTION_TYPES} directionType The dirction type of the gesture.
		 * @param {GeForMT.ROTATION_TYPES} rotationType The rotation type of the gesture.
		 * @param {Array} tmpTemplates List of template objects representing variations of the previous part of the gesture. The parts will be connected to a complex gesture path.
		 */
	function _createListOfTemplatesBasedOnFormalization(atomType,
				directionType, rotationType, tmpTemplates,
				useBoundedRotationInvariance) {
			var templates = [];
			switch (atomType) {
			case GeForMT.CONTACT_TYPES.POINT:
			case GeForMT.CONTACT_TYPES.HOLD:
			case GeForMT.CONTACT_TYPES.DEPOINT:
			case GeForMT.CONTACT_TYPES.MOVE:
				templates = null;
				break;
			case GeForMT.VECTOR_TYPES.LINE:
				if (typeof directionType !== 'undefined'
						&& directionType !== null) {
					templates.push(_createVectorTemplate(directionType));
				} else {
					templates
							.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.NORTH));
					if (useBoundedRotationInvariance) {
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.SOUTH));
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.EAST));
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.WEST));
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.NORTHWEST));
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.NORTHEAST));
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.SOUTHWEST));
						templates
								.push(_createVectorTemplate(GeForMT.DIRECTION_TYPES.SOUTHEAST));
					}
				}
				break;
			case GeForMT.SHAPE_TYPES.CIRCLE:
			case GeForMT.SHAPE_TYPES.SEMICIRCLE:
				if (typeof directionType !== 'undefined'
						&& directionType !== null) {
					if (typeof rotationType !== 'undefined'
							&& rotationType !== null) {
						templates.push(_createShapeTemplate(atomType,
								directionType, rotationType));
					} else {
						templates.push(_createShapeTemplate(atomType, directionType,
										GeForMT.ROTATION_TYPES.CLOCKWISE));
						templates.push(_createShapeTemplate(atomType,
								directionType,
								GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE));
					}
				} else {
					if (typeof rotationType !== 'undefined'
							&& rotationType !== null) {
						templates.push(_createShapeTemplate(atomType,
								GeForMT.DIRECTION_TYPES.NORTH, rotationType));
						if (useBoundedRotationInvariance) {

							templates.push(_createShapeTemplate(atomType,
											GeForMT.DIRECTION_TYPES.SOUTH,
											rotationType));
							templates
									.push(_createShapeTemplate(atomType,
											GeForMT.DIRECTION_TYPES.EAST,
											rotationType));
							templates
									.push(_createShapeTemplate(atomType,
											GeForMT.DIRECTION_TYPES.WEST,
											rotationType));
						}
					} else {
						templates.push(_createShapeTemplate(atomType,
								GeForMT.DIRECTION_TYPES.NORTH,
								GeForMT.ROTATION_TYPES.CLOCKWISE));
						templates.push(_createShapeTemplate(atomType,
								GeForMT.DIRECTION_TYPES.NORTH,
								GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE));
						if (useBoundedRotationInvariance) {

							templates.push(_createShapeTemplate(atomType,
									GeForMT.DIRECTION_TYPES.SOUTH,
									GeForMT.ROTATION_TYPES.CLOCKWISE));
							templates.push(_createShapeTemplate(atomType,
									GeForMT.DIRECTION_TYPES.SOUTH,
									GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE));
							templates.push(_createShapeTemplate(atomType,
									GeForMT.DIRECTION_TYPES.EAST,
									GeForMT.ROTATION_TYPES.CLOCKWISE));
							templates.push(_createShapeTemplate(atomType,
									GeForMT.DIRECTION_TYPES.EAST,
									GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE));
							templates.push(_createShapeTemplate(atomType,
									GeForMT.DIRECTION_TYPES.WEST,
									GeForMT.ROTATION_TYPES.CLOCKWISE));
							templates.push(_createShapeTemplate(atomType,
									GeForMT.DIRECTION_TYPES.WEST,
									GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE));

						}
					}
				}
				break;

			}

			if (templates !== null && templates.length > 0
					&& typeof tmpTemplates !== 'undefined'
					&& tmpTemplates !== null) {
				var newTemplates = [];
				for ( var i = 0; i < tmpTemplates.length; i++) {
					var prevTemplatePart = tmpTemplates[i];

					for ( var j = 0; j < templates.length; j++) {
						var concatTemplatePart = templates[j];
						newTemplates.push(_concatTemplates(
								prevTemplatePart, concatTemplatePart));
					}

				}

				templates = newTemplates;
			}
			return templates;
		}

		/**
		 * Get a template object representing the path of a continous atomic gesture.
		 * @param {GeForMT.CONTACT_TYPES|GeForMT.VECTOR_TYPES|GeForMT.SHAPE_TYPES} atomType The type of the atomic gesture.
		 * @param {GeForMT.DIRECTION_TYPES} directionType The dirction type of the gesture.
		 * @param {GeForMT.ROTATION_TYPES} rotationType The rotation type of the gesture.
		 * @param {GeForMT.TemplateBuilding.Template} tmpTemplate List of Point objects representing the previous part of the gesture path. The parts will be connected to a complex gesture path.
		 */
		function _createTemplateBasedOnFormalization(atomType, directionType,
				rotationType, tmpTemplate) {
			var template = null;
			switch (atomType) {
			case GeForMT.CONTACT_TYPES.POINT:
			case GeForMT.CONTACT_TYPES.HOLD:
			case GeForMT.CONTACT_TYPES.DEPOINT:
			case GeForMT.CONTACT_TYPES.MOVE:
				template = null;
				break;
			case GeForMT.VECTOR_TYPES.LINE:
				template = _createVectorTemplate(directionType);
				break;
			case GeForMT.SHAPE_TYPES.CIRCLE:
			case GeForMT.SHAPE_TYPES.SEMICIRCLE:
				template = _createShapeTemplate(atomType, directionType,
						rotationType);
				break;

			}

			if (template !== null && typeof tmpTemplate !== 'undefined'
					&& tmpTemplate !== null) {
				template = _concatTemplates(tmpTemplate, template);
			}
			return template;
		}
		/**
		 * Creates a list of points representing a vector.
		 * @param {GeForMT.DIRECTION_TYPES} directionType
		 * @return {Template} List of Point objects representing a vector.
		 */
		function _createVectorTemplate(directionType) {
			var lineTemplate = [];

			var refPoint = numberOfPoints * distanceOfPoints;

			switch (directionType) {
			case GeForMT.DIRECTION_TYPES.NORTH:
				for ( var i = 0; i < numberOfPoints
						* distanceOfPoints; i += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint, refPoint - i));

				}
				break;

			case GeForMT.DIRECTION_TYPES.SOUTH:
				for ( var j = 0; j < numberOfPoints
						* distanceOfPoints; j += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint, refPoint + j));

				}
				break;

			case GeForMT.DIRECTION_TYPES.EAST:
				for ( var k = 0; k < numberOfPoints
						* distanceOfPoints; k += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint + k, refPoint));

				}
				break;

			case GeForMT.DIRECTION_TYPES.WEST:
				for ( var l = 0; l < numberOfPoints
						* distanceOfPoints; l += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint - l, refPoint));

				}
				break;

			case GeForMT.DIRECTION_TYPES.NORTHEAST:
				for ( var m = 0; m < numberOfPoints
						* distanceOfPoints; m += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint + m, refPoint - m));

				}
				break;
			case GeForMT.DIRECTION_TYPES.NORTHWEST:
				for ( var n = 0; n < numberOfPoints
						* distanceOfPoints; n += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint - n, refPoint - n));
				}
				break;
			case GeForMT.DIRECTION_TYPES.SOUTHEAST:
				for ( var o = 0; o < numberOfPoints
						* distanceOfPoints; o += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint + o, refPoint + o));
				}
				break;
			case GeForMT.DIRECTION_TYPES.SOUTHWEST:
				for ( var p = 0; p < numberOfPoints
						* distanceOfPoints; p += distanceOfPoints) {
					lineTemplate.push(new Point(refPoint - p, refPoint + p));

				}
				break;
			}
			return new Template(lineTemplate);
		};

		/**
		 * Creates a list of points representing a circle or semicircle.
		 * @param {GeForMT.SHAPE_TYPES} shapeType
		 * @param {GeForMT.DIRECTION_TYPES} directionType
		 * @param {GeForMT.ROTATION_TYPES} rotationType
		 * @return {Template} List of Point objects representing a circle or semicircle.
		 */
		function _createShapeTemplate(shapeType, directionType, rotationType) {
			var circleTemplate = [];

			var r = (numberOfPoints * distanceOfPoints) / 2;

			var refPoint = (numberOfPoints * distanceOfPoints) + 100;

			var circleLength = 0;

			var offset = 0;

			switch (shapeType) {
			case GeForMT.SHAPE_TYPES.CIRCLE:
				circleLength = 2 * Math.PI;
				circleOffset = Math.PI;
				break;
			case GeForMT.SHAPE_TYPES.SEMICIRCLE:
				circleLength = Math.PI;
				circleOffset = 0;
				break;
			}

			switch (directionType) {
			case GeForMT.DIRECTION_TYPES.NORTH:
				offset = 1 / 2 * Math.PI;
				break;

			case GeForMT.DIRECTION_TYPES.SOUTH:
				offset = 3 / 2 * Math.PI;
				break;

			case GeForMT.DIRECTION_TYPES.EAST:
				offset = Math.PI;
				break;

			case GeForMT.DIRECTION_TYPES.WEST:
				offset = 0;// right
				break;

			case GeForMT.DIRECTION_TYPES.NORTHEAST:
				offset = 3 / 4 * Math.PI;
				break;
			case GeForMT.DIRECTION_TYPES.NORTHWEST:
				offset = 1 / 4 * Math.PI;
				break;
			case GeForMT.DIRECTION_TYPES.SOUTHEAST:
				offset = 5 / 4 * Math.PI;
				break;
			case GeForMT.DIRECTION_TYPES.SOUTHWEST:
				offset = 7 / 4 * Math.PI;
				break;
			}

			if (rotationType == GeForMT.ROTATION_TYPES.COUNTERCLOCKWISE) {
				//rotation counterclockwise
				for ( var a = 0 + offset; a < circleLength + offset; a = a
						+ circleLength / numberOfPoints) {

					var x = refPoint - r * Math.cos(a);
					var y = refPoint - r * Math.sin(a);

					circleTemplate.push(new Point(x, y));

				}
				circleTemplate.reverse();
			} else {
				for ( var a = 0 + offset + circleOffset; a < circleLength
						+ offset + circleOffset; a = a + circleLength
						/ numberOfPoints) {

					//rotation clockwise
					var x = refPoint + r * Math.cos(a);
					var y = refPoint + r * Math.sin(a);

					circleTemplate.push(new Point(x, y));
				}
			}
			return new Template(circleTemplate);
		};
		/**
		 * Concatenation of two templates (list of points that represent gesture pathes).
		 * @param {Template} template1 A list of points that represents the first template.
		 * @param {Template} template2 A list of points that represents the second template.
		 * @return {Template} List of Point objects representing the path of a complex shape.
		 */
		function _concatTemplates(template1, template2) {
			var lastPoint = template1.points[template1.points.length - 1];
			var firstPoint = template2.points[0];

			var diffX = Math.abs(lastPoint.x - firstPoint.x);
			var diffY = Math.abs(lastPoint.y - firstPoint.y);

			var offsetX = diffX;
			var offsetY = diffY;
			if (lastPoint.x <= firstPoint.x) {
				offsetX = -offsetX;
			}
			if (lastPoint.y <= firstPoint.y) {
				offsetY = -offsetY;
			}

			for ( var i = 0; i < template2.points.length; i++) {
				template2.points[i].x = template2.points[i].x + offsetX;
				template2.points[i].y = template2.points[i].y + offsetY;
			}

			var template = template1.points.concat(template2.points);

			return new Template(template);
		}
		/**
		 * Returns a list of templates representing all gesture pathes.
		 * @param {Array} eventProfile List of events representing a performed gesture.
		 * @return Array
		 */
		function _createTemplatesBasedOnEventProfile(eventProfile) {
			var points = [];
			var eventProfileLength = eventProfile.length;
			var templates={};
			var keys=[];
			for ( var i = 0; i < eventProfileLength; i++) {
				var contacts=eventProfile[i].contacts;
				var contactsLength=contacts.length;
				for(var j=0; j< contactsLength;j++){
					var contact=contacts[j];
					if(templates[contact.identifier]===null || typeof templates[contact.identifier] == 'undefined'){
	        			//create gesture path with identifier as key
	        			templates[contact.identifier]=new Template([]);
	        			templates[contact.identifier].identifier=contact.identifier;
	        			keys.push(contact.identifier);
	        		}
					
					templates[contact.identifier].points.push(new Point(contact.pageX,contact.pageY));

					templates[contact.identifier].events.push(eventProfile[i]);
				}
			}

			var templateList=[];
			for(var k=0;k<keys.length;k++){
				//var normalizedTemplate = this.normalizeTemplate(templates[keys[k]],useBoundedRotationInvariance);
				templateList.push(templates[keys[k]]);
			}
			
			return templateList;
		}
		
		/**
		 * New events are transformed and integrated into existing templates with the intent to extend the template.
		 * @param {Array} eventProfile List of new events.
		 * @param {Array} templates Existing templates.
		 */
		function _updateTemplatesBasedOnEventProfile(eventProfile,templates) {
			//build map with path identifier as key (helper)
			var templatesMap = {};
			var keys=[];
			
			for(var i=0;i<templates.length;i++){
				templatesMap[templates[i].identifier]=templates[i];
				keys.push(templates[i].identifier);
			}
			
			//attach contact position
			var eventProfileLength=eventProfile.length;
			for ( var i = 0; i < eventProfileLength; i++) {
				var contacts=eventProfile[i].contacts;
				
				for(var j=0; j< contacts.length;j++){
					var contact=contacts[j];
					//console.debug(templatesMap[contact.identifier]===null || typeof templatesMap[contact.identifier] == 'undefined');
					if(templatesMap[contact.identifier]===null || typeof templatesMap[contact.identifier] == 'undefined'){
	        			//create gesture path with identifier as key
	        			templatesMap[contact.identifier]=new Template([]);
	        			templatesMap[contact.identifier].identifier=contact.identifier;
	        			keys.push(contact.identifier);
	        			
	        			
	        		}
					templatesMap[contact.identifier].points.push(new Point(contact.pageX,contact.pageY));

					templatesMap[contact.identifier].events.push(eventProfile[i]);
				}
			}

			var templateList=[];
			for(var k=0;k<keys.length;k++){
				//var normalizedTemplate = this.normalizeTemplate(templates[keys[k]],useBoundedRotationInvariance);
				templateList.push(templatesMap[keys[k]]);
			}
			return templateList;
		}

	return {
		/**
		 * Initialize TemplateBuilder module.
		 */
		init : function() {
		},
		/**
		 * Create template based on syntactic parameters of GeForMT expression.
		 * @param {Number} atomType,
		 * @param {Number} directionType
		 * @param  { Number}rotationType
		 * @param {GeForMT.TemplateBuilder.Template} tmpTemplate
		 */
		createTemplateBasedOnFormalization : function(atomType,
				directionType, rotationType, tmpTemplate) {
			return _createTemplateBasedOnFormalization(atomType,
					directionType, rotationType, tmpTemplate);
		},
		/**
		 * Create templates based on syntactic parameters of GeForMT expression.
		 * @param {Number} atomType,
		 * @param {Number} directionType
		 * @param  { Number}rotationType
		 * @param {GeForMT.TemplateBuilder.Template} tmpTemplate
		 * @param {Boolean} useBoundedRotationInvariance
		 */
		createListOfTemplatesBasedOnFormalization : function(
				atomType, directionType, rotationType, tmpTemplates,
				useBoundedRotationInvariance) {
			return _createListOfTemplatesBasedOnFormalization(
					atomType, directionType, rotationType, tmpTemplates,
					useBoundedRotationInvariance);
		},
		/**
		 * Create templates based on the event profile.
		 * @param {Array} eventProfile List of events
		 */
		createTemplatesBasedOnEventProfile : function(eventProfile) {	
			return _createTemplatesBasedOnEventProfile(eventProfile);
		},
		/**
		 * Update templates based on the event profile.
		 * @param {Array} eventProfile List of events
		 * @param {Array} templates List of Template objects.
		 */
		updateTemplatesBasedOnEventProfile : function(eventProfile,templates) {	
			return _updateTemplatesBasedOnEventProfile(eventProfile,templates);
		}
	};
})();
