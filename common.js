// Includes functions &  variables which are universally used, so as to reduce clutter in dashboard.html
// To add additional constants to defined variables, simply use double notation. E.g. SETTING.NEW_VAR = 0;

var beep = new Audio('beep.wav');

        var CONTENT_TYPE = {
            'GOOGL_INITIALIZE': 1,
            'GOOGL_SETUP_DATA': 2,
            'GOOGL_POST_LTP': 3,
            'RELGR_INITIALIZE': 4,
            'RELGR_PROCESS_ORDER': 5,
            'RELGR_ORDER_STATUS_UPDATE': 6,
            'RELGR_SQUARE_OFF': 7
        };

        var STATE = {
            'OPEN': 1,
            'CLOSE': 0
        };

        var TREND = {
            'NONE': 0,
            'BULL': 1,
            'BEAR': 2
        };

        var STYLE = {
            'PERCENT': parseInt('000001', 2),
            'PERMILLE': parseInt('000010', 2),
            'DEGREE': parseInt('000100', 2),
            'REDUCED': parseInt('001000', 2),
            'GRAY': parseInt('010000', 2),
            'COMMA': parseInt('100000', 2)
        };

        var SORT = {
            'SYMBOL_NAME': 1,
            'LTP_CHANGE': 2,
            'NO_OF_TRADES': 3,
            'C2O_CHANGE': 4,
            'TREND_STRENGTH': 5,
            'SLOPE_ANGLE': 6
        };

        var TRANSACTION_TYPE = {
            'BUY': 1,
            'SELL': 2
        };

        var SETTING = {
            'DO_SOMETHING_RETRY_INTERVAL': 5 * 1000,
            'CHECK_OPEN_RETRY_INTERVAL': 5 * 1000,
            'PRIOR_DATE_STATUS_RETRY_INTERVAL': 5 * 1000,
            'STUDIES_CALC_INTERVAL': 2 * 60 * 1000,
            'CHECK_START_STATE_INTERVAL': 1.5 * 1000,
            'CHECK_START_STATE_INIT_TIMEOUT': 10 * 60 * 1000,
            'ADX_STEP_1_PERIOD': 14,
            'ADX_STEP_2_PERIOD': 14,
            // 30 pixels = 2% change
            'DISPLAY_NORMALIZE_RATIO': 30 / 0.02,
            // 30 pixels = 1% change
            'SLOPE_NORMALIZE_RATIO': 30 / 0.01,
            'PSAR_INCR_ACC_FACTOR': 0.01,
            'EVAL_MAX_SLOPE_ANGLE': Math.PI / 4,
            'EVAL_MIN_SLOPE_ANGLE': Math.PI / 8,
            'EVAL_MAX_SLOPE_DEVIATION': 0.004,
            // 07-08-2015 - For Open Range Breakout calculation
            'MIN_LTP_CONSIDERED': 83.33,
            'MAX_LTP_CONSIDERED': 2083.33,
            'MAX_FOCUS_CONSIDERED': 10,
            // 09-08-2015 - Available slots
            'MAX_SLOTS': 21
        };

        Number.prototype.toStyle = function (style, points) {
            var fontSize = style & STYLE.REDUCED ? ';font-size: 9px' : '';
            var color = style & STYLE.GRAY ? 'color: #A9A9A9' : (this > 0 ? 'color: #093' : (this < 0 ? 'color: #D14836' : 'color: #A9A9A9'));
            var value = Math.abs(style & STYLE.PERCENT ? this * 100 : (style & STYLE.PERMILLE ? this * 1000 : this)).toFixed(points == undefined ? 2 : points);
            var suffix = style & STYLE.PERCENT ? '%' : (style & STYLE.PERMILLE ? '&permil;' : (style & STYLE.DEGREE ? '&deg;' : ''));
            return '<span style="' + color + fontSize + '">' + value + suffix + '</span>';
        };

        Number.prototype.toComma = function (points) {
            return this.toFixed(points == undefined ? 0 : Math.min(3, points)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };

        String.prototype.URL = function () {
            return this + (this.indexOf('?') != -1 ? '&' : '?') + '_=' + new Date().getTime();
        };

        var deferGetStartState;
        var dataPendingStartState = [];
        GetStartState = function () {
            if (dataPendingStartState.length > 0) {
                var k = dataPendingStartState.shift();
                $.ajax({
                    url: ('scrip-highlights.php?symbol=' + data[k].symbol).URL(),
                    type: 'POST',
                    success: function (result) {
                        if (result.error != undefined) {
                            console.error(result.error);
                            dataPendingStartState.push(k);
                            // Sometimes, a scrip might be suspended; hence, the data will always be for prior date
                            // Stop checking once threshold is crossed
                            if (new Date() < startStatePollEndTime)
                                deferGetStartState = setTimeout(GetStartState, SETTING.CHECK_START_STATE_INTERVAL);
                            return;
                        }

                        data[k].limits.previousClosePrice = result.previousClosePrice;
                        data[k].limits.openPrice = result.openPrice;
                        deferGetStartState = setTimeout(GetStartState, SETTING.CHECK_START_STATE_INTERVAL);
                    },
                    error: function (HttpRequest, textStatus, errorThrown) {
                        console.error(HttpRequest, textStatus, errorThrown);
                        dataPendingStartState.push(k);
                        deferGetStartState = setTimeout(GetStartState, SETTING.CHECK_START_STATE_INTERVAL);
                    }
                });
            }
            else if (new Date() < startStatePollEndTime)
                deferGetStartState = setTimeout(GetStartState, SETTING.CHECK_START_STATE_INTERVAL);
        };

        var availableFunds = 0, perSlotBudget = 0, availableSlots = SETTING.MAX_SLOTS;
        UpdateAvailableFunds = function (_availableFunds) {
            availableFunds = _availableFunds;
            perSlotBudget = availableFunds / SETTING.MAX_SLOTS;
            var msg = '+ Available funds: &#8377;' + availableFunds.toComma(2) + ' (per Scrip: &#8377;' + perSlotBudget.toComma(2) + ')';
            if (document.getElementById('funds') != null)
                document.getElementById('funds').innerHTML = msg;
            else {
                var funds = document.createElement('span');
                funds.id = 'funds';
                funds.style.paddingRight = '4px';
                funds.innerHTML = msg;
                document.getElementById('header').appendChild(funds);
            }
        };