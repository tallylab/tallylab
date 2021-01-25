/*! Moment Duration Format v2.2.2
 *  https://github.com/jsmreese/moment-duration-format
 *  Date: 2018-02-16
 *
 *  Duration format plugin function for the Moment.js library
 *  http://momentjs.com/
 *
 *  Copyright 2018 John Madhavan-Reese
 *  Released under the MIT license
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['moment'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // enviroments that support module.exports, like Node.
        try {
            module.exports = factory(require('moment'));
        } catch (e) {
            // If moment is not available, leave the setup up to the user.
            // Like when using moment-timezone or similar moment-based package.
            module.exports = factory;
        }
    }

    if (root) {
        // Globals.
        root.momentDurationFormatSetup = root.moment ? factory(root.moment) : factory;
    }
})(this, function (moment) {
    // `Number#tolocaleString` is tested on plugin initialization.
    // If the feature test passes, `toLocaleStringWorks` will be set to `true` and the
    // native function will be used to generate formatted output. If the feature
    // test fails, the fallback format function internal to this plugin will be
    // used.
    var toLocaleStringWorks = false;

    // `Number#toLocaleString` rounds incorrectly for select numbers in Microsoft
    // environments (Edge, IE11, Windows Phone) and possibly other environments.
    // If the rounding test fails and `toLocaleString` will be used for formatting,
    // the plugin will "pre-round" number values using the fallback number format
    // function before passing them to `toLocaleString` for final formatting.
    var toLocaleStringRoundingWorks = false;

    // Token type names in order of descending magnitude.
    var types = "escape years months weeks days hours minutes seconds milliseconds general".split(" ");

    var bubbles = [
        {
            type: "seconds",
            targets: [
                { type: "minutes", value: 60 },
                { type: "hours", value: 3600 },
                { type: "days", value: 86400 },
                { type: "weeks", value: 604800 },
                { type: "months", value: 2678400 },
                { type: "years", value: 31536000 }
            ]
        },
        {
            type: "minutes",
            targets: [
                { type: "hours", value: 60 },
                { type: "days", value: 1440 },
                { type: "weeks", value: 10080 },
                { type: "months", value: 44640 },
                { type: "years", value: 525600 }
            ]
        },
        {
            type: "hours",
            targets: [
                { type: "days", value: 24 },
                { type: "weeks", value: 168 },
                { type: "months", value: 744 },
                { type: "years", value: 8760 }
            ]
        },
        {
            type: "days",
            targets: [
                { type: "weeks", value: 7 },
                { type: "months", value: 31 },
                { type: "years", value: 365 }
            ]
        },
        {
            type: "months",
            targets: [
                { type: "years", value: 12 }
            ]
        }
    ];

    // stringIncludes
    function stringIncludes(str, search) {
        if (search.length > str.length) {
          return false;
        }

        return str.indexOf(search) !== -1;
    }

    // repeatZero(qty)
    // Returns "0" repeated `qty` times.
    // `qty` must be a integer >= 0.
    function repeatZero(qty) {
        var result = "";

        while (qty) {
            result += "0";
            qty -= 1;
        }

        return result;
    }

    function stringRound(digits) {
        var digitsArray = digits.split("").reverse();
        var i = 0;
        var carry = true;

        while (carry && i < digitsArray.length) {
            if (i) {
                if (digitsArray[i] === "9") {
                    digitsArray[i] = "0";
                } else {
                    digitsArray[i] = (parseInt(digitsArray[i], 10) + 1).toString();
                    carry = false;
                }
            } else {
                if (parseInt(digitsArray[i], 10) < 5) {
                    carry = false;
                }

                digitsArray[i] = "0";
            }

            i += 1;
        }

        if (carry) {
            digitsArray.push("1");
        }

        return digitsArray.reverse().join("");
    }

    // formatNumber
    // Formats any number greater than or equal to zero using these options:
    // - userLocale
    // - useToLocaleString
    // - useGrouping
    // - grouping
    // - maximumSignificantDigits
    // - minimumIntegerDigits
    // - fractionDigits
    // - groupingSeparator
    // - decimalSeparator
    //
    // `useToLocaleString` will use `toLocaleString` for formatting.
    // `userLocale` option is passed through to `toLocaleString`.
    // `fractionDigits` is passed through to `maximumFractionDigits` and `minimumFractionDigits`
    // Using `maximumSignificantDigits` will override `minimumIntegerDigits` and `fractionDigits`.
    function formatNumber(number, options, userLocale) {
        var useToLocaleString = options.useToLocaleString;
        var useGrouping = options.useGrouping;
        var grouping = useGrouping && options.grouping.slice();
        var maximumSignificantDigits = options.maximumSignificantDigits;
        var minimumIntegerDigits = options.minimumIntegerDigits || 1;
        var fractionDigits = options.fractionDigits || 0;
        var groupingSeparator = options.groupingSeparator;
        var decimalSeparator = options.decimalSeparator;

        if (useToLocaleString && userLocale) {
            var localeStringOptions = {
                minimumIntegerDigits: minimumIntegerDigits,
                useGrouping: useGrouping
            };

            if (fractionDigits) {
                localeStringOptions.maximumFractionDigits = fractionDigits;
                localeStringOptions.minimumFractionDigits = fractionDigits;
            }

            // toLocaleString output is "0.0" instead of "0" for HTC browsers
            // when maximumSignificantDigits is set. See #96.
            if (maximumSignificantDigits && number > 0) {
                localeStringOptions.maximumSignificantDigits = maximumSignificantDigits;
            }

            if (!toLocaleStringRoundingWorks) {
                var roundingOptions = extend({}, options);
                roundingOptions.useGrouping = false;
                roundingOptions.decimalSeparator = ".";
                number = parseFloat(formatNumber(number, roundingOptions), 10);
            }

            return number.toLocaleString(userLocale, localeStringOptions);
        }

        var numberString;

        // Add 1 to digit output length for floating point errors workaround. See below.
        if (maximumSignificantDigits) {
            numberString = number.toPrecision(maximumSignificantDigits + 1);
        } else {
            numberString = number.toFixed(fractionDigits + 1);
        }

        var integerString;
        var fractionString;
        var exponentString;

        var temp = numberString.split("e");

        exponentString = temp[1] || "";

        temp = temp[0].split(".");

        fractionString = temp[1] || "";
        integerString = temp[0] || "";

        // Workaround for floating point errors in `toFixed` and `toPrecision`.
        // (3.55).toFixed(1); --> "3.5"
        // (123.55 - 120).toPrecision(2); --> "3.5"
        // (123.55 - 120); --> 3.549999999999997
        // (123.55 - 120).toFixed(2); --> "3.55"
        // Round by examing the string output of the next digit.

        // *************** Implement String Rounding here ***********************
        // Check integerString + fractionString length of toPrecision before rounding.
        // Check length of fractionString from toFixed output before rounding.
        var integerLength = integerString.length;
        var fractionLength = fractionString.length;
        var digitCount = integerLength + fractionLength;
        var digits = integerString + fractionString;

        if (maximumSignificantDigits && digitCount === (maximumSignificantDigits + 1) || !maximumSignificantDigits && fractionLength === (fractionDigits + 1)) {
            // Round digits.
            digits = stringRound(digits);

            if (digits.length === digitCount + 1) {
                integerLength = integerLength + 1;
            }

            // Discard final fractionDigit.
            if (fractionLength) {
                digits = digits.slice(0, -1);
            }

            // Separate integer and fraction.
            integerString = digits.slice(0, integerLength);
            fractionString = digits.slice(integerLength);
        }

        // Trim trailing zeroes from fractionString because toPrecision outputs
        // precision, not significant digits.
        if (maximumSignificantDigits) {
            fractionString = fractionString.replace(/0*$/, "");
        }

        // Handle exponent.
        var exponent = parseInt(exponentString, 10);

        if (exponent > 0) {
            if (fractionString.length <= exponent) {
                fractionString = fractionString + repeatZero(exponent - fractionString.length);

                integerString = integerString + fractionString;
                fractionString = "";
            } else {
                integerString = integerString + fractionString.slice(0, exponent);
                fractionString = fractionString.slice(exponent);
            }
        } else if (exponent < 0) {
            fractionString = (repeatZero(Math.abs(exponent) - integerString.length) + integerString + fractionString);

            integerString = "0";
        }

        if (!maximumSignificantDigits) {
            // Trim or pad fraction when not using maximumSignificantDigits.
            fractionString = fractionString.slice(0, fractionDigits);

            if (fractionString.length < fractionDigits) {
                fractionString = fractionString + repeatZero(fractionDigits - fractionString.length);
            }

            // Pad integer when using minimumIntegerDigits
            // and not using maximumSignificantDigits.
            if (integerString.length < minimumIntegerDigits) {
                integerString = repeatZero(minimumIntegerDigits - integerString.length) + integerString;
            }
        }

        var formattedString = "";

        // Handle grouping.
        if (useGrouping) {
            temp = integerString;
            var group;

            while (temp.length) {
                if (grouping.length) {
                    group = grouping.shift();
                }

                if (formattedString) {
                    formattedString = groupingSeparator + formattedString;
                }

                formattedString = temp.slice(-group) + formattedString;

                temp = temp.slice(0, -group);
            }
        } else {
            formattedString = integerString;
        }

        // Add decimalSeparator and fraction.
        if (fractionString) {
            formattedString = formattedString + decimalSeparator + fractionString;
        }

        return formattedString;
    }

    // durationLabelCompare
    function durationLabelCompare(a, b) {
        if (a.label.length > b.label.length) {
            return -1;
        }

        if (a.label.length < b.label.length) {
            return 1;
        }

        // a must be equal to b
        return 0;
    }

    // durationGetLabels
    function durationGetLabels(token, localeData) {
        var labels = [];

        each(keys(localeData), function (localeDataKey) {
            if (localeDataKey.slice(0, 15) !== "_durationLabels") {
                return;
            }

            var labelType = localeDataKey.slice(15).toLowerCase();

            each(keys(localeData[localeDataKey]), function (labelKey) {
                if (labelKey.slice(0, 1) === token) {
                    labels.push({
                        type: labelType,
                        key: labelKey,
                        label: localeData[localeDataKey][labelKey]
                    });
                }
            });
        });

        return labels;
    }

    // durationPluralKey
    function durationPluralKey(token, integerValue, decimalValue) {
        // Singular for a value of `1`, but not for `1.0`.
        if (integerValue === 1 && decimalValue === null) {
            return token;
        }

        return token + token;
    }

    var engLocale = {
        durationLabelsStandard: {
            S: 'millisecond',
            SS: 'milliseconds',
            s: 'second',
            ss: 'seconds',
            m: 'minute',
            mm: 'minutes',
            h: 'hour',
            hh: 'hours',
            d: 'day',
            dd: 'days',
            w: 'week',
            ww: 'weeks',
            M: 'month',
            MM: 'months',
            y: 'year',
            yy: 'years'
        },
        durationLabelsShort: {
            S: 'msec',
            SS: 'msecs',
            s: 'sec',
            ss: 'secs',
            m: 'min',
            mm: 'mins',
            h: 'hr',
            hh: 'hrs',
            d: 'dy',
            dd: 'dys',
            w: 'wk',
            ww: 'wks',
            M: 'mo',
            MM: 'mos',
            y: 'yr',
            yy: 'yrs'
        },
        durationTimeTemplates: {
            HMS: 'h:mm:ss',
            HM: 'h:mm',
            MS: 'm:ss'
        },
        durationLabelTypes: [
            { type: "standard", string: "__" },
            { type: "short", string: "_" }
        ],
        durationPluralKey: durationPluralKey
    };

    // isArray
    function isArray(array) {
        return Object.prototype.toString.call(array) === "[object Array]";
    }

    // isObject
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }

    // findLast
    function findLast(array, callback) {
        var index = array.length;

        while (index -= 1) {
            if (callback(array[index])) { return array[index]; }
        }
    }

    // find
    function find(array, callback) {
        var index = 0;

        var max = array && array.length || 0;

        var match;

        if (typeof callback !== "function") {
            match = callback;
            callback = function (item) {
                return item === match;
            };
        }

        while (index < max) {
            if (callback(array[index])) { return array[index]; }
            index += 1;
        }
    }

    // each
    function each(array, callback) {
        var index = 0,
            max = array.length;

        if (!array || !max) { return; }

        while (index < max) {
            if (callback(array[index], index) === false) { return; }
            index += 1;
        }
    }

    // map
    function map(array, callback) {
        var index = 0,
            max = array.length,
            ret = [];

        if (!array || !max) { return ret; }

        while (index < max) {
            ret[index] = callback(array[index], index);
            index += 1;
        }

        return ret;
    }

    // pluck
    function pluck(array, prop) {
        return map(array, function (item) {
            return item[prop];
        });
    }

    // compact
    function compact(array) {
        var ret = [];

        each(array, function (item) {
            if (item) { ret.push(item); }
        });

        return ret;
    }

    // unique
    function unique(array) {
        var ret = [];

        each(array, function (_a) {
            if (!find(ret, _a)) { ret.push(_a); }
        });

        return ret;
    }

    // intersection
    function intersection(a, b) {
        var ret = [];

        each(a, function (_a) {
            each(b, function (_b) {
                if (_a === _b) { ret.push(_a); }
            });
        });

        return unique(ret);
    }

    // rest
    function rest(array, callback) {
        var ret = [];

        each(array, function (item, index) {
            if (!callback(item)) {
                ret = array.slice(index);
                return false;
            }
        });

        return ret;
    }

    // initial
    function initial(array, callback) {
        var reversed = array.slice().reverse();

        return rest(reversed, callback).reverse();
    }

    // extend
    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) { a[key] = b[key]; }
        }

        return a;
    }

    // keys
    function keys(a) {
        var ret = [];

        for (var key in a) {
            if (a.hasOwnProperty(key)) { ret.push(key); }
        }

        return ret;
    }

    // any
    function any(array, callback) {
        var index = 0,
            max = array.length;

        if (!array || !max) { return false; }

        while (index < max) {
            if (callback(array[index], index) === true) { return true; }
            index += 1;
        }

        return false;
    }

    // flatten
    function flatten(array) {
        var ret = [];

        each(array, function(child) {
            ret = ret.concat(child);
        });

        return ret;
    }

    function toLocaleStringSupportsLocales() {
        var number = 0;
        try {
            number.toLocaleString('i');
        } catch (e) {
            return e.name === 'RangeError';
        }
        return false;
    }

    function featureTestToLocaleStringRounding() {
        return (3.55).toLocaleString("en", {
            useGrouping: false,
            minimumIntegerDigits: 1,
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }) === "3.6";
    }

    function featureTestToLocaleString() {
        var passed = true;

        // Test locale.
        passed = passed && toLocaleStringSupportsLocales();
        if (!passed) { return false; }

        // Test minimumIntegerDigits.
        passed = passed && (1).toLocaleString("en", { minimumIntegerDigits: 1 }) === "1";
        passed = passed && (1).toLocaleString("en", { minimumIntegerDigits: 2 }) === "01";
        passed = passed && (1).toLocaleString("en", { minimumIntegerDigits: 3 }) === "001";
        if (!passed) { return false; }

        // Test maximumFractionDigits and minimumFractionDigits.
        passed = passed && (99.99).toLocaleString("en", { maximumFractionDigits: 0, minimumFractionDigits: 0 }) === "100";
        passed = passed && (99.99).toLocaleString("en", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) === "100.0";
        passed = passed && (99.99).toLocaleString("en", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) === "99.99";
        passed = passed && (99.99).toLocaleString("en", { maximumFractionDigits: 3, minimumFractionDigits: 3 }) === "99.990";
        if (!passed) { return false; }

        // Test maximumSignificantDigits.
        passed = passed && (99.99).toLocaleString("en", { maximumSignificantDigits: 1 }) === "100";
        passed = passed && (99.99).toLocaleString("en", { maximumSignificantDigits: 2 }) === "100";
        passed = passed && (99.99).toLocaleString("en", { maximumSignificantDigits: 3 }) === "100";
        passed = passed && (99.99).toLocaleString("en", { maximumSignificantDigits: 4 }) === "99.99";
        passed = passed && (99.99).toLocaleString("en", { maximumSignificantDigits: 5 }) === "99.99";
        if (!passed) { return false; }

        // Test grouping.
        passed = passed && (1000).toLocaleString("en", { useGrouping: true }) === "1,000";
        passed = passed && (1000).toLocaleString("en", { useGrouping: false }) === "1000";
        if (!passed) { return false; }

        return true;
    }

    // durationsFormat(durations [, template] [, precision] [, settings])
    function durationsFormat() {
        var args = [].slice.call(arguments);
        var settings = {};
        var durations;

        // Parse arguments.
        each(args, function (arg, index) {
            if (!index) {
                if (!isArray(arg)) {
                    throw "Expected array as the first argument to durationsFormat.";
                }

                durations = arg;
            }

            if (typeof arg === "string" || typeof arg === "function") {
                settings.template = arg;
                return;
            }

            if (typeof arg === "number") {
                settings.precision = arg;
                return;
            }

            if (isObject(arg)) {
                extend(settings, arg);
            }
        });

        if (!durations || !durations.length) {
            return [];
        }

        settings.returnMomentTypes = true;

        var formattedDurations = map(durations, function (dur) {
            return dur.format(settings);
        });

        // Merge token types from all durations.
        var outputTypes = intersection(types, unique(pluck(flatten(formattedDurations), "type")));

        var largest = settings.largest;

        if (largest) {
            outputTypes = outputTypes.slice(0, largest);
        }

        settings.returnMomentTypes = false;
        settings.outputTypes = outputTypes;

        return map(durations, function (dur) {
            return dur.format(settings);
        });
    }

    // durationFormat([template] [, precision] [, settings])
    function durationFormat() {

        var args = [].slice.call(arguments);
        var settings = extend({}, this.format.defaults);

        // Keep a shadow copy of this moment for calculating remainders.
        // Perform all calculations on positive duration value, handle negative
        // sign at the very end.
        var asMilliseconds = this.asMilliseconds();
        var asMonths = this.asMonths();

        // Treat invalid durations as having a value of 0 milliseconds.
        if (typeof this.isValid === "function" && this.isValid() === false) {
            asMilliseconds = 0;
            asMonths = 0;
        }

        var isNegative = asMilliseconds < 0;

        // Two shadow copies are needed because of the way moment.js handles
        // duration arithmetic for years/months and for weeks/days/hours/minutes/seconds.
        var remainder = moment.duration(Math.abs(asMilliseconds), "milliseconds");
        var remainderMonths = moment.duration(Math.abs(asMonths), "months");

        // Parse arguments.
        each(args, function (arg) {
            if (typeof arg === "string" || typeof arg === "function") {
                settings.template = arg;
                return;
            }

            if (typeof arg === "number") {
                settings.precision = arg;
                return;
            }

            if (isObject(arg)) {
                extend(settings, arg);
            }
        });

        var momentTokens = {
            years: "y",
            months: "M",
            weeks: "w",
            days: "d",
            hours: "h",
            minutes: "m",
            seconds: "s",
            milliseconds: "S"
        };

        var tokenDefs = {
            escape: /\[(.+?)\]/,
            years: /\*?[Yy]+/,
            months: /\*?M+/,
            weeks: /\*?[Ww]+/,
            days: /\*?[Dd]+/,
            hours: /\*?[Hh]+/,
            minutes: /\*?m+/,
            seconds: /\*?s+/,
            milliseconds: /\*?S+/,
            general: /.+?/
        };

        // Types array is available in the template function.
        settings.types = types;

        var typeMap = function (token) {
            return find(types, function (type) {
                return tokenDefs[type].test(token);
            });
        };

        var tokenizer = new RegExp(map(types, function (type) {
            return tokenDefs[type].source;
        }).join("|"), "g");

        // Current duration object is available in the template function.
        settings.duration = this;

        // Eval template function and cache template string.
        var template = typeof settings.template === "function" ? settings.template.apply(settings) : settings.template;

        // outputTypes and returnMomentTypes are settings to support durationsFormat().

        // outputTypes is an array of moment token types that determines
        // the tokens returned in formatted output. This option overrides
        // trim, largest, stopTrim, etc.
        var outputTypes = settings.outputTypes;

        // returnMomentTypes is a boolean that sets durationFormat to return
        // the processed momentTypes instead of formatted output.
        var returnMomentTypes = settings.returnMomentTypes;

        var largest = settings.largest;

        // Setup stopTrim array of token types.
        var stopTrim = [];

        if (!outputTypes) {
            if (isArray(settings.stopTrim)) {
                settings.stopTrim = settings.stopTrim.join("");
            }

            // Parse stopTrim string to create token types array.
            if (settings.stopTrim) {
                each(settings.stopTrim.match(tokenizer), function (token) {
                    var type = typeMap(token);

                    if (type === "escape" || type === "general") {
                        return;
                    }

                    stopTrim.push(type);
                });
            }
        }

        // Cache moment's locale data.
        var localeData = moment.localeData();

        if (!localeData) {
            localeData = {};
        }

        // Fall back to this plugin's `eng` extension.
        each(keys(engLocale), function (key) {
            if (typeof engLocale[key] === "function") {
                if (!localeData[key]) {
                    localeData[key] = engLocale[key];
                }

                return;
            }

            if (!localeData["_" + key]) {
                localeData["_" + key] = engLocale[key];
            }
        });

        // Replace Duration Time Template strings.
        // For locale `eng`: `_HMS_`, `_HM_`, and `_MS_`.
        each(keys(localeData._durationTimeTemplates), function (item) {
            template = template.replace("_" + item + "_", localeData._durationTimeTemplates[item]);
        });

        // Determine user's locale.
        var userLocale = settings.userLocale || moment.locale();

        var useLeftUnits = settings.useLeftUnits;
        var usePlural = settings.usePlural;
        var precision = settings.precision;
        var forceLength = settings.forceLength;
        var useGrouping = settings.useGrouping;
        var trunc = settings.trunc;

        // Use significant digits only when precision is greater than 0.
        var useSignificantDigits = settings.useSignificantDigits && precision > 0;
        var significantDigits = useSignificantDigits ? settings.precision : 0;
        var significantDigitsCache = significantDigits;

        var minValue = settings.minValue;
        var isMinValue = false;

        var maxValue = settings.maxValue;
        var isMaxValue = false;

        // formatNumber fallback options.
        var useToLocaleString = settings.useToLocaleString;
        var groupingSeparator = settings.groupingSeparator;
        var decimalSeparator = settings.decimalSeparator;
        var grouping = settings.grouping;

        useToLocaleString = useToLocaleString && toLocaleStringWorks;

        // Trim options.
        var trim = settings.trim;

        if (isArray(trim)) {
            trim = trim.join(" ");
        }

        if (trim === null && (largest || maxValue || useSignificantDigits)) {
            trim = "all";
        }

        if (trim === null || trim === true || trim === "left" || trim === "right") {
            trim = "large";
        }

        if (trim === false) {
            trim = "";
        }

        var trimIncludes = function (item) {
            return item.test(trim);
        };

        var rLarge = /large/;
        var rSmall = /small/;
        var rBoth = /both/;
        var rMid = /mid/;
        var rAll = /^all|[^sm]all/;
        var rFinal = /final/;

        var trimLarge = largest > 0 || any([rLarge, rBoth, rAll], trimIncludes);
        var trimSmall = any([rSmall, rBoth, rAll], trimIncludes);
        var trimMid = any([rMid, rAll], trimIncludes);
        var trimFinal = any([rFinal, rAll], trimIncludes);

        // Parse format string to create raw tokens array.
        var rawTokens = map(template.match(tokenizer), function (token, index) {
            var type = typeMap(token);

            if (token.slice(0, 1) === "*") {
                token = token.slice(1);

                if (type !== "escape" && type !== "general") {
                    stopTrim.push(type);
                }
            }

            return {
                index: index,
                length: token.length,
                text: "",

                // Replace escaped tokens with the non-escaped token text.
                token: (type === "escape" ? token.replace(tokenDefs.escape, "$1") : token),

                // Ignore type on non-moment tokens.
                type: ((type === "escape" || type === "general") ? null : type)
            };
        });

        // Associate text tokens with moment tokens.
        var currentToken = {
            index: 0,
            length: 0,
            token: "",
            text: "",
            type: null
        };

        var tokens = [];

        if (useLeftUnits) {
            rawTokens.reverse();
        }

        each(rawTokens, function (token) {
            if (token.type) {
                if (currentToken.type || currentToken.text) {
                    tokens.push(currentToken);
                }

                currentToken = token;

                return;
            }

            if (useLeftUnits) {
                currentToken.text = token.token + currentToken.text;
            } else {
                currentToken.text += token.token;
            }
        });

        if (currentToken.type || currentToken.text) {
            tokens.push(currentToken);
        }

        if (useLeftUnits) {
            tokens.reverse();
        }

        // Find unique moment token types in the template in order of
        // descending magnitude.
        var momentTypes = intersection(types, unique(compact(pluck(tokens, "type"))));

        // Exit early if there are no moment token types.
        if (!momentTypes.length) {
            return pluck(tokens, "text").join("");
        }

        // Calculate values for each moment type in the template.
        // For processing the settings, values are associated with moment types.
        // Values will be assigned to tokens at the last step in order to
        // assume nothing about frequency or order of tokens in the template.
        momentTypes = map(momentTypes, function (momentType, index) {
            // Is this the least-magnitude moment token found?
            var isSmallest = ((index + 1) === momentTypes.length);

            // Is this the greatest-magnitude moment token found?
            var isLargest = (!index);

            // Get the raw value in the current units.
            var rawValue;

            if (momentType === "years" || momentType === "months") {
                rawValue = remainderMonths.as(momentType);
            } else {
                rawValue = remainder.as(momentType);
            }

            var wholeValue = Math.floor(rawValue);
            var decimalValue = rawValue - wholeValue;

            var token = find(tokens, function (token) {
                return momentType === token.type;
            });

            if (isLargest && maxValue && rawValue > maxValue) {
                isMaxValue = true;
            }

            if (isSmallest && minValue && Math.abs(settings.duration.as(momentType)) < minValue) {
                isMinValue = true;
            }

            // Note the length of the largest-magnitude moment token:
            // if it is greater than one and forceLength is not set,
            // then default forceLength to `true`.
            //
            // Rationale is this: If the template is "h:mm:ss" and the
            // moment value is 5 minutes, the user-friendly output is
            // "5:00", not "05:00". We shouldn't pad the `minutes` token
            // even though it has length of two if the template is "h:mm:ss";
            //
            // If the minutes output should always include the leading zero
            // even when the hour is trimmed then set `{ forceLength: true }`
            // to output "05:00". If the template is "hh:mm:ss", the user
            // clearly wanted everything padded so we should output "05:00";
            //
            // If the user wants the full padded output, they can use
            // template "hh:mm:ss" and set `{ trim: false }` to output
            // "00:05:00".
            if (isLargest && forceLength === null && token.length > 1) {
                forceLength = true;
            }

            // Update remainder.
            remainder.subtract(wholeValue, momentType);
            remainderMonths.subtract(wholeValue, momentType);

            return {
                rawValue: rawValue,
                wholeValue: wholeValue,
                // Decimal value is only retained for the least-magnitude
                // moment type in the format template.
                decimalValue: isSmallest ? decimalValue : 0,
                isSmallest: isSmallest,
                isLargest: isLargest,
                type: momentType,
                // Tokens can appear multiple times in a template string,
                // but all instances must share the same length.
                tokenLength: token.length
            };
        });

        var truncMethod = trunc ? Math.floor : Math.round;
        var truncate = function (value, places) {
            var factor = Math.pow(10, places);
            return truncMethod(value * factor) / factor;
        };

        var foundFirst = false;
        var bubbled = false;

        var formatValue = function (momentType, index) {
            var formatOptions = {
                useGrouping: useGrouping,
                groupingSeparator: groupingSeparator,
                decimalSeparator: decimalSeparator,
                grouping: grouping,
                useToLocaleString: useToLocaleString
            };

            if (useSignificantDigits) {
                if (significantDigits <= 0) {
                    momentType.rawValue = 0;
                    momentType.wholeValue = 0;
                    momentType.decimalValue = 0;
                } else {
                    formatOptions.maximumSignificantDigits = significantDigits;
                    momentType.significantDigits = significantDigits;
                }
            }

            if (isMaxValue && !bubbled) {
                if (momentType.isLargest) {
                    momentType.wholeValue = maxValue;
                    momentType.decimalValue = 0;
                } else {
                    momentType.wholeValue = 0;
                    momentType.decimalValue = 0;
                }
            }

            if (isMinValue && !bubbled) {
                if (momentType.isSmallest) {
                    momentType.wholeValue = minValue;
                    momentType.decimalValue = 0;
                } else {
                    momentType.wholeValue = 0;
                    momentType.decimalValue = 0;
                }
            }

            if (momentType.isSmallest || momentType.significantDigits && momentType.significantDigits - momentType.wholeValue.toString().length <= 0) {
                // Apply precision to least significant token value.
                if (precision < 0) {
                    momentType.value = truncate(momentType.wholeValue, precision);
                } else if (precision === 0) {
                    momentType.value = truncMethod(momentType.wholeValue + momentType.decimalValue);
                } else { // precision > 0
                    if (useSignificantDigits) {
                        if (trunc) {
                            momentType.value = truncate(momentType.rawValue, significantDigits - momentType.wholeValue.toString().length);
                        } else {
                            momentType.value = momentType.rawValue;
                        }

                        if (momentType.wholeValue) {
                            significantDigits -= momentType.wholeValue.toString().length;
                        }
                    } else {
                        formatOptions.fractionDigits = precision;

                        if (trunc) {
                            momentType.value = momentType.wholeValue + truncate(momentType.decimalValue, precision);
                        } else {
                            momentType.value = momentType.wholeValue + momentType.decimalValue;
                        }
                    }
                }
            } else {
                if (useSignificantDigits && momentType.wholeValue) {
                    // Outer Math.round required here to handle floating point errors.
                    momentType.value = Math.round(truncate(momentType.wholeValue, momentType.significantDigits - momentType.wholeValue.toString().length));

                    significantDigits -= momentType.wholeValue.toString().length;
                } else {
                    momentType.value = momentType.wholeValue;
                }
            }

            if (momentType.tokenLength > 1 && (forceLength || foundFirst)) {
                formatOptions.minimumIntegerDigits = momentType.tokenLength;

                if (bubbled && formatOptions.maximumSignificantDigits < momentType.tokenLength) {
                    delete formatOptions.maximumSignificantDigits;
                }
            }

            if (!foundFirst && (momentType.value > 0 || trim === "" /* trim: false */ || find(stopTrim, momentType.type) || find(outputTypes, momentType.type))) {
                foundFirst = true;
            }

            momentType.formattedValue = formatNumber(momentType.value, formatOptions, userLocale);

            formatOptions.useGrouping = false;
            formatOptions.decimalSeparator = ".";
            momentType.formattedValueEn = formatNumber(momentType.value, formatOptions, "en");

            if (momentType.tokenLength === 2 && momentType.type === "milliseconds") {
                momentType.formattedValueMS = formatNumber(momentType.value, {
                    minimumIntegerDigits: 3,
                    useGrouping: false
                }, "en").slice(0, 2);
            }

            return momentType;
        };

        // Calculate formatted values.
        momentTypes = map(momentTypes, formatValue);
        momentTypes = compact(momentTypes);

        // Bubble rounded values.
        if (momentTypes.length > 1) {
            var findType = function (type) {
                return find(momentTypes, function (momentType) {
                    return momentType.type === type;
                });
            };

            var bubbleTypes = function (bubble) {
                var bubbleMomentType = findType(bubble.type);

                if (!bubbleMomentType) {
                    return;
                }

                each(bubble.targets, function (target) {
                    var targetMomentType = findType(target.type);

                    if (!targetMomentType) {
                        return;
                    }

                    if (parseInt(bubbleMomentType.formattedValueEn, 10) === target.value) {
                        bubbleMomentType.rawValue = 0;
                        bubbleMomentType.wholeValue = 0;
                        bubbleMomentType.decimalValue = 0;
                        targetMomentType.rawValue += 1;
                        targetMomentType.wholeValue += 1;
                        targetMomentType.decimalValue = 0;
                        targetMomentType.formattedValueEn = targetMomentType.wholeValue.toString();
                        bubbled = true;
                    }
                });
            };

            each(bubbles, bubbleTypes);
        }

        // Recalculate formatted values.
        if (bubbled) {
            foundFirst = false;
            significantDigits = significantDigitsCache;
            momentTypes = map(momentTypes, formatValue);
            momentTypes = compact(momentTypes);
        }

        if (outputTypes && !(isMaxValue && !settings.trim)) {
            momentTypes = map(momentTypes, function (momentType) {
                if (find(outputTypes, function (outputType) {
                    return momentType.type === outputType;
                })) {
                    return momentType;
                }

                return null;
            });

            momentTypes = compact(momentTypes);
        } else {
            // Trim Large.
            if (trimLarge) {
                momentTypes = rest(momentTypes, function (momentType) {
                    // Stop trimming on:
                    // - the smallest moment type
                    // - a type marked for stopTrim
                    // - a type that has a whole value
                    return !momentType.isSmallest && !momentType.wholeValue && !find(stopTrim, momentType.type);
                });
            }

            // Largest.
            if (largest && momentTypes.length) {
                momentTypes = momentTypes.slice(0, largest);
            }

            // Trim Small.
            if (trimSmall && momentTypes.length > 1) {
                momentTypes = initial(momentTypes, function (momentType) {
                    // Stop trimming on:
                    // - a type marked for stopTrim
                    // - a type that has a whole value
                    // - the largest momentType
                    return !momentType.wholeValue && !find(stopTrim, momentType.type) && !momentType.isLargest;
                });
            }

            // Trim Mid.
            if (trimMid) {
                momentTypes = map(momentTypes, function (momentType, index) {
                    if (index > 0 && index < momentTypes.length - 1 && !momentType.wholeValue) {
                        return null;
                    }

                    return momentType;
                });

                momentTypes = compact(momentTypes);
            }

            // Trim Final.
            if (trimFinal && momentTypes.length === 1 && !momentTypes[0].wholeValue && !(!trunc && momentTypes[0].isSmallest && momentTypes[0].rawValue < minValue)) {
                momentTypes = [];
            }
        }

        if (returnMomentTypes) {
            return momentTypes;
        }

        // Localize and pluralize unit labels.
        each(tokens, function (token) {
            var key = momentTokens[token.type];

            var momentType = find(momentTypes, function (momentType) {
                return momentType.type === token.type;
            });

            if (!key || !momentType) {
                return;
            }

            var values = momentType.formattedValueEn.split(".");

            values[0] = parseInt(values[0], 10);

            if (values[1]) {
                values[1] = parseFloat("0." + values[1], 10);
            } else {
                values[1] = null;
            }

            var pluralKey = localeData.durationPluralKey(key, values[0], values[1]);

            var labels = durationGetLabels(key, localeData);

            var autoLocalized = false;

            var pluralizedLabels = {};

            // Auto-Localized unit labels.
            each(localeData._durationLabelTypes, function (labelType) {
                var label = find(labels, function (label) {
                    return label.type === labelType.type && label.key === pluralKey;
                });

                if (label) {
                    pluralizedLabels[label.type] = label.label;

                    if (stringIncludes(token.text, labelType.string)) {
                        token.text = token.text.replace(labelType.string, label.label);
                        autoLocalized = true;
                    }
                }
            });

            // Auto-pluralized unit labels.
            if (usePlural && !autoLocalized) {
                labels.sort(durationLabelCompare);

                each(labels, function (label) {
                    if (pluralizedLabels[label.type] === label.label) {
                        if (stringIncludes(token.text, label.label)) {
                            // Stop checking this token if its label is already
                            // correctly pluralized.
                            return false;
                        }

                        // Skip this label if it is correct, but not present in
                        // the token's text.
                        return;
                    }

                    if (stringIncludes(token.text, label.label)) {
                        // Replece this token's label and stop checking.
                        token.text = token.text.replace(label.label, pluralizedLabels[label.type]);
                        return false;
                    }
                });
            }
        });

        // Build ouptut.
        tokens = map(tokens, function (token) {
            if (!token.type) {
                return token.text;
            }

            var momentType = find(momentTypes, function (momentType) {
                return momentType.type === token.type;
            });

            if (!momentType) {
                return "";
            }

            var out = "";

            if (useLeftUnits) {
                out += token.text;
            }

            if (isNegative && isMaxValue || !isNegative && isMinValue) {
                out += "< ";
                isMaxValue = false;
                isMinValue = false;
            }

            if (isNegative && isMinValue || !isNegative && isMaxValue) {
                out += "> ";
                isMaxValue = false;
                isMinValue = false;
            }

            if (isNegative && (momentType.value > 0 || trim === "" || find(stopTrim, momentType.type) || find(outputTypes, momentType.type))) {
                out += "-";
                isNegative = false;
            }

            if (token.type === "milliseconds" && momentType.formattedValueMS) {
                out += momentType.formattedValueMS;
            } else {
                out += momentType.formattedValue;
            }

            if (!useLeftUnits) {
                out += token.text;
            }

            return out;
        });

        // Trim leading and trailing comma, space, colon, and dot.
        return tokens.join("").replace(/(,| |:|\.)*$/, "").replace(/^(,| |:|\.)*/, "");
    }

    // defaultFormatTemplate
    function defaultFormatTemplate() {
        var dur = this.duration;

        var findType = function findType(type) {
            return dur._data[type];
        };

        var firstType = find(this.types, findType);

        var lastType = findLast(this.types, findType);

        // Default template strings for each duration dimension type.
        switch (firstType) {
            case "milliseconds":
                return "S __";
            case "seconds": // Fallthrough.
            case "minutes":
                return "*_MS_";
            case "hours":
                return "_HMS_";
            case "days": // Possible Fallthrough.
                if (firstType === lastType) {
                    return "d __";
                }
            case "weeks":
                if (firstType === lastType) {
                    return "w __";
                }

                if (this.trim === null) {
                    this.trim = "both";
                }

                return "w __, d __, h __";
            case "months": // Possible Fallthrough.
                if (firstType === lastType) {
                    return "M __";
                }
            case "years":
                if (firstType === lastType) {
                    return "y __";
                }

                if (this.trim === null) {
                    this.trim = "both";
                }

                return "y __, M __, d __";
            default:
                if (this.trim === null) {
                    this.trim = "both";
                }

                return "y __, d __, h __, m __, s __";
        }
    }

    // init
    function init(context) {
        if (!context) {
            throw "Moment Duration Format init cannot find moment instance.";
        }

        context.duration.format = durationsFormat;
        context.duration.fn.format = durationFormat;

        context.duration.fn.format.defaults = {
            // Many options are defaulted to `null` to distinguish between
            // 'not set' and 'set to `false`'

            // trim
            // Can be a string, a delimited list of strings, an array of strings,
            // or a boolean.
            // "large" - will trim largest-magnitude zero-value tokens until
            // finding a token with a value, a token identified as 'stopTrim', or
            // the final token of the format string.
            // "small" - will trim smallest-magnitude zero-value tokens until
            // finding a token with a value, a token identified as 'stopTrim', or
            // the final token of the format string.
            // "both" - will execute "large" trim then "small" trim.
            // "mid" - will trim any zero-value tokens that are not the first or
            // last tokens. Usually used in conjunction with "large" or "both".
            // e.g. "large mid" or "both mid".
            // "final" - will trim the final token if it is zero-value. Use this
            // option with "large" or "both" to output an empty string when
            // formatting a zero-value duration. e.g. "large final" or "both final".
            // "all" - Will trim all zero-value tokens. Shorthand for "both mid final".
            // "left" - maps to "large" to support plugin's version 1 API.
            // "right" - maps to "large" to support plugin's version 1 API.
            // `false` - template tokens are not trimmed.
            // `true` - treated as "large".
            // `null` - treated as "large".
            trim: null,

            // stopTrim
            // A moment token string, a delimited set of moment token strings,
            // or an array of moment token strings. Trimming will stop when a token
            // listed in this option is reached. A "*" character in the format
            // template string will also mark a moment token as stopTrim.
            // e.g. "d [days] *h:mm:ss" will always stop trimming at the 'hours' token.
            stopTrim: null,

            // largest
            // Set to a positive integer to output only the "n" largest-magnitude
            // moment tokens that have a value. All lesser-magnitude moment tokens
            // will be ignored. This option takes effect even if `trim` is set
            // to `false`.
            largest: null,

            // maxValue
            // Use `maxValue` to render generalized output for large duration values,
            // e.g. `"> 60 days"`. `maxValue` must be a positive integer and is
            /// applied to the greatest-magnitude moment token in the format template.
            maxValue: null,

            // minValue
            // Use `minValue` to render generalized output for small duration values,
            // e.g. `"< 5 minutes"`. `minValue` must be a positive integer and is
            // applied to the least-magnitude moment token in the format template.
            minValue: null,

            // precision
            // If a positive integer, number of decimal fraction digits to render.
            // If a negative integer, number of integer place digits to truncate to 0.
            // If `useSignificantDigits` is set to `true` and `precision` is a positive
            // integer, sets the maximum number of significant digits used in the
            // formatted output.
            precision: 0,

            // trunc
            // Default behavior rounds final token value. Set to `true` to
            // truncate final token value, which was the default behavior in
            // version 1 of this plugin.
            trunc: false,

            // forceLength
            // Force first moment token with a value to render at full length
            // even when template is trimmed and first moment token has length of 1.
            forceLength: null,

            // userLocale
            // Formatted numerical output is rendered using `toLocaleString`
            // and the locale of the user's environment. Set this option to render
            // numerical output using a different locale. Unit names are rendered
            // and detected using the locale set in moment.js, which can be different
            // from the locale of user's environment.
            userLocale: null,

            // usePlural
            // Will automatically singularize or pluralize unit names when they
            // appear in the text associated with each moment token. Standard and
            // short unit labels are singularized and pluralized, based on locale.
            // e.g. in english, "1 second" or "1 sec" would be rendered instead
            // of "1 seconds" or "1 secs". The default pluralization function
            // renders a plural label for a value with decimal precision.
            // e.g. "1.0 seconds" is never rendered as "1.0 second".
            // Label types and pluralization function are configurable in the
            // localeData extensions.
            usePlural: true,

            // useLeftUnits
            // The text to the right of each moment token in a format string
            // is treated as that token's units for the purposes of trimming,
            // singularizing, and auto-localizing.
            // e.g. "h [hours], m [minutes], s [seconds]".
            // To properly singularize or localize a format string such as
            // "[hours] h, [minutes] m, [seconds] s", where the units appear
            // to the left of each moment token, set useLeftUnits to `true`.
            // This plugin is not tested in the context of rtl text.
            useLeftUnits: false,

            // useGrouping
            // Enables locale-based digit grouping in the formatted output. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
            useGrouping: true,

            // useSignificantDigits
            // Treat the `precision` option as the maximum significant digits
            // to be rendered. Precision must be a positive integer. Significant
            // digits extend across unit types,
            // e.g. "6 hours 37.5 minutes" represents 4 significant digits.
            // Enabling this option causes token length to be ignored. See  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
            useSignificantDigits: false,

            // template
            // The template string used to format the duration. May be a function
            // or a string. Template functions are executed with the `this` binding
            // of the settings object so that template strings may be dynamically
            // generated based on the duration object (accessible via `this.duration`)
            // or any of the other settings. Leading and trailing space, comma,
            // period, and colon characters are trimmed from the resulting string.
            template: defaultFormatTemplate,

            // useToLocaleString
            // Set this option to `false` to ignore the `toLocaleString` feature
            // test and force the use of the `formatNumber` fallback function
            // included in this plugin.
            useToLocaleString: true,

            // formatNumber fallback options.
            // When `toLocaleString` is detected and passes the feature test, the
            // following options will have no effect: `toLocaleString` will be used
            // for formatting and the grouping separator, decimal separator, and
            // integer digit grouping will be determined by the user locale.

            // groupingSeparator
            // The integer digit grouping separator used when using the fallback
            // formatNumber function.
            groupingSeparator: ",",

            // decimalSeparator
            // The decimal separator used when using the fallback formatNumber
            // function.
            decimalSeparator: ".",

            // grouping
            // The integer digit grouping used when using the fallback formatNumber
            // function. Must be an array. The default value of `[3]` gives the
            // standard 3-digit thousand/million/billion digit groupings for the
            // "en" locale. Setting this option to `[3, 2]` would generate the
            // thousand/lakh/crore digit groupings used in the "en-IN" locale.
            grouping: [3]
        };

        context.updateLocale('en', engLocale);
    }

    // Run feature tests for `Number#toLocaleString`.
    toLocaleStringWorks = featureTestToLocaleString();
    toLocaleStringRoundingWorks = toLocaleStringWorks && featureTestToLocaleStringRounding();

    // Initialize duration format on the global moment instance.
    init(moment);

    // Return the init function so that duration format can be
    // initialized on other moment instances.
    return init;
});

