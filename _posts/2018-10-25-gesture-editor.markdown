---
layout: post
title: "Gesture Editor"
categories:
  - Showcases
tags:
  - Application
  - Editor
---

An [online editor](../../../../assets/showcases/editor){:target="_blank"} helps to define gestures with GeForMT for use with any framework that employs the GeForMT language to define gestures. The editor is optimized for use on a tablet device, but can also be run on a desktop browser.

![Explanation for the Gesture Editor](../../../../assets/images/geformt_editor_explanation.png)

The editor is divided into five areas. The header contains an input field for the name of the gesture that is being developed (a). In addition, the formalization which is under construction is displayed.

The main area in the middle is subdivided into three columns (b-f). The first column displays the compass rose and is used to create basic gesture building blocks by example, i.e. performing linear or curved move-ments with one or more fingers (e). The second column is used to display GeForMT expressions and to test registered gestures (d). Error messages are displayed as well, for instance if trying to register a gesture before it is defined, or when an identifier is already in use. The third column contains a control panel with tools to construct complex gestures from basic gestures (b,c,f). The atomic gestures defined on the compass rose can be constrained or unconstrained using the switches in (b). The buttons in (c) provide the GeForMT operators to combine atomic gestures. A gesture definition can be registered or reset using the buttons in (f). The area at the bottom of the editor displays the defined and registered gestures available for testing (g). If available, the editor displays [Gesturecons](http://gesturecons.com/) for the registered gestures.

The current version of the online editor does not address the object focus of multi-touch gestures. However, GeForMT does include this aspect in the language itself. Hence, an extension of the editor is subject of future work. Currently, only gesture sets containing global gestures can be defined in a single session, or for a single class of objects. Moreover, the online evaluation of gestures, for instance for direct manipulation, cannot be tested since no application logic can be specified.