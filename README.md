bb-carousel
===========

HTML
----

	<div class="carousel">
		<ul>
			<li>
				<a href="[link 1]"><img src="[image 1]"></a>
			</i>
			<li>
				<a href="[link 1]"><img src="[image 1]"></a>
			</i>
		</ul>
	</div>
	
JavaScript
-----------

### Usage

	$(function() {
		window.carousel = new Swipe($('.carousel')), {
			startSlide: 0,
			speed: 400,
			auto: 3000
		});
	});

### Carousel Options

	$(function() {
		window.product_carousel = new Swipe(document.getElementById('product-carousel'), {
			startSlide: 0, 	// integer, index position
			speed: 400,		// integer, speed of transitions in milliseconds
			auto: 3000,		// integer, time in milliseconds between slides
			callback:			// function, runs at the end of a slide change
		});
	});