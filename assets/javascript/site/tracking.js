$(document).ready(function() {
  // Home
  $(".home").each(function() {
    // Track Demo Click
    $(".proceed button").on("click", function() {
      _gaq.push(["_trackEvent", "Home", "Click", "How To Demo"]);
    });
  });
  
  // Widgets
  $(".widgets").each(function() {
    // Track Widget API Navigation Click
    var basics = 0,
        carousel = 1,
        toggler = 2,
        lazyloader = 3
        autodetectCC = 4,
        autofillZip = 5;
    
    var navButtons = $(".api aside li");
    
    navButtons.on("click", function() {
      var type = "";
      
      switch (navButtons.index(this)) {
        case basics:
          type = "Basics";
          break;
        case carousel:
          type = "Carousel";
          break;
        case toggler:
          type = "Toggler";
          break;
        case lazyloader:
          type = "Lazyloader"
          break;
        case autodetectCC:
          type = "Autodetect CC";
          break;
        case autofillZip:
          type = "Autofill Zip";
          break;
      }
      
      _gaq.push(["_trackEvent", "Widgets", "Click", type]);
    });
    
  });
  
});
