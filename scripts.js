$(document).ready(function() {
  document.getElementById("myModal").classList.toggle('on');
  $(".modal .close-window").on("click", function(e){
   e.preventDefault();
   $(this).closest('.modal').removeClass('on');
  });
});