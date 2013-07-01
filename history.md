1.1.86 - 1.1.87 / 2013-06-27
----------------------------
### Lazyloader
* New "cache" option triggers two new events: SSSaveState and SSLoadState
* Default threshold from bottom increased to 300px

1.1.85 / 2013-06-27
----------------------------
### General
* Remove -webkit-tap-highlight-color from widgets/components

### Carousel/Toggler
* Include margins when calculating heights

1.1.84 / 2013-06-26
----------------------------
### General
* Exclude -webkit-backface-visibility: hidden attribute from browsers that do not support -webkit-transform-3d

1.1.82 - 1.1.83 / 2013-06-21
----------------------------
### General
* Removed soysauce.vars.sessionStorageFull (was never fully implemented)
* Fastclick
* Removed from body
* Attached only to non-orphan toggler buttons
* soysauce.vars.fastclick is an array of Fastclick attached elements (call destroy on these objects if they need to be removed)

1.1.81 / 2013-06-19
----------------------------
### Carousel
* New feature - "left aligned peeking; add [data-ss-peek-align="left"] to widget container (right not yet available)
* Fixed issue with carousel progressing further than the max index with finite, multi carousels

1.1.80 / 2013-06-19
----------------------------
### General
* soysauce.scrollTop() now called on page load instead of document.ready
* Fastclick
* Updated to v0.6.7
* Fastclick var now found in soysauce.vars.fastclick; if necessary to remove it from the site, call soysauce.vars.fastclick.destroy()
* Now attached to body on document.ready event

### Toggler
* Degraded devices no longer support the "slide" option; these devices toggle content normally

1.1.75 - 1.1.79 / 2013-06-04 - 2013-06-06
----------------------------
### General
* Now compressed and gzipped (approximately 4x smaller)
* Updated Fastclick to 0.6.7
* All calls to parseInt() now explicitly define base 10
* Added "SAMSUNG-SGH-I747" to the list of degraded devices

### Autodetect-CC
* Improved event triggering

### Lazyloader
* Improved event triggering
* Added Lazyloader.prototype.reload() function; call after new items are inserted into the container- allows for the lazyloader to continue

### Carousel
* Fixed issue with user attempting to pinch-zoom images if zoom option is not used (pinch is still not ready)
* Zoom - Tap to zoom now zooms to where the user tapped (still needs minor translate adjustment)
* High Quality Zoom Image - new feature - add "[data-ss-zoom-src='new_src']" to request a new, higher quality image (not a required tag); feel free to prank the user by adding in a completely different image source as well

1.1.70 - 1.1.74 / 2013-05-13 - 2013-05-28
----------------------------
### General
* Code refactoring - small performance gains here and there
* soysauce.browserInfo.supportsLocalStorage() now properly works with private browsing

### Carousel
* Multi carousel can now swipe in multiples; by default, it swipes in the number of items in the set. this can be changed via [data-ss-step-size="x"]; dots, item states, and button states are properly updated. Infinite is still not supported
* Zoom, although many changes have occurred, has not changed much. Pinch will be caked in as soon as it's finished
* Zoom pan limits now account for item padding

### Lazyloader
* "SSItemsEmpty" now properly fires after the items are empty
* No longer unbinds the "autoload" scroll event after items are empty

1.1.66 - 1.1.69 / 2013-05-02 - 2013-05-05
----------------------------
### General
* Fixed bug with attaching overlay to body when DOM wasn't ready

### Lazyloader
* Completely remodeled
* "autoload" option added - when a user enters the threshold (defined by the dev or 100px from bottom of container by default), a batch of items will be loaded

1.1.63 - 1.1.64 / 2013-04-23 - 2013-04-29
----------------------------
### General
* Base - updated Fastclick

1.1.62 / 2013-04-22
----------------------------
### General
* Widgets now fire a "SSWidgetResized" event
* Deferred widgets will fire SSWidgetResized after children (aka, you can now have carousels inside closed togglers, see demos page)
* All widgets now carry a "type" variable
* Throttling resize events

### Toggler
* Target fix for basic toggler

1.1.60 - 1.1.61 / 2013-04-15 - 2013-04-22
----------------------------
### Toggler
* Hiding non-slide togglers during load via display: none
* Hiding slide togglers during load via visibility: hidden
* Basic togglers now properly collapse the parent

### Input Clear
* Wrapper now inherit's inputs css
* Hides when not focused

### Autosuggest
* Properly hides during blur and when there is no value

1.1.59 / 2013-04-14
----------------------------
### General
* New widget - autosuggest
* New widget - input clear
* Widgets that cannot be initialized no longer obtain a soysauce id #
* Widgets with the [data-ss-defer] option wait for inner widgets to load before itself

### Carousel
* New attribute "data-ss-multi-min-width" - place this on the body when used with the multi option to allow responsive action (multiple items will increase)
* Removed "3d" option - soysauce will automatically detect whether the os can support 3d or not

