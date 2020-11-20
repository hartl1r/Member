// member.js

// DEFINE VARIABLES
// Color constants
const colors = {
    bg_NeedSM:  "#0000FF",  // Blue
    fg_NeedSM:  "#FFFFFF",  // White 
    bg_NeedTC:  "#00FF00",  // Green
    fg_NeedTC:  "#000000",  // Black (#000000)
    bg_NeedBoth:"#FF0000",  // Red (#FF0000)
    fg_NeedBoth:"#FFFFFF",  // White (#FFFFFF)
    bg_Filled:  "#FFFFFF",  // White (#FFFFFF)
    fg_Filled:  "#000000",  // Black (#000000)
    bg_Sunday:  "#cccccc",  // Light grey
    fg_Sunday:  "#FFFFFF",  // White (#FFFFFF)
    bg_Closed:  "#2E86C1",  // Aqua
    fg_Closed:  "#FFFFFF",  // White (#FFFFFF)
    bg_ToManySM:"#FAFE02",  // Yellow
    fg_ToManySM:"#000000",  // Black
    bg_ToManyTC:"#FE4E02",  // Orange
    fg_ToManyTC:"#000000",  // Black
    bg_PastDate:"#cccccc",  // Light grey
    fg_PastDate:"#FFFFFF"   // White (#FFFFFF)
};

// Declare global variables)

// THE COOKIES FOR clientLocation AND staffID will be set as cookies within login routine

// IF clientLocation COOKIE IS NOT FOUND, PROMPT FOR LOCATION
checkLocationCookie()
var clientLocation = ''
clientLocation= getCookie('clientLocation')

var todaysDate = new Date();
var todaysDateSTR =  (todaysDate.getFullYear() + "-" + ("0"+(todaysDate.getMonth()+1)).slice(-2) + "-" + ("0" + todaysDate.getDate()).slice(-2))

var shopNames = ['Rolling Acres', 'Brownwood']
var currentMemberID = ''
var curShopNumber = ''

//==================================================================
// PAGE START-UP STATEMENTS 
//==================================================================

// SHOW 'ACCEPT DUES ...' BUTTON IF TIME TO COLLECT DUES
acceptDuesDate = document.getElementById('acceptDuesDateID').value
acceptDuesBtn = document.getElementById('acceptDuesID')
if (todaysDateSTR  < acceptDuesDate) {
    acceptDuesBtn.style.display='none'
    //acceptDuesBtn.setAttribute('disabled','disabled')
}

// SET OPTIONS IN SELECT ELEMENTS BASED ON TEXT VALUES
typeOfWorkText = document.getElementById('typeOfWorkTextID').value
typeOfWorkSelect = document.getElementById('typeOfWorkSelecterID')
typeOfWorkSelect.value = typeOfWorkText

skillLevelText = document.getElementById('skillLevelTextID').value
skillLevelSelect = document.getElementById('skillLevelSelecterID')
if (skillLevelSelect != null) {
    skillLevelSelect.value = skillLevelText
}
// ASSIGN PANELS TO VARIABLES
localContactInfo = document.getElementById('localContactID')
altContactInfo = document.getElementById('altContactID')
emergencyInfo = document.getElementById('emergencyID')
membershipInfo = document.getElementById('membershipID')
certificationInfo = document.getElementById('certificationID')
monitorDutyInfo = document.getElementById('monitorDutyID')

// RETRIEVE LOCAL STORAGE VALUES (no longer needed?)



// IF NO staffID COOKIE, PROMPT FOR AN ID
checkStaffCookie()
var staffID = getCookie('staffID')

// SET STAFF ID IN EACH PANEL
var staffIDelements = document.getElementsByClassName('staffID')
for (var i = 0; i > staffIDelements.length; i++) {
    console.log(staffIDelements[i].name)
    staffIDelements[i].setAttribute("value", staffID);
}

