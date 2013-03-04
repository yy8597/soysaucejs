soysauce.freezeChildren = function(selector) {
	var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
	children.each(function(index, child) {
		var id = $(child).attr("data-ss-id");
		soysauce.freeze(id, false);
	});
};

soysauce.freeze = function(selector, freezeChildren) {
	if (typeof(selector) === "object") {
		selector = parseInt($(selector).attr("data-ss-id"));
	}
	freezeChildren = (freezeChildren === undefined) ? true : false;
	soysauce.fetch(selector).handleFreeze();
	if (freezeChildren) {
		soysauce.freezeChildren(selector);
	}
};

soysauce.unfreeze = function(selector) {
	if (typeof(selector) === "object") {
		selector = parseInt($(selector).attr("data-ss-id"));
	}
	var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
	soysauce.fetch(selector).handleUnfreeze();
	children.each(function(index, child) {
		var id = $(child).attr("data-ss-id");
		soysauce.fetch(id).handleUnfreeze();
	});
};
