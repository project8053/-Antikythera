var PATH = 'https://localhost.daplie.com/~Antikythera/';﻿

﻿String.prototype.right = function (n) {
    var len = this.length;
    return n > len ? this : this.substring(len - n);
};

var nodes = document.getElementsByClassName('pf-table-s pf-table-cell lft');
var index = 0;
var pause = false;

ProcessArchive = function () {
    var symbol = nodes[index].innerText;
    input.src = 'https://www.google.com/finance/getprices?q=' + symbol + '&x=BOM&i=120&p=5d&f=d,c,v,o,h,l&df=cpct&auto=1&ts=' + new Date().getTime();
};

window.addEventListener('message', function (event) {
    if (PATH.substr(0, event.origin.length) !== event.origin)
        return;

    if (index < nodes.length) {
        if (pause)
            console.warn('Paused', new Date());
        else
            setTimeout(ProcessArchive, 6 * 1000);
    }
    else
        alert('Completed!');
}, false);

var output = document.createElement('iframe');
output.name = 'output';
document.getElementById('fjfe-click-wrapper').insertBefore(output, document.getElementById('fjfe-click-wrapper').firstChild);

var form = document.createElement('form');
form.method = 'POST';
form.target = 'output';
form.action = PATH + 'Sandbox/Non-canon/add-archive-as-is.php';
var hidden = document.createElement('input');
hidden.type = 'hidden';
hidden.name = 'archive';
form.appendChild(hidden);

var beep = new Audio(PATH + 'beep.wav');

var input = document.createElement('iframe');
input.onload = function () {
    try {
        if (input.contentWindow.location.hostname != location.hostname)
            return;
    }
    catch (e) {
        beep.play();
        console.error(e);
        return;
    }

    var symbol = input.contentWindow.location.search.split('q=')[1].split('&')[0];
    var lines = input.contentDocument.body.innerText.split('\n');
    var archive = [];
    var start = undefined, previous = undefined, previousClosePrice = undefined, lastSlot = undefined;
    for (var i = 0; i < lines.length; i++) {
        var nodes = lines[i].split(',');
        if (nodes.length == 1)
            continue;
        var more = 0;
        if (isNaN(nodes[0])) {
            if (isNaN(nodes[0].replace('a', '')))
                continue;
            start = parseInt(nodes[0].replace('a', '')) * 1000;
        }
        else
            more = parseInt(nodes[0]) * 120 * 1000;

        var slot = isNaN(nodes[0]) ? 0 : parseInt(nodes[0]);
        var current = new Date();
        current.setTime(start + more);
        var thisDay;
        if (previous == undefined || previous.getDate() != current.getDate()) {
            thisDay = {
                'date': current.getFullYear() + '.' + ('0' + (current.getMonth() + 1)).right(2) + '.' + ('0' + current.getDate()).right(2),
                'symbol': symbol,
                'range': []
            };
            if (previousClosePrice != undefined)
                thisDay.previousClosePrice = previousClosePrice;
            archive.push(thisDay);
        }
        else 
            thisDay = archive[archive.length - 1];

        var range = {
            'openPrice': parseFloat(nodes[4]),
            'highPrice': parseFloat(nodes[2]),
            'lowPrice': parseFloat(nodes[3]),
            'closePrice': parseFloat(nodes[1]),
            'asOf': current
        }
        thisDay.range.push(range);
        previousClosePrice = parseFloat(nodes[1]);

        previous = current;
    }
    archive.shift();

    hidden.value = JSON.stringify(archive);
    form.submit();

    index++;
};
document.getElementById('fjfe-click-wrapper').insertBefore(input, document.getElementById('fjfe-click-wrapper').firstChild);

ProcessArchive();
