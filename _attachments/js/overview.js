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
    $db.view("kprof_couchapp/calls", {
        group: true,
        success: function (calls_data) {
            var calls = _.map(calls_data.rows, function (r) {
                return [r['key'], r['value']];
            });
            calls = _.sortBy(calls, function (c) {
                return c[1];
            }).reverse();

            _.each(calls, function (r) {
                calls_select.append($("<option></option>").
                                    attr("value", r[0]).
                                    text(r[0])
                                   );
            });
        }
    });
    calls_select.change(function () {
        chart = make_chart();
        load_call($(this).val());
    });


    load_call('_total');
});

function load_call(call) {
    var now = Math.round(new Date().getTime() / 1000);
    var $db = $.couch.db("kprof_couchapp");
    var startkey = [call, now - 60 * 60];
    var endkey = [call, now];
    console.log(startkey);
    console.log(endkey);

    series = {};

    console.log(call);
    $db.view("kprof_couchapp/call_by_time", {
        startkey: startkey,
        endkey: endkey,

        success: function(tier_data) {
            console.log(tier_data.rows.length);
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
    return Math.round((i / 1000)* 100) / 100;
}