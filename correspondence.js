
$(document).ready(function(){
  $("span[data-corrid]").hover(
    function() {
      $(this).find("span").addClass("hover");
    }, 
    function() {
      $(this).find("span").removeClass("hover");
    });
});
