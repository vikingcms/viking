// content of index.js
const http = require('http')
const getPort = require('get-port')
const open = require('open')
const express = require('express')
let session = require('express-session');
const url = require('url');
const multer  = require('multer')
let bodyParser = require('body-parser')
let dateFormat = require('dateformat')
let app = express()
const fs = require('fs');
var ghpages = require('gh-pages');

let folder = require(require("global-modules-path").getPath("vikingcms") + '/src/lib/folder.js');
let builder = require(folder.vikingPath() + 'src/lib/builder.js');
const settings = require(folder.vikingPath() + 'src/lib/settings.js');
const Post = require(folder.vikingPath() + 'src/lib/post.js');

let post = new Post();

let upload = multer({ dest : folder.imagePath() + 'tmp/' })
let debug = false;
let notificationShown = 0;

function getDateString(d){
	var year = d.getFullYear();
	var month = String(d.getMonth()+1).padStart(2, 0);
	var day = String(d.getDate()).padStart(2, 0);

	var hour = String(d.getHours()).padStart(2, 0);
	var minute = String(d.getMinutes()).padStart(2, 0);
	var second = String(d.getSeconds()).padStart(2, 0);

	return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

async function getRandomPort (preferredPort = 8000) {
    const port = await getPort({ port: preferredPort });
    return port;
}

let serve = module.exports = {
    launch: function(){

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

            serve.generateRoutes();

            app.listen(port, () => console.log(`VikingCMS dashboard running on port ${port}!`))
            
            open('http://localhost:' + port);

        });

    },

    generateRoutes: function(){
        
        app.get('/', function(req, res){
            let posts = post.orderBy('created_at', 'DESC').getPosts();   
            res.render(folder.vikingPath() + 'src/dashboard/index', { request: req, debug: debug, session: req.session, settings: settings.load(), posts: posts }) 
        });

        app.get('/dashboard', function(req, res) {
            let posts = post.orderBy('created_at', 'DESC').getPosts();
            res.render(folder.vikingPath() + 'src/dashboard/index', { request: req, debug: debug, session: req.session, settings: settings.load(), posts: posts }) 
        });
        
        app.post('/dashboard/build', function(req, res){
            res.json( builder.build() );
        });

        app.get('/dashboard/posts', function(req, res){
            let posts = post.orderBy('created_at', 'DESC').getPosts();
            res.render(folder.vikingPath() + 'src/dashboard/posts', { request: req, posts: posts, debug: debug, session: req.session, dateFormat: dateFormat });
        });

        app.get('/dashboard/settings', function (req, res) {
            let settingsFile = JSON.parse(fs.readFileSync(folder.rootPath() + '/content/settings.json'));
            res.render(folder.vikingPath() + 'src/dashboard/settings', { request: req, debug: debug, session: req.session, settingsFile: settingsFile }) 
        });

        app.get('/dashboard/posts/create', function(req, res){
            res.render(folder.vikingPath() + 'src/dashboard/single', { request: req, post: {}, debug: debug, session: req.session });
        });

        app.post('/dashboard/update/settings/:file', function(req, res){
            settings.updateOption(req.params.file, req.body.key, req.body.value);
            res.json({
                "success": true
            });
        });

        app.post('/dashboard/posts/delete', function(req, res){
            let slug = req.body.slug;
            let filename = serve.getFilenameFromSlug(req.body.slug);

            try {
                fs.unlinkSync(filename);
                req.session.notification = 'Your post has been successfully deleted.';
                req.session.notification_type = 'success';
                res.json({ status: 'success' });
            //file removed
            } catch(err) {
                res.json({ status: 'fail', message: err });
            }
        });

        app.post('/dashboard/uploadFile', upload.single('image'), function(req, res){
            console.log('req image');
            console.log(req.file);
            let file = req.file;
            fs.renameSync(file.path, folder.imagePath() + file.originalname);

            res.json({
                success : 1,
                file : {
                    "url" : '/images/' + file.originalname
                }
            });

        });

        app.post('/dashboard/posts/create', function(req, res){
            
            try {
                let imageFile = req.body.image;
                if(req.body.image_filename != ""){
                    let base64Image = req.body.image.split(';base64,').pop();
                    imageFile = '/images/' + req.body.image_filename;
                    fs.writeFileSync(folder.imagePath() + req.body.image_filename, base64Image, {encoding: 'base64'});
                }

                let postJson = {
                    title: req.body.title,
                    excerpt: req.body.excerpt,
                    slug: req.body.slug,
                    image: imageFile,
                    status: "published",
                    body: req.body.body,
                    meta: {
                        title: req.body.meta_title,
                        description: req.body.meta_description,
                        schema: req.body.meta_schema
                    },
                    created_at: getDateString(new Date()),
                    updated_at: getDateString(new Date()),
                }
    
                let filename = serve.getFilenameFromSlug(postJson.slug);
    
                fs.access(filename, fs.F_OK, (err) => {
                    // if we cannot access the file we can write it
                    if (err) {
                        fs.writeFile(filename, JSON.stringify(postJson), 'utf8', function(){
    
                        });
                        res.json({ status: 'success', slug: postJson.slug });
                    } else {
                        fs.writeFile(filename, JSON.stringify(postJson), 'utf8', function(){
    
                        });
                        res.json({ status: 'success', slug: postJson.slug });
                    }
    
                  });

            } catch(err) {
                // An error occurred
                console.error(err);
                res.json({ status: 'danger', message: err });
            }

            
        });

        

        app.get('/dashboard/post/:post', function(req, res){
            serve.getPost(req.params.post, function(post){
                //console.log(post);
                //res.json({ status: 'hmmm', post: post });
                res.render(folder.vikingPath() + 'src/dashboard/single', { request: req, post: post, debug: debug, session: req.session });
            });
        });

        app.get('/dashboard/fetchURL', function(req, res){
            const urlToFetch = req.query.url;
            var res = `{"success" : 1,
                "meta": {
                    "title" : "CodeX Team",
                    "description" : "Club of web-development, design and marketing. We build team learning how to build full-valued projects on the world market.",
                    "image" : {
                        "url" : "https://codex.so/public/app/img/meta_img.png"
                    }
                } 
            }`;
            return res;
        });

    }, 

    getPost: function(slug, _callback){
        console.log('heyo ' + folder.post() + slug + '.json');
        let post = JSON.parse( fs.readFileSync( folder.post() + slug + '.json' ) );
        _callback(post);
    },

    getFilenameFromSlug(slug){
        return folder.post() + slug + '.json';
    }
}
