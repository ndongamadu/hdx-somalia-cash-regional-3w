//configuration object

var config = {
    title:"Somalia Consolidated Cash Programme",
    description:"Who is doing cash interventions in Somalia.",
    data:"data/som-cash-new.json",
    whoFieldName:"organization",
    whatFieldName:"rectified",
    whereFieldName:"pcode",
    geo:"data/som-adm1.geojson",
    joinAttribute:"REG_CODE",
    nameAttribute:"REG_NAME",
    color:"#03a9f4",
    reached: "reached"
  };

//function to generate the 3W component
//data is the whole 3W Excel data set
//geom is geojson file

function generate3WComponent(config,data,geom){

    var lookup = genLookup(geom,config);

    $('#title').html(config.title);
    $('#description').html(config.description);

    var whoChart = dc.rowChart('#hdx-3W-who');
    // var whatChart = dc.bubbleChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    // var whatDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });

    var whoGroup = whoDimension.group().reduceSum(function (d){ return d[config.reached]; });


    var whereGroup = whereDimension.group();
    var all = cf.groupAll();

    whoChart.width($('#hxd-3W-who').width()).height(485)
            .dimension(whoDimension)
            .group(whoGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(15)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .renderTitle(true)
            .title(function(d){
              return "Total beneficiaries : " +d.value;
            })
            .xAxis().ticks(8);

    // whatChart.width($('#hxd-3W-what').width()).height(400)
    //         .dimension(whatDimension)
    //         .group(whatGroup)
    //         .colors([config.color])
    //         .colorAccessor(function(d, i){return 0;})
    //         .data(function(group) {
    //             return group.top(15);
    //         })
    //         .valueAccessor(function (d){
    //           return d.value.totalReached;
    //         })
    //         .transitionDuration(1500)
    //         .radiusValueAccessor(function (p) {
    //         return p.value.totalReached/1000;
    //         })
    //         .x(d3.scale.ordinal().domain([1,50]))
    //         .xUnits(dc.units.ordinal)
    //         // .y(d3.scale.linear().domain([0, 1428215]))
    //         .yAxisPadding(200)
    //         .r(d3.scale.linear().domain([0, 200]))
    //         .minRadiusWithLabel(10)
    //         .elasticY(true)
    //         .elasticX(true)
    //         .renderHorizontalGridLines(true)
    //         .renderTitle(true)
    //         .title(function (p) {
    //           return "Total beneficiaries reached: " +p.value.totalReached;
    //         })
    //         .yAxis().tickFormat(function(v){
    //           return v/1000 +"K";
    //         });



    dc.dataCount('#count-info')
            .dimension(cf)
            .group(all);

    whereChart.width($('#hxd-3W-where').width()).height(475)
            .dimension(whereDimension)
            .group(whereGroup)
            .center([0,0])
            .zoom(0)
            .geojson(geom)
            .colors(['#CCCCCC', config.color])
            .colorDomain([0, 1])
            .colorAccessor(function (d) {
                if(d>0){
                    return 1;
                } else {
                    return 0;
                }
            })
            .featureKeyAccessor(function(feature){
                return feature.properties[config.joinAttribute];
            }).popup(function(d){
                return lookup[d.key];
            })
            .renderPopup(true);

    dc.renderAll();

    var map = whereChart.map();

    zoomToGeom(geom);

    var g = d3.selectAll('#hdx-3W-who').select('svg').append('g');

    g.append('text')
        .attr('class', 'x-axis-label-todrop')
        .attr('text-anchor', 'middle')
        .attr('x', $('#hdx-3W-who').width()/2)
        .attr('y', 400)
        // .text('Activities');

    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }

    function genLookup(geojson,config){
        var lookup = {};
        geojson.features.forEach(function(e){
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
        });
        return lookup;
    }
}

//load 3W data

var dataCall = $.ajax({
    type: 'GET',
    url: config.data,
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({
    type: 'GET',
    url: config.geo,
    dataType: 'json',
});

//when both ready construct 3W

$.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
    var geom = geomArgs[0];
    geom.features.forEach(function(e){
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]);
    });
    generate3WComponent(config,dataArgs[0],geom);
});
