import EditorJS from '@editorjs/editorjs';
const Header = require('@editorjs/header');
const LinkTool = require('@editorjs/link');
const RawTool = require('@editorjs/raw');
import ImageTool from '@editorjs/image';
const List = require('@editorjs/list');
const Delimiter = require('@editorjs/delimiter');
const Quote = require('@editorjs/quote');
const Warning = require('@editorjs/warning');
const InlineCode = require('@editorjs/inline-code');
const axios = require('axios');
var slugify = require('slugify');
let createPost = null;
setCreatePostFalse();

if(document.getElementById('createPost') && parseInt(document.getElementById('createPost').value)){
    setCreatePostTrue();
}

async function getb6(file){
    return await (new Response(file)).text();
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
                byFile: '/dashboard/uploadFile', // Your backend file uploader endpoint
                byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
            }
            // uploader: {
            //     uploadByFile(file) {
            //         let base64Image = getb6(file);

            //         return fetch('/uploadFile', {
            //             method: 'POST',
            //             headers: {
            //                 'Accept': 'application/json',
            //                 'Content-Type': 'application/json'
            //             },
            //             body: JSON.stringify({
            //                 file: base64Image,
            //                 filename: file.name
            //             })
            //         }).then(function(response) {
            //                     //return response.data;
            //                     return {
            //                         "success" : 1,
            //                         "file": {
            //                             "url" : "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg",
            //                             // ... and any additional fields you want to store, such as width, height, color, extension, etc
            //                         }
            //                     };
            //                 });

            //         //return fileToBase64(file).then(function(result){

                        


            //             // fetch('/uploadFile', {
            //             //     method: 'POST',
            //             //     headers: {
            //             //         'Accept': 'application/json',
            //             //         'Content-Type': 'application/json'
            //             //     },
            //             //     body: JSON.stringify({
            //             //         file: base64Image,
            //             //         filename: file.name
            //             //     })
            //             // });



            //        // });

            //     //     let reader = new FileReaderSync();
  
            //     //     let base64Image = reader.onload = function (e) {
                        
            //     //         return e.target.result;

            //     //         // axios.post('/uploadFile', {
            //     //         //         file: e.target.result,
            //     //         //         filename: file.name
            //     //         // }).then(function(response) {
            //     //         //     return response.data;
            //     //         // })

            //     //    };
                    
            //     //     // Read the file
            //     //     reader.readAsDataURL(file);

            //     //     return fetch('/uploadFile', {
            //     //         method: 'POST',
            //     //         headers: {
            //     //             'Accept': 'application/json',
            //     //             'Content-Type': 'application/json'
            //     //         },
            //     //         body: JSON.stringify({
            //     //             file: base64Image,
            //     //             filename: file.name
            //     //         })
            //     //     }).then(function(response) {
            //     //         //return response.data;
            //     //         return {
            //     //             "success" : 1,
            //     //             "file": {
            //     //                 "url" : "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg",
            //     //                 // ... and any additional fields you want to store, such as width, height, color, extension, etc
            //     //             }
            //     //         };
            //     //     });

                    
            //     }
            // }
        }
    },
    paragraph: {
        config: {
            placeholder: 'Tell your story...'
        }
    },
    list: {
        class: List,
        inlineToolbar: true,
      },
      delimiter: Delimiter,
      inlineCode: {
        class: InlineCode,
        shortcut: 'CMD+SHIFT+M',
      },
      warning: Warning,
      quote: Quote
  },
  autofocus: !createPost,
  onReady: () => {
      console.log('rdy');
    renderBlocks();
  }
});

window.ceditor = editor;

function renderBlocks(){
    //if( document.getElementById('editor').dataset.blocks ){
        let blocks = {};
        if( document.getElementById('editor').dataset.blocks ){
            blocks = JSON.parse(document.getElementById('editor').dataset.blocks);
        }
        console.log(blocks + ' -');
        if(blocks){
        editor.blocks.render(
            blocks
        );
        }
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
            axios.post('/dashboard/posts/delete', {
                slug: data.slug
            })
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.location = '/dashboard/posts';
                }

                if(data.status == "fail"){
                    showNotification('danger', JSON.stringify(data.message) )
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
        axios.post('/dashboard/posts/create', data)
            .then(function (response) {
                let data = response.data;
                if(data.status == "success"){
                    window.history.pushState({}, title, '/dashboard/post/' + data.slug);
                    document.getElementById('slug').value = data.slug;
                    setCreatePostFalse();
                    showNotification('success', 'Your new post has been successfull created.');
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

if( document.getElementById('title') ){
    document.getElementById('title').addEventListener('keydown', function(evt){
        // if(evt.keyCode){
        //     document.getElementById('editor').click();
        // }
    });
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
            <img src="/dashboard/assets/img/notifications/` + type + `.png" class="h-48 -ml-8 -mt-8 relative">
        </div>
        <div class="flex flex-col justify-center h-full pl-4 pr-5">
            <h4 class="text-` + color + `-400 font-bold -mt-1 mb-1">` + title + `</h4>
            <p class="text-xs text-gray-500 overflow-scroll">` + message + `</p>
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
    }, 3999000);
}


// Add event listener click for the build button
if( document.getElementById('build-btn') ){
    document.getElementById('build-btn').addEventListener('click', function(){

    });
}

//showNotification('success', 'Your new post has been successfull created.');
//showNotification('danger', 'Something has went wrong trying to save your post.');
//showNotification('info', 'Did you know that you can upload an image for your post.');
//showNotification('warning', 'Make sure to enter a good title in your post.');