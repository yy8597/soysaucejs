soysauce.inputClear = (function() {
  
  function inputClear(selector) {
    var options = soysauce.getOptions(selector),
        self = this,
        iconFocus = false;
    
    this.widget = $(selector);
    this.icon;
    
    this.widget.on("focus keyup", function() {
      self.handleIcon();
    });
    
    this.widget.on("blur", function() {
      if (iconFocus) return;
      self.widget.attr("data-ss-clear", "off");
    });
    
    this.widget.wrap("<div data-ss-component='input-wrapper'></div>");
    
    this.widget.parent().css({
      "display": self.widget.css("display"),
      "width": self.widget.css("width")
    });
    
    this.widget.attr("data-ss-clear", "off");
    this.widget.after("<span data-ss-component='icon'></span>");
    
    this.icon = this.widget.find("+ [data-ss-component='icon']");
    
    this.icon.on("mousedown touchstart", function() {
      iconFocus = true;
      self.icon.one("mouseup touchend", function() {
        self.clear();
        iconFocus = false;
      });
    });
  }

  inputClear.prototype.clear = function() {
    this.widget.val("").attr("data-ss-clear", "off");
    this.widget.trigger("SSEmpty");
  };

  inputClear.prototype.handleIcon = function() {
    this.widget.attr("data-ss-clear", (!this.widget.val().length) ? "off" : "on");
  };

  return {
    init: function(selector) {
      return new inputClear(selector);
    }
  };

})();
