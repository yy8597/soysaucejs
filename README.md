# Soysauce (v1.1.50)
Original Author: Edward Gaba

Soysauce is a customizable javascript widget library. Popular widgets included are carousels and accordions. Please file any issues you find in Github. Please see the Soysauce website for full documentation of the widgets:

http://soysauce.s3.amazonaws.com/site/home.html

## Current CDN URLs
* Compressed (48.68 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.min.js
* Uncompressed (74.14 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.js
* Compressed Lite (36.16 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.lite.min.js
* Uncompressed Lite (54.61 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.lite.js
* Compressed Legacy (50.12 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.legacy.min.js
* Uncompressed Legacy (77.36 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.legacy.js
* CSS (5.04 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.1.50/soysauce.css

Note: Lite contains only the bare essentials (which will later help with scaling as the number of widgets increase):
* Fastclick
* Carousel
* Toggler
* Lateload

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
