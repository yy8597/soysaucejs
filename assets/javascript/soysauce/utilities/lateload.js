soysauce.lateload = function(selector) {
	if (selector) {
		$("[ss-ll-src]").each(function() {
			var curr = $(this);
			var val = curr.attr("ss-ll-src");
			if (val) 
				curr.attr("src", val).attr("ss-ll-src", "");
		});
	}
	else {
		$("[ss-dcl-src]").each(function() {
			var curr = $(this);
			var val = curr.attr("ss-dcl-src");
			if (val) 
				curr.attr("src", val).removeAttr("ss-dcl-src");
		});
		window.addEventListener("load", function() {
			$("[ss-ll-src]").each(function() {
				var curr = $(this);
				var val = curr.attr("ss-ll-src");
				if (val)
					curr.attr("src", val).removeAttr("ss-ll-src");
			});
		});
	}
};

soysauce.lateload();
