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
document.body.appendChild(output);

var form = document.createElement('form');
form.method = 'POST';
form.target = 'output';
form.action = PATH + 'Sandbox/add-archive.php';
var hidden = document.createElement('input');
hidden.type = 'hidden';
hidden.name = 'archive';
form.appendChild(hidden);

var input = document.createElement('iframe');
input.onload = function () {
    if (input.contentWindow.location.href == 'about:blank')
        return;

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
                'range': [],
            };
            if (previousClosePrice != undefined)
                thisDay.previousClosePrice = previousClosePrice;
            archive.push(thisDay);
        }
        else {
            thisDay = archive[archive.length - 1];
            while (lastSlot + 1 < slot) {
                var lastRange = thisDay.range[thisDay.range.length - 1];
                var asOf = new Date();
                asOf.setTime(lastRange.asOf.getTime() + 120 * 1000);
                var range = {
                    'openPrice': lastRange.closePrice,
                    'highPrice': lastRange.closePrice,
                    'lowPrice': lastRange.closePrice,
                    'closePrice': lastRange.closePrice,
                    'asOf': asOf
                };
                thisDay.range.push(range);
                lastSlot++;
            }
        }

        var openPrice = thisDay.range.length == 0 ? parseFloat(nodes[4]) : thisDay.range[thisDay.range.length - 1].closePrice;
        var range = {
            'openPrice': openPrice,
            'highPrice': openPrice > parseFloat(nodes[2]) ? openPrice : parseFloat(nodes[2]),
            'lowPrice': openPrice < parseFloat(nodes[3]) ? openPrice : parseFloat(nodes[3]),
            'closePrice': parseFloat(nodes[1]),
            'asOf': current,
        }
        thisDay.range.push(range);
        previousClosePrice = parseFloat(nodes[1]);

        previous = current;
        lastSlot = slot;
    }
    archive.shift();

    hidden.value = JSON.stringify(archive);
    form.submit();

    index++;
};
document.body.appendChild(input);

ProcessArchive();
