
//(function () {
  if (
    !"mediaDevices" in navigator ||
    !"getUserMedia" in navigator.mediaDevices
  ) {
    alert("Camera API is not available in your browser");
  }
  
  // INITIALIZE PHOTO NUMBER COUNTER
  localStorage.setItem('takeNumber',0)

  // RETURN TO MEMBER SCREEN ROUTINE
  document.getElementById('btnReturnToMember').onclick = function() {
    memberID = document.getElementById('memberID').value
    url = "/index/?villageID=" + memberID
    window.location.href=url
  }
  
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

 

  // take screenshot
  btnScreenshot.addEventListener("click", function () {
    if (localStorage.getItem('takeNumber') == ''){
      localStorage.setItem('takeNumber',0)
      takeNumber = 0
    }
    else{
      takeNumber = parseInt(localStorage.getItem('takeNumber')) + 1
      console.log('incremented takeNumber - '+takeNumber)
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
    var id='btn_' + String(takeNumber)
    imgBtn.id = id
    imgBtn.innerHTML = "SAVE";
    imgBtn.classList.add("saveBtn", "btn", "btn-primary", "btn-sm");
    imgBtn.setAttribute('onclick','savePhoto(id)');
    //imgBtn.onclick = "savePhoto()";
     
    screenshotsContainer.prepend(imgBtn);
    //alert('photo displayed')
  });
// ========================================================================================

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


//})();

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

//var dataURL = canvas.toDataURL()
  //img = canvas.toDataURL("image/png");
//  var dataURL = canvas.src
//  console.log('dataURL - '+dataURL)
//  console.log('before ajax call ')
 
//  saveImgToServer(memberID,dataURL)
//  window.history.back()
//})

//

  //saveImgToServer(memberID,dataURL)
  //window.location.href=".........."
  //}

  // SEND IMAGE TO SERVER
  function savePhoto(id) {
    imgID = 'img_' + id.slice(4,5)
    photo = document.getElementById(imgID)
    memberID = document.getElementById('memberID').value
    console.log('memberID innerHTML - '+document.getElementById('memberID').innerHTML)
    dataURL = photo.src
    alert('dataURL - '+ dataURL)
    saveImgToServerGET(memberID,dataURL)
  }
function saveImgToServerGET(memberID,dataURL){
  console.log('saveImgToServerGET ...')
  console.log('type of dataURL - '+typeof(dataURL))
  console.log('memberID - '+memberID)
  alert('dataURL - '+dataURL)
  $.ajax({
    type: "GET",
    url:"/savePhotoGET",
    data: {
      memberID:memberID,
      imgBase64: dataURL
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

  function saveImgToServerPOST(memberID,dataURL){
    console.log('saveImgToServer ...')
    
    $.ajax({
      type: "POST",
      url:"/savePhotoPOST",
      data: {
        memberID:memberID,
        imgBase64: dataURL
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
