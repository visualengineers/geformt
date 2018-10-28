# Gesture Formalization for Multitouch (GeForMT) JavaScript Implementation

Gesture Formalization for Multitouch – or short GeForMT – is a domain specific language, which describes multi-touch gestures. GeForMT proposes a reasonably detailed set of gesture building blocks while hiding as many concrete parameters and implementation details as possible. The design goals are:

* Concise and clear to read for humans
* Formal definition for platform-independent use
* Quick implementation by embedding in code
* Support of direct manipulation (online gestures) and stroke shortcuts (offline gestures)

## Project Website

More information, demos and tutorials are available on [geformt.org](http://geformt.org).

## Prerequisites

### Install ANT

MacOS:

```bash
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
$ brew update
$ brew install ant
$ ant -version
```

If you are getting errors installing Brew, try uninstalling first using the command:

```bash
$ rm -rf /usr/local/Cellar /usr/local/.git && brew cleanup
```

If you have MacPorts installed (https://www.macports.org/), do this:

```bash
$ sudo port install apache-ant
```

## Generating The Parser

The parser is generated using a grammar file and [PegJS](https://pegjs.org).

```bash
$ npm install -g pegjs
$ cd <path_to_repo>/grammar
$ pegjs geformt.pegjs
```

## Building The Library

Using [ANT](https://code.tutsplus.com/tutorials/using-ant-to-build-a-javascript-library--net-27014) to generate concatenated and minified JavaScript code. Using some dependencies for [ANT](https://www.sitepen.com/blog/2001/09/25/javascript-and-ant/).

Run:

```bash
$ ant compress
```
