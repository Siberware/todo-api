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

sequelize.sync().then(function () {

	return Todo.findById(2)
		.then(function(todo) {
			if(todo){
				console.log(todo.dataValues);
			}
			else{
				console.log('Not found');
			}
		})
		.catch(function(e) {
			console.log(e.message);
		});



	// Todo.create({
	// 	description: 'Wax on wax off.',
	// 	completed: false
	// })
	// .then(function(todo) {
	// 	console.log(todo.toJSON);
	// 	console.log('Fin');
	// })
	// .catch(function(e) {
	// 	console.log(e.message);
	// });
	
});