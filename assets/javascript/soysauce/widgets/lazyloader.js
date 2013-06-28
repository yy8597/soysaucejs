soysauce.lazyloader = (function() {
	var THROTTLE = 100; // milliseconds
	
	function Lazyloader(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.widget = $(selector);
		this.items = this.widget.find("[data-ss-component='item']");
		this.threshold = parseInt(this.widget.attr("data-ss-threshold"), 10) || 300;
		this.timeStamp = 0; // for throttling
		this.initialLoad = parseInt(this.widget.attr("data-ss-initial-load"), 10) || 10;
		this.initialBatchLoaded = false;
		this.batchSize = parseInt(this.widget.attr("data-ss-batch-size"), 10) || 5;
		this.autoload = false;
		this.button = this.widget.find("[data-ss-component='button']");
		this.cache = false;
		this.cacheInput = $("[data-ss-component='cache']");
		this.isCached = false;
		this.processing = false;
		
		if (options) options.forEach(function(option) {
			switch(option) {
				case "autoload":
				  self.autoload = true;
					break;
				case "cache":
				  if (!self.cacheInput.length) {
				    console.warn("Soysauce: Cache input not found.");
				  }
				  else {
				    self.cache = true;
				    self.isCached = (parseInt(self.cacheInput.val(), 10) === 1) ? true : false;
				  }
				  break;
			}
		});
		
		if (this.cache) {
		  if (this.isCached) {
		    this.widget.one("SSWidgetReady", function() {
          self.widget.trigger("SSLoadState");
        });
		  }
		  else {
        this.cacheInput.val(1);
		  }
		  $(window).on("beforeunload", function() {
		    self.widget.trigger("SSSaveState");
		  });
		}
		
		this.processNextBatch(this.initialLoad);
		
		if (this.button.length) {
		  this.button.on("click", function() {
		    self.processNextBatch();
		  });
		}
		
		if (this.autoload) {
		  $(window).scroll(function(e) {
        update(e, self);
      });
		}
		
    function update(e, context) {
      if ((e.timeStamp - self.timeStamp) > THROTTLE) {
        var widgetPositionThreshold = context.widget.height() + context.widget.offset().top - context.threshold,
            windowPosition = $(window).scrollTop() + $(window).height();
        self.timeStamp = e.timeStamp;
        
        if ((windowPosition > widgetPositionThreshold) && Math.abs(e.timeStamp - soysauce.browserInfo.pageLoad) > 1500) {
          self.processNextBatch();
        }
      }
    }
	};
	
	Lazyloader.prototype.processNextBatch = function(batchSize) {
	  var batchSize = batchSize || this.batchSize,
	      $items = $(this.items.splice(0, batchSize)),
	      self = this,
	      count = 0;
	      
    this.widget.trigger("SSBatchStart");
    this.processing = true;
    if ($items.length === 0) {
      this.processing = false;
      this.widget.trigger("SSItemsEmpty");
    }
    else {
      $items.each(function(i, item) {
        var $item = $(item);
        $item.find("[data-ss-ll-src]").each(function() {
          soysauce.lateload(this);
        });
        $item.imagesLoaded(function(e) {
          $item.attr("data-ss-state", "loaded");
          if (++count === $items.length) {
            self.widget.trigger("SSBatchLoaded");
            self.processing = false;
            if (!self.items.length) {
              self.widget.trigger("SSItemsEmpty");
            }
            else if (!self.initialBatchLoaded){
              self.initialBatchLoaded = true;
            }
          }
        });
      });
    }
	};
	
	Lazyloader.prototype.reload = function(processBatch) {
	  this.items = this.widget.find("[data-ss-component='item']:not([data-ss-state])");
	  if (processBatch !== false) {
	    this.processNextBatch();
	  }
	};
	
	return {
		init: function(selector) {
			return new Lazyloader(selector);
		}
	};
	
})();
