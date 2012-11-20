bb-carousel
===========

HTML Structure
--------------
The basic structure of a carousel is:

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

Slide Position Indicators
-------------------------

You can add slide position indicators, usually in the form of bullets, by creating a containing element as a child of the carousel container and giving it the class `carousel_position`. (You can change this selector in the options described in the next section.)

	<div id="product_carousel" class="carousel">
		<div>
			<a href="#"><img src="images/image1.png" alt="Image 1"></a>
			<a href="#"><img src="images/image2.png" alt="Image 2"></a>
			<a href="#"><img src="images/image3.png" alt="Image 3"></a>
		</div>
		<div class="carousel_position"></div>
	</div>
	
The bullets will be automatically generated. As an example:

	<div class="carousel_position">
		<span class="active">1</span>
		<span>2</span>
		<span>3</span>
	</div>	

If the position container is a list, the indicators will appropriately wrapped in `li`, otherwise they will be wrapped in `span`.

JavaScript
-----------

To create a carousel, simply pass the carousel container element to a new BBCarousel object.

	$(function() {
		var carousel = new BBCarousel(document.getElementById('product_carousel'));
	});

### Carousel Options

	$(function() {
		var carousel = new BBCarousel(document.getElementById('product_carousel'), {
			startSlide: 0,
				// integer, index position
			speed: 300,
				// integer, speed of transitions in milliseconds
			auto: 0,
				// integer, time in milliseconds between slides
			callback: function() {},
				// function, runs at the end of a slide change
			bullets_container: '.carousel_position',
				// string, query selector of container to place bullets in
			active_class: 'active'
				// string, class name applied to active position bullets
		});
	});