/*! Twitter-like Date Formatter
 *  https://github.com/hijonathan/moment.twitter
 *  Date: 2015-04-15
 *
 *  Format plugin for the Moment.js library
 *  http://momentjs.com/
 *
 *  Copyright (c) 2013-2015 Jonathan Kim
 *  Released under the MIT license
 */

(function() {
  var day, formats, hour, initialize, minute, second, week;

  second = 1e3;

  minute = 6e4;

  hour = 36e5;

  day = 864e5;

  week = 6048e5;

  formats = {
    seconds: {
      short: 's',
      long: ' sec'
    },
    minutes: {
      short: 'm',
      long: ' min'
    },
    hours: {
      short: 'h',
      long: ' hr'
    },
    days: {
      short: 'd',
      long: ' day'
    }
  };

  initialize = function(moment) {
    var twitterFormat;
    twitterFormat = function(format) {
      var diff, num, unit, unitStr;
      diff = Math.abs(this.diff(moment()));
      unit = null;
      num = null;
      if (diff <= second) {
        unit = 'seconds';
        num = 1;
      } else if (diff < minute) {
        unit = 'seconds';
      } else if (diff < hour) {
        unit = 'minutes';
      } else if (diff < day) {
        unit = 'hours';
      } else if (format === 'short') {
        if (diff < week) {
          unit = 'days';
        } else {
          return this.format('M/D/YY');
        }
      } else {
        return this.format('MMM D');
      }
      if (!(num && unit)) {
        num = moment.duration(diff)[unit]();
      }
      unitStr = unit = formats[unit][format];
      if (format === 'long' && num > 1) {
        unitStr += 's';
      }
      return num + unitStr;
    };
    moment.fn.twitterLong = function() {
      return twitterFormat.call(this, 'long');
    };
    moment.fn.twitter = moment.fn.twitterShort = function() {
      return twitterFormat.call(this, 'short');
    };
    return moment;
  };

  if (typeof define === 'function' && define.amd) {
    define('moment-twitter', ['moment'], function(moment) {
      return this.moment = initialize(moment);
    });
  } else if (typeof module !== 'undefined') {
    module.exports = initialize(require('moment'));
  } else if (typeof window !== "undefined" && window.moment) {
    this.moment = initialize(this.moment);
  }

}).call(this);

