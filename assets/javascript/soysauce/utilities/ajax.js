soysauce.ajax = function(url) {
  var result = false;
  if (soysauce.browserInfo.supportsSessionStorage && sessionStorage[url]) {
    try {
      result = JSON.parse(sessionStorage[url]);
      return result;
    }
    catch(e) {}
  }
  $.ajax({
    url: url,
    type: "GET",
    async: false
  }).success(function(data) {
    try {
      var resultString = JSON.stringify(data);
      result = JSON.parse(resultString);
      if (soysauce.browserInfo.supportsSessionStorage) {
        sessionStorage.setItem(url, resultString);
      }
    }
    catch(e) {
      console.warn("Soysauce: error fetching url '" + url + "'. Data returned needs to be JSON.");
      result = false;
    }
  }).fail(function(data) {
    console.warn("Soysauce: error fetching url '" + url + "'. Message: " + data.status + " " + data.statusText);
  });
  return result;
};
