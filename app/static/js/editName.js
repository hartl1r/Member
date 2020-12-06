// editName.js

// EVENT LISTENERS
nameBody = document.getElementById('nameBodyID')
nameBody.addEventListener('change',nameDataChanged);

// FUNCTIONS
function nameDataChanged() {
    document.getElementById('nameSaveBtnID').style.display='inline';
}