/* 
  http://stackoverflow.com/a/12397882/142225
  Methods: 
    getHost
    getPath
    getHash, setHash
    getParams, setParam, getParam, hasParam, removeParam
    getQuery
*/
function URLParser(u){
    var path="",query="",hash="",params;
    if(u.indexOf("#") > 0){
        hash = u.substr(u.indexOf("#") + 1);
        u = u.substr(0 , u.indexOf("#"));
    }
    if(u.indexOf("?") > 0){
        path = u.substr(0 , u.indexOf("?"));
        query = u.substr(u.indexOf("?") + 1);
        params= query.split('&');
    }else
        path = u;
    return {
        getHost: function(){
            var hostexp = /\/\/([\w.-]*)/;
            var match = hostexp.exec(path);
            if (match != null && match.length > 1)
                return match[1];
            return "";
        },
        getPath: function(){
            var pathexp = /\/\/[\w.-]*(?:\/([^?]*))/;
            var match = pathexp.exec(path);
            if (match != null && match.length > 1)
                return match[1];
            return "";
        },
        getHash: function(){
            return hash;
        },
        getParams: function(){
            return params
        },
        getQuery: function(){
            return query;
        },
        setHash: function(value){
            if(query.length > 0)
                query = "?" + query;
            if(value.length > 0)
                query = query + "#" + value;
            return path + query;
        },
        setParam: function(name, value){
            if(!params){
                params= new Array();
            }
            params.push(name + '=' + value);
            for (var i = 0; i < params.length; i++) {
                if(query.length > 0)
                    query += "&";
                query += params[i];
            }
            if(query.length > 0)
                query = "?" + query;
            if(hash.length > 0)
                query = query + "#" + hash;
            return path + query;
        },
        getParam: function(name){
            if(params){
                for (var i = 0; i < params.length; i++) {
                    var pair = params[i].split('=');
                    if (decodeURIComponent(pair[0]) == name)
                        return decodeURIComponent(pair[1]);
                }
            }
        },
        hasParam: function(name){
            if(params){
                for (var i = 0; i < params.length; i++) {
                    var pair = params[i].split('=');
                    if (decodeURIComponent(pair[0]) == name)
                        return true;
                }
            }
        },
        removeParam: function(name){
            query = "";
            if(params){
                var newparams = new Array();
                for (var i = 0;i < params.length;i++) {
                    var pair = params[i].split('=');
                    if (decodeURIComponent(pair[0]) != name)
                          newparams .push(params[i]);
                }
                params = newparams;
                for (var i = 0; i < params.length; i++) {
                    if(query.length > 0)
                        query += "&";
                    query += params[i];
                }
            }
            if(query.length > 0)
                query = "?" + query;
            if(hash.length > 0)
                query = query + "#" + hash;
            return path + query;
        },
    }
}

