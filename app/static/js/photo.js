
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
    screenshotsContainer.prepend(imgBtn);
  });

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

  // SAVE SELECTED PHOTO
  function savePhoto(id) {
    imgID = 'img_' + id.slice(4,5)
    photo = document.getElementById(imgID)
    memberID = document.getElementById('memberID').value
    dataURL = photo.src
    
    // SEND IMAGE TO SERVER
    $.ajax({
      type: "POST",
      url:"/savePhotoPOST",
      data: {
        memberID:memberID,
        imgBase64: dataURL
      },
      success: function(data, textStatus, jqXHR)
          {
              alert('Photo saved.')
              location.reload()
          },
          error: function(jqXHR, textStatus, errorThrown){
              alert("savePhoto Error ..."+errorThrown+'\n'+textStatus)
        }
    })
  }
    
  