// IF clientLocation IS NOT FOUND, PROMPT FOR LOCATION
var clientLocation = getCookie('clientLocation')
setShopFilter(clientLocation)

// DEFINE EVENT LISTENERS
localContactInfo.addEventListener('change',localDataChanged);
altContactInfo.addEventListener('change',altDataChanged);
emergencyInfo.addEventListener('change',emergencyDataChanged);
membershipInfo.addEventListener('change',membershipDataChanged);
certificationInfo.addEventListener('change',certificationDataChanged);
monitorDutyInfo.addEventListener('change',monitorDutyDataChanged);

// MODAL EVENT LISTENERS
document.getElementById("cancelNoteID").addEventListener("click",cancelNote)
document.getElementById("processMsgID").addEventListener("click",processNote)

document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)
document.getElementById("selectpicker").addEventListener("click",memberSelectedRtn)

document.getElementById("typeOfWorkSelecterID").addEventListener("change",typeOfWorkRtn)
document.getElementById("skillLevelSelecterID").addEventListener("change",skillLevelRtn)

document.querySelector('#monthCheckboxesID').onclick = function(ev) {
    inputID = ev.target.id + 'ResidentValue'
    if (ev.target.checked) {
        document.getElementById(inputID).value='True'
    }
    else {
        document.getElementById(inputID).value='False' 
    }
}

// HIDE DETAIL UNTIL A MEMBER IS SELECTED
if (memberID.value == 'undefined' | memberID.value == ''){
    panels = document.getElementsByClassName('panel')
    for (i = 0; i < panels.length; i++) {
        panels[i].style.display='none'
    }
}
else
{
    // SHOW member options buttons in member menu
    document.getElementById('clearScreenBtnID').removeAttribute('disabled')
    document.getElementById('noteBtnID').removeAttribute('disabled')
    document.getElementById('classSignUpBtnID').removeAttribute('disabled')
    document.getElementById('rolesBtnID').removeAttribute('disabled')
    document.getElementById('mntrSchedBtnID').removeAttribute('disabled')
    document.getElementById('showPhotoBtn').removeAttribute('disabled')
}   
           

// CHECK BOX LISTENERS; SET VALUE TO STRING OF 'True' WHEN CLICKED
// CANNOT PASS BOOLEAN VALUES
document.getElementById('defibrillatorID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('defibrillatorID').value='True'
    }
    else {
        document.getElementById('defibrillatorID').value='False' 
    }
}

document.getElementById('noEmergDataID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('noEmergDataID').value='True'
    }
    else {
        document.getElementById('noEmergDataID').value='False' 
    }
}
// SET VALUE OF MEDICAL INFO WHEN CLICKED
document.getElementById('emergPacemakerID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('emergPacemakerID').value='True'
    }
    else {
        document.getElementById('emergPacemakerID').value='False' 
    }
}
document.getElementById('emergStentID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('emergStentID').value='True'
    }
    else {
        document.getElementById('emergStentID').value='False' 
    }
}
document.getElementById('emergCABGID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('emergCABGID').value='True'
    }
    else {
        document.getElementById('emergCABGID').value='False' 
    }
}
document.getElementById('emergMIID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('emergMIID').value='True'
    }
    else {
        document.getElementById('emergMIID').value='False' 
    }
}
document.getElementById('emergDiabetes1ID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('emergDiabetes1ID').value='True'
    }
    else {
        document.getElementById('emergDiabetes1ID').value='False' 
    }
}
document.getElementById('emergDiabetes2ID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('emergDiabetes2ID').value='True'
    }
    else {
        document.getElementById('emergDiabetes2ID').value='False' 
    }
}

