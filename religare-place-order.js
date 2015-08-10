var PATH = 'https://localhost.daplie.com/~Antikythera/';

﻿var parent;

var CONTENT_TYPE = {
    'RELGR_INITIALIZE': 4,
    'RELGR_PROCESS_ORDER': 5,
    'RELGR_ORDER_EXECUTED': 6,
    'RELGR_SQUARE_OFF': 7
};

var SETTING = {
    'DO_SOMETHING_INTERVAL': 1 * 1000
};

ProcessMessage = function (event) {
    switch (event.data.type) {
        case CONTENT_TYPE.RELGR_PROCESS_ORDER:
            break;
        case CONTENT_TYPE.RELGR_SQUARE_OFF:
            break;
    }
};

GetAvailableFunds = function () {
    $.ajax({ 
        url: ReliSecRootPath + "DefaultProxy.aspx", 
        data: { 
            action: "getmargin", 
            ex: "BSE", 
            pt: "MARGIN" }, 
        type: "POST", 
        success: function (funddata) {
            try {
                // 08-08-2015 - Pass funds data to parent
                parent.postMessage({ 
                    'type': CONTENT_TYPE.RELGR_INITIALIZE,
                    'funds': Number(funddata.data)
                }, '*');
            }
            catch (err) {
                alert('Unable to retrieve funds information', 'E');
                parent.postMessage({ 
                    'type': CONTENT_TYPE.RELGR_INITIALIZE,
                    'funds': 0
                }, '*');
            }
        },
        error: function (HttpRequest, textStatus, errorThrown) {
            alert('Unable to retrieve funds information', 'E');
            parent.postMessage({ 
                    'type': CONTENT_TYPE.RELGR_INITIALIZE,
                    'funds': 0
                }, '*');
        }
    });
};

var deferDoSomething;
DoSomething = function () {
    if (document.getElementsByClassName('logoRel').length == 0) {
        deferDoSomething = setTimeout(DoSomething, SETTING.DO_SOMETHING_INTERVAL);
        return;
    }

    document.title = 'Place Order';
    document.getElementsByClassName('logoRel')[0].style.backgroundImage = 'url(\'' + PATH + 'background.png\')';

    try {
        parent = window.opener.parent;
        if (parent == null)
            throw 'parent is null';
    }
    catch (err) {
        console.error('Unable to establish link to parent', err);
        return;
    }

    window.addEventListener('message', ProcessMessage, false);
    // 08-08-2015 - Get funds & pass to dashboard; earlier, a mere ACK was being passed
    GetAvailableFunds();

    window.onbeforeunload = function () {
        return 'You might have open positions.';
    };
};

deferDoSomething = setTimeout(DoSomething, SETTING.DO_SOMETHING_INTERVAL);
