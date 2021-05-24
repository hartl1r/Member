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

// DECLARE GLOBAL VARIABLES
var todaysDate = new Date();
var todaysDateSTR =  (todaysDate.getFullYear() + "-" + ("0"+(todaysDate.getMonth()+1)).slice(-2) + "-" + ("0" + todaysDate.getDate()).slice(-2))
var staffID = document.getElementById('staffID').value
var isDBA = document.getElementById('isDBA').value
var isManager = document.getElementById('isManager').value
var isCoordinator = document.getElementById('isCoordinator').value
//console.log('isDBA - '+isDBA)
//console.log('staffID - '+ staffID)
document.getElementById('BWcertifiedID').classList.add('indeterminate')
if (staffID == '604875' || staffID == '373608') {
    document.getElementById('copyPhotoBtn').style.display='block'
}
if (isDBA == 'True' | isManager == 'True') {
    setManagerPermissions()
}

if (isCoordinator == 'True') {
    document.getElementById('monitorDutyNotesID').removeAttribute('readonly')
    document.getElementById('monitorDutyNotesID').style=display='block'
}
// HAS A MEMBER ALREADY BEEN LOADED?
memberIDpassedIn = document.getElementById('memberID').value
if (memberIDpassedIn == ''){
    // THE PAGE DOES NOT CONTAIN A MEMBER RECORD
    // BUT ...
    // WAS THE USER WORKING ON A MEMBER RECORD?
    currentMemberID = localStorage.getItem('currentMemberID')
    if (currentMemberID != '' && currentMemberID != null){
        // SET UP LINK TO MEMBER FORM 
        var linkToMemberBtn = document.getElementById('linkToMember');
        link='/index/?villageID=' + currentMemberID 
        linkToMemberBtn.setAttribute('href', link)
        linkToMemberBtn.click()
    }
    else {
        
    }
}
else {
    currentMemberID = document.getElementById('memberID').value
    localStorage.setItem('currentMemberID',currentMemberID)
}

//==================================================================
// PAGE START-UP STATEMENTS 
//==================================================================

// SET INITIAL VALUES FOR SELECT STATEMENTS
curZipcode = document.getElementById('zipcodeTextID').value
selectZipcode = document.getElementById('zipcodeSelecterID')
if (curZipcode != '') {
    selectZipcode.value =  curZipcode
}
else{
    selectZipcode.value = ''
}


curVillage = document.getElementById('villageTextID').value
selectVillage = document.getElementById('villageSelecterID')
if (curVillage) {
    if (curVillage != '') { 
        selectVillage.value = curVillage
    }
}
else {
    selectVillage.value = ''
} 


// SHOW 'ACCEPT DUES ...' BUTTON IF TIME TO COLLECT DUES AND MEMBER HAS NOT PAID
acceptDuesDate = document.getElementById('acceptDuesDateID').value
acceptDuesBtn = document.getElementById('acceptDuesID')
duesPaid = document.getElementById('duesPaidID').value
volunteer = document.getElementById('volunteerID').value
restricted = document.getElementById('restrictedID').value
inActive = document.getElementById('inactiveID').value

if (todaysDateSTR  < acceptDuesDate) {
    acceptDuesBtn.style.display='none'
}
if (duesPaid == 'True') {
    acceptDuesBtn.style.display='none'
}

if (volunteer == 'True') {
    acceptDuesBtn.style.display='none'
}

if (restricted == 'True') {
    acceptDuesBtn.style.display = 'none'
}

if (inActive == 'True') {
    acceptDuesBtn.style.display = 'none'
}

typeOfWorkText = document.getElementById('typeOfWorkTextID').value
typeOfWorkSelect = document.getElementById('typeOfWorkSelecterID')
typeOfWorkSelect.value = typeOfWorkText

// ASSIGN PANELS TO VARIABLES
localContactInfo = document.getElementById('localContactID')
altContactInfo = document.getElementById('altContactID')
emergencyInfo = document.getElementById('emergencyID')
membershipInfo = document.getElementById('membershipID')
certificationInfo = document.getElementById('certificationID')
monitorDutyInfo = document.getElementById('monitorDutyID')
memberMenu = document.getElementById('myDropdown')

// DEFINE EVENT LISTENERS
localContactInfo.addEventListener('click',localDataChanged);
altContactInfo.addEventListener('click',altDataChanged);
emergencyInfo.addEventListener('click',emergencyDataChanged);
membershipInfo.addEventListener('click',membershipDataChanged);
certificationInfo.addEventListener('click',certificationDataChanged);
monitorDutyInfo.addEventListener('click',monitorDutyDataChanged);
memberMenu.addEventListener('click', function() {
    showMenu()
});

