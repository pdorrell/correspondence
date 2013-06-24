
$(document).ready(function(){
  $("span[data-corrid]").hover(
    function() {
      setHovering($(this));
    }, 
    function() {
      // nothing to unhover
    });
});

var currentHoveringElement = null;

function setHovering(element) {
  if (currentHoveringElement != null) {
    currentHoveringElement.find("span").removeClass("hover");
    currentHoveringElement = null;
  }
  element.find("span").addClass("hover");
  currentHoveringElement = element;
}