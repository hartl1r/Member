

(function () {
  if (
    !"mediaDevices" in navigator ||
    !"getUserMedia" in navigator.mediaDevices
  ) {
    alert("Camera API is not available in your browser");
    return;
  }

  // RETURN TO MEMBER SCREEN ROUTINE
  document.getElementById('btnReturnToMember').onclick = function() {
    memberID = document.getElementById('memberID').value
    url = "/index/?villageID=" + memberID
    console.log('memberID - '+memberID)
    window.location.href=url
  }

  

  // SEND IMAGE TO SERVER
  function savePhoto() {
    console.log('this.id - '+this.id)
  }
  // SAVE PHOTO (single button save version, not being used)
  // document.getElementById('btnSavePhoto').onclick = function() {
  //   alert ('copy photo to database')
  //   canvas = document.getElementById('canvas')
  //   img = canvas.toDataURL("image/png");
  //   $.ajax({
  //       url: "/savePhoto",
  //       type: "GET",
  //       data: {
  //           memberID:memberID,
  //           img:img
  //       },
  //       success: function(data, textStatus, jqXHR)
  //       {
  //           if (data.msg != 'SUCCESS') {
  //               alert(data.msg)
                
  //               return
  //           }
  //           alert('Photo saved.')
  //           window.history.back()
  //       },
  //       error: function(jqXHR, textStatus, errorThrown){
  //           alert("savePhoto Error ..."+errorThrown+'\n'+textStatus)
  //       }
  //   })
  // }
 
  // get page elements
  const video = document.querySelector("#video");
  const btnPlay = document.querySelector("#btnPlay");
  const btnPause = document.querySelector("#btnPause");
  const btnScreenshot = document.querySelector("#btnScreenshot");
  const btnChangeCamera = document.querySelector("#btnChangeCamera");
  const screenshotsContainer = document.querySelector("#screenshots");
  const canvas = document.querySelector("#canvas");
  const devicesSelect = document.querySelector("#devicesSelect");
  const screenshots = document.querySelector("#screenshots");

  // video constraints
  const constraints = {
    video: {
      width: {
        min: 1280,
        ideal: 1920,
        max: 2560,
      },
      height: {
        min: 720,
        ideal: 1080,
        max: 1440,
      },
    },
  };

  // use front face camera
  let useFrontCamera = true;

  // current video stream
  let videoStream;

  // handle events
  // play
  // btnPlay.addEventListener("click", function () {
  //   video.play();
  //   btnPlay.classList.add("is-hidden");
  //   btnPause.classList.remove("is-hidden");
  // });

  // pause
  // btnPause.addEventListener("click", function () {
  //   video.pause();
  //   btnPause.classList.add("is-hidden");
  //   btnPlay.classList.remove("is-hidden");
  // });

  // take screenshot
  btnScreenshot.addEventListener("click", function () {
    if (localStorage.getItem('takeNumber') == ''){
      localStorage.setItem('takeNumber',0)
      takeNumber = 0
    }
    else{
      takeNumber = parseInt(localStorage.getItem('takeNumber')) + 1
      localStorage.setItem('takeNumber',takeNumber)
    }

    const img = document.createElement("img");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.id='take' + String(takeNumber)
    console.log('take# - ',takeNumber)

    canvas.getContext("2d").drawImage(video, 0, 0);
    img.src = canvas.toDataURL("image/png");
    img.id = 'img_' + String(takeNumber)
    screenshotsContainer.prepend(img);
    const imgBtn = document.createElement("BUTTON");
    imgBtn.id = 'btn_' + String(takeNumber)
    imgBtn.innerHTML = "SAVE";
    imgBtn.classList.add("saveBtn", "btn", "btn-primary", "btn-sm");
    screenshotsContainer.prepend(imgBtn);
    //alert('photo displayed')
  });
// ========================================================================================



  // switch camera
  //btnChangeCamera.addEventListener("click", function () {
  //  useFrontCamera = !useFrontCamera;

  //  initializeCamera();
  //});

  // stop video stream
  function stopVideoStream() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  // initialize
  async function initializeCamera() {
    stopVideoStream();
    constraints.video.facingMode = useFrontCamera ? "user" : "environment";

    try {
      videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = videoStream;
    } catch (err) {
      alert("Could not access the camera");
    }
  }

  initializeCamera();
})();

// SAVE SELECTED PHOTO
//screenshots.addEventListener("click", function (e) {
//  console.log('screenshots click')
//  console.log('e.target.innerhtml - '+e.target.innerHTML)
  //canvas=document.getElementById('take1')
//  canvas = e.target.nextElementSibling
  
//  console.log('canvas.tagName - '+canvas.tagName)
  //console.log('canvas.id - '+canvas.id)
  //console.log('src - '+canvas.src)
  //canvas.toBlob(postFile,'image/jpeg');
//  memberID = document.getElementById('memberID').value
  //var dataURL = canvas.toDataURL()
  //img = canvas.toDataURL("image/png");
//  var dataURL = canvas.src
//  console.log('dataURL - '+dataURL)
//  console.log('before ajax call ')
 
//  saveImgToServer(memberID,dataURL)
//  window.history.back()
//})

// DEFINE EVENT HANDLER FOR SAVE BTN
saveBtns = document.getElementsByClassName('saveBtn')
saveBtns.onclick=function() {
  alert('this.id - '+this.id)

  //saveImgToServer(memberID,dataURL)
  //window.location.href=".........."
  }

function saveImgToServer(memberID,dataURL){
  console.log('saveImgToServer ...')
  testing = false
  if (testing){
    return
  }
  $.ajax({
    type: "GET",
    url:"/savePhoto",
    data: {
      memberID:memberID,
      dataURL:dataURL
      //imgBase64: dataURL
    },
    success: function(data, textStatus, jqXHR)
        {
            console.log('success rtn')
            if (data.msg != 'SUCCESS') {
                alert(data.msg)
                
                return
            }
            alert('Photo saved.')
            //window.history.back()
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert("savePhoto Error ..."+errorThrown+'\n'+textStatus)
      }
    })
    console.log('end of ajax')
  }


// function sendImgToServer2(member,dataURL){
//   var request = new XMLHttpRequest();
//   request.open("POST", "/path/to/server", true);
//   var data = new FormData();
//   data.append("image", dataURL, "imagename");
//   request.send(data);
// }



  // btn = e.target.id
  // console.log('btn caption - '+ btn.innerHTML)
  
  // console.log('img element - '+ imgTagName)

  
  // saveBtn = document.getElementById(this.id)
  // console.log('caption - '+saveBtn.innerHTML)
  
  // imgElement = this.nextElementSibling
  // console.log('innerHTML - '+ imgElement.innerHTML)
  // console.log('value - ' + this.value)
  // console.log('innerHTML - ' + this.innerhtml)
  // console.log('tag - '+ this.tag)
  // console.log(this.target.id)
  //alert('saveImage')
  // imgElement = this.nextElementSibling.id
  // document.getElementById(imgElement).style.border = "thin solid #0000FF"

