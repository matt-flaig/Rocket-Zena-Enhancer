// track ctrl key and meta keys press events
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
var releaseKeysOnWindowBlur = function(event) {
    window.keyPressStateManager.ctrlKeyPressed = false;
    window.keyPressStateManager.metaKeyPressed = false;
}
var onKeyEvent = function(event) {	
    window.keyPressStateManager.metaKeyPressed = event.metaKey;
    window.keyPressStateManager.ctrlKeyPressed = event.ctrlKey;
}

document.addEventListener("keydown", onKeyEvent, false);
document.addEventListener("keyup", onKeyEvent, false);
document.addEventListener("blur", releaseKeysOnWindowBlur, false);
document.addEventListener("visibilitychange", releaseKeysOnWindowBlur, false);
