(function(window, $, soysauce) {
  $(window).on("resize", function(e) {
    if (soysauce.vars.lastResizeID) clearTimeout(soysauce.vars.lastResizeID);
    soysauce.vars.lastResizeID = window.setTimeout(function() {
      soysauce.vars.lastResizeTime = e.timeStamp;
      soysauce.widgets.forEach(function(widget) {
        if (!widget.handleResize) return;
        widget.handleResize();
        if (/carousel/i.test(widget.type)) {
          if (widget.itemWidth) {
            $(widget.widget).trigger("SSWidgetResized");
          }
        }
        else {
          $(widget.widget).trigger("SSWidgetResized");
        }
      });
    }, 30);
  });
})(window, $, soysauce, null);
