var fs = require('fs');
var path = require('path');
const fse = require('fs-extra');
// In newer Node.js versions where process is already global this isn't necessary.
var process = require("process");
let themeFolder = '/content/themes/'

let builder = module.exports = {
    build: function(sitePath, theme){
        let themePath = sitePath + themeFolder + theme + '/';
        fs.readdir(themePath, function (err, files) {
            if (err) {
              console.error("Could not list the directory.", err);
              process.exit(1);
            }
          
            files.forEach(function (file, index) {
                let extension = path.extname(file);
                if(typeof(extension) != 'undefined' && extension == '.axe'){
                    console.log(file);

                    // turn into func used again below
                    let contents = builder.replaceIncludes( builder.getHTML(themePath + file), themePath );
                    contents = builder.replaceSettings( contents, sitePath, themePath);

                    if(file == 'home.axe'){

                        fs.writeFile(sitePath + '/index.html', contents, (err) => {
                            // throws an error, you could also catch it here
                            if (err) throw err;
                        
                            // success case, the file was saved
                            console.log('Built: ' + file);
                        });
                    }

                    if(file == 'single.axe'){

                        fs.readdir(sitePath + '/content/posts/json/', function (err, postFiles) {
                            if (err) {
                              console.error("Could not list the post directory.", err);
                              process.exit(1);
                            }
                            postFiles.forEach(function (postFile, index) {
                                let jsonPath = sitePath + '/content/posts/json/' + postFile;
                                let post = JSON.parse(builder.getPost(jsonPath));

                                let fileLocation = sitePath + '/' + postFile.replace('.json', '') + '/index.html';
                                
                                let postContents = builder.replaceIncludes( builder.getHTML(themePath + file), themePath );
                                postContents = builder.replaceSettings( contents, sitePath, themePath);
                                postContents = builder.replacePostData( contents, post );

                                fse.outputFile(fileLocation, postContents, err => {
                                    if(err) {
                                      console.log(err);
                                    } else {
                                        console.log('Built: ' + postFile);
                                    }
                                });
                            });

                        });

                    }

                    
                }
                //if( == 'axe'){
                    //console.log('processed: ' + file); 
                //}
                
            });
        });

        return {'success' : 1};
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
              result += `<p class="text-gray-700 mb-2">${block.data.text}</p>`;
              break;
            case 'header':
              result += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
              break;
            case 'list':
              result += ``;
              break;
          }
        }
        return result;
    }
};