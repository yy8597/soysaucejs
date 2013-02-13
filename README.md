Soysauce (BETA)
==========================
Original Author: Edward Gaba

About
--------------
Soysauce is a mobile-specific javascript widget library.

Widgets
--------------

These pre-built widgets are simple to use. Some widgets have additional options for extra effects and functionality. To use, you will need to include:

	soysauce.css (found in assets)
	soysauce.js (found in public/javascript)

If you would like to contribute, fork the repo (git@github.com:brandingbrand/soysauce.git) and make pull requests.

### 1) Carousel

Carousels allow for "slideshow" effects for images. Every carousel is pre-built with dots, infinite scrolling, buttons, and swipe.

Required Attributes:

	1) data-ss-widget="carousel" 	- Add this to the container
	2) data-ss-component="item" 	- Add this to the items

Optional Attributes:
	
	1) data-ss-options="OPTION"					- Add your options
	2) data-ss-autoscroll-interval="x"	- Autoscroll timing delay; default is 5000
	3) data-ss-peek-width="x"						- Total peek width (not per side); default is 40 (in pixels)
	4) data-ss-zoom-multiplier="x"			- Zoom Multiplier; default is 2

Options:

	1) "autoscroll" - timer based autoscrolling, default is 5000ms
	2) "3d"					- forces 3d on devices, 3d is turned off by default for androids and opera browsers; default on for iOS
	3) "peek" 			- allows item "previewing" on both sides of the main item
	4) "finite" 		- does not loop around once end is reached
	5) "noswipe" 		- disables the ability to swipe
	6) "zoom" 			- allows the user to zoom in on an item
	6a) "pinch"			- must be paired with zoom, allows for pinch zoom effects
	7) "thumbs"			- uses thumbnails instead of dots; practical for PDP carousels
	8) "multi"			- allows for multiple items per screen; practical for "Recommended Products"
	9) "cms"				- converts the CMS style nodes to correctly adapt to the soysauce carousel; create the container 
										with this option and import the CMS inside
	10) "nofullscreen" - disables resizing of images

Ex. Usage:

	<div data-ss-widget="carousel" data-ss-options="autoscroll peek">
		<img data-ss-component="item" src="http://placehold.it/600x400/cdcdcd">
		<img data-ss-component="item" src="http://placehold.it/300x200/cdcdcd">
		<img data-ss-component="item" src="http://placehold.it/600x400/cdcdcd">
		<img data-ss-component="item" src="http://placehold.it/600x400/cdcdcd">
	</div>

### 2) Toggler

Togglers allow for hiding and showing content when necessary.

Required Attributes:

	1) data-ss-widget="toggler"					- Add this to the container
	2) data-ss-component="button"				- Add this to the target button
	3) data-ss-component="content"			- Add this to the content you want to toggle

Optional Attributes:

	1) data-ss-options="OPTION"					- Add your options
	2) data-ss-responsive-threshold="x"	- Used with the responsive option; define the threshold to 
																				use tabs/accordions; default is 768

Options:

	1) tabs 				- immediate child buttons/content are linked and only one can be opened at a time
	2) slide				- slide animation
	3) responsive		- before the threshold, accordion-esque; after the threshold, tab-esque

Usage:

	<div data-ss-widget="accordion" data-ss-options="tabs slide">
		<h1 data-ss-component="button">BUTTON</h1>
		<div data-ss-component="content">
			<ul>
				<li>content</li>
				<li>content</li>
				<li>content</li>
				<li>content</li>
			</ul>
		</div>
		<h1 data-ss-component="button">BUTTON</h1>
		<div data-ss-component="content">
			<ul>
				<li>content</li>
				<li>content</li>
				<li>content</li>
				<li>content</li>
			</ul>
		</div>
	</div>

### 3) Lateload

Lateloading is an optimization technique. There are two events that get fired as browser processes the page, "DOMContentLoaded", which is fired on the document object, and "load," which is fired on the window object.

The process goes like this:

	1) User hits the page and waits
	2) "DOMContentLoaded" occurs and user can see the page processing
	3) "load" occurs and user doesn't see the page loading anymore

##### "DOMContentLoaded" event

It's recommended load content on this event for hidden, but necessary content such as non-primary images in a carousel.

Ex. html:

	<img data-ss-ll-src="/images/brownie.png" data-ss-options="dom">

##### "load" event

It's recommended to load all unnecessary images/scripts on this event, such as images in an accordion or images in a popup.

Ex. html:

	<img data-ss-ll-src="/images/brownie.png" data-ss-options="load">

##### Manual load

Call soysauce.load(target) on the element that you would like to load.

	Ex. html:

		<img data-ss-ll-src="/images/brownie.png" class="some-target">
	
	Ex. javascript:
	
		soysauce.load(".some-target");

