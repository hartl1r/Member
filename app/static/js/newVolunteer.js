

$(document).ready( function() {    
    dateJoined = document.getElementById('dateJoined')
    todaysDate = new Date();
    var todaysDateSTR =  (todaysDate.getFullYear() + "-" + ("0"+(todaysDate.getMonth()+1)).slice(-2) + "-" + ("0" + todaysDate.getDate()).slice(-2))
    dateJoined.value = todaysDateSTR;
    document.getElementById('newVolunteerForm').addEventListener('click',showSaveBtn())  
})


// SET INITIAL VALUES FOR ZIP CODE SELECT STATEMENT
selectZipcode = document.getElementById('zipcodeSelecterID')
selectZipcode.value =  ''

document.getElementById("zipcodeSelecterID").addEventListener("change",zipCodeChangeRtn)
function zipCodeChangeRtn() {
    newZip = this.value
    document.getElementById("zipcodeTextID").value = newZip
}

function showSaveBtn() {
    document.getElementById('volunteerSaveBtn').style.display='inline'
}

document.getElementById('villageID').addEventListener('change',checkVillageID)

function checkVillageID() {
    var villageID = document.getElementById('villageID').value
    $.ajax({
        url : "/checkVillageID",
        type: "GET",
        data : {
            memberID:villageID
        },
        success: function(data, textStatus, jqXHR)
        {
            if (data.msg != 'NOT FOUND'){
                msg = data.msg
                console.log('msg - '+ msg)
                modalAlert("NEW VOLUNTEER",msg)
            }
            
        },
        error: function(result){
            alert("Error ..."+result)
        }
    }) 

}


function modalAlert(title,msg) {
    console.log('title - '+title)
    console.log('msg - '+ msg)
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