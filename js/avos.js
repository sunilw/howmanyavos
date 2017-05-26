/**
 * Simple, lightweight, usable local autocomplete library for modern browsers
 * Because there weren’t enough autocomplete scripts in the world? Because I’m completely insane and have NIH syndrome? Probably both. :P
 * @author Lea Verou http://leaverou.github.io/awesomplete
 * MIT license
 */

(function () {

var _ = function (input, o) {
	var me = this;

	// Setup

	this.isOpened = false;

	this.input = $(input);
	this.input.setAttribute("autocomplete", "off");
	this.input.setAttribute("aria-autocomplete", "list");

	o = o || {};

	configure(this, {
		minChars: 2,
		maxItems: 10,
		autoFirst: false,
		data: _.DATA,
		filter: _.FILTER_CONTAINS,
		sort: o.sort === false ? false : _.SORT_BYLENGTH,
		item: _.ITEM,
		replace: _.REPLACE
	}, o);

	this.index = -1;

	// Create necessary elements

	this.container = $.create("div", {
		className: "awesomplete",
		around: input
	});

	this.ul = $.create("ul", {
		hidden: "hidden",
		inside: this.container
	});

	this.status = $.create("span", {
		className: "visually-hidden",
		role: "status",
		"aria-live": "assertive",
		"aria-relevant": "additions",
		inside: this.container
	});

	// Bind events

	this._events = {
		input: {
			"input": this.evaluate.bind(this),
			"blur": this.close.bind(this, { reason: "blur" }),
			"keydown": function(evt) {
				var c = evt.keyCode;

				// If the dropdown `ul` is in view, then act on keydown for the following keys:
				// Enter / Esc / Up / Down
				if(me.opened) {
					if (c === 13 && me.selected) { // Enter
						evt.preventDefault();
						me.select();
					}
					else if (c === 27) { // Esc
						me.close({ reason: "esc" });
					}
					else if (c === 38 || c === 40) { // Down/Up arrow
						evt.preventDefault();
						me[c === 38? "previous" : "next"]();
					}
				}
			}
		},
		form: {
			"submit": this.close.bind(this, { reason: "submit" })
		},
		ul: {
			"mousedown": function(evt) {
				var li = evt.target;

				if (li !== this) {

					while (li && !/li/i.test(li.nodeName)) {
						li = li.parentNode;
					}

					if (li && evt.button === 0) {  // Only select on left click
						evt.preventDefault();
						me.select(li, evt.target);
					}
				}
			}
		}
	};

	$.bind(this.input, this._events.input);
	$.bind(this.input.form, this._events.form);
	$.bind(this.ul, this._events.ul);

	if (this.input.hasAttribute("list")) {
		this.list = "#" + this.input.getAttribute("list");
		this.input.removeAttribute("list");
	}
	else {
		this.list = this.input.getAttribute("data-list") || o.list || [];
	}

	_.all.push(this);
};

_.prototype = {
	set list(list) {
		if (Array.isArray(list)) {
			this._list = list;
		}
		else if (typeof list === "string" && list.indexOf(",") > -1) {
				this._list = list.split(/\s*,\s*/);
		}
		else { // Element or CSS selector
			list = $(list);

			if (list && list.children) {
				var items = [];
				slice.apply(list.children).forEach(function (el) {
					if (!el.disabled) {
						var text = el.textContent.trim();
						var value = el.value || text;
						var label = el.label || text;
						if (value !== "") {
							items.push({ label: label, value: value });
						}
					}
				});
				this._list = items;
			}
		}

		if (document.activeElement === this.input) {
			this.evaluate();
		}
	},

	get selected() {
		return this.index > -1;
	},

	get opened() {
		return this.isOpened;
	},

	close: function (o) {
		if (!this.opened) {
			return;
		}

		this.ul.setAttribute("hidden", "");
		this.isOpened = false;
		this.index = -1;

		$.fire(this.input, "awesomplete-close", o || {});
	},

	open: function () {
		this.ul.removeAttribute("hidden");
		this.isOpened = true;

		if (this.autoFirst && this.index === -1) {
			this.goto(0);
		}

		$.fire(this.input, "awesomplete-open");
	},

	destroy: function() {
		//remove events from the input and its form
		$.unbind(this.input, this._events.input);
		$.unbind(this.input.form, this._events.form);

		//move the input out of the awesomplete container and remove the container and its children
		var parentNode = this.container.parentNode;

		parentNode.insertBefore(this.input, this.container);
		parentNode.removeChild(this.container);

		//remove autocomplete and aria-autocomplete attributes
		this.input.removeAttribute("autocomplete");
		this.input.removeAttribute("aria-autocomplete");

		//remove this awesomeplete instance from the global array of instances
		var indexOfAwesomplete = _.all.indexOf(this);

		if (indexOfAwesomplete !== -1) {
			_.all.splice(indexOfAwesomplete, 1);
		}
	},

	next: function () {
		var count = this.ul.children.length;
		this.goto(this.index < count - 1 ? this.index + 1 : (count ? 0 : -1) );
	},

	previous: function () {
		var count = this.ul.children.length;
		var pos = this.index - 1;

		this.goto(this.selected && pos !== -1 ? pos : count - 1);
	},

	// Should not be used, highlights specific item without any checks!
	goto: function (i) {
		var lis = this.ul.children;

		if (this.selected) {
			lis[this.index].setAttribute("aria-selected", "false");
		}

		this.index = i;

		if (i > -1 && lis.length > 0) {
			lis[i].setAttribute("aria-selected", "true");
			this.status.textContent = lis[i].textContent;

			// scroll to highlighted element in case parent's height is fixed
			this.ul.scrollTop = lis[i].offsetTop - this.ul.clientHeight + lis[i].clientHeight;

			$.fire(this.input, "awesomplete-highlight", {
				text: this.suggestions[this.index]
			});
		}
	},

	select: function (selected, origin) {
		if (selected) {
			this.index = $.siblingIndex(selected);
		} else {
			selected = this.ul.children[this.index];
		}

		if (selected) {
			var suggestion = this.suggestions[this.index];

			var allowed = $.fire(this.input, "awesomplete-select", {
				text: suggestion,
				origin: origin || selected
			});

			if (allowed) {
				this.replace(suggestion);
				this.close({ reason: "select" });
				$.fire(this.input, "awesomplete-selectcomplete", {
					text: suggestion
				});
			}
		}
	},

	evaluate: function() {
		var me = this;
		var value = this.input.value;

		if (value.length >= this.minChars && this._list.length > 0) {
			this.index = -1;
			// Populate list with options that match
			this.ul.innerHTML = "";

			this.suggestions = this._list
				.map(function(item) {
					return new Suggestion(me.data(item, value));
				})
				.filter(function(item) {
					return me.filter(item, value);
				});

			if (this.sort !== false) {
				this.suggestions = this.suggestions.sort(this.sort);
			}

			this.suggestions = this.suggestions.slice(0, this.maxItems);

			this.suggestions.forEach(function(text) {
					me.ul.appendChild(me.item(text, value));
				});

			if (this.ul.children.length === 0) {
				this.close({ reason: "nomatches" });
			} else {
				this.open();
			}
		}
		else {
			this.close({ reason: "nomatches" });
		}
	}
};

// Static methods/properties

_.all = [];

_.FILTER_CONTAINS = function (text, input) {
	return RegExp($.regExpEscape(input.trim()), "i").test(text);
};

_.FILTER_STARTSWITH = function (text, input) {
	return RegExp("^" + $.regExpEscape(input.trim()), "i").test(text);
};

_.SORT_BYLENGTH = function (a, b) {
	if (a.length !== b.length) {
		return a.length - b.length;
	}

	return a < b? -1 : 1;
};

_.ITEM = function (text, input) {
	var html = input.trim() === "" ? text : text.replace(RegExp($.regExpEscape(input.trim()), "gi"), "<mark>$&</mark>");
	return $.create("li", {
		innerHTML: html,
		"aria-selected": "false"
	});
};

_.REPLACE = function (text) {
	this.input.value = text.value;
};

_.DATA = function (item/*, input*/) { return item; };

// Private functions

function Suggestion(data) {
	var o = Array.isArray(data)
	  ? { label: data[0], value: data[1] }
	  : typeof data === "object" && "label" in data && "value" in data ? data : { label: data, value: data };

	this.label = o.label || o.value;
	this.value = o.value;
}
Object.defineProperty(Suggestion.prototype = Object.create(String.prototype), "length", {
	get: function() { return this.label.length; }
});
Suggestion.prototype.toString = Suggestion.prototype.valueOf = function () {
	return "" + this.label;
};

function configure(instance, properties, o) {
	for (var i in properties) {
		var initial = properties[i],
		    attrValue = instance.input.getAttribute("data-" + i.toLowerCase());

		if (typeof initial === "number") {
			instance[i] = parseInt(attrValue);
		}
		else if (initial === false) { // Boolean options must be false by default anyway
			instance[i] = attrValue !== null;
		}
		else if (initial instanceof Function) {
			instance[i] = null;
		}
		else {
			instance[i] = attrValue;
		}

		if (!instance[i] && instance[i] !== 0) {
			instance[i] = (i in o)? o[i] : initial;
		}
	}
}

// Helpers

var slice = Array.prototype.slice;

function $(expr, con) {
	return typeof expr === "string"? (con || document).querySelector(expr) : expr || null;
}

function $$(expr, con) {
	return slice.call((con || document).querySelectorAll(expr));
}

$.create = function(tag, o) {
	var element = document.createElement(tag);

	for (var i in o) {
		var val = o[i];

		if (i === "inside") {
			$(val).appendChild(element);
		}
		else if (i === "around") {
			var ref = $(val);
			ref.parentNode.insertBefore(element, ref);
			element.appendChild(ref);
		}
		else if (i in element) {
			element[i] = val;
		}
		else {
			element.setAttribute(i, val);
		}
	}

	return element;
};

$.bind = function(element, o) {
	if (element) {
		for (var event in o) {
			var callback = o[event];

			event.split(/\s+/).forEach(function (event) {
				element.addEventListener(event, callback);
			});
		}
	}
};

$.unbind = function(element, o) {
	if (element) {
		for (var event in o) {
			var callback = o[event];

			event.split(/\s+/).forEach(function(event) {
				element.removeEventListener(event, callback);
			});
		}
	}
};

$.fire = function(target, type, properties) {
	var evt = document.createEvent("HTMLEvents");

	evt.initEvent(type, true, true );

	for (var j in properties) {
		evt[j] = properties[j];
	}

	return target.dispatchEvent(evt);
};

$.regExpEscape = function (s) {
	return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
};

$.siblingIndex = function (el) {
	/* eslint-disable no-cond-assign */
	for (var i = 0; el = el.previousElementSibling; i++);
	return i;
};

// Initialization

function init() {
	$$("input.awesomplete").forEach(function (input) {
		new _(input);
	});
}

// Are we in a browser? Check for Document constructor
if (typeof Document !== "undefined") {
	// DOM already loaded?
	if (document.readyState !== "loading") {
		init();
	}
	else {
		// Wait for it
		document.addEventListener("DOMContentLoaded", init);
	}
}

_.$ = $;
_.$$ = $$;

// Make sure to export Awesomplete on self when in a browser
if (typeof self !== "undefined") {
	self.Awesomplete = _;
}

// Expose Awesomplete as a CJS module
if (typeof module === "object" && module.exports) {
	module.exports = _;
}

return _;

}());

