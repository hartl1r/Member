// editName.js

// EVENT LISTENERS
nameBody = document.getElementById('nameBodyID')
nameBody.addEventListener('click',nameDataChanged);

// FUNCTIONS
function nameDataChanged() {
    document.getElementById('nameSaveBtnID').style.display='inline';
}

