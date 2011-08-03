var series = {};

$.couch.app(function(app) {
    $("#account").evently("account", app);
    $("#profile").evently("profile", app);
    $.evently.connect("#account","#profile", ["loggedIn","loggedOut"]);
    $("#items").evently("items", app);

    chart = make_chart();

    var $db = $.couch.db("kprof_couchapp");
    var now = Math.round(new Date().getTime() / 1000);
    
    // Get the tiers seen in the given time period, sorted by the sum
    // of means, which should give us an idea of the most expensive /
    // least expensive tier, and thus how to sort the graph
    $db.view("kprof_couchapp/tiers", {
        group: true,
        success: function(tier_data) {
            var tiers = _.map(tier_data.rows, function (o) { return o['key'] });

            _.each(tiers, function(tier) {
                $db.view("kprof_couchapp/tier_by_time", {
                    startkey: [tier, now - 60 * 60],
                    endkey: [tier, now],
                    async: false,
                    success: function(data) {
                        series[tier] = data.rows;
                        var s = _.map(data.rows, function (r) {
                            var t = r['value']['timestamp'] * 1000;
                            return [t, r['value']['mean']]

                        });
                        chart.addSeries({name: tier, data: s});
                    }
                });
            });
        }
    });
});

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