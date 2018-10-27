/**
 * @namespace Parser module
 */
GeForMT.Parser = ( function() {
	/**
	 * Enumeration of registered parser.
	 * Concept: Parser.key = function(){..} with key as identifier and value as adapter function.
	 * @type Object
	 */
	var Parser = {};

	/**
	 * Initialized parser.
	 * 
	 * @type Function
	 * @default null
	 * @private
	 */
	var _generatedParser = null;

	return {
		/**
		 *  Initialize parser component.
		 * @param {String} identifier Unique identifier of the parser.
		 */
		init : function(identifier) {
			if (typeof Parser[identifier] != 'undefined') {
				_generatedParser = Parser[identifier];
			}
		},
		
		/**
		 * Assign expression to concrete parse function of the initialized parser.
		 * @param {String} expr GeForMT expression to parse.
		 * @return Object
		 */
		parse : function(expression) {
			return _generatedParser(expression);
		},
		
		/**
		 * Register a concrete parser implementation.
		 * @param {String} name Unique identifier of the concrete parser.
		 * @param {Function} parseFunction  Function 'parse' operation to adapt.
		 */
		registerParser : function(name, parseFunction) {
			if (typeof Parser[name] != 'undefined') {
				//Warning: Parser with this identifier exists and will be overwritten
			}
			Parser[name] = parseFunction;
		 }
	};
})();