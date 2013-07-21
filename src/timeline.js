/** @jsx React.DOM */
(function(Perseus) {


var Timeline = Perseus.Timeline = React.createClass({
    render: function() {
        var data = this.props.data;
        console.log("Got Data:");
        console.log(data);
        return <div ref="timeline"></div>;
    },

    componentDidMount: function () {

        var root = this.refs.timeline.getDOMNode();

        renderTimeline(root, this.props.data);
    }
});


var renderTimeline = function (root, data) {

    var stack = d3.layout.stack().offset("zero")

    var colors = d3.scale.category10();


    var labels = ["First impression", "Struggling", "Correct"]


    var margin = {top: 20, right: 30, bottom: 50, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;


    var svg = d3.select(root).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")" +
                            "scale(0.6,0.6)");

    data = data.map(function(d) { return d.map(function(p, i) { return {x:i, y:p, y0:0}; }); });

    var layers = stack(data)

    var colors = d3.scale.category10();

    var x = d3.scale.linear()
        .range([0, width])
        .domain([0,200]);

    var y = d3.scale.linear()
        .range([height, 0])
        .domain([0,200000]);

    var z = d3.scale.category20c();

    var area = d3.svg.area()
        .interpolate('cardinal')
        .x(function(d, i) { return x(i); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y0 + d.y); })


        var legend = svg.append("g")
                .attr("class", "legend")
                .attr("height", 100)
                .attr("width", 100)
            .attr('transform', 'translate(-5,' + (height + 35) + ')');


        legend.selectAll('rect')
            .data(labels)
        .enter()
        .append("rect")
            .attr("x", function(d, i){
                var xPost = legendXPosition(labels, i, 15);
                return xPost;
            })
        .attr("y", -6)
            .attr("width", 20)
            .attr("height", 5)
            .style("fill", function(d, i) {
                var color = colors(i);
                return color;
            });

        legend.selectAll('text')
        .data(labels)
        .enter()
        .append("text")
            .attr("x", function(d, i){
                var xPost = legendXPositionText(labels, i, 22, 15);
                return xPost;
            })
        .attr("y", -1)
            .text(function(d) {
                return d;
            });

    svg.selectAll(".layer")
            .data(layers)
            .enter().append("path")
            .attr("class", "layer")
            .attr("d", function(d) { return area(d); })
            .style("fill", function(d, i) { return colors(i); });

}

function legendXPositionText(data, position, textOffset, avgFontWidth){
    return legendXPosition(data, position, avgFontWidth) + textOffset;
}

function legendXPosition(data, position, avgFontWidth){
    if(position == 0){
        return 0;
    } else {
        var xPostiion = 0;
        for(i = 0; i < position; i++){
            xPostiion += (data[i].length * avgFontWidth);
        }
        return xPostiion;
    }
}

})(Perseus);
