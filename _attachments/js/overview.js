$.couch.app(function(app) {
    $("#account").evently("account", app);
    $("#profile").evently("profile", app);
    $.evently.connect("#account","#profile", ["loggedIn","loggedOut"]);
    $("#items").evently("items", app);

    chart = make_chart();

    var $db = $.couch.db("kprof_couchapp");


    $db.view("kprof_couchapp/tiers", {
        group: true,
        success: function(data) {
            console.log(data.rows);
            var tiers = _.map(data.rows, function (o) { return o['key'] });
        }
    });


    var now = Math.round(new Date().getTime() / 1000);
    $db.view("kprof_couchapp/call_by_time", {
        startkey: ["_total", now - 60 * 60],
        endkey: ["_total", now],
        success: function(data) {
            console.log(data.rows);

            

        }
    });
    
});

function make_chart() {
    return new Highcharts.Chart({
        chart: {
            renderTo: 'chart',
            defaultSeriesType: 'area',
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
                var datapoint;
                for (var i = 0; i < s.length; i++) {
                    if (s[i]['timestamp'] == x)
                        datapoint = s[i];
                }
                var d = datapoint;
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