SETTING.MAX_PRICE_ADJUSTMENT = 0.0015;
SETTING.MIN_PRICE_ADJUSTMENT = 0.0005;

var archive = [];

var orders = [];
CheckOrders = function (k, LTP) {
    for (var i = 0; i < orders.length; i++)
        if (!orders[i].executed)
            if (orders[i].symbol == data[k].symbol)
                if ((orders[i].TransactionType == TRANSACTION_TYPE.BUY && orders[i].OrderType == 'LIMIT' && LTP < orders[i].Price
                    ) ||
                    (orders[i].TransactionType == TRANSACTION_TYPE.SELL && orders[i].OrderType == 'LIMIT' && LTP > orders[i].Price
                    ) ||
                    (orders[i].TransactionType == TRANSACTION_TYPE.BUY && orders[i].OrderType == 'SL MARKET' && LTP > orders[i].TriggerPrice
                    ) ||
                    (orders[i].TransactionType == TRANSACTION_TYPE.SELL && orders[i].OrderType == 'SL MARKET' && LTP < orders[i].TriggerPrice
                    )) {
                    orders[i].executed = true;
                }
};

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

    var rangeIndex = 0;
    var deferCalculateRange = setInterval(function () {
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

            if (data[k].limits.previousClosePrice == undefined)
                if (archive[n].previousClosePrice != undefined)
                    data[k].limits.previousClosePrice = archive[n].previousClosePrice;

            if (rangeIndex >= archive[n].range.length)
                continue;

            changed = true;

            var range = archive[n].range[rangeIndex];
            UpdateLTP(k, range.openPrice); CheckOrders(k, range.openPrice);
            UpdateLTP(k, range.highPrice); CheckOrders(k, range.highPrice);
            UpdateLTP(k, range.lowPrice); CheckOrders(k, range.lowPrice);
            UpdateLTP(k, range.closePrice); CheckOrders(k, range.closePrice);
        }
        CalculateRange();

        if (changed)
            rangeIndex++;
        else
            clearInterval(deferCalculateRange);
    }, 2 * 1000);
};

DoSomething = function () {
    var div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '10px';
    div.style.bottom = '10px';
    document.body.appendChild(div);

    var select = document.createElement('select');
    select.id = 'dates';
    select.style.margin = '5px';
    div.appendChild(select);
    $.getJSON('./Sandbox/available-dates.php', function (result) {
        $.each(result, function () {
            $('#dates').append($("<option />").val(this.relativeURL).text(this.date));
        });
    });

    var input = document.createElement('input');
    input.type = 'button';
    input.value = '>';
    input.addEventListener('click', function (e) {
        $.getJSON($('#dates').val(), function (result) {
            archive = result;
            StartSimulation();
        });
    });
    div.appendChild(input);
};

DoSomething();
