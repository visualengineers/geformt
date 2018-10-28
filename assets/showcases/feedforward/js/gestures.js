//all global gestures ! A and V !
var settings = {
	feedback : false,
	preventDefault : true
}

var gestures = {
  callA : {
		identifier : "A_MOVE",
		expr : "ASIDE[1F(LINE_NE,LINE_SE);1F(LINE_E)]",
		description : "A-Move",
		handler : function(e) {
		    console.debug('A');
		}
	},
	callV : {
		identifier : "V_MOVE",
		expr : "1F(LINE_SE(body),LINE_NE(body))",
		handler : function(e) {
	      console.debug('V');
		}
	},
	curlRight : {
		identifier : "curlRight",
		expr : "1F(LINE_E,CIRCLE_S_CCW,LINE_E)",
		description : "Mit dem curl right kann zurücknavigiert werden, das ist sehr hilfreich",
		handler : function(e) {
		    console.debug('curlRight');
		}
	},
	Fragezeichen : {
		identifier : "Fragezeichen",
		expr : "AMONG[1F(SEMICIRCLE_SE,LINE_S);1F(POINT)]",
		description : "Fragezeichen-Symbol ruft die Hilfe auf.",
    handler : function(e) {
		    console.debug('help');
		}
	},  
	North : {
		identifier : "2N",
		expr : "2F(LINE_S)",
    handler : function(e) {
		    console.debug('H');
		}
	},
	K : {
		identifier : "K",
		expr : "ASIDE[1F(LINE_S);1F(LINE_SW,LINE_SE)]",
    handler : function(e) {
		    console.debug('x');
		}
	},
	S: {
	  identifier : "S",
    expr: "1F(SEMICIRCLE_SW_CCW,LINE_SE,SEMICIRCLE_SW_CW)|1F(SEMICIRCLE_S_CCW,SEMICIRCLE_S_CW)",
    handler: function(e){
        console.debug('s');
    }
  },
  U: {
    identifier : "U",
    expr: "1F(LINE_S,SEMICIRCLE_E_CCW,LINE_N)|1F(LINE_S,SEMICIRCLE_W_CW,LINE_N)|1F(LINE_S,SEMICIRCLE_E_CCW,LINE_N,LINE_S)",
    handler: function(e){
        console.debug('u');
    }
  },
  lowercaseH: {
    identifier : "lowercaseH",
    expr: "1F(LINE_S,LINE_S,SEMICIRCLE_E_CW)",
    handler: function(e){
        console.debug('lowercaseH');
    }
  },
  uppercaseH: {
    identifier : "uppercaseH",
    expr: "1F(LINE_S);1F(LINE_S);1F(LINE_E)",
    handler: function(e){
        console.debug('uppercaseH');
    }
  },
	refresh : {
		identifier : "REFRESH",
		expr : "CIRCLE",
		handler : function(e) {
		    console.debug('Circle');
		}
	}
}

GeForMT.init(gestures, settings);              