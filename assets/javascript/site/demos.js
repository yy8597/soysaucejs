$(document).ready(function() {
  $(".demos").each(function() {
    $(".autodetect-cc").each(function() {
      var widget = soysauce.fetch("#cc-input");
      var prediction = $("#prediction");
      var result = $("#result");
      var ccInput = $("#cc-input");
      var cardElements = $(".cards li");

      ccInput.on("SSPrediction", function() {
        prediction.html(widget.prediction);

        if (widget.prediction !== undefined) {
          cardElements.each(function(i, card) {
            var cards = widget.prediction.split(" ");
            var setInactive = true;

            cards.forEach(function(name) {
              if ($(card).hasClass(name)) {
                setInactive = false;
              }
            });

            if (setInactive) {
              $(card).addClass("inactive");
            }
            else {
              $(card).removeClass("inactive");
            }
          });
        } 
        else {
          prediction.html("unknown type");
          cardElements.addClass("inactive");
        }
      });

      ccInput.on("SSResult", function() {
        if (!widget.result) {
          result.html("invalid card");
        }
        else {
          result.html(widget.result);
        }
        $(".cards li:not(." + widget.result + ")").addClass("inactive");
        $(".cards li." + widget.result).removeClass("inactive");
      });

      ccInput.on("keyup change", function() {
        if (ccInput.val() === "") {
          prediction.html("");
          result.html("");
          cardElements.removeClass("inactive");
        }
      });
    });
    $(".reverseGeocode").each(function() {
      var input = soysauce.fetch(".reverseGeocode [data-ss-widget='autofill-zip']");

      input.widget.on("SSDataFetch", function() {
        showLoader(input);
      });

      input.widget.on("SSDataReady SSDataError", function() {
        hideLoader(input);
      });

      function showLoader(widget) {
        widget.zip.find("+ img").show();
      }

      function hideLoader(widget) {
        widget.zip.find("+ img").hide();
      }
    });
  });
});
