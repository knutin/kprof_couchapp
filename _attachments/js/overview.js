var series = {};

$.couch.app(function(app) {
    $("#account").evently("account", app);
    $("#profile").evently("profile", app);
    $.evently.connect("#account","#profile", ["loggedIn","loggedOut"]);
    $("#items").evently("items", app);

    chart = make_chart();

    var $db = $.couch.db("kprof_couchapp");
    var now = Math.round(new Date().getTime() / 1000);

    // Populate list of calls
    var calls_select = $("#call");
    calls_select.append($("<option></option>").
                        attr("value", "_total").
                        text("Aggregated across all calls")
                       );

    $db.view("kprof_couchapp/calls", {
        group: true,
        startkey: [now - 30 * 60],
        success: function (calls_data) {
            // Sum the means of each specific call
            var calls = _(calls_data.rows).chain()
                .groupBy(function (r) {
                    return r['key'][1];
                })
                .foldl(function (acc, values, call) {
                    var sum = _.foldl(values, function (sums, v) {
                        return sums + v['value'];
                    }, 0);

                    acc[call] = (acc[call] || 0) + sum;
                    return acc
                }, {}).value();

            var total_runtime = calls['_total'];
            delete calls['_total'];

            _.each(calls, function (mean, call) {
                var percentage = (mean / total_runtime) * 100;

                calls_select.append($("<option></option>").
                                    attr("value", call).
                                    text(call + ": " + trunc(percentage) + "%")
                                   );
                
            });
        }
    });
    calls_select.change(function () {
        chart = make_chart();
        load_call($(this).val());
    });

    calls_select.change();

});

function load_call(call) {
    var now = Math.round(new Date().getTime() / 1000);
    var $db = $.couch.db("kprof_couchapp");
    var startkey = [call, now - 60 * 60];
    var endkey = [call, now];

    series = {};
    $db.view("kprof_couchapp/call_by_time", {
        startkey: startkey,
        endkey: endkey,

        success: function(tier_data) {
            series = _.groupBy(tier_data.rows, function (r) {
                var tier = r['value']['key'].split(".")[0];
                return tier;
            });

            _.each(series, function (data, tier) {
                var s = _.map(data, function (r) {
                    var t = r['value']['timestamp'] * 1000;
                    return [t, r['value']['mean']];
                });
                chart.addSeries({name: tier, data: s});
            });
        }
    });
}


function make_chart() {
    return new Highcharts.Chart({
        chart: {
            renderTo: 'chart',
            defaultSeriesType: 'line',
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: null,
            labels: {
                formatter: function() {
                    return this.value / 1000 + " ms";
                }
            }
        },
        tooltip: {
            enable: true,
            formatter: function() {
                var x = this.point.x / 1000;
                var s = series[this.series.name];
                var datapoint = _.detect(s, function(o) {
                    return o['value']['timestamp'] == x;
                });
                var d = datapoint['value'];
                return "<strong>" + this.series.name + "</strong>" +
                    "<br/>Observations: " + d['observations'] +
                    "<br/>Mean: " + trunc(d['mean']) +
                    "<br/>Min: " + trunc(d['min']) +
                    "<br/>Max: " + trunc(d['max']) +
                    "<br/>SD: " + trunc(d['sd']) +
                    "<br/>25%: " + trunc(d['quantile_25']) +
                    "<br/>75%: " + trunc(d['quantile_75']) +
                    "<br/>99%: " + trunc(d['quantile_99']) +
                    "<br/>99.9%: " + trunc(d['quantile_999'])
                ;
            }
        },
        title: {
            text: 'Mean response time, by tier'
        },
        series: []
    });
}

function trunc(i) {
    return Math.round(i * 100) / 100;
}