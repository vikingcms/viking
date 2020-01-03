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
const debug = false;
let notificationShown = 0;

// get right now date;
Date.prototype.rightNow = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear() + ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

async function getRandomPort (preferredPort = 8000) {
    const port = await getPort({ port: preferredPort });
    return port;
}

let dashboard = module.exports = {
    launch: function(){

        getRandomPort(8080).then( function(port){

            app.set('view engine', 'ejs');
            app.use('/assets', express.static(pathToPackage + '/src/dashboard/assets'));
            app.use(imagesLocation, express.static(imagesFolder));
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

            dashboard.generateRoutes();

            app.listen(port, () => console.log(`VikingCMS dashboard running on port ${port}!`))
            
            open('http://localhost:' + port);

        });

    },

    generateRoutes: function(){
        
        app.get('/', (req, res) => 
            res.render(pathToPackage + '/src/dashboard/index', { request: req, debug: debug, session: req.session }) 
        );
        
        app.get('/posts', function(req, res){
            dashboard.getPosts(function(posts){
                res.render(pathToPackage + '/src/dashboard/posts', { request: req, posts: posts, debug: debug, session: req.session });
            });
        });

        app.get('/posts/create', function(req, res){
            res.render(pathToPackage + '/src/dashboard/single', { request: req, post: {}, debug: debug, session: req.session });
        });

        app.post('/posts/delete', function(req, res){
            let slug = req.body.slug;
            let filename = dashboard.getFilenameFromSlug(req.body.slug);

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

        app.post('/uploadFile', upload.single('image'), function(req, res){
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
            
            // req.file.mv(imagesFolder + 'awesome.jpg', function(err) {
            //     if (err)
            //         return res.status(500).send(err);
            
            //         res.json({
            //             success : 1,
            //             file : {
            //                 "url" : "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg"
            //             }
            //         });
            // });
            //   let base64String = req.body.file; // Not a real image
            //   console.log('here is the string ' + base64String);
            // // Remove header
            // let base64Image = base64String.split(';base64,').pop();
            
            //   fs.writeFileSync(imagesFolder + "rad.jpg", base64Image, 'base64');

            //     res.json({
            //         success : 1,
            //         file : {
            //             "url" : imagesFolder + "rad.jpg",
            //         }
            //     });
              

              

        });

    

        app.post('/posts/create', function(req, res){
            
            let postJson = {
                title: req.body.title,
                slug: req.body.slug,
                image: req.body.image,
                status: "published",
                body: req.body.body,
                meta: {},
                created_at: "",
                modified_at: ""
            }

            let filename = dashboard.getFilenameFromSlug(postJson.slug);

            fs.access(filename, fs.F_OK, (err) => {
                // if we cannot access the file we can write it
                if (err) {
                    fs.writeFile(filename, JSON.stringify(postJson), 'utf8', function(){

                    });
                    res.json({ status: 'success', slug: postJson.slug });
                } else {
                    res.json({ status: 'File Already Exists', slug: postJson.slug });
                }

              });
            
            
        });

        app.get('/post/:post', function(req, res){
            dashboard.getPost(req.params.post, function(post){
                //console.log(post);
                //res.json({ status: 'hmmm', post: post });
                res.render(pathToPackage + '/src/dashboard/single', { request: req, post: post, debug: debug, session: req.session });
            });
        });

        app.get('/fetchURL', function(req, res){
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
            files.forEach(file => {
                //console.log(file);
                let filename = file.replace('.json', '');
                posts.push( JSON.parse( fs.readFileSync( postsFolder + file ) ) );
            });
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
