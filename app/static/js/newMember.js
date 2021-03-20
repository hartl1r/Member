$(window).ready(function() { 
    $("#newMemberFormID").on("keypress", function (event) { 
        console.log("aaya"); 
        var keyPressed = event.keyCode || event.which; 
        if (keyPressed === 13) { 
            alert("You pressed the Enter key!!"); 
            event.preventDefault(); 
            return false; 
        } 
    }); 
    }); 

$(document).ready( function() { 
    dateJoined = document.getElementById('dateJoined')
    todaysDate = new Date();
    var todaysDateSTR =  (todaysDate.getFullYear() + "-" + ("0"+(todaysDate.getMonth()+1)).slice(-2) + "-" + ("0" + todaysDate.getDate()).slice(-2))
    dateJoined.value = todaysDateSTR;
}) 

// SET INITIAL VALUES FOR ZIP CODE SELECT STATEMENT
selectZipcode = document.getElementById('zipcodeSelecterID')
selectZipcode.value =  ''

document.getElementById("zipcodeSelecterID").addEventListener("change",zipCodeChangeRtn)
document.getElementById("villageSelecterID").addEventListener("change",villageChangeRtn)



function villageChangeRtn() {
    newVillage = this.value
    document.getElementById("villageTextID").value = newVillage
}


function zipCodeChangeRtn() {
    newZip = this.value
    document.getElementById("zipcodeTextID").value = newZip
}

membershipType = document.getElementById('membershipType')
membershipType.addEventListener('change',displayTotalFee);
document.getElementById('memberID').addEventListener('change',checkVillageID)

function checkVillageID() {
    var memberID = document.getElementById('memberID').value
    $.ajax({
        url : "/checkVillageID",
        type: "GET",
        data : {
            memberID:memberID
        },
        success: function(data, textStatus, jqXHR)
        {
            if (data.msg != 'NOT FOUND'){
                msg = data.msg
                modalAlert("NEW MEMBER",msg)
            }
            
        },
        error: function(result){
            alert("Error ..."+result)
        }
    }) 

}
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
    document.getElementById('totalAmt').value = totalFee;
    
    // SHOW SAVE BUTTON
    saveBtn.style.display='inline'

}

function modalAlert(title,msg) {
	document.getElementById("modalTitle").innerHTML = title
	document.getElementById("modalBody").innerHTML= msg
	$('#myModalMsg').modal('show')
	}
	
function closeModal() {
	$('#myModalMsg').modal('hide')
}


$('.phones').usPhoneFormat({
    format: '(xxx) xxx-xxxx',
});