window.addEventListener('unload', function(event) {
    localStorage.removeItem('currentMemberID')
  });

// MODAL EVENT LISTENERS
document.getElementById("cancelNoteID").addEventListener("click",cancelNote)
document.getElementById("processMsgID").addEventListener("click",processNote)

document.getElementById("cancelStaffMsgID").addEventListener("click",cancelStaffMsg)
document.getElementById("saveStaffMsgID").addEventListener("click",saveStaffMsg)

document.getElementById("cancelPasswordID").addEventListener("click",cancelPassword)
document.getElementById("updatePasswordID").addEventListener("click",updatePassword)

document.getElementById("selectpicker").addEventListener("change",memberSelectedRtn)
document.getElementById("selectpicker").addEventListener("click",memberSelectedRtn)

document.getElementById("typeOfWorkSelecterID").addEventListener("change",typeOfWorkRtn)
document.getElementById("zipcodeSelecterID").addEventListener("change",zipCodeChangeRtn)
document.getElementById("villageSelecterID").addEventListener("change",villageChangeRtn)

//document.getElementById("copyExistingPhotoBtn").addEventListener("click",copyExistingPhoto)

document.getElementById("needsToolCribID").onclick = function(ev) {
    if (ev.checked) {
        document.getElementById("needsToolCribID").value = 'True'
    }
    else {
        document.getElementById("needsToolCribID").value = 'False'
    }
}
// HIDE DETAIL UNTIL A MEMBER IS SELECTED
memberID=document.getElementById('memberID')
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
    document.getElementById('passwordBtnID').removeAttribute('disabled')
    document.getElementById('classSignUpBtnID').removeAttribute('disabled')
    document.getElementById('rolesBtnID').removeAttribute('disabled')
    document.getElementById('editNameBtnID').removeAttribute('disabled')
    document.getElementById('chgVillageID').removeAttribute('disabled')
    document.getElementById('mntrSchedBtnID').removeAttribute('disabled')
    document.getElementById('showPhotoBtn').removeAttribute('disabled')
    document.getElementById('copyPhotoBtn').removeAttribute('disabled')
    document.getElementById('showCheckInsID').removeAttribute('disabled')
    document.getElementById('monitorSchedulingBtnID').removeAttribute('disabled')
    
}   
           

// CHECK BOX LISTENERS; SET VALUE TO STRING OF 'True' WHEN CLICKED
// CANNOT PASS BOOLEAN VALUES
document.getElementById('hasTempVillageID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('hasTempVillageID').value='True'
    }
    else {
        document.getElementById('hasTempVillageID').value='False' 
    }
}

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

        pacemaker = document.getElementById('emergPacemakerID')
        pacemaker.removeAttribute('checked','')
        pacemaker.setAttribute('onclick',"return false")
        pacemaker.value='False'

        stent = document.getElementById('emergStentID')
        stent.removeAttribute('checked','')
        stent.setAttribute('onclick',"return false")
        stent.value='False'

        cabg = document.getElementById('emergCABGID')
        cabg.removeAttribute('checked','')
        cabg.setAttribute('onclick',"return false")
        cabg.value='False'

        mi = document.getElementById('emergMIID')
        mi.removeAttribute('checked','')
        mi.setAttribute('onclick',"return false")
        mi.value='False'

        diabetes1 = document.getElementById('emergDiabetes1ID')
        diabetes1.removeAttribute('checked','')
        diabetes1.setAttribute('onclick',"return false")
        diabetes1.value='False'

        diabetes2 = document.getElementById('emergDiabetes2ID')
        diabetes2.removeAttribute('checked','')
        diabetes2.setAttribute('onclick',"return false")
        diabetes2.value='False'

        document.getElementById('emergOtherDiagnosisID').value = ''
        document.getElementById('emergDiabetesOtherID').value = ''
        document.getElementById('emergAlergiesID').value = ''
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
    console.log('RA - '+isDBA+isManager)
    if (isDBA == 'False' & isManager == 'False'){
        modalAlert("CERTIFICATION","You may not change this setting.")
        return false
    }
    if (ev.target.checked) {
        document.getElementById('RAcertifiedID').value='True'
    }
    else {
        document.getElementById('RAcertifiedID').value='False' 
    }
}

