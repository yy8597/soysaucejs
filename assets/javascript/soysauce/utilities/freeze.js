soysauce.freezeChildren = function(selector) {
  var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
  children.each(function(index, child) {
    var id = $(child).attr("data-ss-id");
    soysauce.freeze(id, false);
  });
};

soysauce.freeze = function(selector, freezeChildren) {
  if (typeof(selector) === "object") {
    selector = selector.id || parseInt($(selector).attr("data-ss-id"), 10);
  }
  freezeChildren = (!freezeChildren) ? true : false;
  soysauce.fetch(selector).handleFreeze();
  if (freezeChildren) {
    soysauce.freezeChildren(selector);
  }
};

soysauce.unfreeze = function(selector) {
  if (typeof(selector) === "object") {
    selector = selector.id || parseInt($(selector).attr("data-ss-id"), 10);
  }
  var children = $("[data-ss-id='" + selector + "']").find("[data-ss-widget]");
  soysauce.fetch(selector).handleUnfreeze();
  children.each(function(index, child) {
    var id = $(child).attr("data-ss-id");
    soysauce.fetch(id).handleUnfreeze();
  });
};

soysauce.freezeAll = function() {
  try {
    soysauce.widgets.forEach(function(widget) {
      widget.handleFreeze();
    });
  }
  catch(e) {
    console.warn("Soysauce: Could not freeze all widgets. || Error Message: ", e.message);
    return false;
  }
  return true;
};

soysauce.unfreezeAll = function() {
  try {
    soysauce.widgets.forEach(function(widget) {
      widget.handleUnfreeze();
    });
  }
  catch(e) {
    console.warn("Soysauce: Could not unfreeze all widgets. || Error Message: ", e.message);
    return false;
  }
  return true;
};