// SET VALUE OF MEMBERSHIP STATUS CHECKBOXES WHEN CLICKED
document.getElementById('duesPaidID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('duesPaidID').value='True'
    }
    else {
        document.getElementById('duesPaidID').value='False' 
    }
}
document.getElementById('volunteerID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('volunteerID').value='True'
    }
    else {
        document.getElementById('volunteerID').value='False' 
    }
}
document.getElementById('inactiveID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('inactiveID').value='True'
        document.getElementById('inactiveDateID').value = todaysDateSTR
    }
    else {
        document.getElementById('inactiveID').value='False' 
    }
}
document.getElementById('deceasedID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('deceasedID').value='True'
    }
    else {
        document.getElementById('deceasedID').value='False' 
    }
}
document.getElementById('restrictedID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('restrictedID').value='True'
    }
    else {
        document.getElementById('restrictedID').value='False' 
    }
}
document.getElementById('villagesWaiverID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('villagesWaiverID').value='True'
        document.getElementById('villagesWaiverDateSigned').value = todaysDateSTR
    }
    else {
        document.getElementById('villagesWaiverID').value='False' 
        document.getElementById('villagesWaiverDateSigned').value = ''
    }
}
// SET VALUE OF CERTIFICATION PANEL CHECKBOXES WHEN CLICKED
document.getElementById('RAcertifiedID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('RAcertifiedID').value='True'
    }
    else {
        document.getElementById('RAcertifiedID').value='False' 
    }
}

document.getElementById('BWcertifiedID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('BWcertifiedID').value='True'
    }
    else {
        document.getElementById('BWcertifiedID').value='False' 
    }
}

document.getElementById('RAwillSub').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('RAwillSub').value='True'
    }
    else {
        document.getElementById('RAwillSub').value='False' 
    }
}

document.getElementById('BWwillSub').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('BWwillSub').value='True'
    }
    else {
        document.getElementById('BWwillSub').value='False' 
    }
}


// ------------------------------------------------------------------------------------------------------
// FUNCTIONS    
// ------------------------------------------------------------------------------------------------------
function setShopFilter(shopLocation) {
    switch(shopLocation){
        case 'RA':
            localStorage.setItem('shopFilter','RA')
            shopFilter = 'RA'
            curShopNumber = '1'
            break;
        case 'BW':
            localStorage.setItem('shopFilter','BW')
            shopFilter = 'BW'
            curShopNumber = '2'
            break;
        default:
            localStorage.setItem('shopFilter','RA')
            shopFilter = 'RA'
            curShopNumber = '1'
    }   
}

function memberSelectedRtn() {
    selectedMember = this.value
    lastEight = selectedMember.slice(-8)
    currentMemberID= lastEight.slice(1,7)
    document.getElementById('selectpicker').value=''
    imgLink = document.getElementById('memberImgID')
    imgLink.link = "{{ url_for('static', filename='memberPhotos/" + currentMemberID + ".jpg') }}"
    localStorage.setItem('currentMemberID',currentMemberID)
    

    // SET UP LINK TO MEMBER FORM 
    var linkToMemberBtn = document.getElementById('linkToMember');
    link='/index/' + currentMemberID 
    linkToMemberBtn.setAttribute('href', link)
    linkToMemberBtn.click()
}

function localDataChanged() {
    document.getElementById('localCancelBtn').style.display='inline';
    document.getElementById('localSaveBtn').style.display='inline';
    altContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    altContactInfo.style.color="rgba(0,0,0,0.6)"
    emergencyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    emergencyInfo.style.color="rgba(0,0,0,0.6)"
    membershipInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    membershipInfo.style.color="rgba(0,0,0,0.6)"
    certificationInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    certificationInfo.style.color="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.color="rgba(0,0,0,0.6)"

}

function altDataChanged() {
    document.getElementById('altCancelBtn').style.display='inline';
    document.getElementById('altSaveBtn').style.display='inline';
    localContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    localContactInfo.style.color="rgba(0,0,0,0.6)"
    emergencyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    emergencyInfo.style.color="rgba(0,0,0,0.6)"
    membershipInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    membershipInfo.style.color="rgba(0,0,0,0.6)"
    certificationInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    certificationInfo.style.color="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.color="rgba(0,0,0,0.6)"
}

