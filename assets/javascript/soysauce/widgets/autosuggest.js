soysauce.autosuggest = (function() {

	function AutoSuggest(selector) {
		var options = soysauce.getOptions(selector);
		console.log('ac options', options);
		var self = this;

		this.widget = $(selector);
		this.id = parseInt(this.widget.attr("data-ss-id"));
		this.input = $(selector);
		
		
		this.context = window; // Perhaps later we'll want to change the context

		if (options)
			options.forEach(function(option) {
				switch (option) {
					case "option1":
						break;
				}
			});

		var defaults = {  
			url: 'http://joey.jan.speedousa.dev.becho.me/static/searchTerms.json',
			data: undefined,
			minCharacters: 1,
			maxResults: 10,
			wildCard: '',
			caseSensitive: false,
			notCharacter: '!',
			maxHeight: 350,
			highlightMatches: true,
			onSelect: undefined,
			width: undefined,
			property: 'text'
		};
		this.acSettings = defaults//$.extend(defaults, options);  
		
		
		this.obj = $(selector);
		this.wildCardPatt = new RegExp(self.regexEscape(this.acSettings.wildCard || ''),'g')
		this.results = $('<ul />');
		this.currentSelection = undefined;
		this.pageX =undefined;
		this.pageY =undefined;
		this.getJSONTimeout = 0;
		
		
		
		
		// Prepare the input box to show suggest results by adding in the events
		// that will initiate the search and placing the element on the page
		// that will show the results.
		$(this.results).addClass('jsonSuggest ui-autocomplete ui-menu ui-widget ui-widget-content ui-corner-all').
			attr('role', 'listbox').
			css({
				'xtop': (this.obj.position().top + this.obj.outerHeight()) + 'px',
				'xleft': this.obj.position().left + 'px',
				'width': this.acSettings.width || (this.obj.outerWidth() + 'px'),
				'z-index': 1000000,
				'position':'absolute',
				'background-color': 'black'
			}).hide();
		
		
		this.obj.after(this.results).
			keyup(function (e){
				console.log('ac key: ' + e.keyCode);
				switch (e.keyCode) {
					case 13: // return key
						$(self.currentSelection).trigger('click');
						return false;
					case 40: // down key
						if (typeof self.currentSelection === 'undefined') {
							self.currentSelection = $('li:first', self.results).get(0);
						}
						else {
							self.currentSelection = $(self.currentSelection).next().get(0);
						}

						self.setHoverClass(self.currentSelection);
						if (self.currentSelection) {
							$(self.results).scrollTop(self.currentSelection.offsetTop);
						}

						return false;
					case 38: // up key
						if (typeof self.currentSelection === 'undefined') {
							self.currentSelection = $('li:last', self.results).get(0);
						}
						else {
							self.currentSelection = $(self.currentSelection).prev().get(0);
						}

						self.setHoverClass(self.currentSelection);
						if (self.currentSelection) {
							$(self.results).scrollTop(self.currentSelection.offsetTop);
						}

						return false;
					default:
						self.runSuggest.apply(this, [e, self]);
				}
			}).
			keydown(function(e) {
				// for tab/enter key
				if ((e.keyCode === 9 || e.keyCode === 13) && self.currentSelection) {
					$(self.currentSelection).trigger('click');
					return true;
				}
			}).
			blur(function(e) {
				// We need to make sure we don't hide the result set
				// if the input blur event is called because of clicking on
				// a result item.
				var resPos = $(self.results).offset();
				resPos.bottom = resPos.top + $(self.results).height();
				resPos.right = resPos.left + $(self.results).width();

				if (pageY < resPos.top || pageY > resPos.bottom || pageX < resPos.left || pageX > resPos.right) {
					$(this.results).hide();
				}
			}).
			focus(function(e) {
				$(this.results).css({
					'top': (self.obj.position().top + self.obj.outerHeight()) + 'px',
					'left': self.obj.position().left + 'px'
				});

				if ($('li', self.results).length > 0) {
					$(self.results).show();
				}
			}).
			attr('autocomplete', 'off');
		
		
		$(window).mousemove(function(e) {
			this.pageX = e.pageX;
			this.pageY = e.pageY;
		});
		
		
		// Escape the not character if present so that it doesn't act in the regular expression
		this.acSettings.notCharacter = self.regexEscape(this.acSettings.notCharacter || '');

		// Make sure the JSON data is a JavaScript object if given as a string.
		if (this.acSettings.data && typeof this.acSettings.data === 'string') {
			this.acSettings.data = $.parseJSON(this.acSettings.data);
		}
		
		$(this.obj).trigger("SSLoaded");
	};

	AutoSuggest.prototype.handleResize = function() {
		// Placeholder - required soysauce function
	};
	
	/**
	* Escape some text so that it can be used inside a regular expression
	* without implying regular expression rules iself. 
	*/
	AutoSuggest.prototype.regexEscape = function(txt, omit) {
		var specials = ['/', '.', '*', '+', '?', '|',
						'(', ')', '[', ']', '{', '}', '\\'];

		if (omit) {
			for (var i = 0; i < specials.length; i++) {
				if (specials[i] === omit) { specials.splice(i,1); }
			}
		}

		var escapePatt = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
		return txt.replace(escapePatt, '\\$1');
	}
	
	/**
	* When an item has been selected then update the input box,
	* hide the results again and if set, call the onSelect function.
	*/
	AutoSuggest.prototype.selectResultItem = function(item) {
		this.obj.val(item[this.acSettings.property]);
		$(this.obj).trigger("SSAutoSuggested");
		$(this.results).html('').hide();

		if (typeof this.acSettings.onSelect === 'function') {
			this.acSettings.onSelect(item);
		}
	}
	
	/**
	* Used to get rid of the hover class on all result item elements in the
	* current set of results and add it only to the given element. We also
	* need to set the current selection to the given element here.
	*/
	AutoSuggest.prototype.setHoverClass = function(el) {
		$('li a', this.results).removeClass('ui-state-hover');
		if (el) {
			$('a', el).addClass('ui-state-hover');
		}

		this.currentSelection = el;
	}
	
	/**
	* Build the results HTML based on an array of objects that matched
	* the search criteria, highlight the matches if that feature is turned 
	* on in the settings.
	*/
	AutoSuggest.prototype.buildResults = function(resultObjects, filterTxt) {
		filterTxt = '(' + filterTxt + ')';
		
		var saveSelf = this;

		var bOddRow = true, i, iFound = 0,
			filterPatt = this.acSettings.caseSensitive ? new RegExp(filterTxt, 'g') : new RegExp(filterTxt, 'ig');

		$(this.results).html('').hide();

		for (i = 0; i < resultObjects.length; i += 1) {
			var item = $('<li />'),
				text = resultObjects[i][this.acSettings.property];

			if (this.acSettings.highlightMatches === true) {
				text = text.replace(filterPatt, '<strong>$1</strong>');
			}

			$(item).append('<a class="ui-corner-all">' + text + '</a>');

			if (typeof resultObjects[i].image === 'string') {
				$('>a', item).prepend('<img src="' + resultObjects[i].image + '" />');
			}

			if (typeof resultObjects[i].extra === 'string') {
				$('>a', item).append('<small>' + resultObjects[i].extra + '</small>');
			}

			
			$(item).addClass('ui-menu-item').
				addClass((bOddRow) ? 'odd' : 'even').
				attr('role', 'menuitem').
				click((function(n) { return function() {
					saveSelf.selectResultItem(resultObjects[n]);						
				};})(i)).
				mouseover((function(el) { return function() { 
					saveSelf.setHoverClass(el); 
				};})(item));

			$(this.results).append(item);

			bOddRow = !bOddRow;

			iFound += 1;
			if (typeof this.acSettings.maxResults === 'number' && iFound >= this.acSettings.maxResults) {
				break;
			}
		}

		if ($('li', this.results).length > 0) {
			this.currentSelection = undefined;
			$(this.results).show().css('height', 'auto');

			if ($(this.results).height() > this.acSettings.maxHeight) {
				$(this.results).css({'overflow': 'auto', 'height': this.acSettings.maxHeight + 'px'});
			}
		}
	}
	
	/**
	* Prepare the search data based on the settings for this plugin,
	* run a match against each item in the possible results and display any 
	* results on the page allowing selection by the user.
	*/
	AutoSuggest.prototype.runSuggest = function(e, self) {	
		var search = function(searchData) {
			if (this.value.length < self.acSettings.minCharacters) {
				clearAndHideResults();
				return false;
			}

			var resultObjects = [],
				filterTxt = (!self.acSettings.wildCard) ? self.regexEscape(this.value) : self.regexEscape(this.value, self.acSettings.wildCard).replace(wildCardPatt, '.*'),
				bMatch = true, 
				filterPatt, i;

			if (self.acSettings.notCharacter && filterTxt.indexOf(self.acSettings.notCharacter) === 0) {
				filterTxt = filterTxt.substr(self.acSettings.notCharacter.length,filterTxt.length);
				if (filterTxt.length > 0) { bMatch = false; }
			}
			filterTxt = filterTxt || '.*';
			filterTxt = self.acSettings.wildCard ? '^' + filterTxt : filterTxt;
			filterPatt = self.acSettings.caseSensitive ? new RegExp(filterTxt) : new RegExp(filterTxt, 'i');

			// Look for the required match against each single search data item. When the not
			// character is used we are looking for a false match. 
			for (i = 0; i < searchData.length; i += 1) {
				if (filterPatt.test(searchData[i][self.acSettings.property]) === bMatch) {
					resultObjects.push(searchData[i]);
				}
			}

			self.buildResults(resultObjects, filterTxt);
		};

		if (self.acSettings.data && self.acSettings.data.length) {
			search.apply(this, [self.acSettings.data, self]);
		}
		else if (self.acSettings.url && typeof self.acSettings.url === 'string') {
			var text = this.value;
			if (text.length < self.acSettings.minCharacters) {
				self.clearAndHideResults();
				return false;
			}

			$(self.results).html('<li class="ui-menu-item ajaxSearching"><a class="ui-corner-all">Searching...</a></li>').
				show().css('height', 'auto');

			self.getJSONTimeout = window.clearTimeout(self.getJSONTimeout);
			self.getJSONTimeout = window.setTimeout(function() {
				$.getJSON(self.acSettings.url, {search: text}, function(data) {
					if (data) {
						self.buildResults(data, text);
					}
					else {
						self.clearAndHideResults();
					}
				});
			}, 500);
		}
	}
	
	/**
	* Clears any previous results and hides the result list
	*/
	AutoSuggest.prototype.clearAndHideResults = function() {
		$(this.results).html('').hide();
	}

	return {
		init: function(selector) {
			return new AutoSuggest(selector);
		}
	};

})();