import EditorJS from '@editorjs/editorjs';
const Header = require('@editorjs/header');
const LinkTool = require('@editorjs/link');
const RawTool = require('@editorjs/raw');
import ImageTool from '@editorjs/image';
const axios = require('axios');
var slugify = require('slugify');
let createPost = null;
setCreatePostFalse();

if(document.getElementById('createPost') && parseInt(document.getElementById('createPost').value)){
    setCreatePostTrue();
}

const editor = new EditorJS({
  /**
   * Id of Element that should contain Editor instance
   */
  holderId: 'editor',
  tools: {
    header: Header,
    linkTool: {
        class: LinkTool,
        config: {
            endpoint: 'http://localhost:8008/fetchUrl', // Your backend endpoint for url data fetching
        }
    },
    raw: RawTool,
    image: {
        class: ImageTool,
        config: {
            endpoints: {
            byFile: 'http://localhost:8008/uploadFile', // Your backend file uploader endpoint
            byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
            }
        }
    },
    paragraph: {
        config: {
            placeholder: 'Tell your story...'
        }
    }
  },
  autofocus: !createPost,
  onReady: () => {
    renderBlocks();
  }
});

function renderBlocks(){
    //if( document.getElementById('editor').dataset.blocks ){
        let blocks = JSON.parse(document.getElementById('editor').dataset.blocks);
        editor.blocks.render(
            blocks
        );
    //}
}

if( document.getElementById('settings') ){

    document.getElementById('settings-open').addEventListener('click', function(){
        document.getElementById('settings').classList.add('open');
        
        setTimeout(function(){
            document.getElementById('settings-sidebar').classList.add('open');
        }, 10);
    });

    document.getElementById('settings-backdrop').addEventListener('click', function(){
        closeSettingsBar();
    });

    document.getElementById('settings-close').addEventListener('click', function(){
        closeSettingsBar();
    });

}

if( document.getElementById('save-post') ){
    document.getElementById('save-post').addEventListener('click', function(){
        savePost();
    });
}

if( document.getElementById('delete-post') ){
    document.getElementById('delete-post').addEventListener('click', function(){
        getPostData(function(data){
            
            axios.post('/posts/delete', {
                slug: data.slug
            })
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.location = '/posts';
                }
            })
            .catch(function (error) {
                console.log(error);
            });
        });
    });
}

function closeSettingsBar(){
    document.getElementById('settings-sidebar').classList.remove('open');
    setTimeout(function(){
        document.getElementById('settings').classList.remove('open');
    }, 300);
}

function savePost(){
   
    getPostData(function(data){
        axios.post('/posts/create', data)
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.history.pushState({}, title, '/posts' + data.slug);
                    setCreatePostFalse();
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    });

        
}

function getSlugValue(){
    let slug = document.getElementById('slug').value;
    if( slug == "" ){
        // return a slugified version of the title
        slug = slugify( document.getElementById('title').value );
    }

    // otherwise return the slug value since it is not empty
    return slug.toLowerCase();
}

function setCreatePostTrue(){
    document.getElementById('title').focus();
    createPost = true;
    document.getElementById('delete-post').classList.add('hidden');
}

function setCreatePostFalse(){
    createPost = false;
    if( document.getElementById('delete-post') ){
        document.getElementById('delete-post').classList.remove('hidden');
    }
}

function getPostData(_callback){
    editor.save().then((body) => {
        _callback({
            title: document.getElementById('title').value,
            body: body,
            slug: getSlugValue()
        });

    }).catch((error) => {
      console.log('Saving failed: ', error);
      _callback({});
    });
    
}

window.showNotification = function(type, message){
    createNotification(type, message);
    
    setTimeout(function(){
        let notification = document.getElementById('notification');
        if( notification ){
            notification.classList.add('open');
        }
    }, 0);
}

let notificationTemplate = function(type, message, title, color){
    return `<div class="fixed bottom-0 shadow-2xl group rounded-t-lg bg-white border border-gray-100 cursor-pointer transition ` + type + `" id="notification">
        <div class="float-left w-24">
            <div class="rounded-full absolute left-0 bg-black bg-gray-100 border-` + color + `-400 border-l-4 border-b-4 bubble"></div>
            <img src="/assets/img/notifications/` + type + `.png" class="h-48 -ml-8 -mt-8 relative">
        </div>
        <div class="flex flex-col justify-center h-full pl-4 pr-5">
            <h4 class="text-` + color + `-400 font-bold -mt-1 mb-1">` + title + `</h4>
            <p class="text-xs text-gray-500">` + message + `</p>
        </div>
        <div class="absolute right-0 top-0 bg-gray-100 group-hover:bg-gray-200 text-gray-400 rounded-full h-5 w-5 flex justify-center items-center text-xs leading-none font-bold mt-2 mr-2 cursor-pointer">&times;</div>
    </div>`;
}

let createNotification = function(type, message){
    let title = 'Notice';
    let color = 'gray';
    if(type == 'success'){
        title = 'Victory!';
        color = 'green';
    } else if(type == 'danger'){
        title = 'Dagummit!'
        color = 'red';
    } else if(type == 'info'){
        title = 'Goodaye!'
        color = 'indigo';
    } else if(type == 'warning'){
        title = 'Be Warned!'
        color = 'orange';
    }
    let dynamicElement = document.createElement('div');
    dynamicElement.innerHTML = notificationTemplate(type, message, title, color);
    document.body.appendChild(dynamicElement);
    document.getElementById('notification').addEventListener('click', function(){
        document.getElementById('notification').classList.remove('open');
        setTimeout(function(){
            document.getElementById('notification').remove();
        }, 300);
    });
    setTimeout(function(){
        if( document.getElementById('notification') ){
            document.getElementById('notification').classList.remove('open');
            setTimeout(function(){
                if( document.getElementById('notification') ){ document.getElementById('notification').remove(); }
            }, 300);
        }
    }, 3000);
}

showNotification('success', 'Your new post has been successfull created.');
//showNotification('danger', 'Something has went wrong trying to save your post.');
//showNotification('info', 'Did you know that you can upload an image for your post.');
//showNotification('warning', 'Make sure to enter a good title in your post.');