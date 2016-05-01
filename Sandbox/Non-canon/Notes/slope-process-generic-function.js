
/*  Approach 2:
 *  Uses single function - Slope, to calculate Slope
 */

Slope = function (param) {
    if (param == undefined || param.Y == undefined)
        return;
        
    var Y = param.Y,
        X = param.X == undefined ? Y.map(function (o, index) {
            return index;
        }) : param.X;

    var endPos = param.endPos == undefined ? Y.length - 1 : param.endPos,
        countToConsider = param.countToConsider,
        minCount = param.minCount,
        ignoreUndefined = param.ignoreUndefined == true;
       
    Y = Y.slice(0, endPos + 1);
    X = X.slice(0, endPos + 1);
       
    if (ignoreUndefined) {
        X = X.filter(function (o, index) {
            return typeof Y[index] == 'number';
        });
        Y = Y.filter(function (o) {
            return typeof o == 'number';
        });
    }
    
    if (countToConsider != undefined) {
        X = X.slice(-countToConsider);
        Y = Y.slice(-countToConsider);
    }
        
    var x = 0,
        xx = 0,
        y = 0,
        xy = 0,
        n = 0,
        i = 0;
    
    for (; i < Y.length; i++) {
        if (Y[i] == undefined)
            continue;
        x += X[i];
        xx += X[i] * X[i];
        y += Y[i];
        xy += X[i] * Y[i];
        n++;
    }

    if (n < 2 || (minCount != undefined && i < minCount))
        return;
        
    var m = ((n * xy) - (x * y)) / ((n * xx) - (x * x)), 
        b = (y - m * x) / n;

    return {
        'm': m,
        'b': b
    };
};

// E.g.
//      Slope({
//          'Y': data[k].percChange.map(function (o) {
//              return o == undefined ? undefined : o[PRICE.C];
//          }),
//          'endPos': i,
//          'countToConsider': SETTING.REG_FIRST_DER_COUNT,
//          'minCount': SETTING.REG_FIRST_DER_COUNT,
//          'ignoreUndefined': true 
//      });
//
//      Slope({
//          'Y': data[k].priceChanges.LTP.map(function (o) {
//              return o;
//          }),
//          'X': data[k].priceChanges.ts.map(function (o) {
//              return o;
//          }),
//          'endPos': i,
//          'countToConsider': SETTING.REG_FIRST_DER_COUNT,
//          'minCount': SETTING.REG_FIRST_DER_COUNT,
//          'ignoreUndefined': true 
//      });

/*  Approach 1:
 *  Uses two functions (process & Slope) - first, to clean the two arrays separately & second, to calculate Slope
 */

        Array.prototype.process = function(a, b, c, d) {
            // IMPORTANT: if using d, ensure X/e is also passed in Slope function
            // Use something like: if a for Y/d = function (o) { return expression; }, then a for X/e = function (o, index) { return expression == undefined ? undefined : index; }
            var o;
            if (typeof a == 'function')
                o = this.map(a);
            else {
                d = c;
                c = b;
                b = a;
                o = this;
            }
            if (typeof d == 'boolean' && d) {
                o = o.slice(0, c).filter(function(e) {
                    return typeof e == 'number';
                });
                return o.slice(o.length - c + b);
            }
            else
                return o.slice(b > 0 ? b : 0, c);
        };

        Slope = function(d, e, f) {
            if (typeof e == 'number' && typeof f == 'undefined') {
                // i.e. the user has not passed an X array as second argument, but has passed a min. count
                f = e;
                e = undefined;
            }

            var x = 0,
                xx = 0,
                y = 0,
                xy = 0,
                n = 0,
                i = 0;
            for (; i < d.length; i++) {
                if (d[i] == undefined)
                    continue;
                var g = e == undefined ? i : e[i];
                x += g;
                xx += g * g;
                y += d[i];
                xy += g * d[i];
                n++;
            }

            if (n < 2 || (f != undefined && i < f))
            // min. 2 non-zero entries are reqd. for slope + atleast f entries (incl. undefined if passed)
                return;

            var m = ((n * xy) - (x * y)) / ((n * xx) - (x * x));
            var b = (y - m * x) / n;

            return {
                'm': m,
                'b': b
            };
        };

// E.g.
//          Slope(data[k].percChange.process(function(o) {
//                  return o == undefined ? undefined : o[PRICE.C];
//              }, (i + 1) - SETTING.REG_FIRST_DER_COUNT, i + 1, FILTER.NON_EMPTY), data[k].percChange.process(function(o, index) {
//                  return o == undefined || o[PRICE.C] == undefined ? undefined : index;
//              }, (i + 1) - SETTING.REG_FIRST_DER_COUNT, i + 1, FILTER.NON_EMPTY), SETTING.REG_FIRST_DER_COUNT);