SETTING.MAX_PRICE_ADJUSTMENT = 0.0015;
SETTING.MIN_PRICE_ADJUSTMENT = 0.0005;

var archive = [];

var orders = [];
CheckOrders = function (k, LTP) {
    if (orders[k] == undefined)
        return;

    var changed = false;
    var executedOrders = [];
    for (var i = 0; i < orders[k].pending.length; )
        if ((orders[k].pending[i].TransactionType == TRANSACTION_TYPE.BUY && orders[k].pending[i].OrderType == 'LIMIT' && LTP < orders[k].pending[i].Price
            ) ||
            (orders[k].pending[i].TransactionType == TRANSACTION_TYPE.SELL && orders[k].pending[i].OrderType == 'LIMIT' && LTP > orders[k].pending[i].Price
            ) ||
            (orders[k].pending[i].TransactionType == TRANSACTION_TYPE.BUY && orders[k].pending[i].OrderType == 'SL MARKET' && LTP > orders[k].pending[i].TriggerPrice
            ) ||
            (orders[k].pending[i].TransactionType == TRANSACTION_TYPE.SELL && orders[k].pending[i].OrderType == 'SL MARKET' && LTP < orders[k].pending[i].TriggerPrice
            ) ||
            (orders[k].pending[i].OrderType == 'MARKET'
            )) {
            // Indicates order status of one or more orders has changed (i.e. fully executed; partial execution is beyond scope of backtest)
            changed = true;

            var order = orders[k].pending.splice(i, 1)[0];
            var executedPrice;
            if (order.TransactionType == TRANSACTION_TYPE.BUY) {
                orders[k].executed.BUYQty += order.Quantity;
                executedPrice = order.OrderType == 'LIMIT' ? order.Price : LTP * (1 + Math.random() * (SETTING.MAX_PRICE_ADJUSTMENT - SETTING.MIN_PRICE_ADJUSTMENT) + SETTING.MIN_PRICE_ADJUSTMENT);
                orders[k].executed.BUYValue += order.Quantity * executedPrice;
            }
            else if (order.TransactionType == TRANSACTION_TYPE.SELL) {
                orders[k].executed.SELLQty += order.Quantity;
                executedPrice = order.OrderType == 'LIMIT' ? order.Price : LTP * (1 - Math.random() * (SETTING.MAX_PRICE_ADJUSTMENT - SETTING.MIN_PRICE_ADJUSTMENT) + SETTING.MIN_PRICE_ADJUSTMENT);
                orders[k].executed.SELLValue += order.Quantity * executedPrice;
            }
            executedOrders.push({
                'transactionType': order.TransactionType,
                'quantity': order.Quantity,
                'executedPrice': executedPrice
            });
        }
        else
            i++;

    if (changed)
    // In actual usage, message is posted (type: CONTENT_TYPE.RELGR_ORDER_STATUS_UPDATE) on order status update, which in turn calls calls TrackOrdersStatus
    // In backtest, TrackOrdersStatus is directly called to avoid any asynchronous calls
        TrackOrdersStatus(k, {
            'summary': orders[k].executed, 
            'lastExecuted': executedOrders
        });
};

ProcessOrder = function (k, details) {
    if (orders[k] == undefined)
        orders[k] = {
            'executed': {
                'BUYQty': 0,
                'BUYValue': 0,
                'SELLQty': 0,
                'SELLValue': 0
            },
            'pending': []
        };
    
    if (details.OrderType == 'SL MARKET')
        for (var i = 0; i < orders[k].pending.length; )
            if (orders[k].pending[i].OrderType == 'SL MARKET')
                orders[k].pending.splice(i, 1);
            else
                i++;
    orders[k].pending.push(details);
};

SquareOff = function () {
    console.log('Square-off triggered');
    for (var k = 0; k < orders.length; k++)
        if (orders[k] != undefined) {
            // 10-08-2015 - Check if pending orders correctly reconcile with executed orders
            var BUYQty = orders[k].executed.BUYQty, SELLQty = orders[k].executed.SELLQty;
            for (var i = 0; i < orders[k].pending.length; i++) {
                var order = orders[k].pending[i];
                if (order.TransactionType == TRANSACTION_TYPE.BUY)
                    BUYQty += order.Quantity;
                else if (order.TransactionType == TRANSACTION_TYPE.SELL)
                    SELLQty += order.Quantity;
            }
            if (BUYQty != SELLQty)
                console.error(k, 'Pending & executed orders do not reconcile', JSON.stringify(orders[k]));

            orders[k].pending.length = 0;
            if (orders[k].executed.BUYQty != orders[k].executed.SELLQty)
                ProcessOrder(k, {
                    'TransactionType': orders[k].executed.BUYQty < orders[k].executed.SELLQty ? TRANSACTION_TYPE.BUY : TRANSACTION_TYPE.SELL,
                    'OrderType': 'MARKET',
                    'Quantity': Math.abs(orders[k].executed.BUYQty - orders[k].executed.SELLQty)
                });
        }
    squareOff = true;
};

