var PATH = 'https://localhost.daplie.com/~Antikythera/';

﻿var parent;

var CONTENT_TYPE = {
    'RELGR_INITIALIZE': 4,
};

var SETTING = {
    'DO_SOMETHING_INTERVAL': 1 * 1000,
};

ProcessMessage = function (event) {
    switch (event.data.type) {

    }
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
    parent.postMessage({ 'type': CONTENT_TYPE.RELGR_INITIALIZE }, '*');

    window.onbeforeunload = function () {
        return 'You might have open positions.';
    };
};

deferDoSomething = setTimeout(DoSomething, SETTING.DO_SOMETHING_INTERVAL);
