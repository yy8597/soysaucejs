soysauce.overlay = function(cmd) {
	switch(cmd) {
		case "init":
			if ($("[ss-widget='overlay']") === undefined) break;
			var div = document.createElement("div");
			div.setAttribute("ss-widget", "overlay");
			div.setAttribute("ss-state", "inactive");
			document.body.appendChild(div);
			$("[ss-widget='overlay']").on("click", function() {
				soysauce.overlay("off");
			});
			break;
		case "on":
			$("[ss-widget='overlay']").show();
			window.setTimeout(function() {
				$("[ss-widget='overlay']").attr("ss-state","active");
			}, 0);
			break;
		case "off":
			$("[ss-widget='overlay']").attr("ss-state","inactive");
			window.setTimeout(function() {
				$("[ss-widget='overlay']").hide();
			}, 400);
			break;
		case undefined:
			console.warn("Soysauce: Please provide a command.");
			break;
		default:
			console.warn("Soysauce: Unrecognized command.");
			break;
	}
};

soysauce.overlay("init");
