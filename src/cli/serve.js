// content of index.js
const http = require('http')
const getPort = require('get-port')
const open = require('open')
const express = require('express')
let session = require('express-session');
const url = require('url');
const multer  = require('multer')
let bodyParser = require('body-parser')
//const fileUpload = require('express-fileupload');

let app = express()
let pathToPackage = require("global-modules-path").getPath("vikingcms");
const curDir = process.cwd();
const fs = require('fs');
const postsFolder = curDir + '/content/posts/json/';
const imagesLocation = '/content/images/';
const imagesFolder = curDir + imagesLocation;

let upload = multer({ dest : imagesFolder + 'tmp/' })
let debug = false;
let notificationShown = 0;

let builder = require(pathToPackage + '/src/lib/builder.js');
let dateFormat = require('dateformat');

// get right now date;
Date.prototype.rightNow = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear() + ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

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
            app.use('/dashboard/assets', express.static(pathToPackage + '/src/dashboard/assets'));
            app.use(imagesLocation, express.static(imagesFolder));
            app.use('/', express.static(curDir));
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
        
        app.get('/', (req, res) => 
            res.render(pathToPackage + '/src/dashboard/index', { request: req, debug: debug, session: req.session }) 
        );

        app.get('/dashboard', (req, res) => 
            res.render(pathToPackage + '/src/dashboard/index', { request: req, debug: debug, session: req.session }) 
        );
        
        app.post('/dashboard/build', function(req, res){
            res.json( builder.build(curDir, '2020', debug) );
        });

        app.get('/dashboard/posts', function(req, res){
            serve.getPosts(function(posts){
                res.render(pathToPackage + '/src/dashboard/posts', { request: req, posts: posts, debug: debug, session: req.session, dateFormat: dateFormat });
            });
        });

        app.get('/dashboard/settings', function (req, res) {
            let settingsFile = JSON.parse(fs.readFileSync(curDir + '/content/settings.json'));
            res.render(pathToPackage + '/src/dashboard/settings', { request: req, debug: debug, session: req.session, settingsFile: settingsFile }) 
        });

        app.get('/dashboard/posts/create', function(req, res){
            res.render(pathToPackage + '/src/dashboard/single', { request: req, post: {}, debug: debug, session: req.session });
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
            fs.renameSync(file.path, imagesFolder + file.originalname);

            res.json({
                success : 1,
                file : {
                    "url" : imagesLocation + file.originalname
                }
            });

        });

        app.post('/dashboard/posts/create', function(req, res){
            
            try {
                let imageFile = req.body.image;
                if(req.body.image_filename != ""){
                    let base64Image = req.body.image.split(';base64,').pop();
                    imageFile = imagesLocation + req.body.image_filename;
                    fs.writeFileSync(imagesFolder + req.body.image_filename, base64Image, {encoding: 'base64'});
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
                res.render(pathToPackage + '/src/dashboard/single', { request: req, post: post, debug: debug, session: req.session });
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

    getPosts: function(_callback){
        let posts = [];
        fs.readdir(postsFolder, (err, files) => {
            if(files.length){
                files.forEach(file => {
                    //console.log(file);
                    let filename = file.replace('.json', '');
                    posts.push( JSON.parse( fs.readFileSync( postsFolder + file ) ) );
                });
            }
            _callback(posts);
        });
    }, 

    getPost: function(slug, _callback){
        console.log('heyo ' + postsFolder + slug + '.json');
        let post = JSON.parse( fs.readFileSync( postsFolder + slug + '.json' ) );
        _callback(post);
    },

    getFilenameFromSlug(slug){
        return postsFolder + slug + '.json';
    }
}
