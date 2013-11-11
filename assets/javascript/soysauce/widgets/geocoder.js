soysauce.geocoder = (function() {
  var BASE_URL = "//jeocoder.herokuapp.com/zips/";
  var AOL_URL = "//www.mapquestapi.com/geocoding/v1/reverse?key=Fmjtd%7Cluub2l6tnu%2Ca5%3Do5-96tw0f";
  
  function Geocoder(selector) {
    var options = soysauce.getOptions(selector);
    var self = this;
    
    this.widget = $(selector);
    this.zip = this.widget.find("[data-ss-component='zip']");
    this.city = this.widget.find("[data-ss-component='city']");
    this.state = this.widget.find("[data-ss-component='state']");
    this.lastRequestedData;
    this.freeze = false;
    
    // Reverse Geocode Variables
    this.reverse = false;
    this.reverseGeocodeButton = this.widget.find("[data-ss-component='reverse-geocode']");
    
    if (options) options.forEach(function(option) {
      switch(option) {
        case "reverse":
          self.reverse = true;
          break;
      }
    });
    
    if (this.reverse) {
      this.reverseGeocodeButton.on("click", function() {
        self.reverseGeocode();
      });
    }
    else {
      this.zip.on("keyup change", function() {
        self.getLocationData();
      });
    }
  }
  
  Geocoder.prototype.reverseGeocode = function() {
    var self = this;
    
    if (!navigator.geolocation || this.freeze) return;
    
    self.widget.trigger("SSDataFetch");
    
    navigator.geolocation.getCurrentPosition(success, error, options);
    
    var options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    function success(data) {
      var src = AOL_URL + "&lat=" + data.coords.latitude + "&lng=" + data.coords.longitude + "&callback=soysauce.fetch(" + self.id + ").setLocationData";
      $("body").append("<script src='" + src + "'></script>");
    };

    function error(err) {
      console.warn("Soysauce (err " + err.code + ") could not fetch data: " + err.message);
      self.widget.trigger("SSDataError");
    };
  };
  
  Geocoder.prototype.setLocationData = function(data) {
    if (this.freeze) return;
    
    this.lastRequestedData = data;

    try {
      if (this.reverse) {
        var aolData = data.results[0].locations[0];
        
        this.widget.data("zip", aolData.postalCode);
        this.widget.data("city", aolData.adminArea5);
        this.widget.data("state", aolData.adminArea3);
      }
      else {
        this.widget.data("city", data.city);
        this.widget.data("state", data.state);
      }
      
      this.widget.trigger("SSDataReady");
    }
    catch(e) {
      console.warn("Soysauce: Unable to set location data. Try obtaining data from 'lastRequestedData' variable.");
    }
  };
  
  Geocoder.prototype.getLocationData = function() {
    var self = this;
    var value = this.zip[0].value;
    
    if (this.freeze) return;
    
    if ((value.length === 5) && (parseFloat(value, 10) == parseInt(value, 10)) && !isNaN(value))  {
      this.widget.trigger("SSDataFetch");
      $.ajax({
        dataType: "json",
        url: BASE_URL + value,
        success: function(data) {
          self.setLocationData(data);
        },
        error: function() {
          self.widget.trigger("SSDataError");
          console.warn("Soysauce: Could not fetch zip code " + value);
        }
      });
    }
  };
  
  Geocoder.prototype.handleFreeze = function() {
    this.freeze = true;
  };
  
  Geocoder.prototype.handleUnfreeze = function() {
    this.freeze = false;
  };
  
  return {
    init: function(selector) {
      return new Geocoder(selector);
    }
  };
  
})();