1.1.58 / 2013-04-11
----------------------------
### General
* New feature - "SSReady" event - the event "SSReady" is now triggered on the window after Soysauce is loaded
* New feature - "degrading" - older devices now have a [data-ss-degrade="true"] attribute attached to the body (currently matches android 1.x, 2.x, and opera browsers); degraded widgets can have separate/limited functionality and different styling
* Widgets no longer require a handleResize() function

### Carousel
* New feature - degraded carousel - degraded carousels now use 'left' css transitions instead of transform- translate(x,y)

### Toggler
* "nocollapse" + "tabs" option combination now places a min-height on the widget (assuming the user is creating folder tabs)

### Autodetect CC
* "format" option now has degraded support

1.1.52 - 1.1.57 / 2013-04-03 - 2013-04-10
----------------------------
### Toggler
* Fixed issue with orphans not having an ID; ID now placed on both button and content
* Toggler orphans now throw a "slideEnd" event on the content after opening (if a transition exists)

1.1.50 - 1.1.51 / 2013-04-02 - 2013-04-03
----------------------------
### General
* Lite now only contains toggler and carousel. Removed Fastclick and Lateloader.

### Toggler
* Checks for full session storage if using ajax option
* Adjusts slide-height after a resize/orientation change

1.1.49 / 2013-04-01
----------------------------
### Toggler
* Fixed issue with nesting slide togglers which prevented togglers from obtaining slide height attribute
* Added "nocollapse" option; this needs to be paired with "tab" option which will always keep a toggler open

1.1.46 - 1.1.48 / 2013-03-26 - 2013-03-29
----------------------------
### General
* Created new legacy bundles (stripped from main to minimize size); soysauce.legacy.min.js and soysauce.legacy.js
* Site documentation nearly complete and can be seen at http://soysauce.s3.amazonaws.com/site/home.html

### Toggler
* Fixed issue with "slide" togglers not calculating cached image height

### Carousel
* If carousel is zoomed, carousel will now zoom out when jumpTo() is called
* Dot/button clicks now reset the interval timer with "autoscroll" carousels

1.1.42 - 1.1.45 / 2013-03-22 - 2013-03-36
----------------------------
### General
* Added backwards support for jQuery versions that do not have the find() function with elements and jQuery objects (jQuery 1.6+)
* Improved null/undefined checking when calling soysauce.fetch()

### Carousel
* Fixes major Android issue with users not being able to click content within carousels
* Fixes issue with zoom icon not toggling the zoom
* New option "fade"
* Fixes issue with "finite" carousels not having an initial, active item
* Fixes issue with "peek" and "infinite" carousels getting off center when users performs an interrupted loop-around

### Overlay
* Re-wrote overlay
* Can be called via soysauce.overlay.on()/off()/toggle()

### Autodetect-CC
* Max-length adjusted if user does not select formatting option

1.1.25 - 1.1.41 / 2013-03-11 - 2013-03-20
----------------------------
### General
* Started providing examples at http://soysauce.s3.amazonaws.com/site/home.html (v1.1.24)

### Autofill-Zip
* Now supports reverse geocoding (can use current location)

1.1.24 / 2013-03-08
----------------------------
### Autofill-Zip
* Now using our own native webservice (ex. http://jeocoder.herokuapp.com/zips/94608)

### Carousel
* Fixes issue with carousel always thinking it has links

### Toggler
* Hiding content before state is attached

1.1.18 - 1.1.23 / 2013-03-06 - 2013-03-07
----------------------------
### General
* Changed CDN URL; CNAMEs cannot be used with Cloudfront when accessing SSL links (updated in README.md)
* New Widget - Autofill-Zip

### Carousel
* Fixed bug with carousel always thinking it has links
* Fixed bug concerning padding/margin with the items

1.1.9 - 1.1.17 / 2013-03-04 - 2013-03-06
----------------------------
### General
* Moved freeze functions from base to utilities/freeze.js

### Lazyloader
* Added scrollEvent throttle which only fires the update() event at a max of once per 100ms

1.1.8 / March 04, 2013-03-04
----------------------------
### General
* Added new widget: Lazyloader

### Carousel
* Added error check to ensure dev puts items in the carousel

### Toggler
* Fixed bug with 'autoheight'
* Added error if toggler ajax'd data cannot be fetched

### Lazyloader (new)
* Basic functionality - image appears on page then it loads

1.1.7 / 2013-02-27
----------------------------
### Carousel
* Fixed order of carousel ready state
* Added max-height to carousel while loading

1.1.6 / 2013-02-27
----------------------------
### Carousel
* Fixes issue with carousel re-animating it's loop when it should just be resetting it's position.

1.1.5 / 2013-02-27
----------------------------
### Carousel
* Accounting for padding + peek; avoid using margin if possible (not finished)

### Toggler
* Re-coded 'ajax' option

1.1.2 - 1.1.4 / 2013-02-25 - 2013-02-26
----------------------------
### General
* Added new lite version
* CDN now migrated to cdn.brandingbrand.com

### Carousel
* Added 'autoheight' feature
* Lowered slide transition time
* Bug fix with infinite carousels with single image