if(typeof(soysauce) == "undefined") {
	
soysauce = {
	accordions: {},
	buttons: {},
	init: function() {
		var set = $("[ss-widget]");
		for (var i = 0; i < set.length; i++) {
				$(set[i]).attr("ss-id", i+1);
		}
	},
	lateload: {}
}

soysauce.init();

}