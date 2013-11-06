soysauce.lazyloader = (function() {
  var THROTTLE = 100; // milliseconds
  var $window = $(window);
  var MIN_THRESHOLD = 1200;

  function Lazyloader(selector) {
    var options = soysauce.getOptions(selector);
    var self = this;

    // Base Variables
    this.widget = $(selector);
    this.items = this.widget.find("[data-ss-component='item']");
    this.threshold = parseInt(this.widget.attr("data-ss-threshold"), 10) || MIN_THRESHOLD;
    this.initialLoad = parseInt(this.widget.attr("data-ss-initial-load"), 10) || 10;
    this.initialBatchLoaded = false;
    this.batchSize = parseInt(this.widget.attr("data-ss-batch-size"), 10) || 5;
    this.processing = false;
    this.button = this.widget.find("[data-ss-component='button']");
    this.complete = (this.items.length) ? false : true;
    this.freeze = false;
    
    // Autoload Variables
    this.autoload = false;
    this.autoloadInterval = parseInt(this.widget.attr("data-ss-interval"), 10) || 1000;
    this.autoloadIntervalID = 0;
    
    // Cache Variables
    this.cache = false;
    this.cacheInput = $("[data-ss-component='cache']");
    this.isCached = false;
    
    // Hover Variables
    this.hover = false;

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
        case "hover":
          self.hover = true;
          self.autoload = true;
        break;
      }
    });
    
    if (this.cache) {
      var triggeredLoad = false;

      if (this.isCached) {
        this.widget.one("SSWidgetReady", function() {
          self.widget.trigger("SSLoadState");
          triggeredLoad = true;
        });
      }
      else {
        this.cacheInput.val(1);
      }

      $window.one("beforeunload unload pagehide", function(e) {
        triggeredLoad = false;
        self.widget.trigger("SSSaveState");
      });
      
      $window.on("pageshow", function(e) {
        if (!e.originalEvent.persisted || triggeredLoad) return;
        $(document).ready(function() {
          self.widget.trigger("SSLoadState");
        });
      });
    }
    
    this.processNextBatch(this.initialLoad);

    if (this.button.length) {
      this.button.on("click", function() {
        self.processNextBatch();
      });
    }

    if (this.autoload) {
      this.autoloadIntervalID = window.setInterval(function() {
        update();
      }, self.autoloadInterval);
    }
    
    function update() {
      var widgetPositionThreshold = self.widget.height() + self.widget.offset().top - self.threshold;
      var windowPosition = $window.scrollTop() + $window.height();
      
      if (windowPosition > widgetPositionThreshold) {
        self.widget.trigger("SSThreshold");
      }
    }
  };
  
  Lazyloader.prototype.processNextBatch = function(batchSize) {
    var batchSize = batchSize || this.batchSize,
      $items = $(this.items.splice(0, batchSize)),
      self = this,
      count = 0;
    
    if (this.processing || this.complete) return;
    
    this.processing = true;
    this.widget.trigger("SSBatchStart");
    
    if ($items.length === 0) {
      this.processing = false;
      this.complete = true;
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
            self.processing = false;
            self.widget.trigger("SSBatchLoaded");
            
            if (self.hover && self.items.length && self.initialBatchLoaded) {
              self.calcHoverThreshold();
            }
            
            if (!self.items.length) {
              self.complete = true;
              self.widget.trigger("SSItemsEmpty");
            }
            else if (!self.initialBatchLoaded) {
              self.initialBatchLoaded = true;
              if (self.hover) {
                self.calcHoverThreshold();
              }
            }
          }
        });
      });
    }
  };
  
  Lazyloader.prototype.calcHoverThreshold = function() {
    if (!this.hover || !this.items.length) return;
    this.threshold = this.widget.height() + this.widget.offset().top - this.items.first().offset().top;
    this.threshold = (this.threshold < MIN_THRESHOLD) ? MIN_THRESHOLD : this.threshold;
  };
  
  Lazyloader.prototype.reload = function(processBatch) {
    this.items = this.widget.find("[data-ss-component='item']:not([data-ss-state])");
    if (this.items.length) {
      this.complete = false;
      if (processBatch !== false) {
        this.processNextBatch();
      }
    }
  };
  
  Lazyloader.prototype.handleResize = function() {
    if (!this.hover) return;
    this.calcHoverThreshold();
  Lazyloader.prototype.handleFreeze = function() {
    if (this.freeze) return false;
    
    this.freeze = true;
    this.pauseAutoload();
    
    return true;
  };
  
  Lazyloader.prototype.handleUnfreeze = function() {
    if (!this.freeze) return false;
    
    this.freeze = false;
    this.startAutoload();
    
    return true;
  };
  
  return {
    init: function(selector) {
      return new Lazyloader(selector);
    }
  };
  
})();
