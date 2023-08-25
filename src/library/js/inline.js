// track cntrl key and meta keys press events
window.keyPressStateManager = {
    ctrlKeyPressed: false,
    metaKeyPressed: false
}
function changeToSelectedEnvironment(event, self){
    var url = 'https://' + window.location.href.replace(/^[^.]*/, 'zena-' + document.getElementById('environmentSelector').value);
    if(window.keyPressStateManager.metaKeyPressed || window.keyPressStateManager.ctrlKeyPressed){
        self.value = self.getAttribute('PrvSelectedValue');
        window.open(url);
        return false;
    }else{
        window.onbeforeunload = function(){};
        window.location.href = url;
    }
}
var releaseKeysOnWindowBlur = function (event) {
    window.keyPressStateManager.ctrlKeyPressed = false;
    window.keyPressStateManager.metaKeyPressed = false;
}
var onKeyEvent = function (event) {	
	if (event.type == "keyup") {
        if(event.metaKey){
            window.keyPressStateManager.metaKeyPressed = false;
        }
        if(event.ctrlKey){
            window.keyPressStateManager.ctrlKeyPressed = false;
        }
	}
    if (event.type == "keydown"){
        if(event.metaKey){
            window.keyPressStateManager.metaKeyPressed = true;
        }
        if(event.ctrlKey){
            window.keyPressStateManager.ctrlKeyPressed = true;
        }
    }
}

document.addEventListener("keydown", onKeyEvent, false);
document.addEventListener("keyup", onKeyEvent, false);
document.addEventListener("blur", releaseKeysOnWindowBlur, false);