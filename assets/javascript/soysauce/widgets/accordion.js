soysauce.accordions = function() {
	var accordions = new Array();
	accordionTabGroups = new Array();

	function AccordionTabGroup(id) {
		this.accordions = new Array();
		this.groupid = id;
		this.currOpen;
	}
	
	AccordionTabGroup.prototype.setCurrOpen = function(selector) {
		this.currOpen = selector;
	}
	
	AccordionTabGroup.prototype.addAccordion = function(selector) {
		if (selector === undefined || !typeof(Accordion)) return false;
		this.accordions.push(selector);
	}
	
	AccordionTabGroup.prototype.getCurrOpen = function() {
		return this.currOpen;
	}
	
	AccordionTabGroup.prototype.getAccordions = function() {
		return this.accordions
	}
	
	AccordionTabGroup.prototype.getID = function() {
		return this.groupid;
	}

	function Accordion(obj) {
		this.id = $(obj).attr("ss-id");
		this.parentID = 0;
		this.tabID = 0;
		this.state = "closed";
		this.obj = $(obj);
		this.button = $(obj).find("> [ss-component='button']");
		this.content = $(obj).find("> [ss-component='content']");
		this.overlay = false;
		this.tab = false;
		this.slide = false;
		this.doAjax = false;
		this.height = 0;
		this.isChildAccordion = false;
		this.hasAccordions = false;
		this.childTabOpen = false;
		this.tabGroup = undefined;
		this.parent = undefined;
	}

	Accordion.prototype.open = function() {
		var self = this;
		var prevHeight = 0;
		if (this.tab) {
			if(this.tabGroup.getCurrOpen() !== undefined) {
				prevHeight = this.tabGroup.getCurrOpen().height;
				this.tabGroup.getCurrOpen().close();
			}
			this.tabGroup.setCurrOpen(self);
		}
		if (this.overlay) 
			soysauce.overlay("on");
		if (this.slide) {
			if (this.parent === undefined) this.parent = soysauce.fetch(this.parentID);
			if (this.isChildAccordion && this.parent.slide) {
				if (this.tab) {
					if (!this.parent.childTabOpen) {
						this.parent.addHeight(this.height);
						this.parent.childTabOpen = true;
					}
					else {
						var offset = this.height - prevHeight;
						this.parent.addHeight(offset);
					}
				}
				else this.parent.addHeight(this.height);
			}
			this.content.css("height", this.height + "px");
		}
		this.setState("open");
	};

	Accordion.prototype.close = function(closeOverlay) {
		var self = this;
		if (this.overlay && (closeOverlay === undefined) ? true : closeOverlay) 
			soysauce.overlay("off");
		if (this.slide) {
			if (this.parent === undefined) this.parent = soysauce.fetch(this.parentID);
			if (this.isChildAccordion && this.parent.slide) {
				if (!this.tab) this.parent.addHeight(-this.height);
			}
			this.content.css("height", "0px");
		}
		if (this.tab) {
			var currTabOpen;
			currTabOpen = this.tabGroup.getCurrOpen();
			if (currTabOpen !== undefined && currTabOpen.id == self.id) this.tabGroup.setCurrOpen(undefined);	
		}
		this.setState("closed");
	};

	Accordion.prototype.addHeight = function(height) {
		if (!height===+height || !height===(height|0)) return;
		this.height += height;
		this.height = (this.height < 0) ? 0 : this.height;
		this.content.css("height", this.height + "px");
	};

	Accordion.prototype.setHeight = function(height) {
		if (!height===+height || !height===(height|0)) return;
		this.height = height;
		this.height = (this.height < 0) ? 0 : this.height;
		this.content.css("height", height + "px");
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
				console.warn("Soysauce: 'ss-ajax-callback' tag not found on accordion.");
				return;
			}
			
			url = obj.attr("ss-ajax-url");
			callback = obj.attr("ss-ajax-callback");
			
			if (soysauce.browserInfo["supportsSessionStorage"]) {
				if (sessionStorage.getItem(url) === null)
					$.get(url, function(data) {
						sessionStorage.setItem(url, JSON.stringify(data));
						eval(callback + "(" + JSON.stringify(data) + ")");
					});
				else
					eval(callback + "(" + sessionStorage.getItem(url) + ")");
			}
			else
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

			$(this).find("> [ss-component='button']").append("<span class='icon'></span>");

			item.hasAccordions = ($(this).has("[ss-widget='accordion']").length > 0) ? true : false; 
			item.isChildAccordion = ($(this).parents("[ss-widget='accordion']").length > 0) ? true : false;
			item.parentID = $(this).parents("[ss-widget='accordion']").attr("ss-id");
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
								group = new AccordionTabGroup(tabID);
								item.tabID = tabID;
								$(self).attr("ss-tab-id", tabID);
								siblings.attr("ss-tab-id", tabID);
								item.tabGroup = group;
								group.addAccordion(item);
								accordionTabGroups.push(group);
								tabID++;
							} else {
								item.tabID = $(self).attr("ss-tab-id");
								accordionTabGroups.forEach(function(e) {
									if (e.groupid == item.tabID) {
										item.tabGroup = e;
										e.addAccordion(item);
									}
								});
							}
							
							break;
						case "slide":
							item.slide = true;
							
							if (item.hasAccordions) {
								var height = 0;
								item.content.find("[ss-component='button']").each(function() {
									height += $(this).height();
								});
								item.height = height;
							}
							else
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

soysauce.accordions = soysauce.accordions();

soysauce.accordions.forEach(function(e) {
	if (e.state == "closed") e.setState("closed");
	if (e.state == "closed" && e.slide) e.content.css("height", "0px");
});
