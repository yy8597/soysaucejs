soysauce.lateload = function(selector) {
	
	function loadItem(selector) {
		var curr = $(selector);
		var val = curr.attr("data-ss-ll-src");
		if (val) {
			curr.attr("src", val).removeAttr("data-ss-ll-src");
			return true;
		}
		return false;
	}
	
	if (selector) {
		return loadItem(selector);
	}
	else {
		$(document).on("DOMContentLoaded", function() {
			$("[data-ss-ll-src][data-ss-options='dom']").each(function(i, e) {
				loadItem(e);
			});
		});
		$(window).on("load", function() {
			if (!$("[data-ss-ll-src][data-ss-options='load']")) return;
			$("[data-ss-ll-src][data-ss-options='load']").each(function(i, e) {
				loadItem(e);
			});
		});
	}
};

soysauce.lateload();
