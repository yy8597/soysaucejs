soysauce.ajax = function(url, callback, forceAjax) {
  var result = false;
  var success = true;
  
  if (soysauce.browser.supportsSessionStorage && sessionStorage[url]) {
    try {
      result = JSON.parse(sessionStorage[url]);
      if (!forceAjax) {
        if (typeof(callback) === "function") {
          return callback(result, "success");
        }
        else {
          return result;
        }
      }
    }
    catch(e) {}
  }
  $.ajax({
    url: url,
    async: (!callback) ? false : true
  }).always(function(data, status, jqXHR) {
    try {
      var resultString = JSON.stringify(data);
      result = JSON.parse(resultString);
      if (jqXHR.getResponseHeader("Cache-Control") === "no-cache") {
        sessionStorage.setItem(url, resultString);
      }
    }
    catch(e) {
      if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
        console.warn("Soysauce: sessionStorage is full.");
      }
      else {
        console.log("error message: " + e.message);
        console.warn("Soysauce: error fetching url '" + url + "'. Data returned needs to be JSON.");
        result = false;
      }
    }
    if (typeof(callback) === "function") {
      return callback(result, status);
    }
  });
  return result;
};
