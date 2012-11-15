bb-carousel
===========

HTML Structure
--------------
Carousels are structured as follows:

	<carousel>
		<items>
			<item>Item Content</item>
			<item>Item Content</item>
		</items>
	</carousel>

The preferred HTML layout is:

	<div id="product_carousel" class="carousel">
		<ul>
			<li>
				<a href="#"><img src="images/image1.png" alt="Image 1"></a>
			</i>
			<li>
				<a href="#"><img src="images/image2.png" alt="Image 2"></a>
			</i>
			<li>
				<a href="#"><img src="images/image1.png" alt="Image 3"></a>
			</i>
		</ul>
	</div>

The actual elements used do not matter, as long as the structure remains the same. So, for example, you could use this instead:

	<div id="product_carousel" class="carousel">
		<div>
			<a href="#"><img src="images/image1.png" alt="Image 1"></a>
			<a href="#"><img src="images/image2.png" alt="Image 2"></a>
			<a href="#"><img src="images/image3.png" alt="Image 3"></a>
		</div>
	</div>

	
JavaScript
-----------

To create a carousel, simply pass the carousel container element to a new Swipe object.

	$(function() {
		window.carousel = new Swipe(document.getElementById('product_carousel'));
	});

### Carousel Options

	$(function() {
		window.carousel = new Swipe(document.getElementById('product_carousel'), {
			startSlide: 0,
				// integer, index position
			speed: 400,
				// integer, speed of transitions in milliseconds
			auto: 3000,
				// integer, time in milliseconds between slides
			callback: function() {}
				// function, runs at the end of a slide change
		});
	});

CSS
---
The CSS for the carousel is extremely basic.