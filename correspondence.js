
$(document).ready(function(){
  $("span[data-corrid]").hover(
    function() {
      setHovering($(this));
    }, 
    function() {
      // nothing to unhover
    });
  $("body").click(
    function(event) {
      if (this == event.target) { // click outside of any inner elements to clear any current highlight
        clearCurrentHoveringElement();
      }
    });
});

var currentHoveringElement = null;

function clearCurrentHoveringElement() {
  if (currentHoveringElement != null) {
    currentHoveringElement.find("span").removeClass("hover");
    currentHoveringElement = null;
  }
}  

function setHovering(element) {
  clearCurrentHoveringElement();
  element.find("span").addClass("hover");
  currentHoveringElement = element;
}
