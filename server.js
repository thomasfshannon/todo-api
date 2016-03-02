var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json())
app.get('/', function(req, res) {
	res.send("todo api root");

});


//GET /todos
app.get('/todos', function(req, res) {
	var query = req.query;
	var filtered = todos;

	if (query.hasOwnProperty('completed') && query.completed === 'true') {
		filtered = _.where(todos, {
			completed: true
		})
	} else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		filtered = _.where(todos, {
			completed: false
		})
	}



	if (query.hasOwnProperty('desc') && query.desc.length > 0) {
		filtered = _.filter(filtered, function(todo) {
			return todo.description.toLowerCase().indexOf(query.desc.toLowerCase()) > -1;
		});
	}


	res.json(filtered);
})
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function(todo){
		if(todo) {
			res.json(todo.toJSON())
		} else {
			res.status(404).send();
		}
	}), function(e) {
			res.status(500).send();
		}
});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');
	db.todo.create(body).then(function(todo){
		return res.status(200)
		
	}).catch(function(e){
		res.json(todo.toJSON())
	});
});

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var match = _.findWhere(todos, {
		id: todoId
	});


	if (match) {
		res.json(match);
		todos = _.without(todos, match);
	} else {
		res.send("404 error");
	}
});

app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var match = _.findWhere(todos, {
		id: todoId
	});
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (!match) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		res.status(400).send();
	}

	_.extend(match, validAttributes);
	res.json(match);
});

db.sequelize.sync().then(function(){
	app.listen(PORT, function() {
	console.log('Listening on ' + PORT);

});
})
