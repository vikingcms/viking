const fs = require('fs-extra');
let folder = require(require("global-modules-path").getPath("viking") + '/src/lib/folder.js');

class Post{

    constructor(){
        this.loadPosts();
    }

    orderBy(key, order){
        this.loadPosts();
        // default to ASC order
        if(typeof(order) == 'undefined'){
            order = 'ASC';
        }

        if(order == 'ASC'){
            this.posts = this.posts.sort((a, b) => (a[key] > b[key]) ? 1 : -1);
        } else {
            this.posts = this.posts.sort((a, b) => (a[key] < b[key]) ? 1 : -1);
        }
        return this;
    }

    loadPosts(){
        this.posts = [];
        let postFiles = fs.readdirSync( folder.postPath() )

        let self = this;
        postFiles.forEach(function (postFile, index) {
            self.posts.push( fs.readJSONSync( folder.postPath() + postFile ) );
        });
    }

    getPosts(){
        return this.posts;
    }

}

module.exports = Post;