function getDateRange(startDate, endDate, dateFormat, period) {
  
  var datesObj = [{
    "startDate" : startDate.format(dateFormat),
    "number"    : 0
  }];
  
  var diff = endDate.diff(startDate,period)+1; // Cause we need to include the current date

  if(!startDate.isValid() || !endDate.isValid()) {
    return;
  }

  for(var i = 0; i < diff; i++) {
    datesObj.push({
      "startDate" : startDate.add(1,period).format(dateFormat),
      "number"    : 0
    });
  }

  return datesObj;
};

// Modded from http://trentrichardson.com/2010/04/06/compute-linear-regressions-in-javascript/
// Expects arrays of numeric values
function linearRegression(x,y){ 
  var lr = {};
  var n = y.length;
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var sum_yy = 0;
  
  for (var i = 0; i < y.length; i++) {     
    sum_x += x[i];
    sum_y += y[i];
    sum_xy += (x[i]*y[i]);
    sum_xx += (x[i]*x[i]);
    sum_yy += (y[i]*y[i]);
  } 
  
  lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
  lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
  lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
  
  return lr;
}

function downloadFile(data,filename,type){
  
  var fileType = type === 'txt' ? 'plain' : type;
  
  var fileData = new Blob([data], {"type": 'text/'+fileType+';charset=utf-8;'});
  
  //IE11 & Edge
  if (navigator.msSaveBlob) {
      navigator.msSaveBlob(fileData, exportFilename);
  }

  //iOS
  else if ( navigator.userAgent.indexOf('iPhone') !== -1 && navigator.userAgent.indexOf('Safari') !== -1 ){

    var popupTemplate =
      '<div class="modal fade">' +
      '  <div class="modal-dialog">' +
      '    <div class="modal-content">' +
      '      <div class="modal-header">' +
      '        <button type="button" class="close" data-dismiss="modal">&times;</button>' +
      '        <h4 class="modal-title">iOS CSV Download</h4>' +
      '      </div>' +
      '      <div class="modal-body">' +
      '        <p>iOS doesn\'t like dynamically-created CSVs, so we\'ve pasted the data into the textarea below. All you gotta do is select the text, choose "Share...", then "Save to Files". Sorry for the bad vibes! We\'re working on a real solution.</p>' +
      '        <textarea id="iosCSV" class="form-control" cols=25 rows=4>'+data+'</textarea>' +
      '      </div>' +
      '      <div class="modal-footer">' +
      '        <button type="button" class="btn btn-link" data-dismiss="modal" onclick="csvLink.click();document.body.removeChild(csvLink);">Got it</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

      $(popupTemplate).modal();

      $('#iosCSV').trigger('select');

  }

  // Everybody else
  else {

    var csvLink = document.createElement('a');
        csvLink.href = window.URL.createObjectURL(fileData);
        csvLink.setAttribute('download', filename+'.'+type);

    // Attach
    document.body.appendChild(csvLink);

    // Click
    csvLink.click();

    // Remove
    document.body.removeChild(csvLink);

  }
} // downloadFile

/* ========================================================================
 * bootstrap-tour - v0.10.2
 * http://bootstraptour.com
 * ========================================================================
 * Copyright 2012-2015 Ulrich Sossou
 *
 * ========================================================================
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================================
 */

