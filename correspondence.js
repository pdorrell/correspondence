
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
        clearCurrentSelectedElement();
      }
    });
});

var currentSelectedElement = null;

function clearCurrentSelectedElement() {
  if (currentSelectedElement != null) {
    currentSelectedElement.find("span").removeClass("selected");
    currentSelectedElement = null;
  }
}  

function setHovering(element) {
  clearCurrentSelectedElement();
  element.find("span").addClass("selected");
  currentSelectedElement = element;
}
