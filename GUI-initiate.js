var PATH = 'https://localhost.daplie.com/~Antikythera/';

var parent = window.opener;

var CONTENT_TYPE = {
    'GOOGL_INITIALIZE': 1,
    'GOOGL_SETUP_DATA': 2,
    'GOOGL_POST_LTP': 3,
};

var SETTING = {
    'SPAN_CHECK_TIMEOUT': 5 * 1000,
    'TRACK_LTP_INTERVAL': 2 * 1000,
    'STUDIES_CALC_INTERVAL': 2 * 60 * 1000,
    'REFRESH_ORDER_INTERVAL': 45 * 1000,
    'WAIT_DOCUMENT_INTERVAL': 1 * 1000,
};

GetSpan = function () {
    while (dataPendingSpan.length > 0) {
        var k = dataPendingSpan.shift();
        try {
            var search = new RegExp(data[k].symbol + '<\\/a><\\/td><td class="pf-table-lp pf-table-cell rgt"><span id="ref_[0-9]+_l', 'g');
            data[k].span = iframe.contentDocument.body.innerHTML.match(search)[0].split('"')[3];
            // in case of run before market start, ensures LTP holds previous close
            // post happens only when new LTP != data[k].LTP, so previous close is never processed
            data[k].LTP = parseFloat(iframe.contentDocument.getElementById(data[k].span).innerText.replace(/,/g, ''));
        }
        catch (e) {
            dataPendingSpan.push(k);
            alert('Pending span identification for ' + dataPendingSpan.length + ' scrips', 'W');
            deferGetSpan = setTimeout(GetSpan, SETTING.SPAN_CHECK_TIMEOUT += 1 * 1000);
            return;
        }
    }
    alert('Span identified for ' + data.length + ' scrips');
};

TrackLTP = function () {
    var changed = false;
    for (var k = 0; k < data.length; k++) {
        var LTP = 0;
        try {
            if (data[k].span != undefined)
                if (iframe.contentDocument.getElementById(data[k].span) != null)
                    LTP = parseFloat(iframe.contentDocument.getElementById(data[k].span).innerText.replace(/,/g, ''));
        }
        catch (e) { }
        if (data[k].LTP != undefined)
            if (LTP != data[k].LTP && LTP != 0 && !isNaN(LTP)) {
                data[k].LTP = LTP;
                changed = true;
                parent.postMessage({
                    'type': CONTENT_TYPE.GOOGL_POST_LTP,
                    'k': k,
                    'LTP': LTP,
                }, '*');
            }
    }

    noChangeCount = changed ? 0 : noChangeCount + 1;
    var threshold = SETTING.STUDIES_CALC_INTERVAL / SETTING.TRACK_LTP_INTERVAL / 2;
    if (noChangeCount > threshold) {
        alert('Portfolio static; attempting reload', 'W');
        noChangeCount = 0;
        iframe.src = portfolio;
    }
};

RefreshOrderBook = function () {
    var activeSet = document.getElementsByClassName('active');
    for (var iterator = 0; iterator < activeSet.length; iterator++) {
        if (activeSet[iterator].id.lastIndexOf('hypOrderStatus', 0) === 0) {
            activeSet[iterator].click();
            break;
        }
    }
};

WaitPlaceOrderReady = function () {
    if (placeOrder.document.readyState == 'complete') {
        var script = document.createElement('script');
        script.src = PATH + 'religare-place-order.js?ts=' + new Date().getTime();
        placeOrder.document.head.appendChild(script);
    }
    else
        setTimeout(WaitPlaceOrderReady, SETTING.WAIT_DOCUMENT_INTERVAL);
};

WaitPositionReady = function () {
    if (position.document.readyState == 'complete') {
        var script = document.createElement('script');
        script.src = PATH + 'religare-position.js?ts=' + new Date().getTime();
        position.document.head.appendChild(script);
    }
    else
        setTimeout(WaitPositionReady, SETTING.WAIT_DOCUMENT_INTERVAL);
};

ProcessReligareRequest = function (opt) {
    switch (opt) {
        case OPTION.PLACE_ORDER:
            window.placeOrder = window.open('https://secure.religareonline.com/PlaceOrder.aspx?assettype=Equity', 'WND-PLACE-ORDER');
            setTimeout(WaitPlaceOrderReady, SETTING.WAIT_DOCUMENT_INTERVAL);
            break;
        case OPTION.POSITIONS:
            window.position = window.open('https://secure.religareonline.com/Position.aspx?assettype=Equity', 'WND-POSITIONS');
            setTimeout(WaitPositionReady, SETTING.WAIT_DOCUMENT_INTERVAL);
            break;
    }
};

