const getPort = require('get-port');
const open = require('open');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');

const folder = require(require("global-modules-path").getPath("viking") + '/src/lib/folder.js');
const routes = require(folder.vikingPath() + 'src/lib/routes.js');

let notificationShown = 0;

async function getRandomPort (preferredPort = 8000) {
    const port = await getPort({ port: preferredPort });
    return port;
}

module.exports = {
    launch() {

        routes.sayHello();

        getRandomPort(8080).then( function(port){
            
            app.set('view engine', 'ejs');
            app.use('/dashboard/assets', express.static(folder.vikingPath() + 'src/dashboard/assets'));
            
            
            app.use('/images/', express.static(folder.imagePath()));
            app.use('/', express.static( folder.sitePath() ));
            //app.use(express.json());
            app.use(express.json({limit: '10mb'}));
            app.use(express.urlencoded({ extended: true }));
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(session({secret:'QLZNQn1I1P'}));

            // notification functionality middleware
            app.use(function (req, res, next) {
                if(req.session.notification && req.session.notification_type){
                    if(notificationShown){
                        req.session.notification = '';
                        req.session.notification_type = '';
                        notificationShown = 0;
                    }
                    notificationShown = 1;
                }
                next()
              });

            routes.load(app);

            app.listen(port, () => console.log(`Viking is running on port ${port}!`))
            
            open('http://localhost:' + port);

        });

    },

    getPost(slug, _callback) {
        let post = JSON.parse( fs.readFileSync( folder.post() + slug + '.json' ) );
        _callback(post);
    },

    getFilenameFromSlug(slug) {
        return folder.post() + slug + '.json';
    }
}
