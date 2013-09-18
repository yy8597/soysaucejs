soysauce.overlay = (function() {
  var overlay, content, caption;
  var init = true;
  var isOn = false;

  return {
    init: function(selector) {
      document.addEventListener("DOMContentLoaded", function() {
        var div = document.createElement("div");

        if (!init) return false;

        div.setAttribute("data-ss-utility", "overlay");
        div.setAttribute("data-ss-state", "inactive");
        document.body.appendChild(div);

        overlay = $("[data-ss-utility='overlay']");

        overlay.append("<span data-ss-component='close'>close</span>");
        close = overlay.find("[data-ss-component='close']");
        
        overlay.append("<div data-ss-component='content'></div>");
        content = overlay.find("[data-ss-component='content']");

        close.on("click", function() {
          soysauce.overlay.off();
        });

        init = false;
      });
    },
    on: function(css) {
      if (isOn) return;
      overlay.show();
      window.setTimeout(function() {
        if (css) {
          try {
            JSON.stringify(css);
            overlay.css(css);
          }
          catch(e) {
            console.warn("Soysauce: Could not attach css; need to pass JSON css object");
          }
        }
        overlay.attr("data-ss-state","active");
        isOn = true;
      }, 0);
    },
    off: function() {
      if (!isOn) return;
      overlay.attr("data-ss-state","inactive").removeAttr("style");
      overlay.hide();
    },
    toggle: function() {
      if (isOn) {
        soysauce.overlay.off();
      }
      else {
        soysauce.overlay.on();
      }
    },
    getState: function() {
      return isOn ? "on" : "off";
    }
  };

})();

soysauce.overlay.init();