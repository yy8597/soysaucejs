# Soysauce (v1.3.5)
Original Author: Edward Gaba

Soysauce is a customizable javascript widget library. Popular widgets included are carousels and accordions. Please file any issues you find in Github. Please see the Soysauce website for full documentation of the widgets:

http://www.soysaucejs.com/

## Installation - HTML
* Compressed (22.58 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.3.5/soysauce.min.js
* Uncompressed (39.67 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.3.5/soysauce.js
* CSS (9.66 KB) - http://divgzeiu68c7e.cloudfront.net/soysauce/v1.3.5/soysauce.css

You will need to include both the CSS and JS file (use the CDN links above). jQuery is a pre-requisite and will be need to be inserted before soysauce in the DOM.

## Installation - Bower

Simply run `bower install soysaucejs`. The CSS and JS will need to be included. Example with your bower components folder named 'vendor':

```
<link rel="stylesheet" type="text/css" href="/vendor/soysaucejs/assets/soysauce.css">
<script src="/vendor/soysaucejs/public/soysauce.js"></script>
```

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
