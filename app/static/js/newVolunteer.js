

$(document).ready( function() {    
    todaysDate = new Date();
    var todaysDateSTR =  (todaysDate.getFullYear() + "-" + ("0"+(todaysDate.getMonth()+1)).slice(-2) + "-" + ("0" + todaysDate.getDate()).slice(-2))

    document.getElementById('newVolunteerForm').addEventListener('click',showSaveBtn())
    
    staffID = localStorage.getItem('staffID')
    document.getElementById('staffID').value = staffID

})
function showSaveBtn() {
    document.getElementById('volunteerSaveBtn').style.display='inline'
}