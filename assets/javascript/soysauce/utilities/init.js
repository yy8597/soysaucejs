(function(window, $, soysauce) {
  
  soysauce.init = function(selector, manual) {
    var set;
    var numItems = 0;
    var ret = false;
    var fastclickSelectors = "";

    fastclickSelectors = fastclickSelectors.concat(
      "[data-ss-widget='toggler'] > [data-ss-component='button']",
      ", [data-ss-component='button'][data-ss-toggler-id]",
      ", [data-ss-widget='carousel'] [data-ss-component='button']",
      ", [data-ss-widget='carousel'] [data-ss-component='dots']",
      ", [data-ss-utility='overlay'] [data-ss-component='close']"
    );
    
    $(fastclickSelectors).each(function() {
      try {
        soysauce.vars.fastclick.push(FastClick.attach(this));
      }
      catch(e) {
        console.warn("Soysauce: Could not attach Fastclick listener on soysauce component. " + e.message);
      }
    });

    if (!selector) {
      set = $("[data-ss-widget]:not([data-ss-id]), [data-ss-component='button'][data-ss-toggler-id]");
    }
    else {
      set = $(selector);
    }

    if ((!$(selector) && !set) || $(selector).attr("data-ss-id") !== undefined) return ret;

    numItems = set.length;

    set.each(function(i) {
      var $this = $(this);
      var type = $(this).attr("data-ss-widget");
      var widget;
      var orphan = false;

      if (!type && $this.attr("data-ss-toggler-id") !== undefined) {
        type = "toggler";
        orphan = true;
      }

      if (!manual && /manual/.test($this.attr("data-ss-init"))) {
        return;
      }

      $this.attr("data-ss-id", ++soysauce.vars.idCount);

      switch (type) {
        case "toggler":
          widget = soysauce.togglers.init(this, orphan);
          break;
        case "carousel":
          widget = soysauce.carousels.init(this);
          break;
        case "lazyloader":
          widget = soysauce.lazyloader.init(this);
          break;
        case "autofill-zip":
          console.warn("Soysauce: autofill-zip is now deprecated. Please set data-ss-widget to 'geocoder'");
        case "geocoder":
          widget = soysauce.geocoder.init(this);
          break;
        case "autodetect-cc":
          widget = soysauce.autodetectCC.init(this);
          break;
        case "autosuggest":
          widget = soysauce.autosuggest.init(this);
          break;
        case "input-clear":
          widget = soysauce.inputClear.init(this);
          break;
      }

      if (widget !== undefined) {
        widget.type = type;
        widget.id = soysauce.vars.idCount;
        soysauce.widgets.push(widget);
        ret = true;
        if ($this.attr("data-ss-defer") !== undefined) {
          widget.defer = true;
        }
        else {
          $this.imagesLoaded(function() {
            widget.initialized = true;
            $this.trigger("SSWidgetReady");
          });
        }
      }
      else {
        $this.removeAttr("data-ss-id");
        --soysauce.vars.idCount;
      }
    });

    return ret;
  };
  
  // Widget Initialization
  $(document).ready(function() {
    soysauce.init();
    if (soysauce.vars.degradeAll) {
      $("body").attr("data-ss-degrade", "true");
    }
    soysauce.widgets.forEach(function(obj) {
      if (!obj.defer) return;
      var deferCount = 0;
      var innerWidgets = obj.widget.find("[data-ss-widget]");
      innerWidgets.each(function() {
        var widget = soysauce.fetch(this);
        if (widget.initialized) {
          if (++deferCount === innerWidgets.length) {
            $(obj.widget).trigger("SSWidgetReady").removeAttr("data-ss-defer");
            return;
          }
        }
        else {
          widget.widget.on("SSWidgetReady", function() {
            if (++deferCount === innerWidgets.length) {
              $(obj.widget).trigger("SSWidgetReady").removeAttr("data-ss-defer");
            }
          });
        }
      });
    });
    // Set HammerJS Options
    try {
      Hammer.gestures.Swipe.defaults.swipe_velocity = 0.7;
      Hammer.gestures.Drag.defaults.drag_min_distance = 1;
      Hammer.gestures.Drag.defaults.drag_lock_min_distance = 1;
      Hammer.gestures.Drag.defaults.drag_lock_to_axis = true;
    }
    catch(e) {
      console.warn("Soysauce: Error setting options with HammerJS");
      console.error(e);
    }

    $(window).trigger("SSReady");
  });
  
})(window, $, soysauce, null);