window.houseData = [
    {
        "Electorate": "Auckland Central",
        "House Price": "$1,079,879",
        "Source": ""
    },
    {
        "Electorate": "Bay of Plenty",
        "House Price": "$533,600",
        "Source": "http://www.nzherald.co.nz/bay-of-plenty-times/news/article.cfm?c_id=1503343&objectid=11656861"
    },
    {
        "Electorate": "Botany",
        "House Price": "$1,172,617",
        "Source": ""
    },
    {
        "Electorate": "Christchurch Central",
        "House Price": "$585,099",
        "Source": ""
    },
    {
        "Electorate": "Christchurch East",
        "House Price": "$370,913",
        "Source": ""
    },
    {
        "Electorate": "Clutha-Southland",
        "House Price": "$313,711",
        "Source": ""
    },
    {
        "Electorate": "Coromandel",
        "House Price": "$690,634",
        "Source": ""
    },
    {
        "Electorate": "Dunedin North",
        "House Price": "$346,444",
        "Source": ""
    },
    {
        "Electorate": "Dunedin South",
        "House Price": "$352,212",
        "Source": ""
    },
    {
        "Electorate": "East Coast",
        "House Price": "$288,748",
        "Source": "http://www.nzherald.co.nz/bay-of-plenty-times/news/article.cfm?c_id=1503343&objectid=11656861"
    },
    {
        "Electorate": "East Coast Bays",
        "House Price": "$1,148,505",
        "Source": "http://www.nzherald.co.nz/business/news/article.cfm?c_id=3&objectid=11491720"
    },
    {
        "Electorate": "Epsom",
        "House Price": "$1,653,500",
        "Source": ""
    },
    {
        "Electorate": "Hamilton East",
        "House Price": "$586,214",
        "Source": ""
    },
    {
        "Electorate": "Hamilton West",
        "House Price": "$488,953",
        "Source": ""
    },
    {
        "Electorate": "Helensville",
        "House Price": "$587,500",
        "Source": ""
    },
    {
        "Electorate": "Hunua",
        "House Price": "$669,518",
        "Source": ""
    },
    {
        "Electorate": "Hutt South",
        "House Price": "$503,286",
        "Source": ""
    },
    {
        "Electorate": "Ilam",
        "House Price": "$641,550",
        "Source": "http://www.stuff.co.nz/business/money/77741927/Housing-demand-pushes-price-growth-east-in-Christchurch"
    },
    {
        "Electorate": "Invercargill",
        "House Price": "$239,486",
        "Source": ""
    },
    {
        "Electorate": "Kaikōura",
        "House Price": "$399,661",
        "Source": ""
    },
    {
        "Electorate": "Kelston",
        "House Price": "$708,500",
        "Source": ""
    },
    {
        "Electorate": "Mana",
        "House Price": "$501,028",
        "Source": ""
    },
    {
        "Electorate": "Mangere",
        "House Price": "$636,750",
        "Source": ""
    },
    {
        "Electorate": "Manukau East",
        "House Price": "$1,172,617",
        "Source": ""
    },
    {
        "Electorate": "Manurewa",
        "House Price": "$607,000",
        "Source": ""
    },
    {
        "Electorate": "Maungakiekie",
        "House Price": "$1,023,306",
        "Source": "https://www.barfoot.co.nz/market-reports/2016/february/suburb-report"
    },
    {
        "Electorate": "Mt Albert",
        "House Price": "$1,094,000",
        "Source": ""
    },
    {
        "Electorate": "Mt Roskill",
        "House Price": "$909,000",
        "Source": ""
    },
    {
        "Electorate": "Napier",
        "House Price": "$425,484",
        "Source": ""
    },
    {
        "Electorate": "Nelson",
        "House Price": "$527,422",
        "Source": ""
    },
    {
        "Electorate": "New Lynn",
        "House Price": "$702,000",
        "Source": ""
    },
    {
        "Electorate": "New Plymouth",
        "House Price": "$418,445",
        "Source": ""
    },
    {
        "Electorate": "North Shore",
        "House Price": "$1,195,292",
        "Source": ""
    },
    {
        "Electorate": "Northcote",
        "House Price": "$1,198,200",
        "Source": ""
    },
    {
        "Electorate": "Northland",
        "House Price": "$554,000",
        "Source": "http://www.scoop.co.nz/stories/BU1702/S00824/northland-residential-property-price-increases-accelerated.htm"
    },
    {
        "Electorate": "Ōhariu",
        "House Price": "$580,000",
        "Source": "www.leaderswellington.co.nz/s/PU-0616-AndrewPano.pdf"
    },
    {
        "Electorate": "Ōtaki",
        "House Price": "$325,500",
        "Source": ""
    },
    {
        "Electorate": "Pakuranga",
        "House Price": "$854,000",
        "Source": ""
    },
    {
        "Electorate": "Palmerston North",
        "House Price": "$354,999",
        "Source": ""
    },
    {
        "Electorate": "Papakura",
        "House Price": "$575,139",
        "Source": ""
    },
    {
        "Electorate": "Port Hills",
        "House Price": "$648,000",
        "Source": "http://www.stuff.co.nz/the-press/news/69229248/christchurch-home-values-take-a-jump-on-the-hills-flatter-on-the-flat"
    },
    {
        "Electorate": "Rangitata",
        "House Price": "$355,556",
        "Source": "http://www.landlords.co.nz/housing-statistics/?graphsubmitted=true&frommonth=1&fromyear=1994&tomonth=5&toyear=2017&graphareas%5B%5D=119&graphstyle=price&submit=Show+Graph"
    },
    {
        "Electorate": "Rangitīkei",
        "House Price": "$163,111",
        "Source": "http://www.stuff.co.nz/manawatu-standard/news/88957498/Houses-worth-more-in-Palmerston-North-and-Horowhenua-QV-figures-show"
    },
    {
        "Electorate": "Rimutaka",
        "House Price": "$445,632",
        "Source": ""
    },
    {
        "Electorate": "Rodney",
        "House Price": "$809,752",
        "Source": "http://www.nzherald.co.nz/business/news/article.cfm?c_id=3&objectid=11598700"
    },
    {
        "Electorate": "Rongotai",
        "House Price": "$583,000",
        "Source": ""
    },
    {
        "Electorate": "Rotorua",
        "House Price": "$396,423",
        "Source": ""
    },
    {
        "Electorate": "Selwyn",
        "House Price": "$542,493",
        "Source": "https://ecoprofile.infometrics.co.nz/Selwyn%2BDistrict/QuarterlyEconomicMonitor/HousePrices"
    },
    {
        "Electorate": "Tāmaki",
        "House Price": "$1,021,250",
        "Source": "tamaki east"
    },
    {
        "Electorate": "Taranaki-King Country",
        "House Price": "$411,160",
        "Source": "http://www.stuff.co.nz/business/property/88303046/taranaki-residential-property-prices-continue-to-rise"
    },
    {
        "Electorate": "Taupō",
        "House Price": "$437,943",
        "Source": ""
    },
    {
        "Electorate": "Tauranga",
        "House Price": "$678,643",
        "Source": ""
    },
    {
        "Electorate": "Te Atatu",
        "House Price": "$834,750",
        "Source": "Te Atatu Peninsula + Te Atatu south"
    },
    {
        "Electorate": "Tukituki",
        "House Price": "$408,510",
        "Source": "hastings"
    },
    {
        "Electorate": "Upper Harbour",
        "House Price": "$937,324",
        "Source": ""
    },
    {
        "Electorate": "Waikato",
        "House Price": "$450,043",
        "Source": ""
    },
    {
        "Electorate": "Waimakariri",
        "House Price": "$435,200",
        "Source": "https://ecoprofile.infometrics.co.nz/Waimakariri%2BDistrict/QuarterlyEconomicMonitor/HousePrices"
    },
    {
        "Electorate": "Wairarapa",
        "House Price": "$359,212",
        "Source": "south wairarapa + masterton"
    },
    {
        "Electorate": "Waitaki",
        "House Price": "$267,631",
        "Source": ""
    },
    {
        "Electorate": "Wellington Central",
        "House Price": "$721,252",
        "Source": ""
    },
    {
        "Electorate": "West Coast-Tasman",
        "House Price": "$320,200",
        "Source": "no data for haast, hari hari, whataroa, ross, fox glacier"
    },
    {
        "Electorate": "Whanganui",
        "House Price": "$220,336",
        "Source": ""
    },
    {
        "Electorate": "Whangarei",
        "House Price": "$477,765",
        "Source": ""
    },
    {
        "Electorate": "Wigram",
        "House Price": "$640,000",
        "Source": ""
    }
]

/* main for howmanyavos */

console.log("starting...");