(function($, window) {
  var Tour, document;
  document = window.document;
  Tour = (function() {
    function Tour(options) {
      var storage;
      try {
        storage = window.localStorage;
      } catch (_error) {
        storage = false;
      }
      this._options = $.extend({
        name: 'tour',
        steps: [],
        container: 'body',
        autoscroll: true,
        keyboard: true,
        storage: storage,
        debug: false,
        backdrop: false,
        backdropContainer: 'body',
        backdropPadding: 0,
        redirect: true,
        orphan: false,
        duration: false,
        delay: false,
        basePath: '',
        template: '<div class="popover" role="tooltip"> <div class="arrow"></div> <h3 class="popover-title"></h3> <div class="popover-content"></div> <div class="popover-navigation"> <div class="btn-group"> <button class="btn btn-sm btn-default" data-role="prev">&laquo; Prev</button> <button class="btn btn-sm btn-default" data-role="next">Next &raquo;</button> <button class="btn btn-sm btn-default" data-role="pause-resume" data-pause-text="Pause" data-resume-text="Resume">Pause</button> </div> <button class="btn btn-sm btn-default" data-role="end">End tour</button> </div> </div>',
        afterSetState: function(key, value) {},
        afterGetState: function(key, value) {},
        afterRemoveState: function(key) {},
        onStart: function(tour) {},
        onEnd: function(tour) {},
        onShow: function(tour) {},
        onShown: function(tour) {},
        onHide: function(tour) {},
        onHidden: function(tour) {},
        onNext: function(tour) {},
        onPrev: function(tour) {},
        onPause: function(tour, duration) {},
        onResume: function(tour, duration) {},
        onRedirectError: function(tour) {}
      }, options);
      this._force = false;
      this._inited = false;
      this._current = null;
      this.backdrop = {
        overlay: null,
        $element: null,
        $background: null,
        backgroundShown: false,
        overlayElementShown: false
      };
      this;
    }

    Tour.prototype.addSteps = function(steps) {
      var step, _i, _len;
      for (_i = 0, _len = steps.length; _i < _len; _i++) {
        step = steps[_i];
        this.addStep(step);
      }
      return this;
    };

    Tour.prototype.addStep = function(step) {
      this._options.steps.push(step);
      return this;
    };

    Tour.prototype.getStep = function(i) {
      if (this._options.steps[i] != null) {
        return $.extend({
          id: "step-" + i,
          path: '',
          host: '',
          placement: 'right',
          title: '',
          content: '<p></p>',
          next: i === this._options.steps.length - 1 ? -1 : i + 1,
          prev: i - 1,
          animation: true,
          container: this._options.container,
          autoscroll: this._options.autoscroll,
          backdrop: this._options.backdrop,
          backdropContainer: this._options.backdropContainer,
          backdropPadding: this._options.backdropPadding,
          redirect: this._options.redirect,
          reflexElement: this._options.steps[i].element,
          orphan: this._options.orphan,
          duration: this._options.duration,
          delay: this._options.delay,
          template: this._options.template,
          onShow: this._options.onShow,
          onShown: this._options.onShown,
          onHide: this._options.onHide,
          onHidden: this._options.onHidden,
          onNext: this._options.onNext,
          onPrev: this._options.onPrev,
          onPause: this._options.onPause,
          onResume: this._options.onResume,
          onRedirectError: this._options.onRedirectError
        }, this._options.steps[i]);
      }
    };

    Tour.prototype.init = function(force) {
      this._force = force;
      if (this.ended()) {
        this._debug('Tour ended, init prevented.');
        return this;
      }
      this.setCurrentStep();
      this._initMouseNavigation();
      this._initKeyboardNavigation();
      this._onResize((function(_this) {
        return function() {
          return _this.showStep(_this._current);
        };
      })(this));
      if (this._current !== null) {
        this.showStep(this._current);
      }
      this._inited = true;
      return this;
    };

    Tour.prototype.start = function(force) {
      var promise;
      if (force == null) {
        force = false;
      }
      if (!this._inited) {
        this.init(force);
      }
      if (this._current === null) {
        promise = this._makePromise(this._options.onStart != null ? this._options.onStart(this) : void 0);
        this._callOnPromiseDone(promise, this.showStep, 0);
      }
      return this;
    };

    Tour.prototype.next = function() {
      var promise;
      promise = this.hideStep(this._current);
      return this._callOnPromiseDone(promise, this._showNextStep);
    };

    Tour.prototype.prev = function() {
      var promise;
      promise = this.hideStep(this._current);
      return this._callOnPromiseDone(promise, this._showPrevStep);
    };

    Tour.prototype.goTo = function(i) {
      var promise;
      promise = this.hideStep(this._current);
      return this._callOnPromiseDone(promise, this.showStep, i);
    };

    Tour.prototype.end = function() {
      var endHelper, promise;
      endHelper = (function(_this) {
        return function(e) {
          $(document).off(press+".tour-" + _this._options.name);
          $(document).off("keyup.tour-" + _this._options.name);
          $(window).off("resize.tour-" + _this._options.name);
          _this._setState('end', 'yes');
          _this._inited = false;
          _this._force = false;
          _this._clearTimer();
          if (_this._options.onEnd != null) {
            return _this._options.onEnd(_this);
          }
        };
      })(this);
      promise = this.hideStep(this._current);
      return this._callOnPromiseDone(promise, endHelper);
    };

    Tour.prototype.ended = function() {
      return !this._force && !!this._getState('end');
    };

    Tour.prototype.restart = function() {
      this._removeState('current_step');
      this._removeState('end');
      this._removeState('redirect_to');
      return this.start();
    };

    Tour.prototype.pause = function() {
      var step;
      step = this.getStep(this._current);
      if (!(step && step.duration)) {
        return this;
      }
      this._paused = true;
      this._duration -= new Date().getTime() - this._start;
      window.clearTimeout(this._timer);
      this._debug("Paused/Stopped step " + (this._current + 1) + " timer (" + this._duration + " remaining).");
      if (step.onPause != null) {
        return step.onPause(this, this._duration);
      }
    };

    Tour.prototype.resume = function() {
      var step;
      step = this.getStep(this._current);
      if (!(step && step.duration)) {
        return this;
      }
      this._paused = false;
      this._start = new Date().getTime();
      this._duration = this._duration || step.duration;
      this._timer = window.setTimeout((function(_this) {
        return function() {
          if (_this._isLast()) {
            return _this.next();
          } else {
            return _this.end();
          }
        };
      })(this), this._duration);
      this._debug("Started step " + (this._current + 1) + " timer with duration " + this._duration);
      if ((step.onResume != null) && this._duration !== step.duration) {
        return step.onResume(this, this._duration);
      }
    };

    Tour.prototype.hideStep = function(i) {
      var hideStepHelper, promise, step;
      step = this.getStep(i);
      if (!step) {
        return;
      }
      this._clearTimer();
      promise = this._makePromise(step.onHide != null ? step.onHide(this, i) : void 0);
      hideStepHelper = (function(_this) {
        return function(e) {
          var $element;
          $element = $(step.element);
          if (!($element.data('bs.popover') || $element.data('popover'))) {
            $element = $('body');
          }
          $element.popover('destroy').removeClass("tour-" + _this._options.name + "-element tour-" + _this._options.name + "-" + i + "-element");
          $element.removeData('bs.popover');
          if (step.reflex) {
            $(step.reflexElement).removeClass('tour-step-element-reflex').off("" + (_this._reflexEvent(step.reflex)) + ".tour-" + _this._options.name);
          }
          if (step.backdrop) {
            _this._hideBackdrop();
          }
          if (step.onHidden != null) {
            return step.onHidden(_this);
          }
        };
      })(this);
      this._callOnPromiseDone(promise, hideStepHelper);
      return promise;
    };

    Tour.prototype.showStep = function(i) {
      var promise, showStepHelper, skipToPrevious, step;
      if (this.ended()) {
        this._debug('Tour ended, showStep prevented.');
        return this;
      }
      step = this.getStep(i);
      if (!step) {
        return;
      }
      skipToPrevious = i < this._current;
      promise = this._makePromise(step.onShow != null ? step.onShow(this, i) : void 0);
      showStepHelper = (function(_this) {
        return function(e) {
          var path, showPopoverAndOverlay;
          _this.setCurrentStep(i);
          path = (function() {
            switch ({}.toString.call(step.path)) {
              case '[object Function]':
                return step.path();
              case '[object String]':
                return this._options.basePath + step.path;
              default:
                return step.path;
            }
          }).call(_this);
          if (_this._isRedirect(step.host, path, document.location)) {
            _this._redirect(step, i, path);
            if (!_this._isJustPathHashDifferent(step.host, path, document.location)) {
              return;
            }
          }
          if (_this._isOrphan(step)) {
            if (step.orphan === false) {
              _this._debug("Skip the orphan step " + (_this._current + 1) + ".\nOrphan option is false and the element does not exist or is hidden.");
              if (skipToPrevious) {
                _this._showPrevStep();
              } else {
                _this._showNextStep();
              }
              return;
            }
            _this._debug("Show the orphan step " + (_this._current + 1) + ". Orphans option is true.");
          }
          if (step.backdrop) {
            _this._showBackdrop(step);
          }
          showPopoverAndOverlay = function() {
            if (_this.getCurrentStep() !== i || _this.ended()) {
              return;
            }
            if ((step.element != null) && step.backdrop) {
              _this._showOverlayElement(step);
            }
            _this._showPopover(step, i);
            if (step.onShown != null) {
              step.onShown(_this);
            }
            return _this._debug("Step " + (_this._current + 1) + " of " + _this._options.steps.length);
          };
          if (step.autoscroll) {
            _this._scrollIntoView(step.element, showPopoverAndOverlay);
          } else {
            showPopoverAndOverlay();
          }
          if (step.duration) {
            return _this.resume();
          }
        };
      })(this);
      if (step.delay) {
        this._debug("Wait " + step.delay + " milliseconds to show the step " + (this._current + 1));
        window.setTimeout((function(_this) {
          return function() {
            return _this._callOnPromiseDone(promise, showStepHelper);
          };
        })(this), step.delay);
      } else {
        this._callOnPromiseDone(promise, showStepHelper);
      }
      return promise;
    };

    Tour.prototype.getCurrentStep = function() {
      return this._current;
    };

    Tour.prototype.setCurrentStep = function(value) {
      if (value != null) {
        this._current = value;
        this._setState('current_step', value);
      } else {
        this._current = this._getState('current_step');
        this._current = this._current === null ? null : parseInt(this._current, 10);
      }
      return this;
    };

    Tour.prototype.redraw = function() {
      return this._showOverlayElement(this.getStep(this.getCurrentStep()).element, true);
    };

    Tour.prototype._setState = function(key, value) {
      var e, keyName;
      if (this._options.storage) {
        keyName = "" + this._options.name + "_" + key;
        try {
          this._options.storage.setItem(keyName, value);
        } catch (_error) {
          e = _error;
          if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
            this._debug('LocalStorage quota exceeded. State storage failed.');
          }
        }
        return this._options.afterSetState(keyName, value);
      } else {
        if (this._state == null) {
          this._state = {};
        }
        return this._state[key] = value;
      }
    };

    Tour.prototype._removeState = function(key) {
      var keyName;
      if (this._options.storage) {
        keyName = "" + this._options.name + "_" + key;
        this._options.storage.removeItem(keyName);
        return this._options.afterRemoveState(keyName);
      } else {
        if (this._state != null) {
          return delete this._state[key];
        }
      }
    };

    Tour.prototype._getState = function(key) {
      var keyName, value;
      if (this._options.storage) {
        keyName = "" + this._options.name + "_" + key;
        value = this._options.storage.getItem(keyName);
      } else {
        if (this._state != null) {
          value = this._state[key];
        }
      }
      if (value === void 0 || value === 'null') {
        value = null;
      }
      this._options.afterGetState(key, value);
      return value;
    };

    Tour.prototype._showNextStep = function() {
      var promise, showNextStepHelper, step;
      step = this.getStep(this._current);
      showNextStepHelper = (function(_this) {
        return function(e) {
          return _this.showStep(step.next);
        };
      })(this);
      promise = this._makePromise(step.onNext != null ? step.onNext(this) : void 0);
      return this._callOnPromiseDone(promise, showNextStepHelper);
    };

    Tour.prototype._showPrevStep = function() {
      var promise, showPrevStepHelper, step;
      step = this.getStep(this._current);
      showPrevStepHelper = (function(_this) {
        return function(e) {
          return _this.showStep(step.prev);
        };
      })(this);
      promise = this._makePromise(step.onPrev != null ? step.onPrev(this) : void 0);
      return this._callOnPromiseDone(promise, showPrevStepHelper);
    };

    Tour.prototype._debug = function(text) {
      if (this._options.debug) {
        return window.console.log("Bootstrap Tour '" + this._options.name + "' | " + text);
      }
    };

    Tour.prototype._isRedirect = function(host, path, location) {
      var currentPath;
      if (host !== '') {
        if (this._isHostDifferent(host, location.href)) {
          return true;
        }
      }
      currentPath = [location.pathname, location.search, location.hash].join('');
      return (path != null) && path !== '' && (({}.toString.call(path) === '[object RegExp]' && !path.test(currentPath)) || ({}.toString.call(path) === '[object String]' && this._isPathDifferent(path, currentPath)));
    };

    Tour.prototype._isHostDifferent = function(host, currentURL) {
      return this._getProtocol(host) !== this._getProtocol(currentURL) || this._getHost(host) !== this._getHost(currentURL);
    };

    Tour.prototype._isPathDifferent = function(path, currentPath) {
      return this._getPath(path) !== this._getPath(currentPath) || !this._equal(this._getQuery(path), this._getQuery(currentPath)) || !this._equal(this._getHash(path), this._getHash(currentPath));
    };

    Tour.prototype._isJustPathHashDifferent = function(host, path, location) {
      var currentPath;
      if (host !== '') {
        if (this._isHostDifferent(host, location.href)) {
          return false;
        }
      }
      currentPath = [location.pathname, location.search, location.hash].join('');
      if ({}.toString.call(path) === '[object String]') {
        return this._getPath(path) === this._getPath(currentPath) && this._equal(this._getQuery(path), this._getQuery(currentPath)) && !this._equal(this._getHash(path), this._getHash(currentPath));
      }
      return false;
    };

    Tour.prototype._redirect = function(step, i, path) {
      if ($.isFunction(step.redirect)) {
        return step.redirect.call(this, path);
      } else if (step.redirect === true) {
        this._debug("Redirect to " + step.host + path);
        if (this._getState('redirect_to') === ("" + i)) {
          this._debug("Error redirection loop to " + path);
          this._removeState('redirect_to');
          if (step.onRedirectError != null) {
            return step.onRedirectError(this);
          }
        } else {
          this._setState('redirect_to', "" + i);
          return document.location.href = "" + step.host + path;
        }
      }
    };

    Tour.prototype._isOrphan = function(step) {
      return (step.element == null) || !$(step.element).length || $(step.element).is(':hidden') && ($(step.element)[0].namespaceURI !== 'http://www.w3.org/2000/svg');
    };

    Tour.prototype._isLast = function() {
      return this._current < this._options.steps.length - 1;
    };

    Tour.prototype._showPopover = function(step, i) {
      var $element, $tip, isOrphan, options, shouldAddSmart;
      $(".tour-" + this._options.name).remove();
      options = $.extend({}, this._options);
      isOrphan = this._isOrphan(step);
      step.template = this._template(step, i);
      if (isOrphan) {
        step.element = 'body';
        step.placement = 'top';
      }
      $element = $(step.element);
      $element.addClass("tour-" + this._options.name + "-element tour-" + this._options.name + "-" + i + "-element");
      if (step.options) {
        $.extend(options, step.options);
      }
      if (step.reflex && !isOrphan) {
        $(step.reflexElement).addClass('tour-step-element-reflex').off("" + (this._reflexEvent(step.reflex)) + ".tour-" + this._options.name).on("" + (this._reflexEvent(step.reflex)) + ".tour-" + this._options.name, (function(_this) {
          return function() {
            if (_this._isLast()) {
              return _this.next();
            } else {
              return _this.end();
            }
          };
        })(this));
      }
      shouldAddSmart = step.smartPlacement === true && step.placement.search(/auto/i) === -1;
      $element.popover({
        placement: shouldAddSmart ? "auto " + step.placement : step.placement,
        trigger: 'manual',
        title: step.title,
        content: step.content,
        html: true,
        animation: step.animation,
        container: step.container,
        template: step.template,
        selector: step.element
      }).popover('show');
      $tip = $element.data('bs.popover') ? $element.data('bs.popover').tip() : $element.data('popover').tip();
      $tip.attr('id', step.id);
      this._reposition($tip, step);
      if (isOrphan) {
        return this._center($tip);
      }
    };

    Tour.prototype._template = function(step, i) {
      var $navigation, $next, $prev, $resume, $template, template;
      template = step.template;
      if (this._isOrphan(step) && {}.toString.call(step.orphan) !== '[object Boolean]') {
        template = step.orphan;
      }
      $template = $.isFunction(template) ? $(template(i, step)) : $(template);
      $navigation = $template.find('.popover-navigation');
      $prev = $navigation.find('[data-role="prev"]');
      $next = $navigation.find('[data-role="next"]');
      $resume = $navigation.find('[data-role="pause-resume"]');
      if (this._isOrphan(step)) {
        $template.addClass('orphan');
      }
      $template.addClass("tour-" + this._options.name + " tour-" + this._options.name + "-" + i);
      if (step.reflex) {
        $template.addClass("tour-" + this._options.name + "-reflex");
      }
      if (step.prev < 0) {
        $prev.addClass('disabled');
        $prev.prop('disabled', true);
      }
      if (step.next < 0) {
        $next.addClass('disabled');
        $next.prop('disabled', true);
      }
      if (!step.duration) {
        $resume.remove();
      }
      return $template.clone().wrap('<div>').parent().html();
    };

    Tour.prototype._reflexEvent = function(reflex) {
      if ({}.toString.call(reflex) === '[object Boolean]') {
        return 'click';
      } else {
        return reflex;
      }
    };

    Tour.prototype._reposition = function($tip, step) {
      var offsetBottom, offsetHeight, offsetRight, offsetWidth, originalLeft, originalTop, tipOffset;
      offsetWidth = $tip[0].offsetWidth;
      offsetHeight = $tip[0].offsetHeight;
      tipOffset = $tip.offset();
      originalLeft = tipOffset.left;
      originalTop = tipOffset.top;
      offsetBottom = $(document).outerHeight() - tipOffset.top - $tip.outerHeight();
      if (offsetBottom < 0) {
        tipOffset.top = tipOffset.top + offsetBottom;
      }
      offsetRight = $('html').outerWidth() - tipOffset.left - $tip.outerWidth();
      if (offsetRight < 0) {
        tipOffset.left = tipOffset.left + offsetRight;
      }
      if (tipOffset.top < 0) {
        tipOffset.top = 0;
      }
      if (tipOffset.left < 0) {
        tipOffset.left = 0;
      }
      $tip.offset(tipOffset);
      if (step.placement === 'bottom' || step.placement === 'top') {
        if (originalLeft !== tipOffset.left) {
          return this._replaceArrow($tip, (tipOffset.left - originalLeft) * 2, offsetWidth, 'left');
        }
      } else {
        if (originalTop !== tipOffset.top) {
          return this._replaceArrow($tip, (tipOffset.top - originalTop) * 2, offsetHeight, 'top');
        }
      }
    };

    Tour.prototype._center = function($tip) {
      return $tip.css('top', $(window).outerHeight() / 2 - $tip.outerHeight() / 2);
    };

    Tour.prototype._replaceArrow = function($tip, delta, dimension, position) {
      return $tip.find('.arrow').css(position, delta ? 50 * (1 - delta / dimension) + '%' : '');
    };

    Tour.prototype._scrollIntoView = function(element, callback) {
      var $element, $window, counter, offsetTop, scrollTop, windowHeight;
      $element = $(element);
      if (!$element.length) {
        return callback();
      }
      $window = $(window);
      offsetTop = $element.offset().top;
      windowHeight = $window.height();
      scrollTop = Math.max(0, offsetTop - (windowHeight / 2));
      this._debug("Scroll into view. ScrollTop: " + scrollTop + ". Element offset: " + offsetTop + ". Window height: " + windowHeight + ".");
      counter = 0;
      return $('body, html').stop(true, true).animate({
        scrollTop: Math.ceil(scrollTop)
      }, (function(_this) {
        return function() {
          if (++counter === 2) {
            callback();
            return _this._debug("Scroll into view.\nAnimation end element offset: " + ($element.offset().top) + ".\nWindow height: " + ($window.height()) + ".");
          }
        };
      })(this));
    };

    Tour.prototype._onResize = function(callback, timeout) {
      return $(window).on("resize.tour-" + this._options.name, function() {
        clearTimeout(timeout);
        return timeout = setTimeout(callback, 100);
      });
    };

    Tour.prototype._initMouseNavigation = function() {
      var _this;
      _this = this;
      return $(document).off(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='prev']").off(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='next']").off(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='end']").off(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='pause-resume']").on(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='next']", (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.next();
        };
      })(this)).on(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='prev']", (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.prev();
        };
      })(this)).on(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='end']", (function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.end();
        };
      })(this)).on(press+".tour-" + this._options.name, ".popover.tour-" + this._options.name + " *[data-role='pause-resume']", function(e) {
        var $this;
        e.preventDefault();
        $this = $(this);
        $this.text(_this._paused ? $this.data('pause-text') : $this.data('resume-text'));
        if (_this._paused) {
          return _this.resume();
        } else {
          return _this.pause();
        }
      });
    };

    Tour.prototype._initKeyboardNavigation = function() {
      if (!this._options.keyboard) {
        return;
      }
      return $(document).on("keyup.tour-" + this._options.name, (function(_this) {
        return function(e) {
          if (!e.which) {
            return;
          }
          switch (e.which) {
            case 39:
              e.preventDefault();
              if (_this._isLast()) {
                return _this.next();
              } else {
                return _this.end();
              }
              break;
            case 37:
              e.preventDefault();
              if (_this._current > 0) {
                return _this.prev();
              }
              break;
            case 27:
              e.preventDefault();
              return _this.end();
          }
        };
      })(this));
    };

    Tour.prototype._makePromise = function(result) {
      if (result && $.isFunction(result.then)) {
        return result;
      } else {
        return null;
      }
    };

    Tour.prototype._callOnPromiseDone = function(promise, cb, arg) {
      if (promise) {
        return promise.then((function(_this) {
          return function(e) {
            return cb.call(_this, arg);
          };
        })(this));
      } else {
        return cb.call(this, arg);
      }
    };

    Tour.prototype._showBackdrop = function(step) {
      if (this.backdrop.backgroundShown) {
        return;
      }
      this.backdrop = $('<div>', {
        "class": 'tour-backdrop'
      });
      this.backdrop.backgroundShown = true;
      return $(step.backdropContainer).append(this.backdrop);
    };

    Tour.prototype._hideBackdrop = function() {
      this._hideOverlayElement();
      return this._hideBackground();
    };

    Tour.prototype._hideBackground = function() {
      if (this.backdrop && this.backdrop.remove)  {
        this.backdrop.remove();
        this.backdrop.overlay = null;
        return this.backdrop.backgroundShown = false;
      }
    };

    Tour.prototype._showOverlayElement = function(step, force) {
      var $element, elementData;
      $element = $(step.element);
      if (!$element || $element.length === 0 || this.backdrop.overlayElementShown && !force) {
        return;
      }
      if (!this.backdrop.overlayElementShown) {
        this.backdrop.$element = $element.addClass('tour-step-backdrop');
        this.backdrop.$background = $('<div>', {
          "class": 'tour-step-background'
        });
        this.backdrop.$background.appendTo(step.backdropContainer);
        this.backdrop.overlayElementShown = true;
      }
      elementData = {
        width: $element.innerWidth(),
        height: $element.innerHeight(),
        offset: $element.offset()
      };
      if (step.backdropPadding) {
        elementData = this._applyBackdropPadding(step.backdropPadding, elementData);
      }
      return this.backdrop.$background.width(elementData.width).height(elementData.height).offset(elementData.offset);
    };

    Tour.prototype._hideOverlayElement = function() {
      if (!this.backdrop.overlayElementShown) {
        return;
      }
      this.backdrop.$element.removeClass('tour-step-backdrop');
      this.backdrop.$background.remove();
      this.backdrop.$element = null;
      this.backdrop.$background = null;
      return this.backdrop.overlayElementShown = false;
    };

    Tour.prototype._applyBackdropPadding = function(padding, data) {
      if (typeof padding === 'object') {
        if (padding.top == null) {
          padding.top = 0;
        }
        if (padding.right == null) {
          padding.right = 0;
        }
        if (padding.bottom == null) {
          padding.bottom = 0;
        }
        if (padding.left == null) {
          padding.left = 0;
        }
        data.offset.top = data.offset.top - padding.top;
        data.offset.left = data.offset.left - padding.left;
        data.width = data.width + padding.left + padding.right;
        data.height = data.height + padding.top + padding.bottom;
      } else {
        data.offset.top = data.offset.top - padding;
        data.offset.left = data.offset.left - padding;
        data.width = data.width + (padding * 2);
        data.height = data.height + (padding * 2);
      }
      return data;
    };

    Tour.prototype._clearTimer = function() {
      window.clearTimeout(this._timer);
      this._timer = null;
      return this._duration = null;
    };

    Tour.prototype._getProtocol = function(url) {
      url = url.split('://');
      if (url.length > 1) {
        return url[0];
      } else {
        return 'http';
      }
    };

    Tour.prototype._getHost = function(url) {
      url = url.split('//');
      url = url.length > 1 ? url[1] : url[0];
      return url.split('/')[0];
    };

    Tour.prototype._getPath = function(path) {
      return path.replace(/\/?$/, '').split('?')[0].split('#')[0];
    };

    Tour.prototype._getQuery = function(path) {
      return this._getParams(path, '?');
    };

    Tour.prototype._getHash = function(path) {
      return this._getParams(path, '#');
    };

    Tour.prototype._getParams = function(path, start) {
      var param, params, paramsObject, _i, _len;
      params = path.split(start);
      if (params.length === 1) {
        return {};
      }
      params = params[1].split('&');
      paramsObject = {};
      for (_i = 0, _len = params.length; _i < _len; _i++) {
        param = params[_i];
        param = param.split('=');
        paramsObject[param[0]] = param[1] || '';
      }
      return paramsObject;
    };

    Tour.prototype._equal = function(obj1, obj2) {
      var k, v;
      if ({}.toString.call(obj1) === '[object Object]' && {}.toString.call(obj2) === '[object Object]') {
        for (k in obj1) {
          v = obj1[k];
          if (obj2[k] !== v) {
            return false;
          }
        }
        for (k in obj2) {
          v = obj2[k];
          if (obj1[k] !== v) {
            return false;
          }
        }
        return true;
      }
      return obj1 === obj2;
    };

    return Tour;

  })();
  return window.Tour = Tour;
})(jQuery, window); // bootstrap tour