function emergencyDataChanged() {
    document.getElementById('emergCancelBtn').style.display='inline';
    document.getElementById('emergSaveBtn').style.display='inline';
    localContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    localContactInfo.style.color="rgba(0,0,0,0.6)"
    altContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    altContactInfo.style.color="rgba(0,0,0,0.6)"
    membershipInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    membershipInfo.style.color="rgba(0,0,0,0.6)"
    certificationInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    certificationInfo.style.color="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.color="rgba(0,0,0,0.6)"
}

function membershipDataChanged() {
    document.getElementById('memberCancelBtn').style.display='inline';
    document.getElementById('memberSaveBtn').style.display='inline';
    localContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    localContactInfo.style.color="rgba(0,0,0,0.6)"
    altContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    altContactInfo.style.color="rgba(0,0,0,0.6)"
    emergencyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    emergencyInfo.style.color="rgba(0,0,0,0.6)"
    certificationInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    certificationInfo.style.color="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.color="rgba(0,0,0,0.6)"
}

function certificationDataChanged() {
    document.getElementById('certificationCancelBtn').style.display='inline';
    document.getElementById('certificationSaveBtn').style.display='inline';
    localContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    localContactInfo.style.color="rgba(0,0,0,0.6)"
    altContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    altContactInfo.style.color="rgba(0,0,0,0.6)"
    emergencyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    emergencyInfo.style.color="rgba(0,0,0,0.6)"
    membershipInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    membershipInfo.style.color="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    monitorDutyInfo.style.color="rgba(0,0,0,0.6)"
}

function monitorDutyDataChanged() {
    document.getElementById('monitorDutyCancelBtn').style.display='inline';
    document.getElementById('monitorDutySaveBtn').style.display='inline';
    localContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    localContactInfo.style.color="rgba(0,0,0,0.6)"
    altContactInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    altContactInfo.style.color="rgba(0,0,0,0.6)"
    emergencyInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    emergencyInfo.style.color="rgba(0,0,0,0.6)"
    membershipInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    membershipInfo.style.color="rgba(0,0,0,0.6)"
    certificationInfo.style.backgroundColor="rgba(0,0,0,0.6)"
    certificationInfo.style.color="rgba(0,0,0,0.6)"
}



// function monthCheckboxRtn() {
//     if (this.checked) {
//         this.value = True
//     }
//     else {
//         this.value = False
//     }
// }

function findAllVariables() { 
    msg=''
    for (let variable in window) { 
        if (window.hasOwnProperty(variable)) { 
            msg += variable + '\n'
            console.log(variable); 
        } 
    } 
    alert(msg)
} 

/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
function showMenu() {
    document.getElementById("myDropdown").classList.toggle("show");
  }
  
  // Close the dropdown if the user clicks outside of it
  window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }

function noteRoutine() {
    // CHECK FOR EXISTING NOTE
    // IF FOUND, DISPLAY IN MSG
    memberID = document.getElementById('memberID').value
    $.ajax({
        url : "/getNoteToMember",
        type: "GET",
        data : {
            memberID:memberID,
            },
 
        success: function(data, textStatus, jqXHR)
        {
            if (data.msg) {
                msg = data.msg
                msgElement = document.getElementById('msgID')
                msgElement.value = msg
            }
        },
        error: function(result){
            alert("Error ..."+result)
        }
    })    
    $('#noteModalID').modal('show')
}

function cancelNote() {
    $('#noteModalID').modal('hide')
}

