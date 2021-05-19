alert('beginning of photo.js')

// $(".saveBtn").click(function() {
//   alert('saveBtn this.id - '+this.id)
// })
console.log('const arrClass')
const arrClass = document.querySelectorAll(".saveBtn");
for (let i of arrClass) {
  i.addEventListener("click", (e) => {
      console.log("Perform Action")
    })
}

console.log('navigator test')
//(function () {
  if (
    !"mediaDevices" in navigator ||
    !"getUserMedia" in navigator.mediaDevices
  ) {
    alert("Camera API is not available in your browser");
    //return;
  }
  
  console.log('saveBtns rtn')
  var saveBtns = document.getElementsByClassName('saveBtn')

  for (var i = 0; i < saveBtns.length; i++) {
    console.log('i = '+i)
    saveBtns[i].addEventListener('click',savePhoto)
  }
  
  // var savePhoto = function() {
  //   alert('this.id - '+this.id)
  // }
    // saveBtns.onclick=function() {
      
  // DEFINE EVENT HANDLER FOR SAVE BTN
  // $('.saveBtn').click(function() {
  //   console.log('saveBtn id - '+this.id)
  //   alert('saveBtn id - ' + this.id)
  // })

  // document.getElementsByClassName('saveBtn').addEventListener('click', function (evt) {
  //   console.log('evt.target - ',evt.target,evt.target.id)
  //   alert('this.id - '+this.id)
  // })
  

  // INITIALIZE PHOTO NUMBER COUNTER
  localStorage.setItem('takeNumber',0)

  // RETURN TO MEMBER SCREEN ROUTINE
  document.getElementById('btnReturnToMember').onclick = function() {
    memberID = document.getElementById('memberID').value
    url = "/index/?villageID=" + memberID
    //console.log('memberID - '+memberID)
    window.location.href=url
  }

  function save1() {
    alert('save1')
  }
  function save2() {
    alert('save2')
  }
  function save3() {
    alert('save3')
  }
  // document.getElementById('btn_1').onclick = function() {
  //   console.log('btn_1 clicked')
  // }

  // document.getElementById('btn_2').onclick = function() {
  //   console.log('btn_2 clicked')
  //}

  // SEND IMAGE TO SERVER
  function savePhoto() {
    console.log('this.id - '+this.id)
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
    imgBtn.id = 'btn_' + String(takeNumber)
    imgBtn.innerHTML = "SAVE";
    imgBtn.classList.add("saveBtn", "btn", "btn-primary", "btn-sm");
    //imgBtn.onclick = "savePhoto";
     
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
//  memberID = document.getElementById('memberID').value
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

// btn_2=document.getElementById('btn_2')
// btn_2.addEventListener('click',savePhoto('btn_2'))

function saveImage(btnID) {
  alert('btnID - '+btnID)
}