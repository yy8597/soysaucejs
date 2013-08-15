# Soysauce (v1.1.104)
Original Author: Edward Gaba

Soysauce is a customizable javascript widget library. Popular widgets included are carousels and accordions. Please file any issues you find in Github. Please see the Soysauce website for full documentation of the widgets:

http://www.soysaucejs.com/

## Current CDN URLs
* Compressed (17.50 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.min.js
* Uncompressed (27.16 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.js
* Compressed Lite (10.45 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.lite.min.js
* Uncompressed Lite (13.96 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.lite.js
* Compressed Legacy (17.97 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.legacy.min.js
* Uncompressed Legacy (28.01 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.legacy.js
* CSS (7.61 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.104/soysauce.css

Note: Lite contains only the bare essentials (which will later help with scaling as the number of widgets increase):
* Carousel
* Toggler

Note2: Legacy contains support for older versions of jQuery (< 1.6)

## Widgets
These pre-built widgets are simple to use. Some widgets have additional options for extra effects and functionality. To use, you will need to include both the CSS and JS file (use the CDN links above).

## Contribute
If you would like to contribute, fork the repo (git@github.com:brandingbrand/soysauce.git) and make pull requests. You will need to have Java and the gems bundle, compass, jammit, rake, and aws-sdk. Just run these two simple commands to obtain the gems (Java is separate):

	gem install bundle
	bundle

Note: If you have trouble installing gems, make sure you have XCode with Command Line Tools and RVM. RVM can be installed via:

	curl -L https://get.rvm.io | bash -s stable

To create a build, run this command in the main directory. This compiles the CSS/JS, places the assets in the "build" directory, pushes it up to the CDN, and updates the readme. You must have cdn.yml located in the assets folder.

	rake v=[VERSION_NUMBER]
	(ex. rake v=1.0.5)

To compile the css, run this command in the main directory:

	compass watch
		-OR-
	compass compile

To bundle the javascript, run this command in the main directory:

	jammit