StartSimulation = function () {
    var processingDate = $('#dates').val().replace('/~Antikythera/Sandbox/History/archive.', '').replace('.json', '').replace(/\./g, '-');

    // 1. Reinitialize user-defined date objects to reflect processingDate
    for (var name in this) {
        if (this[name] instanceof Date)
            this[name] = new Date(processingDate + this[name].toISOString().slice(10));
    }
    // 2. Update function definitions to use polledTime when new Date() created
    eval('CalculateRange = ' + CalculateRange.toString().replace(/new Date\(\)/g, 'new Date(polledTime.toISOString())'));
    eval('EvaluateScrips = ' + EvaluateScrips.toString().replace(/new Date\(\)/g, 'new Date(polledTime.toISOString())'));

    // 10-08-2015 - Save the new funds value and use the same for simulation
    document.cookie = 'sampleFunds=' + document.getElementById('sampleFunds').value + '; path=/; expires=Thu, 31 Dec 2099 12:00:00 UTC';
    UpdateAvailableFunds(Number(document.getElementById('sampleFunds').value));

    log.processingDate.innerHTML = $('#dates option:selected').text();
    log.availableFunds.innerHTML = '₹' + availableFunds.toComma(2);

    window.polledTime = new Date();
    var rangeStartTime = new Date(processingDate + 'T03:46:00.000Z');
    var rangeIndex = 0;

    RepeatSimulation = function () {
        document.getElementById('clickToContinue').removeEventListener('click', RepeatSimulation);
        ProcessSimulation();
    };

    ProcessSimulation = function () {
        polledTime.setTime(rangeStartTime.getTime() + rangeIndex * 2 * 60 * 1000);

        var changed = false;
        for (var n = 0; n < archive.length; n++) {
            var k = archive[n].link;
            if (k == undefined) {
                for (k = 0; k < data.length; k++)
                    if (data[k].symbol == archive[n].symbol)
                        break;
                if (k == data.length)
                    continue;
                else
                    archive[n].link = k;
            }

            var nRangeIndex = archive[n].rangeIndex == undefined ? 0 : archive[n].rangeIndex + 1;
            if (archive[n].range[nRangeIndex] == undefined)
                continue;
            if (archive[n].range[nRangeIndex].asOf != polledTime.toISOString())
                continue;

            if (data[k].limits.previousClosePrice == undefined)
                if (archive[n].previousClosePrice != undefined)
                    data[k].limits.previousClosePrice = archive[n].previousClosePrice;

            // 07-08-2015 - Added initialization of open price
            if (data[k].limits.openPrice == undefined)
                data[k].limits.openPrice = archive[n].range[0].openPrice;

            var range = archive[n].range[nRangeIndex];
            UpdateLTP(k, range.openPrice); CheckOrders(k, range.openPrice);
            UpdateLTP(k, range.highPrice); CheckOrders(k, range.highPrice);
            UpdateLTP(k, range.lowPrice); CheckOrders(k, range.lowPrice);
            UpdateLTP(k, range.closePrice); CheckOrders(k, range.closePrice);
            archive[n].rangeIndex = nRangeIndex;

            changed = true;
        }
        CalculateRange();

        if (changed) {
            rangeIndex++;
            if (document.getElementById('checkOnSlowMo').checked)
                document.getElementById('clickToContinue').addEventListener('click', RepeatSimulation);
            else
                setTimeout(ProcessSimulation, 0);
        }
        else {
            var grossValue = 0;
            var netValue = 0;
            for (var k = 0; k < orders.length; k++)
                if (orders[k] != undefined) {
                    grossValue += orders[k].executed.SELLValue - orders[k].executed.BUYValue;
                    netValue += orders[k].executed.SELLValue - orders[k].executed.BUYValue * 1.0012;
                }

            log.grossValue.style.color = grossValue > 0 ? 'green' : 'red';
            log.grossValue.innerHTML = '₹' + grossValue.toComma(2);

            log.netValue.style.color = netValue > 0 ? 'green' : 'red';
            log.netValue.innerHTML = '₹' + netValue.toComma(2);

            var elapsedTime = new Date().getTime() - simulationStartTime;
            log.elapsedTime.innerHTML = ('0' + Math.floor(elapsedTime / 1000 / 60)).slice(-2) + ':' + ('0' + Math.floor(elapsedTime / 1000 % 60)).slice(-2);

            log.handle.GotoNext();
        }
    };
    ProcessSimulation();
};

