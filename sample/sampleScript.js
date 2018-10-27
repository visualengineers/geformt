var gestures = {
    help: {
        expr: "AMONG[1F(SEMICIRCLE_SE(#content),LINE_S(#content));1F(POINT(#content))]",
        handler: callHelp
    },
    lowercaseH: {
        expr: "1F(LINE_S(#content),LINE_S(#content),SEMICIRCLE_E_CW(#content))",
        handler: callHelp
    },
    uppercaseH: {
        expr: "1F(LINE_S(#content));1F(LINE_S(#content));1F(LINE_E(#content))",
        handler: callHelp
    },
    S: {
        expr: "1F(SEMICIRCLE_SW_CCW(#content),LINE_SE(#content),SEMICIRCLE_SW_CW(#content))|1F(SEMICIRCLE_S_CCW(#content),SEMICIRCLE_S_CW(#content))",
        handler: function(e){
            window.location = 'index.html';
        }
    },
    rooftop: {
        expr: "1F(LINE_NE(#content),LINE_SE(#content))",
        handler: function(e){
            console.debug("HOME");
            window.location = 'index.html';
        }
    },
    A: {
        expr: "1F(LINE_NE(#content),LINE_SE(#content));1F(LINE_E(#content))",
        handler: function(e){
            window.location = 'offers.html';
        }
    },
    U: {
        expr: "1F(LINE_S(#content),SEMICIRCLE_E_CCW(#content),LINE_N(#content))|1F(LINE_S(#content),SEMICIRCLE_W_CW(#content),LINE_N(#content))|1F(LINE_S(#content),SEMICIRCLE_E_CCW(#content),LINE_N(#content),LINE_S(#content))",
        handler: function(e){
            window.location = 'company.html';
        }
    },
    K: {
        expr: "ASIDE[1F(LINE_S(#content));1F(LINE_SW(#content),LINE_SE(#content))]|1F(LINE_S(#content),LINE_S(#content),LINE_S(#content),LINE_N(#content),LINE_N(#content),CIRCLE_W_CW(#content),LINE_SE(#content))",
        handler: function(e){
            window.location = 'contact.html';
        }
    },
    curlLeft: {
        expr: "1F(LINE_W(#content),CIRCLE_S_CW(#content),LINE_W(#content))|1F(LINE_W(#content),CIRCLE_N_CCW(#content),LINE_W(#content))",
        handler: function(e){
            console.debug("CURL LEFT");
            history.back();
            
        }
    },
    curlRight: {
        expr: "1F(LINE_E(#content),CIRCLE_S_CCW(#content),LINE_E(#content))|1F(LINE_E(#content),CIRCLE_N_CW(#content),LINE_E(#content))",
        handler: function(e){
            history.forward();
            console.debug("CURL RIGHT");
            
        }
    },
    tapPreviousPage: {
        expr: "1F(POINT(#previousPageLabel))",
        online: true,
        handler: function(e){
            goToPreviousPage();
            
        }
    },
    tapNextPage: {
        expr: "1F(POINT(#nextPageLabel))",
        online: true,
        handler: function(e){
            goToNextPage();
            
        }
    },
    swipeToPreviousPage: {
        expr: "1F(LINE_E(div#previousPageLabel))",
        online: true,
        handler: function(e){
            var plabel = document.getElementById("previousPageLabel");
            if (e.currentEvent.type == 'touchend') {
                plabel.style.marginLeft = -190;
            }
            else {
                var x = e.currentEvent.touches[0].pageX;
                var y = e.currentEvent.touches[0].pageY;
                
                var currentMargin = parseInt($('#previousPageLabel').css('margin-left'));
                if (currentMargin < -20) {
                    plabel.style.marginLeft = -190 + x;
                }
                else {
                    goToPreviousPage();
                }
            }
            
            
        }
    },
    swipeToNextPage: {
        expr: "1F(LINE_W(#nextPageLabel))",
        online: true,
        handler: function(e){
            var nlabel = document.getElementById("nextPageLabel");
            if (e.currentEvent.type == 'touchend') {
                nlabel.style.marginRight = -190;
            }
            else {
                var x = e.currentEvent.touches[0].pageX;
                var y = e.currentEvent.touches[0].pageY;
                
                var currentMargin = parseInt($('#nextPageLabel').css('margin-right'));
                var docWidth = document.body.clientWidth;
                if (currentMargin < -20) {
                    nlabel.style.marginRight = -190 + (docWidth - x);
                }
                else {
                    goToNextPage();
                }
                
            }
            
        }
    },
    scrollPage: {
        expr: "MOVE(body)",
        online: true,
        handler: function(e){
            var event = e.currentEvent;
            if (event.type !== 'touchend' && e.events[0].length > 1) {
                var previousY = e.events[0][e.events[0].length - 2].contacts[0].pageY;
                var y = event.touches[0].pageY;
                window.scrollBy(0, previousY - y);
                adaptToOrientation();
            }
        }
    },
    scaleFontDown: {
        expr: "JOIN[2F(LINE(.section))]",
        online: false,
        handler: function(e){
            var event = e.currentEvent;
            var target = event.target;
            if (target instanceof Text) {
                target = target.parentNode;
            }
            var fontSize = getStyle(target, 'font-size');
            if (fontSize !== null && fontSize !== '' && typeof fontSize !== 'undefined') {
                target.style.fontSize = parseInt(fontSize) - 2;
            }
            
        }
    },
    scaleFontUp: {
        expr: "SPLIT[2F(LINE(.section))]",
        online: false,
        handler: function(e){
            var event = e.currentEvent;
            var target = event.target;
            if (target instanceof Text) {
                target = target.parentNode;
            }
            var fontSize = getStyle(target, 'font-size');
            if (fontSize !== null && fontSize !== '' && typeof fontSize !== 'undefined') {
                target.style.fontSize = parseInt(fontSize) + 2;
            }
            
        }
    }
};

