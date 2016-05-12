var Sequelize = require('sequelize');
var sequelize = new Sequelize('AMS', 'ams_user', 'User$0ams', {
  host: 'localhost',
  dialect: 'mssql',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

var Todo = sequelize.define('todo', {
	id: {
            type: Sequelize.INTEGER, 
            primaryKey: true, 
            autoIncrement: true,
            field: 'id' 
    },
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
})

var User = sequelize.define('user', {
	email: Sequelize.STRING
},
{	tableName: 'user',
	freezeTableName: true
});

Todo.belongsTo(User);
User.hasMany(Todo);

sequelize.sync({
	//force:true
}).then(function () {
	console.log('Everything is synced');

	User.findById(1).then(function(user) {
		user.getTodos({
			where: {
				completed: false
			}
		}).then(function(todos) {
			todos.forEach(function (todo) {
				console.log(todo.toJSON());
			});
		});
	});
	
	// User.create({
	// 	email: 'super@duper.com'
	// }).then(function() {
	// 	return Todo.create({
	// 		description: 'Clean yard'
	// 	}).then(function(todo) {
	// 		User.findById(1).then(function(user) {
	// 			user.addTodo(todo);
	// 		});
	// 	});
	// })
});