function processNote() {
    //console.log('processNote')
    memberID = document.getElementById('memberID').value
    show = document.getElementById('showAtCheckIn')
    send = document.getElementById('sendEmail')
    msg = document.getElementById('msgID').value
    eMailAddr = document.getElementById('eMailID').value
    //console.log('memberID - '+memberID + '\nshow - '+show.checked+'\nsend - '
    //+send.checked+'\nmsg - '+msg+'\neMailAddr - '+eMailAddr)
    
    if (show.checked) {
        showAtCheckIn='true'
    }
    else {
        showAtCheckIn='false'
    }
    if (send.checked) {
        //console.log('send routine ...')
        sendEmail = 'true'
        
        //console.log ('eMailAddr - ' + eMailAddr)
        //alert ('emailAddress - '+eMailAddr)
    }
    else {
        sendEmail = 'false' 
    } 
      
    $.ajax({
        url : "/processNoteToMember",
        type: "GET",
        data : {
            showAtCheckIn: showAtCheckIn,
            sendEmail: sendEmail,
            memberID:memberID,
            eMailAddr:'hartl1r@gmail.com',
            msg:msg},

        success: function(data, textStatus, jqXHR)
        {
            alert(data)
        },
        error: function(result){
            alert("Error ..."+result)
        }
    }) 
    
    $('#noteModalID').modal('hide')

}
// $('#noteModalID').on('shown.bs.modal', function () {
//     $('#msgID').focus();
// }) 

function rolesRoutine() {
    alert('rolesRoutine')
    // CHECK FOR EXISTING role
    // IF FOUND, DISPLAY IN MSG
    memberID = document.getElementById('memberID').value
    $.ajax({
        url : "/getRoles",
        type: "GET",
        data : {
            memberID:memberID,
            },
 
        success: function(data, textStatus, jqXHR)
        {
            if (data.msg) {
                memberRoles = data.memberRoles
            }
        },
        error: function(result){
            alert("Error ..."+result)
        }
    })
    alert('show role modal')    
    $('#roleModalID').modal('show')
}
function cancelRole() {
    $('#roleModalID').modal('hide')
}

function setPhotoSrc() {
    photo = document.getElementsByClassName('memberImgID')
    photo.src = "{{ url_for('static', filename='memberPhotos/" + currentMemberID + ".jpg') }}"
}
function showHidePhoto(objBtn) {
    photo = document.getElementById('memberImgID')
    memberID = document.getElementById('memberID').value
    if (objBtn.innerHTML == 'SHOW PHOTO'){
        objBtn.innerHTML = 'HIDE PHOTO'
        photo.src = "/static/memberPhotos/" + memberID + ".jpg "
        photo.style.display='inline'
    }
    else {
        objBtn.innerHTML = 'SHOW PHOTO'
        photo.style.display='none'
    }
}

function typeOfWorkRtn() {
    typeOfWork = this.value
    document.getElementById('typeOfWorkTextID').value=this.value
}

function skillLevelRtn() {
    skillLevel = this.value
    document.getElementById('skillLevelTextID').value=this.value
}
function clearScreen() {
    var linkToMemberBtn = document.getElementById('linkToMember');
    link='/index/' 
    linkToMemberBtn.setAttribute('href', link)
    linkToMemberBtn.click()
}
  
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  
  function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
  function checkStaffCookie() {
    var staffID = getCookie("staffID");
    if (staffID != "") {
    } else {
      staffID = prompt("Please enter your village ID:", "");
      if (staffID != "" && staffID != null) {
        setCookie("staffID", staffID, 365);
      }
    }
  }
  function checkLocationCookie() {
    var clientLocation = getCookie("clientLocation");
    if (clientLocation != "") {
    } else {
      clientLocation = prompt("Please enter your location (RA/BW):", "");
      if (clientLocation != "" && clientLocation != null) {
        setCookie("clientLocation", clientLocation, 365);
      }
    }
  }


function acceptDues() {
    var memberID = document.getElementById('memberID').value
    $.ajax({
        url : "/acceptDues",
        type: "GET",
        data : {
            memberID:memberID
        },
        success: function(data, textStatus, jqXHR)
        {
            alert(data)
            location.reload()
        },
        error: function(result){
            alert("Error ..."+result)
        }
    }) 
}

function classSignUp() {
    alert ('routine not ready')
    return
}

function linkToMonitorSchedule() {
    alert('link not ready')
}