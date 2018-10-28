
// load the application when DOM is ready
$(document).ready(function(){

// event handler for the selected command
function clickCommand(listName){ 

      GeForMT.Feedforward.animateGesture(listName);
      
      // remove active class on all listelements
			$('li').removeClass('active');
      
      var target = document.getElementById(listName);
      target.className = 'active';
}

// creates a list item of the command var listName
function setCommandsItem(listName) {
      var newLiElem = document.createElement('li');
      newLiElem.innerHTML = listName;
      newLiElem.id = listName;
      
      var target = document.getElementById('ful');
      target.appendChild(newLiElem);
}; 

// creates a navigation list for all available commands
function setNavList() {
      var newUL = document.createElement('ul');
      newUL.id = 'ful';
      var target = document.getElementById('help');
      target.appendChild(newUL);
      
      for (i=0; i<gestureList.length; i++) { 
          setCommandsItem(gestureList[i].identifier);      
      }
};

var gestureList =  GeForMT.GestureModel.getAllGestures();
GeForMT.initFeedforward();
GeForMT.Feedforward.setFeedforwardVis();
setNavList();

GeForMT.addGesture({
        identifier: "listTap",
        expr: "1F(POINT(#help li))",
        online: true,
        handler: function(e){
            clickCommand(e.target.id);
        }
});

});            