ProcessMessage = function (event) {
    switch (event.data.type) {
        case CONTENT_TYPE.GOOGL_SETUP_DATA:
            alert('Link established with parent; set-up in progress');

            window.marketSpeculativeOpenTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 9, 14);
            window.marketCloseTime = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 15, 30);

            window.data = [];
            window.dataPendingSpan = [];
            for (var k = 0; k < event.data.symbol.length; k++) {
                data.push({
                    'symbol': event.data.symbol[k],
                });
                dataPendingSpan.push(k);
            }
            window.deferGetSpan = setTimeout(GetSpan, SETTING.SPAN_CHECK_TIMEOUT);
            // Begin tracking LTP post market open time (no need to bother about whether market is actually open or not)
            setTimeout(function () {
                window.noChangeCount = 0;
                window.deferTrackLTP = setInterval(TrackLTP, SETTING.TRACK_LTP_INTERVAL);
                alert('Market presumed open; LTP tracking initiated');
                // Stop tracking LTP when market is closed
                setTimeout(function () {
                    clearInterval(deferTrackLTP);
                    alert('Market closed; LTP tracking stopped');
                }, marketCloseTime.getTime() - new Date().getTime());
            }, marketSpeculativeOpenTime.getTime() - new Date().getTime());
            break;
    }
};

InitiateReligare = function () {
    if (window.deferRefreshOrderBook != undefined)
        clearInterval(deferRefreshOrderBook);
    window.deferRefreshOrderBook = setInterval(RefreshOrderBook, SETTING.REFRESH_ORDER_INTERVAL);

    document.title = 'Order Book';
    document.getElementsByClassName('logoRel')[0].style.backgroundImage = 'url(\'' + PATH + 'background.png\')';

    window.OPTION = {
        'PLACE_ORDER': 1,
        'POSITIONS': 2,
    };

    try {
        var placeOrder = document.getElementById('CtrlTradingTopNavigation_hypPlaceOrder');
        placeOrder.href = 'javascript:ProcessReligareRequest(OPTION.PLACE_ORDER);';
        placeOrder.style.color = '#25B3A2';

        var positions = document.getElementById('CtrlTradingTopNavigation_hypPositions');
        positions.href = 'javascript:ProcessReligareRequest(OPTION.POSITIONS);';
        positions.style.color = '#25B3A2';
    }
    catch (err) {
        console.error(err, 'Possible premature execution; wait until fully loaded');
    }
};

InitiateGoogle = function () {
    document.getElementsByTagName('html')[0].innerHTML = '<head><title>Ral\'akkai\'s Google</title></head><body style="margin: 0px; overflow-x:hidden;"></body>';

    var div = document.createElement('div');
    div.id = 'alert';
    div.style.fontFamily = 'Verdana';
    div.style.color = '#EEEEEE';
    div.style.fontSize = '10px';
    div.style.padding = '4px';
    div.style.display = 'block';
    div.style.position = 'absolute';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.right = '0px';
    div.style.height = window.innerHeight;
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.25)';

    window.iframe = document.createElement('iframe');
    iframe.frameBorder = 0;
    iframe.scrolling = 'no';
    iframe.onload = function () {
        this.height = this.contentWindow.document.body.scrollHeight + 'px';
        this.width = window.innerWidth + 'px';
        div.style.height = document.body.scrollHeight + 'px';
    };
    document.body.appendChild(iframe);
    document.body.appendChild(div);
    iframe.src = window.portfolio = 'https://www.google.com/finance/portfolio?action=view&pid=3';

    window.addEventListener('message', ProcessMessage, false);

    parent.postMessage({ 'type': CONTENT_TYPE.GOOGL_INITIALIZE }, '*');

    window.onbeforeunload = function () {
        return 'You might have open positions.';
    };
};

DoSomething = function () {
    if (location.host == 'www.google.com') {
        if (location.hash == '#SAFE') {
            InitiateGoogle();
        }
        else
            location.href = PATH + 'dashboard.html?ts=' + new Date().getTime();
    }
    else if (location.host == 'secure.religareonline.com') {
        if (location.pathname == '/OrderBook.aspx') {
            InitiateReligare();
        }
        else
            console.error('No action associated with this page');
    }
    else
        location.href = PATH + 'dashboard.html?ts=' + new Date().getTime();
};

window.alert = function (msg, type) {
    var div = document.getElementById('alert');
    if (div != null) {
        var d = new Date();
        var filler = type == 'E' ? '&nbsp;<img src="' + PATH + 'error.png" height="8px" width="8px"></img>&nbsp;' : (type == 'W' ? '&nbsp;<img src="' + PATH + 'warning.png" height="8px" width="8px"></img>&nbsp;' : '&nbsp;');
        div.innerHTML += '[' + (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds() + ']' + filler + msg + '<br>';
    }
    else
        console.log(msg);
};

DoSomething();
