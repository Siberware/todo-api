var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = 3000;
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API Root');
});

// GET /todos?completed=true
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var uId = req.user.get('id');
	var where = {
		userId: uId
	};

	if(query.hasOwnProperty('completed') && query.completed === 'true'){
		where.completed = true;
	}
	else if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	}

	if(query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where: where}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});

});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id);
	var uId = req.user.get('id');
	var where = {
		id: todoId,
		userId: uId
	};

	db.todo.findOne({where: where}).then(function(todo) {
		if(!!todo) {
			res.json(todo);
		}
		else {
			res.status(404).send("404 Not Found");
		}
	}, function(e) {
		res.status(500).send();
	});

	// db.todo.findById(todoId).then(function(todo) {
	// 	if(!!todo) {
	// 		res.json(todo);
	// 	}
	// 	else {
	// 		res.status(404).send("404 Not Found");
	// 	}
	// }, function(e) {
	// 	res.status(500).send();
	// });
});

app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		// 
		req.user.addTodo(todo).then(function() {
			return todo.reload();
		}).then(function(todo) {
			res.json(todo.toJSON());
		});
	}, function (e) {
		res.status(400).json(e);
	});

});

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id);
	var uId = req.user.get('id');

	db.todo.destroy({
		where: {
			id: todoId,
			userId: uId
		}
	}).then(function(rowsDeleted) {
		if(rowsDeleted === 0) {
			res.status(404).json({
				error: "No todos with id: " + todoId
			});
		} 
		else {
			res.status(204).send();
		}
	},function () {
		res.status(500).send()
	});
	
});

app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id);
	var body = _.pick(req.body, 'description', 'completed');
	var attributes = {};
	var uId = req.user.get('id');
	var where = {
		id: todoId,
		userId: uId
	};

	if (body.hasOwnProperty('completed')) {
		attributes.completed = body.completed;
	} 

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	} 

	db.todo.findOne({where: where}).then(function(todo) {
		if(todo) {
			todo.update(attributes).then(function(todo) {
			res.json(todo);
		}, function(e) {
			res.status(400).send(e);
		})
		}
		else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	});
});

app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, 
	function (e) {
		res.status(400).json(e);
	});

});

app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');
	var userInstance;

	db.user.authenticate(body).then(function(user) {
		var token = user.generateToken('authentication');
		userInstance = user;
		return db.token.create({
			token: token
		});
	}).then(function(tokenInstance) {
		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	}).catch(function() {
		res.status(401).send();
	});

});

app.delete('/users/login', middleware.requireAuthentication, function(req, res) {
	req.token.destroy().then(function(){
		res.status(204).send();
	}).catch(function() {
		res.status(500).send();
	});
});

db.sequelize.sync().then(function () {
	// run sync to create table
	// db.todo.sync({force: true});
	// db.user.sync({force: true});
	app.listen(PORT, function() {
		console.log("Express listening on port " + PORT);
	});
});

