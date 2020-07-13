// //basic set up ========================
// var express  = require('express');
// var app = express();                                   // creating the app with express
// var morgan = require('morgan');                                // log requests to the console (express4)
// var bodyParser = require('body-parser');                       // pull information from HTML POST (express4)

// var SERVER_PORT = 9090;

// // registration testing
// var multicast = require('./registration');

// var config = require('./config');
// const _app_folder = 'dist';

// app.use(morgan('dev'));                                   // log every request to the console
// app.use(bodyParser.urlencoded({'extended':'true'}));      // parse application/x-www-form-urlencoded
// app.use(bodyParser.json());                               // parse application/json
// app.use(bodyParser.text());


// // serve static assets with express (angular's dist folder needs to be mentioned here, too)
// app.use(express.static(__dirname + '/public'));


// // start app ======================================
// app.use('/uploaded-files', express.static(__dirname + '/server/uploaded-files')); //Serves resources from public folder
// var server = app.listen(SERVER_PORT);

// // start socket-server
// var SocketServer = require('./socket-server');
// var socketServer = new SocketServer(server);

// // api routing
// // TODO: if a lot of routes are added later we have to have a central route file (otherwise we include a lot of files here)

// // Create an instance of a graphDB connection database
// GraphDBConnection = require('./util/graphDbConnection');
// graphDBConnection = new GraphDBConnection();

// var moduleRoutes = require('./routes/module-management.route')(socketServer, graphDBConnection);
// app.use('/api/modules', moduleRoutes);

// var capabilityRoutes = require('./routes/capability-management.route')(socketServer, graphDBConnection);
// app.use('/api/capabilities', capabilityRoutes);

// var orderManagementRoutes = require('./routes/order-management.route');
// app.use('/api/order-management', orderManagementRoutes);

// var graphOperationsRoutes = require('./routes/graph-operations.route')(graphDBConnection);
// app.use('/api/graph-operations', graphOperationsRoutes);

// var graphDbManagementRoutes = require('./routes/graph-repositories.route')(graphDBConnection);
// app.use('/api/graph-repositories', graphDbManagementRoutes);

// var serviceExecutionRoutes = require('./routes/service-execution.route');
// app.use('/api/service-executions', serviceExecutionRoutes);

// // load the single view file, angular does all the front-end-routing
// // app.get('*', (req, res) => {
// //   res.sendFile(path.join(__dirname, 'dist/index.html'));
// // });
// app.get('*.*', express.static(_app_folder, {maxAge: '1y'}));
// app.all('/*', function (req, res) {
//     res.status(200).sendFile(`/`, {root: _app_folder});
// });




// console.log(`app listening on port ${SERVER_PORT}`);