

$(document).ready( function() { 
    dateJoined = document.getElementById('dateJoined')
    todaysDate = new Date();
    var todaysDateSTR =  (todaysDate.getFullYear() + "-" + ("0"+(todaysDate.getMonth()+1)).slice(-2) + "-" + ("0" + todaysDate.getDate()).slice(-2))
    dateJoined.value = todaysDateSTR;
})

membershipType = document.getElementById('membershipType')
membershipType.addEventListener('change',displayTotalFee);


function displayTotalFee() {
    singleInitiationFee = document.getElementById('singleInitiationFee').value
    singleTotalFee = document.getElementById('singleTotalFee').value
    familyInitiationFee = document.getElementById('familyInitiationFee').value
    familyTotalFee = document.getElementById('familyTotalFee').value
    initiationFee = document.getElementById('initiationFee')
    saveBtn = document.getElementById('saveBtn')

    if (membershipType.value == 'single') {
        initiationFee.value = singleInitiationFee
        totalFee = singleTotalFee
    }
    else{
        initiationFee.value = familyInitiationFee
        totalFee = familyTotalFee
    }
    // format to currency
    console.log('totalFee - ' + totalFee)
    document.getElementById('totalAmt').value = totalFee;
    
    // SHOW SAVE BUTTON
    saveBtn.style.display='inline'

}