var gestures = {
    help: {
        expr: "AMONG[1F(SEMICIRCLE_SE(#content),LINE_S(#content));1F(POINT(#content))]",
        description : "'Help' ruft die Hilfe-Seite auf",
        handler: callHelp
    },
    lowercaseH: {
        expr: "1F(LINE_S(#content),LINE_S(#content),SEMICIRCLE_E_CW(#content))",
        description : "'h-Move' ruft die Hilfe-Seite auf",
        //online: true,
        handler: callHelp
    },
    uppercaseH: {
        expr: "1F(LINE_S(#content));1F(LINE_S(#content));1F(LINE_E(#content))",
        description : "'H-Move' ruft die Hilfe-Seite auf",
        handler: callHelp
    },
    S: {
        expr: "1F(SEMICIRCLE_SW_CCW(#content),LINE_SE(#content),SEMICIRCLE_SW_CW(#content))|1F(SEMICIRCLE_S_CCW(#content),SEMICIRCLE_S_CW(#content))",
        description : "'S-Move' ruft die Start-Seite auf",
        //online: true,
        handler: function(e){
            window.location = 'index.html';
        }
    },
    rooftop: {
        expr: "1F(LINE_NE(#content),LINE_SE(#content))",
        description : "'rooftop-Move' ruft die Start-Seite auf",
        handler: callHelp
    },
    A: {
        expr: "1F(LINE_NE(#content),LINE_SE(#content));1F(LINE_E(#content))",
        description : "'A-Move' ruft die Angebote-Seite auf",
        handler: function(e){
            window.location = 'offers.html';
        }
    },
    U: {
        expr: "1F(LINE_S(#content),SEMICIRCLE_E_CCW(#content),LINE_N(#content))|1F(LINE_S(#content),SEMICIRCLE_W_CW(#content),LINE_N(#content))|1F(LINE_S(#content),SEMICIRCLE_E_CCW(#content),LINE_N(#content),LINE_S(#content))",
        description : "'U-Move' ruft die Unternehmen-Seite auf",
        //online: true,
        handler: function(e){
            window.location = 'company.html';
        }
    },
    K: {
        expr: "ASIDE[1F(LINE_S(#content));1F(LINE_SW(#content),LINE_SE(#content))]|1F(LINE_S(#content),LINE_S(#content),LINE_S(#content),LINE_N(#content),LINE_N(#content),CIRCLE_W_CW(#content),LINE_SE(#content))",
        description : "'K-Move' ruft die Kontakt-Seite auf",
        handler: function(e){
            window.location = 'contact.html';
        }
    },
    curlLeft: {
        expr: "1F(LINE_W(#content),CIRCLE_S_CW(#content),LINE_W(#content))|1F(LINE_W(#content),CIRCLE_N_CCW(#content),LINE_W(#content))",
        description : "'curlLeft' dient dem Zurücknavigieren in der History",
        //online: true,
        handler: function(e){
            history.back();
            
        }
    },
    curlRight: {
        expr: "1F(LINE_E(#content),CIRCLE_S_CCW(#content),LINE_E(#content))|1F(LINE_E(#content),CIRCLE_N_CW(#content),LINE_E(#content))",
        description : "'curlRight' dient dem Vorwärtsnavigieren",
        //online: true,
        handler: function(e){
            history.forward();
            
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

var gestureList = ["help", "lowercaseH", "uppercaseH", "S", "rooftop", "A", "U", "K", "curlRight", "curlLeft"];
var currentPageIdx = 0;
var pages = ["index.html", "offers.html", "company.html", "contact.html", "help.html"];

// initialize gestures
window.onload = function(){
    currentPageIdx = getPageIdx(getFileName());
    currentPageIdx = currentPageIdx === null ? 0 : currentPageIdx;
    adaptPageNavi();
    GeForMT.init(gestures, {
        feedback: false,
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
    
    if(currentPageIdx === 4){
     
    // event handler for the selected command
    function clickCommand(listName){ 
      GeForMT.Feedforward.animateGesture(listName);
      
    };
    // creates a list item of the command var listName
    function setCommandsItem(listName) {
      var newLiElem = document.createElement('li');
      newLiElem.innerHTML = listName;
      newLiElem.id = listName;
      
      var target = document.getElementById('feedM');
      target.appendChild(newLiElem);
    }; 
    // creates a navigation list for all available commands
    function setNavList() {

      
      for (i=0; i<gestureList.length; i++) { 
          setCommandsItem(gestureList[i]);      
      }
    };

    GeForMT.initFeedforward();
    GeForMT.Feedforward.setFeedforwardVis('helpHolder', '#696969');
    setNavList();

    GeForMT.addGesture({
        identifier: "listTap",
        expr: "1F(POINT(#feedM li))",
        online: true,
        handler: function(e){
            clickCommand(e.target.id);
        }
    });
    } 
    
    //GeForMT.addRecognitionFailedEventListener(function(){
        //recognitionFailed();
    //});
    
}

function adaptToOrientation(){
    var orientation = Math.abs(window.orientation);
    var previousLabelStyle = document.getElementById("previousPageLabel").style;
    var nextLabelStyle = document.getElementById("nextPageLabel").style;
    if (orientation == 0) {
        previousLabelStyle.marginTop = (window.innerWidth+window.pageXOffset) / 2 - 40;
        nextLabelStyle.marginTop = (window.innerWidth+window.pageXOffset) / 2 - 40;
    }
    else {
        previousLabelStyle.marginTop = (window.innerHeight+window.pageYOffset) / 2 - 40;
        nextLabelStyle.marginTop = (window.innerHeight+window.pageYOffset) / 2 - 40;
    }

	var isiPad = navigator.userAgent.match(/iPad/i) !== null;

	if(document.body.clientHeight<window.innerHeight && !isiPad){
		$('body').height(window.innerHeight);
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

	var isiPad = navigator.userAgent.match(/iPad/i) !== null;

	if(isiPad){ 
    $.blockUI({
        message: "<span class='message'>Die Geste konnte nicht erkannt werden.</span> <br /> Nutzen Sie die Hilfe (Gesten: ?, h oder H) und versuchen Sie es erneut.",
        fadeOut: 700,
        timeout: 2000,
        css: {
			marginTop: window.pageYOffset,
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            'border-radius': '10px',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: 0.5,
            color: '#fff'
        },
		overlayCSS: {
			height: document.documentElement.scrollHeight,
			backgroundColor: '#000'
		}
    });
	}else{
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
        },
		overlayCSS: {
			backgroundColor: '#000'
		}
    });
	}

    
    // setTimeout($.unblockUI, 2000);
}

function callHelp(e){
    window.location = "help.html";
}

function callMarkingMenu(e){
    //GeForMT.Feedforward.startFeedMenu();
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
