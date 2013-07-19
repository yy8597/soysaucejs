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
      var resultString = result = JSON.stringify(data);
      result = JSON.parse(result);
      if (soysauce.browserInfo.supportsSessionStorage) {
        sessionStorage.setItem(url, resultString);
      }
    }
    catch(e) {
      console.warn("Soysauce: error fetching url '" + url + "'. Data returned needs to be JSON.");
      result = false;
    }
  }).fail(function(data) {
    console.warn("Soysauce: " + data.status + " " + data.statusText);
  });
  return result;
};