/* https://stackoverflow.com/a/196991/142225 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

/* https://github.com/kensnyder/moment-parseplus
   Add support to momentjs for parsing many different date formats with the ability to easily add new formats.
*/
(function (root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['moment'], function (moment) {
      return (root.returnExportsGlobal = factory(moment));
    });
  }
  else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('moment'));
  }
  else {
    // Browser globals
    root.parseplus = factory(root.moment);
  }
}(this, function (moment) {

  /**
   * Hook that moment triggers when the date cannot be parsed
   * @param {Object} config  moment passes an object with info about the instantiation
   * @property {String} _i  The input string that was passed to the constructor
   * @property {Date} _d  Populate this property with a valid date
   * @property {Boolean} _isValid  Set to false if date still cannot be parsed
   */
  moment.createFromInputFallback = function(config) {
    var date = parseplus.attemptToParse(config._i);
    if (date instanceof Date) {
      config._d = date;
    }
    else {
      config._isValid = false;
    }
  };

  (function(locale) {
    /**
     * Monkeypatch moment.locale to update our parser regexes with new locale info
     * @param {String|Array} [names]
     * @param {Object} [object]
     * @returns {String}
     */
    moment.locale = function(names, object) {
      if (arguments.length === 0) {
        return locale.call(moment);
      }
      var currName = locale.call(moment);
      var result = locale.call(moment, names, object);
      var newName = locale.call(moment);
      if (currName != newName) {
        parseplus.updateMatchers();
      }
      return result;
    };
  })(moment.locale);

  /**
   * The parseplus object including methods addMatcher and removeMatcher.
   * Also contains all other methods and values parseplus uses internally.
   * @type {Object}
   */
  var parseplus = {};

  /**
   * Try to parse the given input string. Return a Date if parsing was successful
   * @param {String} input
   * @returns {Date|undefined}
   */
  parseplus.attemptToParse = function(input) {
    var match;
    var parser;
    var i = 0;
    var obj;
    var mo;
    while ((parser = parseplus.parsers[i++])) {
      if (!(match = input.match(parser.matcher))) {
        // this parser cannot parse this date string
        continue;
      }
      if (parser.handler) {
        // a handler function that should return moment or Date
        obj = parser.handler(match, input);
        if (obj instanceof moment && obj.isValid()) {
          return obj.toDate();
        }
        else if (obj instanceof Date) {
          return obj;
        }
      }
      else if (parser.format) {
        // a handler format which will pass a parse string to moment
        mo = parseplus.attemptFormat(match.slice(1), parser.format);
        if (mo.isValid()) {
          return mo.toDate();
        }
      }
    }
  };

  /**
   * Attempt to format the given array of date parts with the given string
   * @param {Array} match  A list of date parts
   * @param {String} format  A space-delimited list of what each date part means
   * @returns {moment}
   */
  parseplus.attemptFormat = function(match, format) {
    var formatArr = [];
    var dateStrs = [];
    // go through each format string and line up to match
    format.split(' ').forEach(function(f, idx) {
      if (f != '*' && match[idx] !== '') {
        dateStrs.push(match[idx]);
        formatArr.push(f);
      }
    });
    return moment(dateStrs.join('|'), formatArr.join('|'));
  };

  /**
   * Compile a string into a regex where things like _MONTH_ are auto replace
   * @param {String} code
   * @returns {RegExp}
   */
  parseplus.compile = function(code) {
    var compiled = code.replace(/_([A-Z][A-Z0-9]+)_/g, function($0, $1) {
      return parseplus.regexes[$1];
    });
    return new RegExp(compiled, 'i');
  };

  /**
   * Update all the parser regexes with new locale data
   */
  parseplus.updateMatchers = function() {
    try {
      parseplus.regexes.MONTHNAME = moment.months().join('|') + '|' + moment.monthsShort().join('|');
      parseplus.regexes.DAYNAME = moment.weekdays().join('|') + '|' + moment.weekdaysShort().join('|');
      var config = moment.localeData()._config;
      parseplus.regexes.AMPM = config.meridiemParse.source;
      var ordinalParse = config.ordinalParse || config.dayOfMonthOrdinalParse;
      parseplus.regexes.ORDINAL = ordinalParse.source.replace(/.*\(([^)]+)\).*/, '$1');
      parseplus.parsers.forEach(function (parser) {
        if (parser.template) {
          parser.matcher = parseplus.compile(parser.template);
        }
      });
    }
    catch (e) {
      // moment has changed its internal handling of localeData
    }
  };

  /**
   * The strings used to generate regexes for parses
   * @type {Object}
   */
  parseplus.regexes = {
    YEAR: "[1-9]\\d{3}|\\d{2}",
    MONTH: "1[0-2]|0?[1-9]",
    MONTH2: "1[0-2]|0[1-9]",
    MONTHNAME: "jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december",
    DAYNAME: "mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday",
    DAY: "3[01]|[12]\\d|0?[1-9]",
    DAY2: "3[01]|[12]\\d|0[1-9]",
    TIMEZONE: "[+-][01]\\d\\:?[0-5]\\d",
    TZABBR: "[A-Z]{3,10}",
    H24: "[01]\\d|2[0-3]",
    H12: "0?[1-9]|1[012]",
    AMPM: "[ap]\\.?m?\\.?",
    MIN: "[0-5]\\d",
    SEC: "[0-5]\\d",
    MS: "\\d{3,}",
    UNIT: "year|month|week|day|hour|minute|second|millisecond",
    ORDINAL: "st|nd|rd|th"
  };

  /**
   * The list of parsers
   * @type {Array}
   */
  parseplus.parsers = [];

  /**
   * Add a parser with the given specification
   * @param {Object} spec  Should contain name, matcher, and replacer or handler
   * @returns {parseplus}
   */
  parseplus.addParser = function (spec) {
    if (spec.template) {
      spec.matcher = parseplus.compile(spec.template);
    }
    parseplus.parsers.push(spec);
    return this;
  };

  /**
   * Remove the parser with the given name
   * @param {String} name
   * @returns {parseplus}
   */
  parseplus.removeParser = function (name) {
    parseplus.parsers.some(function(parser, i) {
      if (parser.name == name) {
        parseplus.parsers.splice(i, 1);
        return true;
      }
    });
    return this;
  };

  /**
   * Remove all parsers
   * @returns {parseplus}
   */
  parseplus.clearParsers = function () {
    parseplus.parsers = [];
    return this;
  };

  // Register our built-in parsers!
  parseplus
    // 24 hour time
    .addParser({
      // lots of 24h time such as "23:59", "T23:59:59+0700", "23:59:59 GMT-05:00", "23:59:59 CST", "T23:59:59Z"
      name: '24h',
      //              $1            $2        $3           $4           $5                   $6             $7
      template: "^(?:(.+?)(?: |T))?(_H24_)\\:(_MIN_)(?:\\:(_SEC_)(?:\\.(_MS_))?)? ?(?:GMT)? ?(_TIMEZONE_)? ?(_TZABBR_)?$",
      handler: function(match) {
        var date, mo;
        if (match[1]) {
          date = parseplus.attemptToParse(match[1]);
          // console.log(['24h parse', match[1], 'into', moment(date).toString()]);
          if (date) {
            mo = moment(date);
          }
          else {
            return;
          }
        }
        else {
          // today plus the given time
          mo = moment();
        }
        if (!match[6] && match[7]) {
          match[6] = parseplus.tzabbrs[match[7]];
          match[7] = '';
        }
        var parts = [mo.year(), mo.month()+1, mo.date()].concat(match.slice(2));
        parts[5] = parts[5] || '00';
        parts[6] = parts[6] || '000';
        parts.pop(); // remove 9th item
        return moment(parts.join('|'), 'YYYY|MM|DD|HH|mm|ss|SSS|ZZ');
      }
    })
    // 12-hour time
    .addParser({
      name: '12h',
      //              $1     $2           $3           $4           $5
      template: "^(?:(.+) )?(_H12_)(?:\\:(_MIN_)(?:\\:(_SEC_))?)? ?(_AMPM_)$",
      handler: function(match) {
        var date, mo;
        if (match[1]) {
          date = parseplus.attemptToParse(match[1]);
          if (date) {
            mo = moment(date);
          }
          else {
            return;
          }
        }
        else {
          // today plus the given time
          mo = moment();
        }
        return moment(
          [mo.year(), mo.month()+1, mo.date()].concat(match.slice(2)).join(' '),
          'YYYY MM DD h mm ss a'
        );
      }
    })
    // date such as "3-15-2010" and "3/15/2010"
    .addParser({
      name: 'us',
      //           $1       $2        $3      $4
      template: "^(_MONTH_)([\\/-])(_DAY_)\\2(_YEAR_)$",
      format: 'MM * DD YYYY'
    })
    // date such as "3-15" and "3/15"
    .addParser({
      name: 'us-yearless',
      //           $1             $2
      template: "^(_MONTH_)[\\/-](_DAY_)$",
      handler: function(match) {
        return moment(
          [match[1], match[2], new Date().getFullYear()].join(' '),
          'MM DD YYYY'
        );
      }
    })
    // date such as "15.03.2010" and "15/3/2010"
    .addParser({
      name: 'world',
      //           $1     $2        $3          $4
      template: "^(_DAY_)([\\/\\.])(_MONTH_)\\2(_YEAR_)$",
      format: 'DD * MM YYYY'
    })
    // date such as "15.03" and "15/3"
    .addParser({
      name: 'world-yearless',
      //           $1             $2
      template: "^(_DAY_)[\\/\\.](_MONTH_)$",
      handler: function(match) {
        return moment(
          [match[1], match[2], new Date().getFullYear()].join(' '),
          'DD MM YYYY'
        );
      }
    })
    // date such as "15-Mar-2010", "8 Dec 2011", "Thu, 8 Dec 2011"
    .addParser({
      name: 'rfc-2822',
      //                                    $1                   $2                        $3
      template: "^(?:(?:_DAYNAME_)\\.?,? )?(_DAY_)(?:_ORDINAL_)?([ -])(_MONTHNAME_)\\.?\\2(_YEAR_)$",
      format: 'DD * MMM YYYY'
    })
    // date such as "15-Mar", "8 Dec", "Thu, 8 Dec"
    .addParser({
      name: 'rfc-2822-yearless',
      //                                    $1                       $2
      template: "^(?:(?:_DAYNAME_)\\.?,? )?(_DAY_)(?:_ORDINAL_)?[ -](_MONTHNAME_)\\.?$",
      handler: function(match) {
        return moment(
          [match[1], match[2], new Date().getFullYear()].join(' '),
          'DD MMM YYYY'
        );
      }
    })
    // date such as "March 4, 2012", "Mar 4 2012", "Sun Mar 4 2012"
    .addParser({
      name: 'conversational',
      //                                    $1                $2                      $3
      template: "^(?:(?:_DAYNAME_)\\.?,? )?(_MONTHNAME_)\\.? (_DAY_)(?:_ORDINAL_)?,? (_YEAR_)$",
      replacer: '$1 $2 $3',
      format: 'MMM DD YYYY'
    })
    // date such as "March 4", "Mar 4", "Sun Mar 4"
    .addParser({
      name: 'conversational-yearless',
      //                                    $1                $2
      template: "^(?:(?:_DAYNAME_)\\.?,? )?(_MONTHNAME_)\\.? (_DAY_)(?:_ORDINAL_)?$",
      handler: function (match) {
        return moment(
          [match[1], match[2], new Date().getFullYear()].join(' '),
          'MMM DD YYYY'
        );
      }
    })
    // date such as "Tue Jun 22 17:47:27 +0000 2010"
    .addParser({
      name: 'twitter',
      //                             $1                   $2      $3         $4      $5          $6           $7
      template: "^(?:_DAYNAME_)\\.? (_MONTHNAME_)\\.?\.? (_DAY_) (_H24_)?\\:(_MIN_)?(\\:_SEC_)? (_TIMEZONE_) (_YEAR_)$",
      format: 'MMM DD HH mm ss ZZ YYYY'
    })
    .addParser({
      name: 'ago',
      template: "^([\\d.]+) (_UNIT_)s? ago$",
      handler: function(match) {
        return moment().subtract(parseFloat(match[1]), match[2]);
      }
    })
    .addParser({
      name: 'in',
      template: "^in ([\\d.]+) (_UNIT_)s?$",
      handler: function(match) {
        return moment().add(parseFloat(match[1]), match[2]);
      }
    })
    .addParser({
      name: 'today',
      matcher: /^(today|now|tomorrow|yesterday)/i,
      handler: function(match) {
        switch (match[1].toLowerCase()) {
          case 'today':
          case 'now':
            return moment();
          case 'tomorrow':
            return moment().add(1, 'day');
          case 'yesterday':
            return moment().subtract(1, 'day');
        }
      }
    })
    .addParser({
      name: 'plus',
      template: "^([+-]) ?([\\d.]+) ?(_UNIT_)s?$",
      handler: function(match) {
        var mult = match[1] == '-' ? -1 : 1;
        return moment().add(mult * parseFloat(match[2]), match[3]);
      }
    })
  ;

  /**
   * A lookup of Timezone offset string by abbreviation. In some cases
   * multiple timezones have the same abbreviation. In those cases
   * the more US-centric one is used
   * @type {Object}
   */
  parseplus.tzabbrs = {
    "ACDT": "+10:30", // Australian Central Daylight Savings Time
    "ACST": "+09:30", // Australian Central Standard Time
    // "ACT": "-05:00", // Acre Time
    "ACT": "+08:00", // ASEAN Common Time
    "ADT": "-03:00", // Atlantic Daylight Time
    "AEDT": "+11:00", // Australian Eastern Daylight Savings Time
    "AEST": "+10:00", // Australian Eastern Standard Time
    "AFT": "+04:30", // Afghanistan Time
    "AKDT": "-08:00", // Alaska Daylight Time
    "AKST": "-09:00", // Alaska Standard Time
    "AMST": "-03:00", // Amazon Summer Time (Brazil)[1]
    "AMT": "-04:00", // Amazon Time (Brazil)[2]
    // "AMT": "+04:00", // Armenia Time
    "ART": "-03:00", // Argentina Time
    "AST": "+03:00", // Arabia Standard Time
    // "AST": "-04:00", // Atlantic Standard Time
    "AWDT": "+09:00", // Australian Western Daylight Time
    "AWST": "+08:00", // Australian Western Standard Time
    "AZOST": "-01:00", // Azores Standard Time
    "AZT": "+04:00", // Azerbaijan Time
    // "BDT": "+08:00", // Brunei Time
    "BDT": "+06:00", // Bangladesh Daylight Time (Bangladesh Daylight saving time keeps UTC+06 offset) [3]
    "BIOT": "+06:00", // British Indian Ocean Time
    "BIT": "-12:00", // Baker Island Time
    "BOT": "-04:00", // Bolivia Time
    "BRST": "-02:00", // Brasilia Summer Time
    "BRT": "-03:00", // Brasilia Time
    // "BST": "+06:00", // Bangladesh Standard Time
    // "BST": "+11:00", // Bougainville Standard Time[4]
    "BST": "+01:00", // British Summer Time (British Standard Time from Feb 1968 to Oct 1971)
    "BTT": "+06:00", // Bhutan Time
    "CAT": "+02:00", // Central Africa Time
    "CCT": "+06:30", // Cocos Islands Time
    "CDT": "-05:00", // Central Daylight Time (North America)
    // "CDT": "-04:00", // Cuba Daylight Time[5]
    "CEDT": "+02:00", // Central European Daylight Time
    "CEST": "+02:00", // Central European Summer Time (Cf. HAEC)
    "CET": "+01:00", // Central European Time
    "CHADT": "+13:45", // Chatham Daylight Time
    "CHAST": "+12:45", // Chatham Standard Time
    "CHOT": "+08:00", // Choibalsan
    "ChST": "+10:00", // Chamorro Standard Time
    "CHUT": "+10:00", // Chuuk Time
    "CIST": "-08:00", // Clipperton Island Standard Time
    "CIT": "+08:00", // Central Indonesia Time
    "CKT": "-10:00", // Cook Island Time
    "CLST": "-03:00", // Chile Summer Time
    "CLT": "-04:00", // Chile Standard Time
    "COST": "-04:00", // Colombia Summer Time
    "COT": "-05:00", // Colombia Time
    "CST": "-06:00", // Central Standard Time (North America)
    // "CST": "+08:00", // China Standard Time
    // "CST": "+09:30", // Central Standard Time (Australia)
    // "CST": "+10:30", // Central Summer Time (Australia)
    // "CST": "-05:00", // Cuba Standard Time
    "CT": "+08:00", // China time
    "CVT": "-01:00", // Cape Verde Time
    "CWST": "+08:45", // Central Western Standard Time (Australia) unofficial
    "CXT": "+07:00", // Christmas Island Time
    "DAVT": "+07:00", // Davis Time
    "DDUT": "+10:00", // Dumont d'Urville Time
    "DFT": "+01:00", // AIX specific equivalent of Central European Time[6]
    "EASST": "-05:00", // Easter Island Standard Summer Time
    "EAST": "-06:00", // Easter Island Standard Time
    "EAT": "+03:00", // East Africa Time
    // "ECT": "-04:00", // Eastern Caribbean Time (does not recognise DST)
    "ECT": "-05:00", // Ecuador Time
    "EDT": "-04:00", // Eastern Daylight Time (North America)
    "EEDT": "+03:00", // Eastern European Daylight Time
    "EEST": "+03:00", // Eastern European Summer Time
    "EET": "+02:00", // Eastern European Time
    "EGST": "+00:00", // Eastern Greenland Summer Time
    "EGT": "-01:00", // Eastern Greenland Time
    "EIT": "+09:00", // Eastern Indonesian Time
    "EST": "-05:00", // Eastern Standard Time (North America)
    // "EST": "+10:00", // Eastern Standard Time (Australia)
    "FET": "+03:00", // Further-eastern European Time
    "FJT": "+12:00", // Fiji Time
    "FKST": "-03:00", // Falkland Islands Standard Time
    // "FKST": "-03:00", // Falkland Islands Summer Time
    "FKT": "-04:00", // Falkland Islands Time
    "FNT": "-02:00", // Fernando de Noronha Time
    "GALT": "-06:00", // Galapagos Time
    "GAMT": "-09:00", // Gambier Islands
    "GET": "+04:00", // Georgia Standard Time
    "GFT": "-03:00", // French Guiana Time
    "GILT": "+12:00", // Gilbert Island Time
    "GIT": "-09:00", // Gambier Island Time
    "GMT": "+00:00", // Greenwich Mean Time
    "GST": "-02:00", // South Georgia and the South Sandwich Islands
    // "GST": "+04:00", // Gulf Standard Time
    "GYT": "-04:00", // Guyana Time
    "HADT": "-09:00", // Hawaii-Aleutian Daylight Time
    "HAEC": "+02:00", // Heure Avancée d'Europe Centrale francised name for CEST
    "HAST": "-10:00", // Hawaii-Aleutian Standard Time
    "HKT": "+08:00", // Hong Kong Time
    "HMT": "+05:00", // Heard and McDonald Islands Time
    "HOVT": "+07:00", // Khovd Time
    "HST": "-10:00", // Hawaii Standard Time
    "IBST": "+00:00", // International Business Standard Time
    "ICT": "+07:00", // Indochina Time
    "IDT": "+03:00", // Israel Daylight Time
    "IOT": "+03:00", // Indian Ocean Time
    "IRDT": "+04:30", // Iran Daylight Time
    "IRKT": "+08:00", // Irkutsk Time
    "IRST": "+03:30", // Iran Standard Time
    // "IST": "+05:30", // Indian Standard Time
    // "IST": "+01:00", // Irish Standard Time[7]
    "IST": "+02:00", // Israel Standard Time
    "JST": "+09:00", // Japan Standard Time
    "KGT": "+06:00", // Kyrgyzstan time
    "KOST": "+11:00", // Kosrae Time
    "KRAT": "+07:00", // Krasnoyarsk Time
    "KST": "+09:00", // Korea Standard Time
    "LHST": "+10:30", // Lord Howe Standard Time
    // "LHST": "+11:00", // Lord Howe Summer Time
    "LINT": "+14:00", // Line Islands Time
    "MAGT": "+12:00", // Magadan Time
    "MART": "-09:30", // Marquesas Islands Time
    "MAWT": "+05:00", // Mawson Station Time
    "MDT": "-06:00", // Mountain Daylight Time (North America)
    "MET": "+01:00", // Middle European Time Same zone as CET
    "MEST": "+02:00", // Middle European Summer Time Same zone as CEST
    "MHT": "+12:00", // Marshall Islands
    "MIST": "+11:00", // Macquarie Island Station Time
    "MIT": "-09:30", // Marquesas Islands Time
    "MMT": "+06:30", // Myanmar Time
    "MSK": "+03:00", // Moscow Time
    // "MST": "+08:00", // Malaysia Standard Time
    "MST": "-07:00", // Mountain Standard Time (North America)
    // "MST": "+06:30", // Myanmar Standard Time
    "MUT": "+04:00", // Mauritius Time
    "MVT": "+05:00", // Maldives Time
    "MYT": "+08:00", // Malaysia Time
    "NCT": "+11:00", // New Caledonia Time
    "NDT": "-02:30", // Newfoundland Daylight Time
    "NFT": "+11:00", // Norfolk Time
    "NPT": "+05:45", // Nepal Time
    "NST": "-03:30", // Newfoundland Standard Time
    "NT": "-03:30", // Newfoundland Time
    "NUT": "-11:00", // Niue Time
    "NZDT": "+13:00", // New Zealand Daylight Time
    "NZST": "+12:00", // New Zealand Standard Time
    "OMST": "+06:00", // Omsk Time
    "ORAT": "+05:00", // Oral Time
    "PDT": "-07:00", // Pacific Daylight Time (North America)
    "PET": "-05:00", // Peru Time
    "PETT": "+12:00", // Kamchatka Time
    "PGT": "+10:00", // Papua New Guinea Time
    "PHOT": "+13:00", // Phoenix Island Time
    "PKT": "+05:00", // Pakistan Standard Time
    "PMDT": "-02:00", // Saint Pierre and Miquelon Daylight time
    "PMST": "-03:00", // Saint Pierre and Miquelon Standard Time
    "PONT": "+11:00", // Pohnpei Standard Time
    "PST": "-08:00", // Pacific Standard Time (North America)
    // "PST": "+08:00", // Philippine Standard Time
    "PYST": "-03:00", // Paraguay Summer Time (South America)[8]
    "PYT": "-04:00", // Paraguay Time (South America)[9]
    "RET": "+04:00", // Réunion Time
    "ROTT": "-03:00", // Rothera Research Station Time
    "SAKT": "+11:00", // Sakhalin Island time
    "SAMT": "+04:00", // Samara Time
    "SAST": "+02:00", // South African Standard Time
    "SBT": "+11:00", // Solomon Islands Time
    "SCT": "+04:00", // Seychelles Time
    "SGT": "+08:00", // Singapore Time
    "SLST": "+05:30", // Sri Lanka Standard Time
    "SRET": "+11:00", // Srednekolymsk Time
    "SRT": "-03:00", // Suriname Time
    // "SST": "-11:00", // Samoa Standard Time
    "SST": "+08:00", // Singapore Standard Time
    "SYOT": "+03:00", // Showa Station Time
    "TAHT": "-10:00", // Tahiti Time
    "THA": "+07:00", // Thailand Standard Time
    "TFT": "+05:00", // Indian/Kerguelen
    "TJT": "+05:00", // Tajikistan Time
    "TKT": "+13:00", // Tokelau Time
    "TLT": "+09:00", // Timor Leste Time
    "TMT": "+05:00", // Turkmenistan Time
    "TOT": "+13:00", // Tonga Time
    "TVT": "+12:00", // Tuvalu Time
    "UCT": "+00:00", // Coordinated Universal Time
    "ULAT": "+08:00", // Ulaanbaatar Time
    "USZ1": "+02:00", // Kaliningrad Time
    "UTC": "+00:00", // Coordinated Universal Time
    "UYST": "-02:00", // Uruguay Summer Time
    "UYT": "-03:00", // Uruguay Standard Time
    "UZT": "+05:00", // Uzbekistan Time
    "VET": "-04:00", // Venezuelan Standard Time
    "VLAT": "+10:00", // Vladivostok Time
    "VOLT": "+04:00", // Volgograd Time
    "VOST": "+06:00", // Vostok Station Time
    "VUT": "+11:00", // Vanuatu Time
    "WAKT": "+12:00", // Wake Island Time
    "WAST": "+02:00", // West Africa Summer Time
    "WAT": "+01:00", // West Africa Time
    "WEDT": "+01:00", // Western European Daylight Time
    "WEST": "+01:00", // Western European Summer Time
    "WET": "+00:00", // Western European Time
    "WIT": "+07:00", // Western Indonesian Time
    "WST": "+08:00", // Western Standard Time
    "YAKT": "+09:00", // Yakutsk Time
    "YEKT": "+05:00", // Yekaterinburg Time
    "Z": "+00:00" // Zulu Time (Coordinated Universal Time)
  };

  return parseplus;

}));

