// chgVillageID.js

document.getElementById('dataItems').style.display='none'
// EVENT LISTENERS
document.getElementById('villageIDBodyID').addEventListener('change',villageIDDataChanged);
document.getElementById('typeOfID').addEventListener('change',typeOfIDchanged);
document.getElementById('reTypedID').addEventListener('change',compareIDs);

// FUNCTIONS
function villageIDDataChanged() {
    document.getElementById('chgVillageIDSaveBtnID').style.display='inline';
}

function typeOfIDchanged() {
    // if permanent, set expiration date to null
    if (document.getElementById('typeOfID').value=='Permanent') {
        document.getElementById('expirationDate').value = null;
        document.getElementById('expirationData').style.display='none' 
    }
    document.getElementById('dataItems').style.display='inline'
}

function compareIDs() {
    firstID = document.getElementById('newVillageID').value
    secondID = document.getElementById('reTypedID').value
    if (firstID != secondID) {
        alert('The new and re-typed IDs do not match.')
    }
}