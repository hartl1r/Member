// chgVillageID.js

// EVENT LISTENERS
document.getElementById('villageIDBodyID').addEventListener('click',villageIDDataClicked);
document.getElementById('reTypedID').addEventListener('change',compareIDs);
document.getElementById('temporaryID').onclick = function(ev) {
    if (ev.target.checked) {
        document.getElementById('temporaryID').value = 'True'   
    }
    else {
        document.getElementById('temporaryID').value='False'
        document.getElementById('expirationDate').value = null;
        document.getElementById('expirationData').style.display='none' 
    }
}

// FUNCT(IONS

function villageIDDataClicked() {
    document.getElementById('chgVillageIDSaveBtnID').style.display='inline';
}
function temporaryIDchanged() {
    // if permanent, set expiration date to null; hide expiration date label and text
    if (document.getElementById('temporaryID').value=='False') {
        document.getElementById('expirationDate').value = null
        document.getElementById('dataItems').style.display='none'
    }
    else {
        document.getElementById('dataItems').style.display='inline'  
    }
}

function compareIDs() {
    firstID = document.getElementById('newVillageID').value
    secondID = document.getElementById('reTypedID').value
    if (firstID != secondID) {
        alert('The new and re-typed IDs do not match.')
    }
    else {
        document.getElementById('chgVillageIDSaveBtnID').disabled=false
    }
    
}
