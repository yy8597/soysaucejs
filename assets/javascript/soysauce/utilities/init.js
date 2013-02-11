soysauce.init = function(selector) {
	var set;
	var numItems = 0;
	
	if (!selector) {
		set = $("[data-ss-widget]:not([data-ss-id])");
	}
	else {
		set = $(selector);
	}
	
	numItems = set.length;
	
	set.each(function(i) {
		var type = $(this).attr("data-ss-widget");
		var widget;
		
		$(this).attr("data-ss-id", ++soysauce.vars.idCount);
		
		switch (type) {
			case "toggler":
				widget = soysauce.togglers.init(this);
				break;
		}

		if (widget !== undefined) {
			$(window).on("resize orientationchange", widget.handleResize);
		}

		soysauce.widgets.push(widget);
	});
}
