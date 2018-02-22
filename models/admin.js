var mongoose = require('mongoose');
var db = mongoose.connection;

mongoose.connect('mongodb://localhost/my_hotel');

//Admin schema
var AdminSchema = mongoose.Schema({
	username:{
		type: String,
		index: true
	},
	password:{
		type: String,
		required:true
	}
});

var Admin = module.exports = mongoose.model('Admin',AdminSchema);
