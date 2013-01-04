soysauce.overlay = function(cmd) {
	switch(cmd) {
		case "init":
			if ($("[data-ss-widget='overlay']") === undefined) break;
			var div = document.createElement("div");
			div.setAttribute("data-ss-widget", "overlay");
			div.setAttribute("data-ss-state", "inactive");
			document.body.appendChild(div);
			$("[data-ss-widget='overlay']").on("click", function() {
				soysauce.overlay("off");
			});
			break;
		case "on":
			$("[data-ss-widget='overlay']").show();
			window.setTimeout(function() {
				$("[data-ss-widget='overlay']").attr("data-ss-state","active");
			}, 0);
			break;
		case "off":
			$("[data-ss-widget='overlay']").attr("data-ss-state","inactive");
			window.setTimeout(function() {
				$("[data-ss-widget='overlay']").hide();
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
