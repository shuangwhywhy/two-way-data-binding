var AppProgram = function () {

	this.init = function () {
		var user = TBinding.initModel('AP.user');

		user.loadModelData({
			name: 'Demo User',
			age: 29,
			gender: 1,
			desc: 'Hello, my name is demo. It is very nice to meet you my friend!'
		});

		user.incAge = function() {
			this.age ++;
		};

		user.decAge = function() {
			this.age --;
		};

		this.user = user;
	};

};
