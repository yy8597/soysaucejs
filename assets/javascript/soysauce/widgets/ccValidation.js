soysauce.ccValidation = (function() {
	$("body").on("keyup", "[ss-widget='ccValidation']", function(e) {
		var card_num = e.target.value.replace(/-/g, "");

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
