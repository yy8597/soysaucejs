$(document).ready(function() {
	var html = "";
	
	if ($("body").hasClass("carousels")) {
		var img1 = "<img data-ss-component='item' src='http://pipocamoderna.com.br/wp-content/uploads/2012/06/ironman-08preview-lg-600x400.jpg'>";
		var img2 = "<img data-ss-component='item' src='http://wallpapermaning.com/wp-content/uploads/2013/01/Audi-R8-Background-600x400.jpg'>";
		var img3 = "<img data-ss-component='item' src='http://collider.com/wp-content/image-base/Movies/I/Iron_Man_movie/Iron_Man_Movie_/iron_man_movie_image__11_.jpg'>";
		var options = "";
		var params = location.search.match(/\w+=/g);

		if (params) {
			params.forEach(function(element) {
				options += element.replace("=", " ");
			});
		}
		
		html = "<div data-ss-widget='carousel' data-ss-options='" + options + "'>";
		html += img1;
		html += img2;
		html += img3;
		html += "</div>";
		
		$("#carousel").append(html);
		soysauce.init("#carousel [data-ss-widget]");
	}
});