document.getElementById('BWcertifiedID').onclick = function(ev) {
    console.log('BW - '+isDBA+isManager)
    if (isDBA == 'False' & isManager == 'False'){
        modalAlert("CERTIFICATION","You may not change this setting.")
        return false
    }
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


function memberSelectedRtn() {
    selectedMember = this.value
    lastEight = selectedMember.slice(-8)
    currentMemberID= lastEight.slice(1,7)
    document.getElementById('selectpicker').value=''
    //imgLink = document.getElementById('memberImgID')
    //imgLink.link = "{{ url_for('static', filename='memberPhotos/" + currentMemberID + ".jpg') }}"
    localStorage.setItem('currentMemberID',currentMemberID)
    

    // SET UP LINK TO MEMBER FORM 
    var linkToMemberBtn = document.getElementById('linkToMember');
    link='/index/?villageID=' + currentMemberID 
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
    menu=document.getElementById('menuID')
    if (menu.innerHTML== 'SHOW MENU'){
        menu.innerHTML= 'HIDE MENU'
    }
    else {
        menu.innerHTML = 'SHOW MENU'
    }
    document.getElementById("myDropdown").classList.toggle("show");
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


function getStaffNoteRtn() {
    // GET CURRENT STAFF NOTE
    $.ajax({
        url : "/getNoteToStaff",
        type: "GET",
        data : {
            
            },
 
        success: function(data, textStatus, jqXHR)
        {
            if (data.msg) {
                msg = data.msg
                //msgElement = document.getElementById('staffMsgID')
                //msgElement.value = msg
                document.getElementById('staffMsgID').innerHTML = msg
            }
        },
        error: function(result){
            alert("Error ..."+result)
        }
    })    
    $('#staffNoteModalID').modal('show')
}

function cancelNote() {
    $('#noteModalID').modal('hide')
}

function cancelStaffMsg() {
    $('#staffNoteModalID').modal('hide')
}

function processNote() {
    memberID = document.getElementById('memberID').value
    show = document.getElementById('showAtCheckIn')
    send = document.getElementById('sendEmail')
    msg = document.getElementById('msgID').value
    eMailAddr = document.getElementById('eMailID').value
    
    if (show.checked) {
        showAtCheckIn='true'
    }
    else {
        showAtCheckIn='false'
    }
    if (send.checked) {
        sendEmail = 'true'
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
            // eMailAddr:'hartl1r@gmail.com',
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
    showMenu()
}

function saveStaffMsg() {
    msg = document.getElementById('staffMsgID').innerHTML
    $.ajax({
        url : "/saveStaffMsg",
        type: "GET",
        data : {
            msg:msg},

        success: function(data, textStatus, jqXHR)
        {
            alert(data)
        },
        error: function(result){
            alert("Error ..."+result)
        }
    }) 
    
    $('#staffNoteModalID').modal('hide')
    showMenu()
}

function passwordRoutine() {
    // GET CURRENT PASSWORD AND DISPLAY MODAL FORM
    memberID = document.getElementById('memberID').value
    $.ajax({
        url : "/getPassword",
        type: "GET",
        data : {
            memberID:memberID,
            },
 
        success: function(data, textStatus, jqXHR)
        {
            if (data.password) {
                pw = data.password
                pwElement = document.getElementById('curPasswordID')
                pwElement.value = pw
                document.getElementById('newPasswordID').value = ''
            }
        },
        error: function(result){
            alert("Error ..."+result)
        }
    })    
    $('#passwordModalID').modal('show')
}

function cancelPassword() {
    $('#passwordModalID').modal('hide')
}

function updatePassword() {
    memberID = document.getElementById('memberID').value
    curPassword = document.getElementById('curPasswordID').value
    newPassword = document.getElementById('newPasswordID').value
      
    $.ajax({
        url : "/updatePassword",
        type: "GET",
        data : {
            memberID:memberID,
            curPassword:curPassword,
            newPassword:newPassword},

        success: function(data, textStatus, jqXHR)
        {
            alert(data)
        },
        error: function(result){
            alert("Error ..."+result)
        }
    }) 
    
    $('#passwordModalID').modal('hide')
    showMenu()
}


// function setPhotoSrc() {
//     photo = document.getElementsByClassName('memberImgID')
//     photo.src = "{{ url_for('static', filename='memberPhotos/" + currentMemberID + ".jpg') }}"

//     // for photo modal display if used
//     photoModal = document.getElementById('photoImgID')
//     photoModal.src = "{{ url_for('static', filename='memberPhotos/" + currentMemberID + ".jpg') }}"

// }
//function showHidePhoto(objBtn) {
    //photo = document.getElementById('memberImgID')
    //memberID = document.getElementById('memberID').value
    // if (objBtn.innerHTML == 'SHOW PHOTO'){
    //     objBtn.innerHTML = 'HIDE PHOTO'
        //photo.src = "/static/memberPhotos/" + memberID + ".jpg "
        //photo.style.display='inline'

        // photoImgModal = document.getElementById('photoImgID')
        // photoImgModal.src = "/static/memberPhotos/" + memberID + ".jpg "
        // $('#photo').modal('show')

    //}
    // else {
    //     objBtn.innerHTML = 'SHOW PHOTO'
    //     photo.style.display='none'
    //}
//}

function showPhoto() {
    console.log('showPhoto ...')
    memberID = document.getElementById('memberID').value
    photoImgModal = document.getElementById('photoImgID')
    photoImgModal.src = "/static/memberPhotos/" + memberID + ".jpg "
    $('#photoModal').modal('show')
}

function villageRtn() {
    village = this.value
    villageText = document.getElementById('villageTextID')
    villageText.setAttribute('value',this.value)
}

function typeOfWorkRtn() {
    typeOfWork = this.value
    document.getElementById('typeOfWorkTextID').value=this.value
}

function zipCodeChangeRtn() {
    newZip = this.value
    document.getElementById("zipcodeTextID").value = newZip
}

function villageChangeRtn() {
    newVillage = this.value
    document.getElementById("villageTextID").value = newVillage
}

function clearScreen() {
    currentMemberID = ''
    localStorage.removeItem('currentMemberID')
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
    return staffID
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
    memberID = document.getElementById('memberID').value
    if (memberID != ''){
        link = "https://fd.thevwc.org:42738/?villageID=" + memberID 
    }
    else{
        link = "https://fd.thevwc.org:42738/"
    }
    var classSignup = window.open(link,'classSignup')
    classSignup.focus();
    return
}

function linkToMonitorSchedule() {
    memberID = document.getElementById('memberID').value
    if (memberID != ''){
        link = "https://fd.thevwc.org:42735/?villageID=" + memberID 
    }
    else{
        link = "https://fd.thevwc.org:42735/" 
    }

    var monitorWindow = window.open(link,'monitorWindow');
    monitorWindow.focus();
}

$('.phones').usPhoneFormat({
    format: '(xxx) xxx-xxxx',
});

$('input[type="tel"]')
	.keydown(function (e) {
		var key = e.which || e.charCode || e.keyCode || 0;
		$phone = $(this);

    // Don't let them remove the starting '('
    if ($phone.val().length === 1 && (key === 8 || key === 46)) {
			$phone.val('('); 
      return false;
		} 
    // Reset if they highlight and type over first char.
    else if ($phone.val().charAt(0) !== '(') {
			$phone.val('('+String.fromCharCode(e.keyCode)+''); 
		}

		// Auto-format- do not expose the mask as the user begins to type
		if (key !== 8 && key !== 9) {
			if ($phone.val().length === 4) {
				$phone.val($phone.val() + ')');
			}
			if ($phone.val().length === 5) {
				$phone.val($phone.val() + ' ');
			}			
			if ($phone.val().length === 9) {
				$phone.val($phone.val() + '-');
			}
		}

		// Allow numeric (and tab, backspace, delete) keys only
		return (key == 8 || 
				key == 9 ||
				key == 46 ||
				(key >= 48 && key <= 57) ||
				(key >= 96 && key <= 105));	
	})
	
	.bind('click focus', function () {
		$phone = $(this);
		
		if ($phone.val().length === 0) {
			$phone.val('(');
		}
		else {
			var val = $phone.val();
			$phone.val('').val(val); // Ensure cursor remains at the end
        }
    
	})

    
	.blur(function () {
		$phone = $(this);
	
		if ($phone.val() === '(') {
			$phone.val('');
		}
  });

function shiftChange() {
    //   PROMPT FOR STAFF ID
    staffID = prompt("Staff ID - ","xxxxxx")
    $.ajax({
        url: "/shiftChange",
        type: "GET",
        data: {
            staffID:staffID
        },
        success: function(data, textStatus, jqXHR)
        {
            if (data.msg != 'Authorized') {
                alert(data.msg)
                // RELOAD INDEX PAGE WITHOUT CHANGING STAFF
                location.reload()
                return
            }
            // RESTART PAGE
            link='/index/' 
            window.location.href=link
            // LAUNCH INDEX PAGE
            //clearScreen()
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert("shiftChange Error ..."+errorThrown+'\n'+textStatus)
        }
    })
}

function setManagerPermissions() {
    // REMOVE READONLY FROM SPECIFIC ELEMENTS
    document.getElementById('RAcertifiedID').disabled=false
    document.getElementById('BWcertifiedID').disabled=false
    document.getElementById('RAdateCertifiedID').removeAttribute('readonly')
    document.getElementById('BWdateCertifiedID').removeAttribute('readonly')
    document.getElementById('monitorDutyNotesID').style=display='block'
    document.getElementById('rolesBtnID').style.display='block'
    document.getElementById('showCheckInsID').style.display='block'
    document.getElementById('passwordBtnID').style.display='block'
   // document.getElementById('staffNoteBtnID').style.display='block'
    document.getElementById('inactiveID').removeAttribute('disabled')
    document.getElementById('inactiveDateID').removeAttribute('disabled')
    document.getElementById('restrictedID').removeAttribute('disabled')
    document.getElementById('reasonRestricted').removeAttribute('disabled')
    document.getElementById('deceasedID').removeAttribute('disabled')
    document.getElementById('typeOfWorkSelecterID').removeAttribute('disabled')
    //document.getElementById('typeOfWorkSelecterID').removeAttribute('readonly')
    document.getElementById('typeOfWorkSelecterID').style.color = colors.blue 
    document.getElementById('waiverReason').removeAttribute('readonly')
    document.getElementById('waiverExpirationDate').removeAttribute('readonly')

    
    // mgrElements = document.querySelectorByAll('input','textarea','select')
    // for (inputElement of mgrElements) {
    //     console.log('id- ' + inputElement.id)
    //     inputElement.disabled=false
    // }
     
    // mgrElements = document.querySelectorAll('manager')
    // for (element of mgrElements) {
    //     element.style.color = colors.violet
    // }
     
}

// function setStyleForStaff() {
//     console.log('setStyleForStaff')
//     mgrElements = document.getElementsByClassName('manager')
//     for (element of mgrElements) {
//         console.log('ID - ' + element.id)
//         element.classList.remove('manager')
//     }
    //document.getElementsByClassName('mgrOnly').style.color = colors.red
    //document.getElementById('typeOfWorkLabelID').style.color = colors.red 
    //document.getElementById('waiverReason').style.color = colors.violet 
    //document.getElementById('waiverExpirationDate').style.color = colors.lightgray  
//}

document.querySelector('#monthCheckboxesID').onclick = function(ev) {
    inputID = ev.target.id
    if (ev.target.checked) {
        document.getElementById(inputID).value='True'
    }
    else {
        document.getElementById(inputID).value='False' 
    }
}

document.getElementById('needsToolCribID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('needsToolCribID').value = 'True'
    }
    else {
        document.getElementById('needsToolCribID').value = 'False'
    }
}

function modalAlert(title,msg) {
	document.getElementById("modalAlertTitle").innerHTML = title
	document.getElementById("modalAlertBody").innerHTML= msg
	$('#myModalMsg').modal('show')
}


// function noPhotoAvailable() {
//     showPhotoBtn = document.getElementById('showPhotoBtn')
//     showPhotoBtn.innerHTML = 'NO PHOTO'
//     //modalAlert("MEMBER PHOTO","No photo available.")
// }

$("#photoModal").prependTo("body");	
function closeMsgModal() {
	$('#myModalMsg').modal('hide')
}

function closePhotoModal() {
	$('#photoModal').modal('hide')
}

// Add active class to the current button (highlight it)
var header = document.getElementById("schedulePeriod");
var btns = header.getElementsByClassName("btn");
for (var i = 0; i < btns.length; i++) {
  btns[i].addEventListener("click", function() {
  var current = document.getElementsByClassName("active");
  current[0].className = current[0].className.replace(" active", "");
  this.className += " active";
  });
}

function changeScheduleYear(yearSpecified) {
    // SET UP LINK TO MEMBER FORM 
    var linkToMemberBtn = document.getElementById('linkToMember');
    link='/index/?villageID=' + currentMemberID + "&scheduleYear=" + yearSpecified 
    linkToMemberBtn.setAttribute('href', link)
    linkToMemberBtn.click()
}

// $(document).on('click','body *',function() {
//     $('.modal').modal('hide')
// })

// function copyExistingPhoto() {
//     // SEND MEMBER TO SERVER
//     $.ajax({
//         type: "POST",
//         url:"/copyExistingPhoto",
//         data: {
//           memberID:memberID,
//           imgBase64: dataURL
//         },
//         success: function(data, textStatus, jqXHR)
//             {
//                 console.log('success rtn')
//                 if (data.msg != 'SUCCESS') {
//                     alert(data.msg)
//                     return
//                 }
//                 alert('Photo saved.')
//             },
//             error: function(jqXHR, textStatus, errorThrown){
//                 alert("savePhoto Error ..."+errorThrown+'\n'+textStatus)
//           }
//       })
// }