// roles.js

// EVENT LISTENERS
document.getElementById('roleBodyID').addEventListener('change',roleDataChanged);

document.querySelector('#roleBodyID').onclick = function(ev) {
    inputID = ev.target.id
    if (ev.target.checked) {
        document.getElementById(inputID).value='True'
    }
    else {
        document.getElementById(inputID).value='False' 
    }
}
// FUNCTIONS
function roleDataChanged() {
    //document.getElementById('roleCancelBtnID').style.display='inline';
    document.getElementById('roleSaveBtnID').style.display='inline';
}

