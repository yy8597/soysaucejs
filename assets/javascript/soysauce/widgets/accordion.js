soysauce.accordions = function() {
	var accordions = new Array();
	accordion_groups = new Array();

	function Accordion(obj) {
		this.id = $(obj).attr("ss-id");
		this.state = "closed";
		this.obj = $(obj);
		this.button = $(obj).find("> [ss-component='button']");
		this.content = $(obj).find("> [ss-component='content']");
		this.overlay = false;
		this.tab = false;
		this.slide = false;
		this.doAjax = false;
		this.height = 0;
		this.hasAccordions = false;
		this.tabID = 0;
	}

	Accordion.prototype.open = function() {
		if(this.tab) {
			accordion_groups[this.tabID - 1].forEach(function(e) {
				e.close(false);
			});
		}
		if (this.overlay) 
			soysauce.overlay("on");
		if (this.slide) {
			this.content.css("height", this.height + "px");
		}
		this.setState("open");
	};

	Accordion.prototype.close = function(closeOverlay) {
		if (this.overlay && (closeOverlay === undefined) ? true : closeOverlay) 
			soysauce.overlay("off");
		if (this.slide)
			this.content.css("height", "0px");
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

			soysauce.stifle(e);
			self.setState("ajaxing");

			if(!obj.attr("ss-ajax-url")) {
				console.warn("Soysauce: 'ss-ajax-url' tag required. Must be on the same domain.");
				return;
			}

			if(!obj.attr("ss-ajax-callback")) {
				console.warn("Soysauce: 'ss-ajax-callback' tag required.");
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
		var tabID = 1;
		var group;
		$("[ss-widget='accordion']").each(function() {
			var item = new Accordion(this);
			var self = this;
			var options;

			if(!$(this).attr("ss-state"))
			item.close();

			$(this).find("> [ss-component='button']").append("<span class='icon'></span>");

			item.hasAccordions = ($(this).has("[ss-widget='accordion']").length > 0) ? true : false; 

			options = soysauce.getOptions(this);

			if(options) {
				options.forEach(function(option) {
					switch(option) {
						case "ajax":
							item.doAjax = true;
							item.handleAjax();
							break;
						case "overlay":
							item.overlay = true;
							break;
						case "tab":
							item.tab = true;
							if (!$(self).attr("ss-tab-id")) {
								var siblings = $(self).find("~ [ss-options*='tab']");
								var group_name = "group"
								group = new Array();
								item.tabID = tabID;
								$(self).attr("ss-tab-id", tabID);
								siblings.attr("ss-tab-id", tabID);
								group.push(item);
								accordion_groups.push(group);
								tabID++;
							} else {
								item.tabID = $(self).attr("ss-tab-id");
								accordion_groups[item.tabID - 1].push(item);
							}
							
							break;
						case "slide":
							item.slide = true;
							item.height = item.content.height();
							item.content.css("height", "0px");
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
