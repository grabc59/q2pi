  'use strict';

function uploadFile(file, signedRequest, url){
  $('.progress-bar').text('0%');
  $('.progress-bar').width('0%');
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', signedRequest);
  // listen to the 'progress' event
  xhr.upload.addEventListener('progress', function(evt) {
    if (evt.lengthComputable) {
      // calculate the percentage of upload completed
      var percentComplete = evt.loaded / evt.total;
      percentComplete = parseInt(percentComplete * 100);

      // update the Bootstrap progress bar with the new percentage
      $('.progress-bar').text(percentComplete + '%');
      $('.progress-bar').width(percentComplete + '%');

      // once the upload reaches 100%, set the progress bar text to done
      if (percentComplete === 100) {
        $('.progress-bar').html('Done, redirecting...');
        window.setTimeout( function(){
          window.location.href = "/landing";
        }, 1600);
      }
    }
  }, false);
  // xhr.onreadystatechange = () => {
  //   if(xhr.readyState === 4){
  //     if(xhr.status === 200){
  //       window.setTimeout( function(){
  //         window.location.href = "/landing";
  //       }, 1600);
  //     }
  //     else{
  //       alert('Could not upload file.');
  //     }
  //   }
  // };
  xhr.send(file);
}

/*
  Function to get the temporary signed request from the app.
  If request successful, continue to upload the file using this signed
  request.
*/
function getSignedRequest(file){
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `/uploads/sign-s3?file-name=${file.name}&file-type=${file.type}`);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4){
      console.log(xhr.responseText);
      if(xhr.status === 200){
        const response = JSON.parse(xhr.responseText);
        uploadFile(file, response.signedRequest, response.url);
      }
      else{
        alert('Could not get signed URL.');
      }
    }
  };
  xhr.send();
}

/*
 Function called when file input updated. If there is a file selected, then
 start upload procedure by asking for a signed request from the app.
*/
function initUpload(){
  const files = document.getElementById('file-input').files;
  const file = files[0];
  if(file == null){
    return alert('No file selected.');
  }
  getSignedRequest(file);
}

/*
 Bind listeners when the page loads.
*/
(() => {
    document.getElementById('file-input').onchange = initUpload;
})();
