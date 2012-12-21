Soysauce
==========================
Original Author: Edward Gaba

About
--------------
Soysauce is a mobile-specific javascript widget package.

Widgets
--------------
### 1) Accordion

Options:

	1) overlay - provides a transparent overlay behind main content
	2) ajax - transfer information
	3) tab
	4) slide

Usage:

	<div ss-widget="accordion" ss-options="overlay">
		<h1 ss-component="button">BUTTON</h1>
		<div ss-component="content">
			<ul>
				<li>content</li>
				<li>content</li>
				<li>content</li>
				<li>content</li>
			</ul>
		</div>
	</div>

### 2) Lateload

Lateloading is an optimization technique. There are two events that get fired as browser processes the page, "DOMContentLoaded", which is fired on the document object, and "load," which is fired on the window object.

The process goes like this:

	1) User hits the page and waits
	2) "DOMContentLoaded" occurs and user can see the page processing
	3) "load" occurs and user doesn't see the page loading anymore

##### "DOMContentLoaded" event

It's recommended load content on this event for hidden, but necessary content such as non-primary images in a carousel.

Usage:

	<img ss-dcl-src="/images/brownie.png">

##### "load" event

It's recommended to load all unnecessary images/scripts on this event, such as images in an accordion or images in a popup.

Usage:

	<img ss-ll-src="/images/brownie.png">

Notes
--------------
* This widget package requires jQuery 1.7+

