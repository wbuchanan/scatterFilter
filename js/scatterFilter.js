/**
 * Created by billy on 5/18/16.
 */
var dataSet, varnames, varlabs, vallabs, selectX, selectY, distfilter, graphVarNames;
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var brush, brushCell;

d3.json("data/msas.json", function(error, data) {
    if (error) throw error;
    dataSet = data.data.data;
    varnames = data.variableNames;
    varlabs = d3.map(data.variableLabels);
    vallabs = d3.map(data.valueLabels);
    graphVarNames = varnames.filter(function(d) { return !data.variableIsString[d]; });


    var xVarNames = graphVarNames;
    selectX = d3.select("body").append("div")
                .append("span")
                .attr("class", "col-xs-12 col-md-4")
                .text("X-Axis Variable : ")
                .append("select")
                .attr("id", "xvar")
                .attr("onchange", "xChange()");

    selectX.selectAll("option")
        .data(xVarNames)
        .enter().append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return varlabs.get(d); });

    selectY = d3.select("div")
        .append("span")
        .attr("class", "col-xs-12 col-md-4")
        .attr("id", "yvspan")
        .text("Y-Axis Variable : ")
        .append("select")
        .attr("id", "yvar")
        .attr("onchange", "scatter()");

    d3.select("div")
        .append("span")
        .attr("class", "col-xs-12 col-md-4")
        .attr("id", "dfiltername")
        .text("Show Schools Only? ");

    distfilter = d3.selectAll("span#dfiltername").append("input")
        .attr("id", "distfilter")
        .attr("type", "checkbox")
        .attr("value", "dfilter")
        .property("checked", true);

    d3.selectAll("input#distfilter").on("change", function() {
        scatter();
    });

    xLoad();




    // var sel = document.getElementById('xvar');
    // console.log(sel.options[sel.selectedIndex].value)

});


function scatter() {

    var svg = d3.selectAll("svg"),
        group = "offgrade";

    svg.remove();

    var filt = d3.select("input#distfilter").property("checked");
    var xvar = d3.select("select#xvar").selectAll("option")[0][d3.select("select#xvar").property("selectedIndex")].value,
        yvar = d3.select("select#yvar").selectAll("option")[0][d3.select("select#yvar").property("selectedIndex")].value;

    dataSet.forEach(function(d) {
        d[xvar] = +d[xvar];
        d[yvar] = +d[yvar];
    });

/*    dataSet.filter(function(d) {
        if ((d[xvar] != null && d[yvar] != null) &&
            (d[xvar] !== "null" && d[yvar] !== "null") &&
            (d[xvar] != undefined && d[yvar] != undefined) &&
            (!isNaN(d[xvar]) && !isNaN(d[yvar]))) return d;
    });
*/
    var xValue = function(d) { if (!isNaN(d[xvar]) && d[xvar] !== null) return d[xvar];}, // data -> value
        xScale = d3.scale.linear().range([0, width]), // value -> display
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    // setup y
    var yValue = function(d) { if (!isNaN(d[yvar]) && d[yvar] !== null) return d[yvar];}, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    var cValue = function(d) { return d[group];},
        color = d3.scale.category10();

    // add the graph canvas to the body of the webpage
    svg = d3.select("body").append("div").append("svg")
        .attr("class", "col-xs-12 col-sm-8 col-md-8 col-lg-8")
//        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 40);

    xScale.domain([d3.min(dataSet, xValue) - 1, d3.max(dataSet, xValue) + 1]);
    yScale.domain([d3.min(dataSet, yValue) - 1, d3.max(dataSet, yValue) + 1]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(function() { return varlabs.get(xvar); });

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(function() { return varlabs.get(yvar); });

    svg.selectAll(".dot")
        .data(dataSet)
        .enter().append("circle")
        .filter(function(d) { if (!isNaN(d[xvar]) && !isNaN(d[yvar])) {
            if (filt && d["schnm"] != "District Level") return d;
            else if (filt && d["schnm"] == "District Level") return null;
            else return d;
        }
        })
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function(d) { return color(cValue(d));})
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(varlabs.get("distnm") + " : " + d["distnm"] + "<br/>" +
                        varlabs.get("schnm") + " : " + d["schnm"] + "<br/>" +
                varlabs.get(xvar) + " = " + xValue(d) + ", " +
                varlabs.get(yvar) + " = " + yValue(d))
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    // draw legend colored rectangles
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    // draw legend text
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return vallabs.get(group)[d];});

}

function xLoad() {
    var yvars = graphVarNames.filter(function(d, i) {
        if (i !== d3.selectAll("select#xvar").property("selectedIndex"))
            return d;
    });

    d3.select("select#yvar").selectAll("option").remove();

    selectY.selectAll("option")
            .data(yvars)
            .enter().append("option")
            .attr("value", function(d) { return d; })
            .text(function(d) { return varlabs.get(d); });

    scatter();


}


function xChange() {
    var yvars = graphVarNames.filter(function(d, i) {
        if (i !== d3.selectAll("select#xvar").property("selectedIndex"))
            return d;
    });

    d3.select("select#yvar").selectAll("option").remove();

    selectY.selectAll("option")
        .data(yvars)
        .enter().append("option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return varlabs.get(d); });


    scatter();

}

