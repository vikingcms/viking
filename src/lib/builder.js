var path = require('path');
const fs = require('fs-extra');
// In newer Node.js versions where process is already global this isn't necessary.
var process = require("process");
let themeFolder = '/content/themes/';

let folder = require(require("global-modules-path").getPath("vikingcms") + '/src/lib/folder.js');
const config = require(folder.vikingPath() + '/src/lib/config.js');
const Post = require(folder.vikingPath() + 'src/lib/post.js');

let post = new Post();
let themePath = folder.themePath() + '2020/';

let builder = module.exports = {
    build: function(){
        
        let buildConfig = config.loadConfigs().build;
        let siteConfig = config.loadConfigs().site;
        let posts = post.orderBy('created_at', 'DESC').getPosts();

        // empty the site folder
        fs.emptyDirSync( folder.sitePath() );

        
        fs.readdir(themePath, function (err, files) {
            if (err) {
              console.error("Could not list the directory.", err);
              process.exit(1);
            }
          
            files.forEach(function (file, index) {
                let extension = path.extname(file);
                if(typeof(extension) != 'undefined' && extension == '.axe'){

                    // if debug mode is on we will write all posts to a json file
                    if(buildConfig.debug){
                        fs.writeJsonSync( folder.sitePath() + '/posts.json', posts, { spaces: '\t' });
                    }

                    if(file == 'home.axe'){
                        builder.writeFile(file, '', false, '');
                    }
                    
                    if(file == 'single.axe'){

                        posts.forEach(function (post, index) {
                            builder.writeFile(file, post.slug + '/', true, post);
                        });

                    }

                    if(file == 'loop.axe'){

                    }

                    // copy over all the assets
                    fs.copySync(themePath + '/site/', folder.sitePath());
                    // copy over all the images
                    fs.copySync(folder.imagePath(), folder.sitePath() + 'images/');

                }
                
            });
        });

        return {'status' : 'success'};
    },

    writeFile: function(file, directory, single, post){

        let buildConfig = config.loadConfigs().build;

        // turn into func used again below
        let contents = builder.replaceIncludes( builder.getHTML(themePath + file), themePath );
        contents = builder.replaceSettings( contents, folder.rootPath(), themePath);
        if(single){
            contents = builder.replacePostData( contents, post );
        }
        if(buildConfig.debug){
            contents = builder.addAdminBar(contents);
        }

        fs.outputFile(folder.sitePath() + directory + 'index.html', contents, (err) => {
            // throws an error, you could also catch it here
            if (err) throw err;
        
            // success case, the file was saved
            console.log('Built: ' + file);
        });
    },

    getHTML: function(file){
        return fs.readFileSync(file, 'utf8');
    },

    getPost: function(file){
        return fs.readFileSync(file, 'utf8');
    },

    replaceIncludes: function(contents, themePath){
        let include = contents.indexOf('@include', 0);

        while(include != -1){
            let endInclude = builder.endOfIncludeLocation(include, contents.substring(include, contents.length));
            let includeText = contents.substring(include, include+endInclude);
            let includeTemplate = includeText.split(" ");
            if(typeof(includeTemplate[1]) !== "undefined"){
                includeTemplate = includeTemplate[1].replace('.', '/');
                // fetch file contents and replace the template
                contents = contents.replace( includeText, builder.getHTML( themePath + includeTemplate + '.axe' ) );
            }
            include = contents.indexOf('@include', include+1);
        }

        return contents;
    },
    replaceSettings: function(contents, sitePath, themePath){
        //let loadSettings = builder.loadSettingsFile();
        let settings = {
                "title": "GetFullReport"
            };

        contents = contents.replace('{{ title }}', settings.title);

        return contents;
    },
    endOfIncludeLocation: function(start, str){
        let endIncludeLocation = str.length;
        let nextSpaceIndex = str.indexOf(" ", 10);
        let nextNewLineIndex = str.indexOf("\n", 10);
        if(nextSpaceIndex != -1 && nextSpaceIndex <= nextNewLineIndex){
            endIncludeLocation = nextSpaceIndex;
        }
        if(nextNewLineIndex != -1 && nextNewLineIndex <= nextSpaceIndex){
            endIncludeLocation = nextNewLineIndex;
        }
        return endIncludeLocation;
    },
    replacePostData: function( contents, post ){
        for (var key in post) {
            if (post.hasOwnProperty(key)) {
                
                let replaceThis = '{{ post.' + key + ' }}';
                let withThis = post[key];
                if(key == 'body'){
                    withThis = builder.renderHTML(post[key]);
                }
                contents = contents.replace(replaceThis, withThis);
            }
        }
        return contents;
    },
    renderHTML: function(data) {
        let result = ``;
        for (let block of data.blocks) {
          switch (block.type) {
            case 'paragraph':
              result += `<p>${block.data.text}</p>`;
              break;
            case 'header':
              result += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
              break;
            case 'list':
                if(block.data.style == 'ordered'){
                    result += `<ol>`;
                } else {
                    result += `<ul>`;
                }
                for(var i=0; i<block.data.items.length; i++){
                    result += `<li>` + block.data.items[i] + `</li>`;
                }
                if(block.data.style == 'ordered'){
                    result += `</ol>`;
                } else {
                    result += `</ul>`;
                }
              break;
            case 'image':
                result += `<img src="${block.data.file.url}" class="w-full">`;
                break;
          }
        }
        return result;
    },
    addAdminBar: function(contents) {
        return contents.replace('</body>', builder.adminBarHTML() + '</body>');
    },
    adminBarHTML: function() {
        return `<div class="fixed bottom-0 left-0 bg-black w-full h-10 flex justify-between items-center z-50">
                    <img src="/dashboard/assets/img/logo-inverse.svg" class="h-4 pl-2 w-auto">
                    <div class="flex h-10">
                        <a href="/dashboard" class="text-white font-medium inline-block h-full px-3 flex items-center text-xs uppercase border-r border-l border-gray-800">Dashboard</a>
                    </div>
                </div>`;
    }
};