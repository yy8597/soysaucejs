soysauce.accordions = function() {
	var accordions = new Array();

	function Accordion(obj) {
		this.id = $(obj).attr("ss-id");
		this.state = "closed";
		this.obj = $(obj);
		this.button = $(obj).find("> [ss-component='button']");
		this.content = $(obj).find("> [ss-component='content']");
		this.overlay = false;
		this.tab = false;
		this.animate = false;
		this.doAjax = false;
	}

	Accordion.prototype.open = function() {
		this.setState("open");
	};

	Accordion.prototype.close = function() {
		this.setState("closed");
	};

	Accordion.prototype.toggle = function() {
		(this.state != "open") ? this.open() : this.close();
	};

	Accordion.prototype.handleAjax = function() {
		var obj = this.obj;
		var content = this.content;
		var url = "";
		var callback;
		var self = this;

		this.button.click(function(e) {
			if (!self.doAjax) {
				self.toggle();
				soysauce.stifle(e);
				return;
			}

			stifle(e);
			self.setState("ajaxing");

			if(!obj.attr("ss-ajax-url")) {
				console.warn("Soysauce: 'ss-ajax-url' tag not found on accordion.");
				return;
			}

			if(!obj.attr("ss-ajax-callback")) {
				console.warn("Soysauce: 'ss-ajax-callback' tag not found on accordion.");
				return;
			}

			url = obj.attr("ss-ajax-url");
			callback = obj.attr("ss-ajax-callback");
			$.get(url, eval(callback));

			self.setAjaxComplete();
		});
	};

	Accordion.prototype.setState = function(state) {
		this.state = state;
		this.obj.attr("ss-state", state);
		this.button.attr("ss-state", state);
		this.content.attr("ss-state", state);
	};

	Accordion.prototype.setAjaxComplete = function() {
		this.doAjax = false;
	};

	// Initialize
	(function() {
		$("[ss-widget='accordion']").each(function() {
			var item = new Accordion(this);
			var options;

			if(!$(this).attr("ss-state"))
			item.close();

			$(this).find("> [ss-component='button']").append("<span class='icon'></span>");

			options = getOptions(this);

			if(options) {
				options.forEach(function(option) {
					switch(option) {
						case "ajax":
						item.doAjax = true;
						item.handleAjax();
						break;
						case "overlay":
						console.log("overlay TBI");
						break;
						case "tab":
						console.log("tab TBI");
						break;
						case "animate":
						console.log("animate TBI");
						break;
					}
				});
			}

			$(this).find("> [ss-component='button']").click(function() {
				item.toggle();
			});

			accordions.push(item);
		});
	})(); // end init

	return accordions;
};

soysauce.accordions();
