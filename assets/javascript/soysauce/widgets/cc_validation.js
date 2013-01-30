soysauce.ccValidation = (function() {
	$("body").on("keyup", "[data-ss-widget='cc_validation']", function(e) {
		var card_num = e.target.value.replace(/-/g, "");
		
		// Stage 1
		if(card_num.length === 1 || $(".cardContainer .fade").length === 0) {
			if(card_num.match(/^4/))
				$(".cardContainer span:not(.visa)").addClass("fade");
			else if(card_num.match(/^5/))
				$(".cardContainer span:not(.mc)").addClass("fade");
			else if(card_num.match(/^3/))
				$(".cardContainer span:not(.amex,.dc)").addClass("fade");
			else if(card_num.match(/^6(?:011|5[0-9]{2})/))
				$(".cardContainer span:not(.disc)").addClass("fade");
			else if(card_num.match(/^(?:2131|1800|35\d{3})/))
				$(".cardContainer span:not(.jcb)").addClass("fade");
			else
				$(".cardContainer span").addClass("fade");
		}
		else if(card_num.length === 0)
			$(".cardContainer span").removeClass("fade");
		
		// Stage 2
		if(card_num.match(/^4[0-9]{12}(?:[0-9]{3})?$/))
			$(e.target).attr("ss-state", "visa");
		else if(card_num.match(/^5[1-5][0-9]{14}$/))
			$(e.target).attr("ss-state", "mastercard")
		else if(card_num.match(/^3[47][0-9]{13}$/))
			$(e.target).attr("ss-state", "amex")
		else if(card_num.match(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/))
			$(e.target).attr("ss-state", "dinersclub")
		else if(card_num.match(/^6(?:011|5[0-9]{2})[0-9]{12}$/))
			$(e.target).attr("ss-state", "discover")
		else if(card_num.match(/^(?:2131|1800|35\d{3})\d{11}$/))
			$(e.target).attr("ss-state", "jcb")
		else
			$(e.target).attr("ss-state", "undefined");
	});
})();
