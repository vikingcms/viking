// content of index.js
const http = require('http')
const getPort = require('get-port')
const open = require('open')
let express = require('express')
let app = express()
let pathToPackage = require("global-modules-path").getPath("vikingcms");
const curDir = process.cwd();
const fs = require('fs');
const postsFolder = curDir + '/content/posts/json/';
const debug = true;

async function getRandomPort (preferredPort = 8000) {
    const port = await getPort({ port: preferredPort });
    return port;
}

let dashboard = module.exports = {
    launch: function(){

        getRandomPort(8080).then( function(port){

            app.set('view engine', 'ejs');
            app.use('/assets', express.static(pathToPackage + '/src/dashboard/assets'));
            
            dashboard.generateRoutes();

            app.listen(port, () => console.log(`VikingCMS dashboard running on port ${port}!`))
            
            open('http://localhost:' + port);

        });

    },

    generateRoutes: function(){
        
        app.get('/', (req, res) => res.render(pathToPackage + '/src/dashboard/index', { request: req }) );
        
        app.get('/posts', function(req, res){
            dashboard.getPosts(function(posts){
                res.render(pathToPackage + '/src/dashboard/posts', { request: req, posts: posts, debug: debug });
            });
        });

        app.get('/post/:post', function(req, res){
            //res.send('rad ' + req.params.post, { request: req });
            res.send('rad ' + req.params.post);
        });

    }, 

    getPosts: function(_callback){
        let posts = [];
        fs.readdir(postsFolder, (err, files) => {
            files.forEach(file => {
                //console.log(file);
                let filename = file.replace('.json', '');
                posts.push( JSON.parse( fs.readFileSync( postsFolder + file ) ) );
            });
            _callback(posts);
        });
    }
}
