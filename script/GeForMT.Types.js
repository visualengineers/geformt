/**
 * Enumeration of constant operation types.
 * @namespace
 */
GeForMT.OPERATION_TYPES = /*@lends*/{
    /**
     * Operation type for asynchronous composition gestures.
     * @constant
     */
    PLUS: 0,
    /**
     * Operation type for synchronous composition gestures.
     * @constant
     */
    ASTERISK: 1,
    /**
     * Operation type for sequential composition of coherent gestures.
     * @constant
     */
    COMMA: 2,
    /**
     * Operation type defining gestures as options.
     * @constant
     */
    OPTION: 3,
    /**
     * Operation type for sequential composition of incoherent (that means the operation includes a DEPOINT gesture) gestures.
     * @constant
     */
    SEMICOLON: 4
};
/**
 * Enumeration of constant relation types.
 * @namespace
 */
GeForMT.RELATION_TYPES = /*@lends*/{
    /**
     * Relation type for crossing gestures.
     * @constant
     */
    CROSS: 5,
    /**
     * Relation type for gestures that are moving towards each other.
     * @constant
     */
    JOIN: 6,
    /**
     * Relation type parallel execution of gestures.
     * @constant
     */
    SYNC: 7,
    /**
     * Relation type for gestures that are moving away from each other.
     * @constant
     */
    SPLIT: 8,
    /**
     * Relation type for connected at start position of the gestures.
     * @constant
     */
    CONNECT_START: 9,
    /**
     * Relation type for connected at end position of the gestures.
     * @constant
     */
    CONNECT_END: 10,
     /**
     * Relation type for gestures performed among each other.
     * @constant
     */
     AMONG: 11,
  /**
     * Relation type for gestures performed aside each other.
     * @constant
     */
     ASIDE: 12,
      /**
     * Relation type for closed gesture pathes.
     * @constant
     */
     CLOSE: 13
};
/**
 * Enumeration of constant identifier types.
 * @namespace
 */
GeForMT.CONTACT_TYPES = /*@lends*/{
	/**
	 * Represents an unspecified movement.
	 * @constant
	 */
    MOVE: 10,
    /**
	 * Represents a pointing gesture.
	 * @constant
	 */
    POINT: 11,
     /**
	 * Holding the finger on a position.
	 * @constant
	 */
    HOLD: 12,
   /**
	 * Represents lifting the finger.
	 * @constant
	 */
    DEPOINT: 13
};
/**
 * Enumeration of constant shape types.
 * @namespace
 */
GeForMT.SHAPE_TYPES = /*@lends*/{
	  /**
	 * Represents a circular movement.
	 * @constant
	 */
    CIRCLE: 14,
    /**
	 * Represents a half circle.
	 * @constant
	 */
    SEMICIRCLE: 15,
     /**
	 * Represents a composed (connected, that means composition with KOMMA operation) gesture.
	 * @constant
	 */
	COMPLEX_SHAPE: 34
};
/**
 * Enumeration of constant rotation types.
 * @namespace
 */
GeForMT.ROTATION_TYPES = /*@lends*/{
	 /**
	 * Represents clockwise movement.
	 * @constant
	 */
    CW: 16,
    	 /**
	 * Represents clockwise movement.
	 * @constant
	 */
    CLOCKWISE: 16,
    	 /**
	 * Represents counterclockwise movement.
	 * @constant
	 */
    CCW: 17,
    	 /**
	 * Represents counterclockwise movement.
	 * @constant
	 */
    COUNTERCLOCKWISE: 17
};
/**
 * Enumeration of constant vector types.
 * @namespace
 */
GeForMT.VECTOR_TYPES = /*@lends*/{
	/**
	 * Represents an unidimensional movement.
	 * @constant
	 */
    LINE: 18
};
/**
 * Enumeration of constant vector direction types.
 * @namespace
 */
GeForMT.DIRECTION_TYPES = /*@lends*/{
	/**
	 * Represents direction to top.
	 * @constant
	 */
    NORTH: 19,
    	/**
	 * Represents direction to bottom.
	 * @constant
	 */
    SOUTH: 20,
    	/**
	 * Represents direction to the right.
	 * @constant
	 */
    EAST: 21,
    	/**
	 * Represents direction to the left.
	 * @constant
	 */
    WEST: 22,
    /**
	 * Represents direction to top-right.
	 * @constant
	 */
    NORTHEAST: 23,
     /**
	 * Represents direction to top-left.
	 * @constant
	 */
    NORTHWEST: 24,
        /**
	 * Represents direction to bottom-right.
	 * @constant
	 */
    SOUTHEAST: 25,
        /**
	 * Represents direction to top-left.
	 * @constant
	 */
    SOUTHWEST: 26,
     /**
	 * Represents tendency to top.
	 * @constant
	 */
    TEND_NORTH: 19,
         /**
	 * Represents tendency to bottom.
	 * @constant
	 */
    TEND_SOUTH: 20,
         /**
	 * Represents tendency to right.
	 * @constant
	 */
    TEND_EAST: 21,
         /**
	 * Represents tendency to left.
	 * @constant
	 */
    TEND_WEST: 22
};
/**
 * Enumeration of constant function types.
 * @namespace
 */
GeForMT.FUNCTION_TYPES = /*@lends*/{
	 /**
	 * Represents an input with the  finger.
	 * @constant
	 */
    FINGER: 31,
    	 /**
	 * Represents an input with the hand.
	 * @constant
	 */
    HAND: 32,
    /**
	 * Represents a blob.
	 * @constant
	 */
    BLOB: 33
};
