// PrepareAlternateWindow uses jquery notation to retrieve HTML of alternate script
var script = document.createElement('script');
script.src = './jquery-2.1.1.min.js';
document.head.appendChild(script);

// To support timestamp-dependent URL in PrepareAlternateWindow
String.prototype.URL = function () { 
    return this + (this.indexOf('?') != -1 ? '&' : '?') + '_=' + new Date().getTime(); 
};

var nextButton = document.createElement('input');
nextButton.type = 'checkbox';
nextButton.checked = true;
document.getElementsByTagName('div')[0].appendChild(nextButton);

var parent = window.opener;
var technique = parent.technique;

ContinueSimulation = function () {
    // Used in update-dashboard.js to determine for what date, the simulation needs to be run
    // This value is set only in log-monitor.js; hence, this serves as a cue to trigger automatic backtest run
    parent.nextDateDue = document.getElementById('next').innerText;

    var script2 = parent.document.createElement('script');
    script2.src = './Sandbox/update-dashboard.js';
    parent.document.head.appendChild(script2);
};

if (parent.PrepareAlternateWindow != undefined)
    // Once technique is refreshed, the backtest needs to automatically run for next date; ContinueSimulation does this
    // $EOF$ is a placeholder in original function, to be replaced with call to ContinueSimulation
    eval('PrepareAlternateWindow = ' + parent.PrepareAlternateWindow.toString().replace('$EOF$', '\nContinueSimulation();'));

GotoNext = function () {
    if (nextButton.checked == false || document.getElementById('next').innerText == '-') {
        parent.alert('Simulation complete!');
        return;
    }

    parent.onbeforeunload = null;
    parent.location.reload();
    if (technique != undefined)
        PrepareAlternateWindow(parent, technique);
    else
        ContinueSimulation();
};