var currentPageIdx = 0;
var pages = ["index.html", "offers.html", "company.html", "contact.html", "help.html"];

// initialize gestures
window.onload = function(){
    currentPageIdx = getPageIdx(getFileName());
    currentPageIdx = currentPageIdx === null ? 0 : currentPageIdx;
    adaptPageNavi();
    GeForMT.init(gestures, {
        feedback: true,
        preventDefault: true
    });
    
    GeForMT.addGesture({
        identifier: "menuTap",
        expr: "1F(POINT(#menu li))",
        handler: function(e){
            var target = e.target;
            window.location = target.href || target.parentNode.href || target.parentNode.parentNode.href;
        }
    });
    adaptToOrientation();
    window.addEventListener("orientationchange", function(){
        adaptToOrientation();
    }, false);
    
    GeForMT.addRecognitionFailedEventListener(function(){
        recognitionFailed();
    });
    
}

function adaptToOrientation(){
    var orientation = Math.abs(window.orientation);
    var previousLabelStyle = document.getElementById("previousPageLabel").style;
    var nextLabelStyle = document.getElementById("nextPageLabel").style;
    if (orientation == 0) {
        previousLabelStyle.marginTop = document.body.clientWidth / 2 - 40;
        nextLabelStyle.marginTop = document.body.clientWidth / 2 - 40;
    }
    else {
        previousLabelStyle.marginTop = document.body.clientHeight / 2 - 40;
        nextLabelStyle.marginTop = document.body.clientHeight / 2 - 40;
    }
}

function adaptPageNavi(){

    //currentPageIdx
    var dotitems = $('div#footer div#pagenavi ul').children();
    dotitems.css('opacity', '0.6');
    
    if (currentPageIdx == 0) {
        $('#previousPageLabel').css('visibility', 'hidden');
    }
    
    if (currentPageIdx == pages.length - 1) {
        $('#nextPageLabel').css('visibility', 'hidden');
    }
    
    var currentPageDotStyle = dotitems[currentPageIdx].style;
    currentPageDotStyle.opacity = 1;
    currentPageDotStyle.height = 15;
    currentPageDotStyle.width = 15;
}

function getFileName(){
    var strHref = self.location.href;
    strHref = strHref.replace(/\//g, "\\");
    var iIdx = strHref.lastIndexOf("\\");
    var anchorIdx = strHref.search('#');
    if (anchorIdx != -1) {
        strHref = strHref.slice(0, anchorIdx);
    }
    if (-1 < iIdx) {
        return strHref.substring(iIdx + 1);
    }
    else {
        return strHref;
    }
}

function getPageIdx(strFilename){
    for (var i = 0; i < pages.length; i++) {
        if (pages[i] === strFilename) {
            return i;
        }
    }
    return null;
}

function recognitionFailed(){
    console.debug("failed");
    $.blockUI({
        message: "<span class='message'>Die Geste konnte nicht erkannt werden.</span> <br /> Nutzen Sie die Hilfe (Gesten: ?, h oder H) und versuchen Sie es erneut.",
        fadeOut: 700,
        timeout: 2000,
        css: {
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            'border-radius': '10px',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: 0.5,
            color: '#fff'
        }
    });
    
    // setTimeout($.unblockUI, 2000);
}

function callHelp(e){
    window.location = "help.html";
}

function goToNextPage(){
    if (currentPageIdx < pages.length - 1) {
        window.location = pages[currentPageIdx + 1];
    }
}

function goToPreviousPage(){
    if (currentPageIdx > 0) {
        window.location = pages[currentPageIdx - 1];
    }
}

function getStyle(el, styleProp){
    var x = el;
    if (x.currentStyle) 
        var y = x.currentStyle[styleProp];
    else 
        if (window.getComputedStyle) 
            var y = document.defaultView.getComputedStyle(x, null).getPropertyValue(styleProp);
    return y;
}
