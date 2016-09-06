var Pubsub = {

	subscribe: function(ev, callback) {
		this._callbacks || (this._callbacks = {});
		(this._callbacks[ev] || (this._callbacks[ev] = [])).push(callback);

		return this;
	},

	publish: function() {
		var self = this;
		var args = Array.from(arguments);
		var ev = args.shift();

		if (!this._callbacks) {
			return this;
		}
		if (!this._callbacks[ev]) {
			return this;
		}

		this._callbacks[ev].forEach(function (fn, i) {
			fn.apply(self, args);
		});

		return this;
	}
};

var TBinding = (function() {

	function pageElementEventHandler (e) {
		var target = e.target || e.srcElemnt;
		var fullPropName = target.getAttribute('t-binding-data');

		if (fullPropName && target) {
			Pubsub.publish('ui-change', fullPropName, target.value);
		}
	}

	if (document.addEventListener) {
		document.addEventListener('keydown', pageElementEventHandler, false);
		document.addEventListener('change', pageElementEventHandler, false);
	} else {
		document.attachEvent('onkeydown', pageElementEventHandler);
		document.attachEvent('onchange', pageElementEventHandler);
	}

	if (jQuery) {
		(function ($) {
			function dispatchAutoBindEvent (elm) {
				elm.find('[t-binding-data]').each(function () {
					var fullPropName = $(this).attr('t-binding-data');
					var propPathArr = fullPropName.split('.');
					var tail = propPathArr.splice(-1, 1);
					eval(propPathArr.join('.')).rebind(tail[0]);
				});
			}

			$.fn.oldAppend = $.fn.append;
			$.fn.append = function (elm) {
				var elem = $(this);
				var args = Array.from(arguments);
				$.fn.oldAppend.apply(elem, args);
				dispatchAutoBindEvent($(elm));
				return elem;
			};

			$.fn.oldHtml = $.fn.html;
			$.fn.html = function (content) {
				var elem = $(this);
				var args = Array.from(arguments);
				$.fn.oldHtml.apply(elem, args);
				dispatchAutoBindEvent($(content));
				return elem;
			};
		})(jQuery);
	}

	Pubsub.subscribe('model-change', function(fullPropName, propValue) {
		var elements = document.querySelectorAll('[t-binding-data="' + fullPropName + '"]');

		elements.forEach(function (elem, i) {
			var elementType = elem.tagName.toLowerCase();

			if (elementType === 'input' || elementType === 'textarea' || elementType === 'select') {
				elem.value = propValue;
			} else {
				elem.innerHTML = propValue;
			}
		});
	});

	return {
		modelName: '',

		initModel: function (modelName) {
			this.modelName = modelName;

			Pubsub.subscribe('ui-change', function(fullPropName, propValue) {
				var propPathArr = fullPropName.split('.');
				var tail = propPathArr.splice(-1, 1);
				eval(propPathArr.join('.'))[tail[0]] = propValue;
			});

			return Object.create(this);
		},

		loadModelData: function (modelData) {
			var self = this;
			for (p in modelData) {
				(function (prop) {
					self.defineObjProp(self, prop, modelData[prop]);
				})(p);
			}
		},

		rebindAll: function () {
			var self = this;
			for (p in this) {
				(function (prop) {
					value = self[prop];
					Pubsub.publish('model-change', self.modelName + '.' + prop, value);
				})(p);
			}
		},

		rebind: function (prop) {
			value = this[prop];
			Pubsub.publish('model-change', this.modelName + '.' + prop, value);
		},

		defineObjProp: function(obj, propName, propValue) {
			var self = this;
			var _value = propValue;
			var _oldValue = undefined;

			try {
				Object.defineProperty(obj, propName, {
					get: function() {
						return _value;
					},

					set: function(newValue) {
						_value = newValue;
						// dirty check:
						if (_oldValue !== newValue) {
							_oldValue = newValue;
							Pubsub.publish('model-change', self.modelName + '.' + propName, newValue);
						}
					},

					enumerable: true,
					configurable: true
				});

				obj[propName] = _value;
			} catch (error) {
				console.log("Browser must be IE8+ !");
			}
		}

	}

})();
