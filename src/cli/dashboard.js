// content of index.js
const http = require('http')
const getPort = require('get-port')
const open = require('open')
var express = require('express')
var app = express()
let pathToPackage = require("global-modules-path").getPath("vikingcms");

const curDir = process.cwd();

async function getRandomPort (preferredPort = 8000) {
    const port = await getPort({ port: preferredPort });
    return port;
}

module.exports = {
    launch: function(){
        console.log('Welcome to VikingCMS');

        getRandomPort(8080).then( function(port){
            
            // const requestHandler = (request, response) => {
            //     console.log(request.url)
            //     response.end('Hello Node.js Server!')
            // }

            app.set('view engine', 'ejs');
            app.get('/', (req, res) => res.render(pathToPackage + '/src/dashboard/index') );
            app.use('/assets', express.static(pathToPackage + '/src/dashboard/assets'));
            app.get('/posts', function(req, res){
                res.send('rad');
            });

            app.get('/post/:post/', function(req, res){
                res.send('rad ' + req.params.post);
            });

            app.listen(port, () => console.log(`Example app listening on port ${port}!`))
            
            open('http://localhost:' + port);

            // const server = http.createServer(requestHandler)
            
            // server.listen(port, (err) => {
            //     if (err) {
            //     return console.log('something bad happened', err)
            //     }
            
            //     console.log(`server is listening on ${port}`)

            //     open('http://localhost:' + port);
            // });
        });

    }
}
