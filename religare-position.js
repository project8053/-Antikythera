var PATH = 'https://localhost.daplie.com/~Antikythera/';﻿

var SETTING = {
    'DO_SOMETHING_INTERVAL': 1 * 1000,
};

var deferDoSomething;
DoSomething = function () {
    if (FetchPositionBook == undefined || document.getElementsByClassName('logoRel').length == 0) {
        deferDoSomething = setTimeout(DoSomething, SETTING.DO_SOMETHING_INTERVAL);
        return;
    }

    // Dependent on implementation in Position.aspx (Religare)
    FetchPositionBook = function () {
        ShowProcessing();
        var exchg = gExchange;
        $.ajax({
            url: ReliSecRootPath + "DefaultProxy.aspx",
            data: {
                Action: "getpositionbook",
                Exchange: exchg,
                Position: gPosition,
                ProductType: gProductType,
                IsForNetPositionDetails: ($('#txtSymbol').val() == "Enter Symbol" ? "false" : "true"),
                MktSegID: gMktSegID,
                SecurityCode: ($('#txtSymbol').val() == "Enter Symbol" ? "" : $.trim($('#txtSymbol').val()).toUpperCase()),
                Filter: gFilter,
                AssetType: strAssetType,
                Instrument: gInsType,
                OptionType: gOptType
            },
            type: "POST",
            success: function (htmlText) {
                HideProcessing();

                var pbhtml = '<table width="100%" border="0" class="tbls05 s11">';
                pbhtml += '<thead><tr class="dl">';
                pbhtml += '<th class="aL" rowspan="2">Exchange/</br>Instrument</th><th class="aL" rowspan="2">Symbol';
                if ('_EQUITY_'.indexOf('_' + strAssetType.toUpperCase() + '_') >= 0) {
                    pbhtml += '/</br>Series';
                }
                pbhtml += '</th>';
                pbhtml += '<th class="aL" rowspan="2">Product';
                if ('_DERIVATIVE_CURRENCY_COMMODITY_'.indexOf('_' + strAssetType.toUpperCase() + '_') >= 0) {
                    pbhtml += '/</br>Expiry Date</th><th class="aL" rowspan="2">Str. Price/</br>Opt. Type';
                }
                pbhtml += '</th>';
                pbhtml += '<th colspan="2" class="brdn aC greenBg">BUY</th><th colspan="2" class="brdn aC pinkbg">SELL</th>' +
                        '<th colspan="2" class="brdn aC WhiteGryBg">NET</th><th class="aR" rowspan="2">CMP</th>' +
                        '<th class="aR" rowspan="2">MTM +<br/>Realized P/L</th><th class="aC" rowspan="2">Action</th>' +
                        '</tr><tr>	' +
                        '<th class="aR subHead greenBg first">Qty./ Avg Pri.</th><th class="aR subHead greenBg">Value</th>' +
                        '<th class="aR subHead pinkbg first">Qty./ Avg Pri.</th><th class="aR subHead pinkbg">Value</th>' +
                        '<th class="aR subHead WhiteGryBg first">Qty./ Avg Pri.</th><th class="aR subHead WhiteGryBg">Value</th>' +
                        '</tr></thead>';

                if (htmlText.status == 1) {
                    htmlText.data = htmlText.data.replace('"WhetherQuantity":,', '"WhetherQuantity":true,');
                    var pbdata = eval(htmlText.data);
                    if (pbdata.length == 0) {
                        pbhtml += '</table>';
                        $('#dvPositionBook').html(pbhtml + '<div class="bGGy greenHead aC lh42 pT40 pB40">No Positions available for selected criteria.</div>');
                        return;
                    }
                    var NETProfit = 0;
                    for (var i = 0; i < pbdata.length; i++) {
                        var pdata = pbdata[i];
                        var ttype = (pdata.TransactionType == "1" ? "Buy" : "Sell");
                        var ordt = new Date();
                        pbhtml += '<tr class="' + ((i % 2 == 0) ? 'even' : 'odd') + '">';
                        pbhtml += '<td class=""><div class="b cGy5 s11 tUp">' + pdata.Exchange + '</div><div class="cGyL7a  tUp">' + pdata.Instrument + '</div></td>';
                        pbhtml += '<td class=""><div class="b s11">' + pdata.Symbol + '</div>';
                        if ('_EQUITY_'.indexOf('_' + strAssetType.toUpperCase() + '_') >= 0) {
                            pbhtml += '<div class="tUp cGyL7a">' + pdata.Series + '</div>';
                        }
                        pbhtml += '</td>';
                        pbhtml += '<td class="aL"><div class="s11">' + pdata.ProductType + '</div>';
                        if ('_DERIVATIVE_CURRENCY_COMMODITY_'.indexOf('_' + strAssetType.toUpperCase() + '_') >= 0) {
                            pbhtml += '<div class="cGyL7a"> ' + pdata.ExpiryDate + ' </div></td>';

                            if (pdata.OptType == "" || pdata.OptType == "XX" || (new Number(pdata.StrPrice)) < 0)
                                pbhtml += '<td>-<br/>-';
                            else
                                pbhtml += '<td class=""><div class="s11 cGy5">' + pdata.StrPrice + '</div><div class="cGyL7a"> ' + pdata.OptType + '</div>';
                        }
                        else
                            pbhtml += '</td>';
                        pbhtml += '<td class="aR"><div class="b s11">' + pdata.BUYQty + '</div><div class="cGy5">' + CommaRound2(pdata.BUYAvgPri) + '</div></td>';
                        pbhtml += '<td class="aR"><div class="cGy5 s11">' + CommaRound2(pdata.BUYValue) + '</div></td>';
                        pbhtml += '<td class="aR"><div class="b s11">' + pdata.SELLQty + '</div><div class="cGy5">' + CommaRound2(pdata.SELLAvgPri) + '</div></td>';
                        pbhtml += '<td class="aR"><div class="cGy5 s11">' + CommaRound2(pdata.SELLValue) + '</div></td>';
                        pbhtml += '<td class="aR"><div class="b s11">' + pdata.NETQty + '</div><div class="cGy5">' + CommaRound2(pdata.NETAvgPri) + '</div></td>';
                        pbhtml += '<td class="aR"><div class="cGy5 s11">' + CommaRound2(pdata.NETValue) + '</div></td>';
                        pbhtml += '<td class="aR"><div class="b s11">' + CommaRound2(pdata.CMP) + '</div></td>';
                        // 04-05-2015 - Included by Sanjay
                        // Displays net profit\loss instead of gross profit\loss
                        var BUYQty = parseInt(pdata.BUYQty);
                        var SELLQty = parseInt(pdata.SELLQty);
                        var BUYValue = parseFloat(pdata.BUYValue);
                        var SELLValue = parseFloat(pdata.SELLValue);
                        var MTM = 0;
                        if (BUYQty > SELLQty)
                            SELLValue += (BUYQty - SELLQty) * pdata.CMP;
                        else
                            BUYValue += (SELLQty - BUYQty) * pdata.CMP;
                        MTM = SELLValue - BUYValue * 1.0012;
                        NETProfit += MTM;
                        var MTMclass = (MTM > 0 ? "cGr2" : "cRd2");
                        pbhtml += '<td class="aR"><div class="' + MTMclass + ' s11 b">' + CommaRound2(MTM) + '</div></td>';
                        pbhtml += '<td class="first w130">';
                        var expdt = '';
                        if (pdata.ExpiryDate != '')
                            expdt = (new Date(pdata.ExpiryDate)).format('dd-mm-yyyy');
                        if (Math.abs(pdata.NETQty) > 0) {
                            if (IsNull(pdata.ProductConversionList, '') != '')
                                pbhtml += '<span title="Position Conversion" class="icn_po1" onclick="positionConversion(\'' + i + '\',\'' + IsNull(pdata.Exchange, '') + '\',\'' + IsNull(pdata.SecurityCode, '') + '\',\'' + IsNull(ReplaceSpecialChars(pdata.Symbol), '') + '\',\'' + IsNull(pdata.Series, '') + '\',\'' + IsNull(pdata.ProductType, '') + '\',\'' + IsNull(pdata.ExpiryDate, '') + '\',' + IsNull(pdata.StrPrice, '') + ',\'' + IsNull(pdata.OptType, '') + '\',\'' + IsNull(pdata.Instrument, '') + '\',' + pdata.NETQty + ',\'' + IsNull(pdata.TokenNo, '') + '\',' + IsNull(pdata.WhetherQuantity, 'TRUE') + ',' + IsNull(pdata.LotSize, '') + ',\'' + IsNull(pdata.ProductConversionList, '') + '\');"></span>&nbsp;';
                            else
                                pbhtml += '<span class="icn_po1"></span>&nbsp;';
                            pbhtml += '<span title="Square Off" class="icn_po2" onclick="document.location=\'PlaceOrder.aspx?assettype=' + strAssetType + '&ex=' + escape(IsNull(pdata.Exchange, '')) + '&sc=' + IsNull(pdata.SecurityCode, '') + '&ins=' + IsNull(pdata.Instrument, '') + '&symbol=' + IsNull($.trim(ReplaceSpecialChars(pdata.Symbol)), '') + '&edate=' + IsNull(expdt, '') + '&strprice=' + IsNull(pdata.StrPrice, '') + '&ot=' + IsNull(pdata.OptType, '') + '&pt=' + IsNull(pdata.ProductType, '') + '&series=' + IsNull(pdata.Series, '') + '&flag=3&qty=' + Math.abs(pdata.NETQty) + '&isSO=Y&cPos=Y&action=' + (pdata.NETQty > 0 ? "SELL" : "BUY") + '\';"></span>&nbsp;';
                        }
                        else {
                            pbhtml += '<span title="Position Conversion" class="icn_po1"></span>&nbsp;';
                            pbhtml += '<span  title="Square Off" class="icn_po2"></span>&nbsp;';
                        }
                        pbhtml += '<span title="Buy" class="icn_B mL5" onclick="document.location=\'PlaceOrder.aspx?assettype=' + strAssetType + '&ex=' + IsNull(pdata.Exchange, '') + '&sc=' + IsNull(pdata.SecurityCode, '') + '&ins=' + IsNull(pdata.Instrument, '') + '&symbol=' + IsNull($.trim(ReplaceSpecialChars(pdata.Symbol)), '') + '&edate=' + IsNull(expdt, '') + '&strprice=' + IsNull(pdata.StrPrice, '') + '&ot=' + IsNull(pdata.OptType, '') + '&pt=' + IsNull(pdata.ProductType, '') + '&series=' + IsNull(pdata.Series, '') + '&flag=1&orderType=LIMIT&action=BUY&cPos=Y\';"></span>&nbsp;';
                        pbhtml += '<span title="Sell" class="icn_S mL2" onclick="document.location=\'PlaceOrder.aspx?assettype=' + strAssetType + '&ex=' + IsNull(pdata.Exchange, '') + '&sc=' + IsNull(pdata.SecurityCode, '') + '&ins=' + IsNull(pdata.Instrument, '') + '&symbol=' + IsNull($.trim(ReplaceSpecialChars(pdata.Symbol)), '') + '&edate=' + IsNull(expdt, '') + '&strprice=' + IsNull(pdata.StrPrice, '') + '&ot=' + IsNull(pdata.OptType, '') + '&pt=' + IsNull(pdata.ProductType, '') + '&series=' + IsNull(pdata.Series, '') + '&flag=2&orderType=LIMIT&action=SELL&cPos=Y\';"></span>';
                        pbhtml += '<div class="mktPopup fR mT40 pR" style="display:none;left:-50px" id="dvPopup' + i + '"></div></td>';
                        pbhtml += '</tr>';
                    }
                    console.info('NET Profit: ' + CommaRound2(NETProfit), new Date());
                    pbhtml += '</table>';

                    $('#dvPositionBook').html(pbhtml);
                }
                else if (htmlText.status == "20210") {
                    console.error(htmlText.message);
                    window.location.href = RelisecSessionRedirectURL;
                }
                else {
                    pbhtml += '</table>';
                    $('#dvPositionBook').html(pbhtml + '<div class="bGGy greenHead aC lh42 pT40 pB40">No Positions available for selected criteria.</div>');
                }
            },
            error: function (HttpRequest, textStatus, errorThrown) {
                HideProcessing();
                console.error(textStatus);
            }
        });
    };

    document.title = 'Positions';
    document.getElementsByClassName('logoRel')[0].style.backgroundImage = 'url(\'' + PATH + 'background.png\')';

    window.onbeforeunload = function () {
        return 'You might have open positions.';
    };
};

deferDoSomething = setTimeout(DoSomething, SETTING.DO_SOMETHING_INTERVAL);
