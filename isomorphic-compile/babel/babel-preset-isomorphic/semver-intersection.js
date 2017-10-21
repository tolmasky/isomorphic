
const semver = require("semver");
const { Range } = semver;


module.exports = semver;

var intersectionsSet = function (setA, setB) {
    var mergeSet = setA.concat(setB);
    var matching = true;
    var minSet = null;
    var maxSet = null;
    var eqSet = null;
    var neqSet = [];
    for (var i = 0; i < mergeSet.length && matching; i++) {
        var mergeSetOperator = mergeSet[i].operator;
        if (mergeSetOperator == '===' || mergeSetOperator == '==' || mergeSetOperator == '=' || mergeSetOperator == '') {
            if (!minSet && !maxSet) {
                eqSet = mergeSet[i];
            } else if ((minSet && minSet.test(mergeSet[i].semver)) || (maxSet && maxSet.test(mergeSet[i].semver))) {
                minSet = null;
                maxSet = null;
                eqSet = mergeSet[i];
            } else {
                matching = false;
                break;
            }
        } else if (mergeSetOperator == '!==' || mergeSetOperator == '!=') {
            neqSet.push(mergeSet[i]);
        } else if (mergeSetOperator == '>' || mergeSetOperator == '>=') {
            var rangeOperator = minSet ? minSet.operator : null;
            if (!minSet) {
                minSet = mergeSet[i];
            } else if (minSet.test(mergeSet[i].semver)) {// a include b
                minSet = mergeSet[i];
                if (minSet.semver == mergeSet[i].semver && rangeOperator != mergeSetOperator) {
                    minSet.operator = '>';
                }
            } else if (mergeSet[i].test(minSet.semver)) {// b include a
                if (rangeOperator != mergeSetOperator) {
                    minSet.operator = '>';
                }
            } else {
                matching = false;
                break;
            }
            if (eqSet) {
                if (!minSet.test(eqSet.semver)) {
                    eqSet = null;
                }
                minSet = null;
            }
        } else if (mergeSetOperator == '<' || mergeSetOperator == '<=') {
            var rangeOperator = maxSet ? maxSet.operator : null;
            if (!maxSet) {
                maxSet = mergeSet[i];
            } else if (maxSet.test(mergeSet[i].semver)) {// a include b
                maxSet = mergeSet[i];
                if (maxSet.semver == mergeSet[i].semver && rangeOperator != mergeSetOperator) {
                    maxSet.operator = '<';
                }
            } else if (mergeSet[i].test(maxSet.semver)) {// b include a
                if (rangeOperator != mergeSetOperator) {
                    maxSet.operator = '<';
                }
            } else {
                matching = false;
                break;
            }
            if (eqSet) {
                if (!maxSet.test(eqSet.semver)) {
                    eqSet = null;
                }
                maxSet = null;
            }
        }
    }
    if (minSet && maxSet && !minSet.test(maxSet.semver) && !maxSet.test(minSet.semver)) {
        matching = false;
    }
    var intersectionSet = [];
    if (matching) {
        if (minSet) {
            intersectionSet.push(minSet);
        }
        if (maxSet) {
            intersectionSet.push(maxSet);
        }
        if (eqSet) {
            intersectionSet = [eqSet];
        }
    }
    return intersectionSet.length ? intersectionSet.concat(neqSet) : null;
};

// get range intersections
Range.prototype.intersections = function (range, loose) {
    range = Range(range, loose);
    var intersectionsRange = Range(this.toString(), this.loose);
    intersectionsRange.set = [];
    intersectionsRange.raw = '';
    for (var i = 0; i < this.set.length; i++) {
        for (var j = 0; j < range.set.length; j++) {
            var rangeSet = intersectionsSet(this.set[i], range.set[j]);
            if (rangeSet) {
                intersectionsRange.set.push(rangeSet);
            }
        }
    }
    intersectionsRange.format();
    return intersectionsRange;
};
