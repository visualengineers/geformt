var gestures = {
    rooftop: {
        expr: "1F(LINE_NE(div),LINE_SE(div))",
        online: true,
        handler: function(e){
            console.debug("handler:roof");
        }
    },
    S: {
        expr: "1F(SEMICIRCLE_S_CCW(div),SEMICIRCLE_S_CW(div))",
        online: true,
        handler: function(e){
            console.debug("handler:s");
        }
    },
    lowercaseH: {
        expr: "1F(LINE_S(div),LINE_S(div),SEMICIRCLE_E_CW(div))",
        online: true,
        handler: function(e){
            console.debug("handler:h");
        }
    },
    U: {
        expr: "1F(LINE_S(div),SEMICIRCLE_E_CCW(div),LINE_N(div))|1F(LINE_S(div),SEMICIRCLE_W_CW(div),LINE_N(div))",
        online: true,
        handler: function(e){
            console.debug("handler:u");
        }
    },
};

// initialize gestures
window.onload = function(){
    
    GeForMT.init(gestures, {
        feedback: false,
        preventDefault: true
    });
    
    GeForMT.initFeedforward();
    GeForMT.Feedforward.startFeedMenu();

} 