InitializeSimulation = function () {
    var handle = window.open('', 'WND-LOG' + (window.technique != undefined ? '-' + window.technique.text.toUpperCase().replace(/ /g, '-') : ''), 'width=400, height=300');
    if (handle.document.getElementById('log') == undefined) {
        var logURL = './Sandbox/log-monitor.js'.URL();
        handle.document.write('<div style="font-family: Verdana; font-size: 10px;">Next: <span id="next" style="margin-right: 5px;">-</span></div><br /><table id="log" style="font-family: Verdana; font-size: 10px;"></table><script src="' + logURL + '"></script>');
        handle.document.title = window.technique != undefined ? window.technique.text : 'Dashboard';
    }

    var row = handle.document.getElementById('log').insertRow(-1);
    window.log = {
        'handle': handle,
        'processingDate': row.insertCell(0),
        'availableFunds': row.insertCell(1),
        'grossValue': row.insertCell(2),
        'netValue': row.insertCell(3),
        'elapsedTime': row.insertCell(4)
    };
    handle.document.getElementById('next').innerHTML = $('#dates option:selected').next().text() == '' ? '-' : $('#dates option:selected').next().text();

    window.simulationStartTime = new Date().getTime();
    $.getJSON($('#dates').val(), function (result) {
        archive = result;
        StartSimulation();
    });
};

PrepareAlternateWindow = function (handle, _technique) {
    $.get(_technique.val.URL(), function (result) {
        handle.document.write(result);
        // For easy readability; display name of selected script
        var alternate = handle.document.createElement('span');
        alternate.id = 'alternate';
        alternate.style.paddingRight = '4px';
        alternate.innerHTML = _technique.text;
        handle.document.getElementById('header').insertBefore(alternate, handle.document.getElementById('header').firstChild);

        handle.technique = _technique;
        // DO NOT REMOVE (for use in log-monitor.js; place additional script) - $EOF$
    });
};

/*  IMPORTANT:
    DoSomething needs to be fully compatible with all techniques
*/
DoSomething = function () {
    // Clear existing intervals & pre-initialization steps
    if (window.deferCheckIfOpen != undefined)
        clearTimeout(deferCheckIfOpen);
    if (window.deferCalculateRange != undefined)
        clearInterval(deferCalculateRange);
    dataPendingStartState = [];

    var div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '10px';
    div.style.bottom = '10px';
    document.body.appendChild(div);

    var selectScripts = document.createElement('select');
    selectScripts.id = 'scripts';
    selectScripts.style.margin = '5px';
    div.appendChild(selectScripts);
    $.getJSON('./Sandbox/available-alternate-scripts.php', function (result) {
        $.each(result, function () {
            $('#scripts').append($("<option />").val(this.relativeURL).text(this.alternateScript));
        });
    });

    var inputScripts = document.createElement('input');
    inputScripts.type = 'button';
    inputScripts.value = '>';
    inputScripts.addEventListener('click', function (e) {
        var handle = window.open();
        PrepareAlternateWindow(handle, {
            'text': $('#scripts option:selected').text(),
            'val': $('#scripts').val()
        });
    });
    div.appendChild(inputScripts);

    div.appendChild(document.createElement('br'));

    var selectDates = document.createElement('select');
    selectDates.id = 'dates';
    selectDates.style.margin = '5px';
    div.appendChild(selectDates);

    var inputFunds = document.createElement('input');
    inputFunds.type = 'text';
    inputFunds.id = 'sampleFunds';
    inputFunds.style.marginRight = '5px';
    inputFunds.style.width = '90px';
    if (document.cookie.indexOf('sampleFunds=') != -1)
        inputFunds.value = document.cookie.split('sampleFunds=')[1].split(';')[0];
    div.appendChild(inputFunds);

    var inputDates = document.createElement('input');
    inputDates.type = 'button';
    inputDates.value = '>';
    inputDates.addEventListener('click', function (e) {
        InitializeSimulation();
    });
    div.appendChild(inputDates);

    div.appendChild(document.createElement('br'));

    var inputCheck = document.createElement('input');
    inputCheck.type = 'checkbox';
    inputCheck.id = 'checkOnSlowMo';
    if (document.cookie.indexOf('slowMoEnabled=') != -1)
        inputCheck.checked = document.cookie.split('slowMoEnabled=')[1].split(';')[0] == 'yes';
    inputCheck.addEventListener('change', function (e) {
        document.cookie = 'slowMoEnabled=' + (inputCheck.checked ? 'yes' : 'no') + '; path=/; expires=Thu, 31 Dec 2099 12:00:00 UTC';
    });
    div.appendChild(inputCheck);

    var inputNext = document.createElement('input');
    inputNext.type = 'button';
    inputNext.id = 'clickToContinue';
    inputNext.value = '>>';
    // Event handler for inputNext is added when and where necessary
    div.appendChild(inputNext);

    // Populating of dates is done asynchronously
    $.getJSON('./Sandbox/available-dates.php', function (result) {
        result.sort(function (a, b) {
            return a.relativeURL < b.relativeURL ? 1 : (a.relativeURL > b.relativeURL ? -1 : 0);
        });

        $.each(result, function () {
            var option = $("<option />").val(this.relativeURL).text(this.date);
            // nextDateDue is ONLY set in log-monitor.js & holds the value of the next date to be run
            if (window.nextDateDue != undefined && window.nextDateDue == this.date)
                option.attr('selected', 'selected');
            $('#dates').append(option);
        });

        if (window.nextDateDue != undefined && window.nextDateDue != '-')
            InitializeSimulation();
    });
};

DoSomething();