parseplus.addParser({ // Not sure if we need this, but couldn't hurt!
  name: 'unixms',
  matcher: /(?:\b\d{13}\b)/,
  handler: function(match) {
    return moment(match,'x');
  }
});

// The following is from https://stackoverflow.com/a/7557433/142225
function isElementInViewport (el) {

    //special bonus for those using jQuery
    if (typeof jQuery === "function" && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

/*!
 * jQCloud 2.0.3
 * Copyright 2011 Luca Ongaro (http://www.lucaongaro.eu)
 * Copyright 2013 Daniel White (http://www.developerdan.com)
 * Copyright 2014-2017 Damien "Mistic" Sorel (http://www.strangeplanet.fr)
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */
!function(a,b){"function"==typeof define&&define.amd?define(["jquery"],b):"object"==typeof module&&module.exports?module.exports=b(require("jquery")):b(a.jQuery)}(this,function(a){"use strict";function b(a,b,c){var d={pid:null,last:0};return function(){function e(){return d.last=(new Date).getTime(),a.apply(c||h,Array.prototype.slice.call(g))}var f=(new Date).getTime()-d.last,g=arguments,h=this;return f>b?e():(clearTimeout(d.pid),void(d.pid=setTimeout(e,b-f)))}}var c=function(b,c,d){this.$element=a(b),this.word_array=c||[],this.options=d,this.sizeGenerator=null,this.colorGenerator=null,this.data={placed_words:[],timeouts:{},namespace:null,step:null,angle:null,aspect_ratio:null,max_weight:null,min_weight:null,sizes:[],colors:[]},this.initialize()};c.DEFAULTS={width:100,height:100,center:{x:.5,y:.5},steps:10,delay:null,shape:"elliptic",classPattern:"w{n}",encodeURI:!0,removeOverflowing:!0,afterCloudRender:null,autoResize:!1,colors:null,fontSize:null,template:null},c.prototype={initialize:function(){if(this.options.width?this.$element.width(this.options.width):this.options.width=this.$element.width(),this.options.height?this.$element.height(this.options.height):this.options.height=this.$element.height(),this.options=a.extend(!0,{},c.DEFAULTS,this.options),null===this.options.delay&&(this.options.delay=this.word_array.length>50?10:0),this.options.center.x>1&&(this.options.center.x=this.options.center.x/this.options.width,this.options.center.y=this.options.center.y/this.options.height),"function"==typeof this.options.colors)this.colorGenerator=this.options.colors;else if(a.isArray(this.options.colors)){var d=this.options.colors.length;if(d>0){if(d<this.options.steps)for(var e=d;e<this.options.steps;e++)this.options.colors[e]=this.options.colors[d-1];this.colorGenerator=function(a){return this.options.colors[this.options.steps-a]}}}if("function"==typeof this.options.fontSize)this.sizeGenerator=this.options.fontSize;else if(a.isPlainObject(this.options.fontSize))this.sizeGenerator=function(a,b,c){var d=a*this.options.fontSize.from,e=a*this.options.fontSize.to;return Math.round(e+1*(d-e)/(this.options.steps-1)*(c-1))+"px"};else if(a.isArray(this.options.fontSize)){var f=this.options.fontSize.length;if(f>0){if(f<this.options.steps)for(var g=f;g<this.options.steps;g++)this.options.fontSize[g]=this.options.fontSize[f-1];this.sizeGenerator=function(a,b,c){return this.options.fontSize[this.options.steps-c]}}}this.data.angle=6.28*Math.random(),this.data.step="rectangular"===this.options.shape?18:2,this.data.aspect_ratio=this.options.width/this.options.height,this.clearTimeouts(),this.data.namespace=(this.$element.attr("id")||Math.floor(1e6*Math.random()).toString(36))+"_word_",this.$element.addClass("jqcloud"),"static"===this.$element.css("position")&&this.$element.css("position","relative"),this.createTimeout(a.proxy(this.drawWordCloud,this),10),this.options.autoResize&&a(window).on("resize."+this.data.namespace,b(this.resize,50,this))},createTimeout:function(b,c){var d=setTimeout(a.proxy(function(){delete this.data.timeouts[d],b()},this),c);this.data.timeouts[d]=!0},clearTimeouts:function(){a.each(this.data.timeouts,function(a){clearTimeout(a)}),this.data.timeouts={}},overlapping:function(a,b){return Math.abs(2*a.left+a.width-2*b.left-b.width)<a.width+b.width&&Math.abs(2*a.top+a.height-2*b.top-b.height)<a.height+b.height},hitTest:function(a){for(var b=0,c=this.data.placed_words.length;b<c;b++)if(this.overlapping(a,this.data.placed_words[b]))return!0;return!1},drawWordCloud:function(){var a,b;if(this.$element.children('[id^="'+this.data.namespace+'"]').remove(),0!==this.word_array.length){for(a=0,b=this.word_array.length;a<b;a++)this.word_array[a].weight=parseFloat(this.word_array[a].weight,10);if(this.word_array.sort(function(a,b){return b.weight-a.weight}),this.data.max_weight=this.word_array[0].weight,this.data.min_weight=this.word_array[this.word_array.length-1].weight,this.data.colors=[],this.colorGenerator)for(a=0;a<this.options.steps;a++)this.data.colors.push(this.colorGenerator(a+1));if(this.data.sizes=[],this.sizeGenerator)for(a=0;a<this.options.steps;a++)this.data.sizes.push(this.sizeGenerator(this.options.width,this.options.height,a+1));if(this.options.delay>0)this.drawOneWordDelayed();else{for(a=0,b=this.word_array.length;a<b;a++)this.drawOneWord(a,this.word_array[a]);"function"==typeof this.options.afterCloudRender&&this.options.afterCloudRender.call(this.$element)}}},drawOneWord:function(b,c){var d,e,f,g=this.data.namespace+b,h=this.data.angle,i=0,j=0,k=0,l=Math.floor(this.options.steps/2);for(c.attr=a.extend({},c.html,{id:g}),this.data.max_weight!=this.data.min_weight&&(l=Math.round(1*(c.weight-this.data.min_weight)*(this.options.steps-1)/(this.data.max_weight-this.data.min_weight))+1),d=a("<span>").attr(c.attr),d.addClass("jqcloud-word"),this.options.classPattern&&d.addClass(this.options.classPattern.replace("{n}",l)),this.data.colors.length&&d.css("color",this.data.colors[l-1]),c.color&&d.css("color",c.color),this.data.sizes.length&&d.css("font-size",this.data.sizes[l-1]),this.options.template?d.html(this.options.template(c)):c.link?("string"==typeof c.link&&(c.link={href:c.link}),this.options.encodeURI&&(c.link.href=encodeURI(c.link.href).replace(/'/g,"%27")),d.append(a("<a>").attr(c.link).text(c.text))):d.text(c.text),c.handlers&&d.on(c.handlers),this.$element.append(d),e={width:d.outerWidth(),height:d.outerHeight()},e.left=this.options.center.x*this.options.width-e.width/2,e.top=this.options.center.y*this.options.height-e.height/2,f=d[0].style,f.position="absolute",f.left=e.left+"px",f.top=e.top+"px";this.hitTest(e);){if("rectangular"===this.options.shape)switch(j++,j*this.data.step>(1+Math.floor(k/2))*this.data.step*(k%4%2===0?1:this.data.aspect_ratio)&&(j=0,k++),k%4){case 1:e.left+=this.data.step*this.data.aspect_ratio+2*Math.random();break;case 2:e.top-=this.data.step+2*Math.random();break;case 3:e.left-=this.data.step*this.data.aspect_ratio+2*Math.random();break;case 0:e.top+=this.data.step+2*Math.random()}else i+=this.data.step,h+=(b%2===0?1:-1)*this.data.step,e.left=this.options.center.x*this.options.width-e.width/2+i*Math.cos(h)*this.data.aspect_ratio,e.top=this.options.center.y*this.options.height+i*Math.sin(h)-e.height/2;f.left=e.left+"px",f.top=e.top+"px"}return this.options.removeOverflowing&&(e.left<0||e.top<0||e.left+e.width>this.options.width||e.top+e.height>this.options.height)?void d.remove():(this.data.placed_words.push(e),void("function"==typeof c.afterWordRender&&c.afterWordRender.call(d)))},drawOneWordDelayed:function(b){return b=b||0,this.$element.is(":visible")?void(b<this.word_array.length?(this.drawOneWord(b,this.word_array[b]),this.createTimeout(a.proxy(function(){this.drawOneWordDelayed(b+1)},this),this.options.delay)):"function"==typeof this.options.afterCloudRender&&this.options.afterCloudRender.call(this.$element)):void this.createTimeout(a.proxy(function(){this.drawOneWordDelayed(b)},this),10)},destroy:function(){this.options.autoResize&&a(window).off("resize."+this.data.namespace),this.clearTimeouts(),this.$element.removeClass("jqcloud"),this.$element.removeData("jqcloud"),this.$element.children('[id^="'+this.data.namespace+'"]').remove()},update:function(a){this.word_array=a,this.data.placed_words=[],this.clearTimeouts(),this.drawWordCloud()},resize:function(){var a={width:this.$element.width(),height:this.$element.height()};a.width==this.options.width&&a.height==this.options.height||(this.options.width=a.width,this.options.height=a.height,this.data.aspect_ratio=this.options.width/this.options.height,this.update(this.word_array))}},a.fn.jQCloud=function(b,d){var e=arguments;return this.each(function(){var f=a(this),g=f.data("jqcloud");if(g||"destroy"!==b)if(g)"string"==typeof b&&g[b].apply(g,Array.prototype.slice.call(e,1));else{var h="object"==typeof d?d:{};f.data("jqcloud",g=new c(this,b,h))}})},a.fn.jQCloud.defaults={set:function(b){a.extend(!0,c.DEFAULTS,b)},get:function(b){var d=c.DEFAULTS;return b&&(d=d[b]),a.extend(!0,{},d)}}});

// Remove Stop Words
function removeStopWords(sentence) {
  var common = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've"];
  var wordArr = sentence.match(/\w+/g),
      commonObj = {},
      uncommonArr = [],
      word, i;

  for (i = 0; i < common.length; i++) {
      commonObj[ common[i].trim() ] = true;
  }

  for (i = 0; i < wordArr.length; i++) {
      word = wordArr[i].trim().toLowerCase();
      if (!commonObj[word]) {
          uncommonArr.push(word);
      }
  }
  return uncommonArr;
}

// https://gist.github.com/carolineartz/ae3f1021bb41de2b1935 updated to use lodash sortBy
function median(array) {
  array = _.sortBy(array);
  if (array.length % 2 === 0) { // array with even number elements
    return (array[array.length/2] + array[(array.length / 2) - 1]) / 2;
  } else {
    return array[(array.length - 1) / 2]; // array with odd number elements
  }
};

// Attempt to deal with unpredictable date formats
function formatDeviantDatetime(datetimeStr){

  var result = '';

  var dateString = datetimeStr.substr(0,datetimeStr.indexOf(' '));

  // Date is valid, but the rest isn't (or it wouldn't have gotten here)
  if ( moment(dateString).isValid() ){

    // Looks for "0800" format
    if ( datetimeStr.match(/\s\d{4}($|\s)/g) ){
      var timeString = datetimeStr.match(/\s\d{4}($|\s)/g)[0].trim();
      result = moment(dateString+' '+timeString[0]+timeString[1]+':'+timeString[2]+timeString[3]).valueOf();
    }

    //TODO Add other formats people might try?

    else {
      result = moment(dateString).valueOf();
    } // time is not "0800" format

  }

  // Date isn't valid
  else {

    // See if it's some kind of number
    if ( !isNaN(parseFloat(datetimeStr)) ){
      result = moment(parseFloat(datetimeStr)).valueOf();
    }

    // But we want to preserve SOMETHING, so we convert it to a timestamp and hope it's a real time
    else {
      var datetimeBlob = datetimeStr.replace(/[\s\.\,\/\#\!\$\%\^\&\*\;\:\{\}\=\_\`\'\~\(\)]/g,"");
      result = parseFloat(datetimeBlob);
    }

  }

  return result;

} // formatDeviantDatetime

// Round moment duration to nearest stat
function durationStat(duration){

  var number, label;

  if ( Math.round(duration.as('years')) > 1 ){
    number = Math.round(duration.as('years'));
    label  = 'years';
  } else if ( Math.round(duration.as('months')) > 1 ){
    number = Math.round(duration.as('months'));
    label  = 'months';
  } else if ( Math.round(duration.as('days')) > 1 ){
    number = Math.round(duration.as('days'));
    label  = 'days';
  } else if ( Math.round(duration.as('hours')) > 1 ){
    number = Math.round(duration.as('hours'));
    label  = 'hours';
  } else if ( Math.round(duration.as('minutes')) > 1 ){
    number = Math.round(duration.as('minutes'));
    label  = 'minutes';
  } else if ( Math.round(duration.as('seconds')) > 1 ){
    number = Math.round(duration.as('seconds'));
    label  = 'seconds';
  }

  return {
    "number" : number,
    "label"  : label
  }

} // durationStat

// end plugins.js