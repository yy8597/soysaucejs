$(document).ready(function() {
	$(".widgets").each(function() {
		var navItems = $(".api aside li");
		var apiCarousel = soysauce.fetch(".apiCarousel");
		navItems.click(function(e, i) {
			apiCarousel.jumpTo(navItems.index(this));
		});
	});
});
