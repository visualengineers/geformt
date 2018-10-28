---
layout: category
title: Getting Started
category: Getting Started
sidebar_sort_order: 20
---

This tutorial covers programming with GeForMTjs, the JavaScript implementation of GeForMT.

### Syntax

The syntax used with the JavaScript implementation of GeForMT follows the EBNF grammar and consists of:

* Atomic gestures
    * Number of contacts
    * Point, line, semicircle, circle, freeform
    * _motion vector, _rotation
* Operators
    * synchronous, asynchronous (*/+)
    * Combined path (,)
    * Sequential order (;)
* Relations
    * parallel (sync), join, split, cross, connected, aside, among, closed
* Focus
    * CSS-Selectors, e.g.
    * Type selector body, div
    * Class selector .class
    * Id selector #id

### API

```javascript
GeForMT.init(gestures,settings)
````

Initialization of the framework.

```javascript
GeForMT.addGesture(gesture)
```

Adding of a gesture definition

```javascript
GeForMT.removeGesture(identifier)
```

Remove a gesture with a given unique identifier

```javascript
GeForMT.addRecognitionStartedEventListener(function)
```

Registers an event listener, that is called when gesture recognition starts

```javascript
GeForMT.addRecognizedCandidatesEventListener(function)
```

Registers an event listener that is called when part of a gesture has been recognized. The event reports the identifiers of all gesture candidates.

```javascript
GeForMT.addRecognitionFailedEventListener(function)
```

Registers an event listener that is called when no gesture has been recognized after user input is complete.

```javascript
GeForMT.setFeedback(bool)
```

Activates or deactivates standard visual feedback

### Global Properties (settings for object model)

```javascript
var settings = {
	feedback: true,         // Visual feedback (default true)
	preventDefault: false,  // Prevents standard behavious of 
				// browsers for gestural input
				// (default true)
	contiguityInterval: 800 // Time allowed between sequentially 
				// performed gesture paths in
				// milliseconds (default 1000)
}
```

### Gesture definition (gesture in the object model)

```javascript
var gesture = {
	identifier: "dragObjects",	// Unique identifier
	expr: "1F(MOVE(.objects))",	// GeForMT expression
	online: true,			// Online/offline recognition
					// (default false)
	handler: function(e){		// Event listener for
					// GestureRecognizedEvent
		... 
		}
}
```

### GestureRecognizedEvent Interface

```javascript
e.identifier
```

Unique identifier of a gesture

```javascript
e.expr
```

GeForMT expression of the recognized gesture

```javascript
e.pathes
```

Paths of the gesture represented as coordinate lists. Supplies a list of gesture sequences, which are in turn a list of template objects representing exactly one path of a finger, expressed by a list of coordinates (points). 

Example: `2F(LINE)`

```javascript
var lineIndexFinger = e.pathes[0][0].points;
var lineSecondFinger = e.pathes[0][1].points 
```

Example: `1F(LINE);1F(LINE)`

```javascript
var firstLine = e.pathes[0][0].points;
var nextLine= e.pathes[1][0].points
```

```javascript
e.events
```

All TouchEvents, which represent the gesture input. Supplies a list of gesture sequences, in which all of the recorded TouchEvent objects are contained. Their specification is taken from the TouchEvent interface of W3C (see http://www.w3.org/TR/touch-events/). 

Example: `2F(LINE)`

```javascript
var touchstartEvent = e.events[0][0]; 
```

Example: `1F(LINE);1F(LINE)`

```javascript
var touchstartEventFirstLine = e.events[0][0];
var touchstartEventNextLine = e.events[1][0];
```

```javascript
e.currentEvent
```

Current TouchEvent object of the gesture input. See W3C TouchEvent Interface: http://www.w3.org/TR/touch-events/.

```javascript
e.duration
```

Duration of gesture input in milliseconds

```javascript
e.getBoundingBox()
```

Representation of the rectangular bounding box of the input. Supplies an object with the attributes top, right, bottom, and left.

```javascript
e.getMidPoint()
```

Supplies the center of the gesture as (x,y) coordinate.

Basic Example for Circle Gesture

```html
<head>
  <script type="text/javascript" src="GeForMT.min.js"></script>
  <script type="text/javascript">
    window.onload = function() {
      var settings = {
        feedback: true
      }
      var gestures = {
        circle: {
          expr: "1F(CIRCLE)",
          handler: function(e) {
            // Kreisgeste erkannt
          }
        }
      }
      GeForMT.init(gestures,settings);
      GeForMT.addRecognitionFailedEventListener(function(){
        // z.B. Hilfe aufrufen
      });
    };
  </script>
</head>
````
