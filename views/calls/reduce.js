function(keys, values, rereduce) {
    var sum = 0;
    for (var i = 0; i < values.length; i++) {
        var val = values[i];
        sum += (val[0] * val[1]);
    }
    return sum;
}