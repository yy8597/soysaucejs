soysauce.ajax = function(url, callback, forceAjax) {
  var result = false;
  if (soysauce.browser.supportsSessionStorage && sessionStorage[url]) {
    try {
      result = JSON.parse(sessionStorage[url]);
      if (!forceAjax) return result;
    }
    catch(e) {}
  }
  $.ajax({
    url: url,
    async: (!callback) ? false : true
  }).success(function(data, status, jqXHR) {
    try {
      var resultString = JSON.stringify(data);
      result = JSON.parse(resultString);
      if (!jqXHR.getResponseHeader("Cache-Control")) {
        sessionStorage.setItem(url, resultString);
      }
    }
    catch(e) {
      if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
        console.warn("Soysauce: sessionStorage is full.");
      }
      else {
        console.warn("Soysauce: error fetching url '" + url + "'. Data returned needs to be JSON.");
        result = false;
      }
    }
    if (typeof(callback) === "function") {
      callback(data);
    }
  }).fail(function(data) {
    console.warn("Soysauce: error fetching url '" + url + "'. Message: " + data.status + " " + data.statusText);
  });
  return result;
};
