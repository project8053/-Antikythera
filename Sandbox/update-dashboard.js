SETTING.MAX_PRICE_ADJUSTMENT = 0.0015;
SETTING.MIN_PRICE_ADJUSTMENT = 0.0005;

var archive = [];
var polledTime = new Date();

var orders = [];
CheckOrders = function (k, LTP) {
    if (orders[k] == undefined)
        return;
    
    for (var i = 0; i < orders[k].pending.length;)
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
            var order = orders[k].pending.splice(i, 1);
            var executedPrice;
            if (order.TransactionType == TRANSACTION_TYPE.BUY) {
                order.executed.BUYQty += order.Quantity;
                executedPrice = order.OrderType == 'LIMIT' ? order.Price : LTP * (1 + Math.random() * (SETTING.MAX_PRICE_ADJUSTMENT - SETTING.MIN_PRICE_ADJUSTMENT) + SETTING.MIN_PRICE_ADJUSTMENT);
                order.exeucted.BUYValue += order.Quantity * executedPrice;
            }
            else if (order.TransactionType == TRANSACTION_TYPE.SELL) {
                order.executed.SELLQty += order.Quantity;
                executedPrice = order.OrderType == 'LIMIT' ? order.Price : LTP * (1 - Math.random() * (SETTING.MAX_PRICE_ADJUSTMENT - SETTING.MIN_PRICE_ADJUSTMENT) + SETTING.MIN_PRICE_ADJUSTMENT);
                order.exeucted.SELLValue += order.Quantity * executedPrice;
            }
            ProcessMessage({
                'data': {
                    'type': CONTENT_TYPE.RELGR_ORDER_EXECUTED,
                    'executed': {
                        'k': k,
                        'transactionType': order.TransactionType,
                        'netPrice': executedPrice,
                    }
                }
            });
        }
        else
            i++;
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
            'pending': [],
        };

    if (details.OrderType == 'SL MARKET')
        for (var i = 0; i < orders[k].pending;)
            if (orders[k].pending[i].OrderType == 'SL MARKET')
                orders[k].pending.splice(i, 1);
            else
                i++;
    orders[k].pending.push(details);
};

StartSimulation = function () {
    if (window.deferCheckIfOpen != undefined)
        clearTimeout(deferCheckIfOpen);
    if (window.deferCalculateRange != undefined)
        clearInterval(deferCalculateRange);
    dataPendingStartState = [];

    var processingDate = $('#dates').val().replace('/~Antikythera/Sandbox/History/archive.', '').replace('.json', '').replace(/\./g, '-');
    console.log('Simulation starting for ' + processingDate);
    var rangeStartTime = new Date(processingDate + 'T03:46:00.000Z');
    var rangeIndex = 0;
    
    var deferCalculateRange = setInterval(function () {
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

            var range = archive[n].range[nRangeIndex];
            UpdateLTP(k, range.openPrice); CheckOrders(k, range.openPrice);
            UpdateLTP(k, range.highPrice); CheckOrders(k, range.highPrice);
            UpdateLTP(k, range.lowPrice); CheckOrders(k, range.lowPrice);
            UpdateLTP(k, range.closePrice); CheckOrders(k, range.closePrice);
            archive[n].rangeIndex = nRangeIndex;

            changed = true;
        }
        CalculateRange();

        if (changed)
            rangeIndex++;
        else
            clearInterval(deferCalculateRange);
    }, 2 * 1000);
};

DoSomething = function () {
    // Update function definitions to respond to simulation
    eval('CalculateRange = ' + CalculateRange.toString().replace(/new Date\(\)/g, 'new Date(polledTime.toISOString())'));
    eval('EvaluateScrips = ' + EvaluateScrips.toString().replace(/new Date\(\)/g, 'new Date(polledTime.toISOString())'));

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
        var wnd = window.open();
        $.get($('#scripts').val(), function (result) {
            wnd.document.write(result);
        });
    });
    div.appendChild(inputScripts);

    div.appendChild(document.createElement('br'));

    var selectDates = document.createElement('select');
    selectDates.id = 'dates';
    selectDates.style.margin = '5px';
    div.appendChild(selectDates);
    $.getJSON('./Sandbox/available-dates.php', function (result) {
        $.each(result, function () {
            $('#dates').append($("<option />").val(this.relativeURL).text(this.date));
        });
    });

    var inputDates = document.createElement('input');
    inputDates.type = 'button';
    inputDates.value = '>';
    inputDates.addEventListener('click', function (e) {
        $.getJSON($('#dates').val(), function (result) {
            archive = result;
            StartSimulation();
        });
    });
    div.appendChild(inputDates);
};

DoSomething();
