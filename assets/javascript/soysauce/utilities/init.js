soysauce.init = function(selector) {
	var set;
	var numItems = 0;
	var ret = false;
	
	if (!selector) {
		set = $("[data-ss-widget]:not([data-ss-id])");
	}
	else {
		set = $(selector);
	}
	
	if ($(selector).attr("data-ss-id") !== undefined) return ret;
	
	numItems = set.length;
	
	set.each(function(i) {
		var type = $(this).attr("data-ss-widget");
		var widget;
		
		$(this).attr("data-ss-id", ++soysauce.vars.idCount);
		
		switch (type) {
			case "toggler":
				widget = soysauce.togglers.init(this);
				break;
			case "carousel":
				widget = soysauce.carousels.init(this);
				break;
		}

		if (widget !== undefined) {
			soysauce.widgets.push(widget);
			ret = true;
		}
		
	});
	
	return ret;
}
