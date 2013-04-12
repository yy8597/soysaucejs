soysauce.overlay = (function() {
	var overlay, done, caption;
	var init = true;
	var isOn = false;

	return {
		init: function(selector) {
			var div = document.createElement("div");
			
			if (!init) return false;
			
			div.setAttribute("data-ss-utility", "overlay");
			div.setAttribute("data-ss-state", "inactive");
			document.body.appendChild(div);
			
			overlay = $("[data-ss-utility='overlay']");
			
			overlay.append("<span class='done'></span>");
			done = overlay.find(".done");
			
			overlay.append("<div class='caption'></span>");
			caption = overlay.find(".caption");
			
			done.on("click", function() {
				soysauce.overlay.off();
			});
			
			init = false;
		},
		on: function() {
			if (isOn) return;
			overlay.show();
			window.setTimeout(function() {
				overlay.attr("data-ss-state","active");
				overlay.trigger("SSOverlayOn");
				isOn = true;
			}, 0);
		},
		off: function() {
			if (!isOn) return;
			overlay.attr("data-ss-state","inactive");
			window.setTimeout(function() {
				overlay.hide();
				overlay.trigger("SSOverlayOff");
				isOn = false;
			}, 400);
		},
		toggle: function() {
			if (isOn) {
				soysauce.overlay.off();
			}
			else {
				soysauce.overlay.on();
			}
		},
		state: function() {
			if (isOn) {
				return "on";
			}
			else {
				return "off";
			}
		},
		caption: function(text) {
			if (!text) {
				caption.html("");
			}
			else {
				caption.html(text);
			}
		}
	};

})();

soysauce.overlay.init();