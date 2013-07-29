soysauce.ajax = function(url, forceAjax) {
  var result = false;
  if (soysauce.browserInfo.supportsSessionStorage && sessionStorage[url]) {
    try {
      result = JSON.parse(sessionStorage[url]);
      if (!forceAjax) return result;
    }
    catch(e) {}
  }
  $.ajax({
    url: url,
    async: false
  }).success(function(data) {
    try {
      var resultString = JSON.stringify(data);
      result = JSON.parse(resultString);
      sessionStorage.setItem(url, resultString);
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
  }).fail(function(data) {
    console.warn("Soysauce: error fetching url '" + url + "'. Message: " + data.status + " " + data.statusText);
  });
  return result;
};