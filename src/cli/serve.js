const getPort = require('get-port');
const open = require('open');
const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const bodyParser = require('body-parser');
const dateFormat = require('dateformat');
const app = express();
const fs = require('fs');
const ghpages = require('gh-pages');
const parse = require('parse-git-config');

const folder = require(require("global-modules-path").getPath("viking") + '/src/lib/folder.js');
const builder = require(folder.vikingPath() + 'src/lib/builder.js');
const settings = require(folder.vikingPath() + 'src/lib/settings.js');
const Post = require(folder.vikingPath() + 'src/lib/post.js');

const post = new Post();

const upload = multer({ dest : folder.imagePath() + 'tmp/' });
let debug = false;
let notificationShown = 0;

function getDateString(d){
	const year = d.getFullYear();
	const month = String(d.getMonth()+1).padStart(2, 0);
	const day = String(d.getDate()).padStart(2, 0);

	const hour = String(d.getHours()).padStart(2, 0);
	const minute = String(d.getMinutes()).padStart(2, 0);
	const second = String(d.getSeconds()).padStart(2, 0);

	return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

async function getRandomPort (preferredPort = 8000) {
    const port = await getPort({ port: preferredPort });
    return port;
}

let serve = module.exports = {
    launch() {

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

            app.listen(port, () => console.log(`Viking is running on port ${port}!`))
            
            open('http://localhost:' + port);

        });

    },

    generateRoutes() {
        
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
                        schema: req.body.meta_schema,
                        data: req.body.meta_data
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

        app.get('/dashboard/deploy', function(req, res){
            let envSettings = settings.load().environment;

            if(typeof envSettings.gh_token == 'undefined' || envSettings.gh_token == ''){
                console.log('No GH TOKEN available');
                req.session.notification = 'Could not deploy, no gh_token key in your environment.json';
                req.session.notification_type = 'danger';
                res.redirect('/dashboard');
            }

            let ghConfig = parse.sync();
            let githubURL = ghConfig['remote "origin"'].url.replace('https://', '').replace('http://', '');
            let checkForAtInURL = githubURL.split('@');
            if(typeof checkForAtInURL[1] !== 'undefined'){
                githubURL = checkForAtInURL[1];
            }

            
            if(githubURL.indexOf('.git') !== -1){
                githubURL = githubURL.replace(':', '/').replace('.git', '');
            }

            console.log('deploying to repo https://' + envSettings.gh_token + '@' + githubURL);
            
            ghpages.publish(folder.sitePath(), {
                branch: 'gh-pages',
                repo: 'https://' + envSettings.gh_token + '@' + githubURL
              }, function(){
                req.session.notification = 'Your site has been successfully deployed. Give it a few minutes to update.';
                req.session.notification_type = 'success';
                res.redirect('/dashboard');
                //res.json({ status: 'success', message: 'deployed to gh-pages branch of ' +  envSettings.gh_token + '@' + githubURL });
              });
        });

        app.get('/dashboard/post/:post', function(req, res){
            serve.getPost(req.params.post, function(post){
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

    getPost(slug, _callback) {
        let post = JSON.parse( fs.readFileSync( folder.post() + slug + '.json' ) );
        _callback(post);
    },

    getFilenameFromSlug(slug) {
        return folder.post() + slug + '.json';
    }
}
