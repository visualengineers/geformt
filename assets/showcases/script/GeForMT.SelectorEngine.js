/**
 * @namespace
 * Selector Engine module
 */
GeForMT.SelectorEngine = (function(){
    /**
     * Enumeration of possible selector engines.
     * @type Object
     */
    var Engines = {};
    
    /**
     * Initialized selector engine.
     * @type Function
     * @default null
     * @private
     */
    var _engine = null;
    
    
    return {  
        /**
         * Initialize the selector engine by identifier. The engine ust be registered before it can be initialized.
         * @param {String} identifier Identifier of a registered selector engine.
         */
        init: function(identifier){
            _engine = Engines[identifier];
            //info of version and selector engine
        },
        /**
         * Get Element objects by a single selector expression or a list of selector expressions. A Selector Engine must be registered and initialized before it can be used.
         * @param  {String|Array} selector|list Single selector expression or a list of selector expressions.
         * @return {Array} A Node object or an array of Node objects.
         */
        getElements: function(selector){
            var nodeList = [];
			
			var elements=null;
            
            if (Array.isArray(selector)) {
				for (var i = 0; i < selector.length; i++) {
					elements = _engine(selector);
					if(selector.length!==0 && selector!==null && elements.length==0){
            // throw exception
            throw "Exception while parsing the selector [" + selector + "]";
					}
        	
					if (Array.isArray(elements)) {
						nodeList = nodeList.concat(elements);
					}
					else {
						nodeList.push(elements);
					}
				}
			}
			else 
				if (typeof selector == "String") {
					elements = _engine(selector);
					if(selector!=="" && selector!==null && elements.length==0){
            // throw exception
            throw "Exception while parsing the selector [" + selector + "]";
					}
					if (Array.isArray(elements)) {
						nodeList = nodeList.concat(elements);
					}
					else {
						nodeList.push(elements);
					}
				}
            return nodeList;
        },
        /**
         * Register another selector engine.
         * @param {String} name Name to identify the Engine.
         * @param {Function} adaptedFunction Function to adapt the main function of the engine.
         * @return {String} Return the identifier of registered engine.
         *  */
        registerEngine: function(name, adaptedFunction){
            if (typeof Engines[name] != 'undefined') {
                //Warning: Parser with this identifier exists and will be overwritten
            }
            Engines[name] = adaptedFunction;
            return name;
        }
        
        
    };
})();
