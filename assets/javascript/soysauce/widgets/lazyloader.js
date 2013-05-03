soysauce.lazyloader = (function() {
	var THROTTLE = 100; // milliseconds
	
	function Lazyloader(selector) {
		var options = soysauce.getOptions(selector);
		var self = this;
		
		this.type = "Lazyloader";
		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.items = this.widget.find("[data-ss-component='item']");
		this.threshold = parseInt(this.widget.attr("data-ss-threshold")) || 100;
		this.timeStamp = 0; // for throttling
		this.initialLoad = parseInt(this.widget.attr("data-ss-initial-load")) || 10;
		this.batchSize = parseInt(this.widget.attr("data-ss-batch-size")) || 5;
		
		this.processNextBatch(this.initialLoad);
		
    $(window).scroll(function(e) {
      update(e, self);
    });
		
    function update(e, context) {
      if ((e.timeStamp - self.timeStamp) > THROTTLE) {
        var widgetPositionThreshold = context.widget.height() + context.widget.offset().top - context.threshold,
            windowPosition = $(window).scrollTop() + $(window).height();
        if (!self.items.length) {
          $(window).unbind("scroll", update);
          return;
        }
        self.timeStamp = e.timeStamp;
        if (windowPosition > widgetPositionThreshold) {
          self.widget.trigger("SSBatchStart");
          self.processNextBatch();
        }
      }
    }
	};
	
	Lazyloader.prototype.processNextBatch = function(batchSize) {
	  var $items = $(this.items.splice(0, batchSize || this.batchSize)),
	      self = this,
	      count = 0;

    $items.each(function(i, item) {
      var $item = $(item);
      $item.find("[data-ss-ll-src]").each(function() {
        soysauce.lateload(this);
      });
      $item.imagesLoaded(function(e) {
        $item.attr("data-ss-state", "loaded");
        if (++count === $items.length) {
          self.widget.trigger("SSBatchLoaded");
        }
      });
    });
	};
	
	return {
		init: function(selector) {
			return new Lazyloader(selector);
		}
	};
	
})();
