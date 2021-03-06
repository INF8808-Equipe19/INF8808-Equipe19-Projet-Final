    var margin = {top: 100, right: 275, bottom: 40, left: 275};
   
    var width = 960 - margin.left - margin.right,
    		height = 760 - margin.top - margin.bottom;
        
    var svg = d3.select("body").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var url = "https://raw.githubusercontent.com/tlfrd/pay-ratios/master/data/payratio.json";
    
    var y1 = d3.scaleLinear()
    	.range([height, 0]);
    
    var config = {
      xOffset: 0,
      yOffset: 0,
      width: width,
      height: height,
      labelPositioning: {
        alpha: 0.5,
        spacing: 18
      },
      leftTitle: "2013",
      rightTitle: "2016",
      labelGroupOffset: 5,
      labelKeyOffset: 50,
      radius: 6,
      // Reduce this to turn on detail-on-hover version
      unfocusOpacity: 0.3
    }
    
    function drawSlopeGraph(cfg, data, yScale, leftYAccessor, rightYAccessor) {
      var slopeGraph = svg.append("g")
      	.attr("class", "slope-graph")
      	.attr("transform", "translate(" + [cfg.xOffset, cfg.yOffset] + ")");     
    }
    
    d3.json(url, function(error, data) {
      if (error) return error;
      
      // Combine ratios into a single array
      var ratios = [];
      data.pay_ratios_2012_13.forEach(function(d) {
        d.year = "2012-2013";
        ratios.push(d);
      });
      data.pay_ratios_2015_16.forEach(function(d) {
        d.year = "2015-2016";
        ratios.push(d);
      });
                  
      // Nest by university
      var nestedByName = d3.nest()
      	.key(function(d) { return d.name })
      	.entries(ratios);
      
      // Filter out those that only have data for a single year
      nestedByName = nestedByName.filter(function(d) {
        return d.values.length > 1;
      });
      
      var y1Min = d3.min(nestedByName, function(d) {        
        var ratio1 = d.values[0].max / d.values[0].min;
        var ratio2 = d.values[1].max / d.values[1].min;
        
        return Math.min(ratio1, ratio2);
      });
      
      var y1Max = d3.max(nestedByName, function(d) {        
        var ratio1 = d.values[0].max / d.values[0].min;
        var ratio2 = d.values[1].max / d.values[1].min;
        
        return Math.max(ratio1, ratio2);
      });
         
      // Calculate y domain for ratios
      y1.domain([y1Min, y1Max]);
      
      var yScale = y1;
            
      var voronoi = d3.voronoi()
        .x(d => d.year == "2012-2013" ? 0 : width)
        .y(d => yScale(d.max / d.min))
        .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);
      
      var borderLines = svg.append("g")
      	.attr("class", "border-lines")
      borderLines.append("line")
      	.attr("x1", 0).attr("y1", 0)
      	.attr("x2", 0).attr("y2", config.height);
      borderLines.append("line")
      	.attr("x1", width).attr("y1", 0)
      	.attr("x2", width).attr("y2", config.height);
      
      var slopeGroups = svg.append("g")
      	.selectAll("g")
      	.data(nestedByName)
      	.enter().append("g")
      		.attr("class", "slope-group")
        	.attr("id", function(d, i) {
            d.id = "group" + i;
            d.values[0].group = this;
            d.values[1].group = this;
          });
      
      var slopeLines = slopeGroups.append("line")
        .attr("class", "slope-line")
        .attr("x1", 0)
        .attr("y1", function(d) {
          return y1(d.values[0].max / d.values[0].min);
        })
        .attr("x2", config.width)
        .attr("y2", function(d) {
          return y1(d.values[1].max / d.values[1].min);
        });
      
      var leftSlopeCircle = slopeGroups.append("circle")
      	.attr("r", config.radius)
      	.attr("cy", d => y1(d.values[0].max / d.values[0].min));
      
      var leftSlopeLabels = slopeGroups.append("g")
      	.attr("class", "slope-label-left")
      	.each(function(d) {
          d.xLeftPosition = -config.labelGroupOffset;
          d.yLeftPosition = y1(d.values[0].max / d.values[0].min);
        });
      
      leftSlopeLabels.append("text")
      	.attr("class", "label-figure")
      	.attr("x", d => d.xLeftPosition)
				.attr("y", d => d.yLeftPosition)
        .attr("dx", -10)
        .attr("dy", 3)
        .attr("text-anchor", "end")
        .text(d => (d.values[0].max / d.values[0].min).toPrecision(3));
      
      leftSlopeLabels.append("text")
      	.attr("x", d => d.xLeftPosition)
				.attr("y", d => d.yLeftPosition)
        .attr("dx", -config.labelKeyOffset)
        .attr("dy", 3)
        .attr("text-anchor", "end")
        .text(d => d.key);
      
      var rightSlopeCircle = slopeGroups.append("circle")
      	.attr("r", config.radius)
      	.attr("cx", config.width)
      	.attr("cy", d => y1(d.values[1].max / d.values[1].min));
      
      var rightSlopeLabels = slopeGroups.append("g")
      	.attr("class", "slope-label-right")
      	.each(function(d) {
          d.xRightPosition = width + config.labelGroupOffset;
          d.yRightPosition = y1(d.values[1].max / d.values[1].min);
        });
      
      rightSlopeLabels.append("text")
      	.attr("class", "label-figure")
				.attr("x", d => d.xRightPosition)
				.attr("y", d => d.yRightPosition)
        .attr("dx", 10)
        .attr("dy", 3)
        .attr("text-anchor", "start")
        .text(d => (d.values[1].max / d.values[1].min).toPrecision(3));
      
     	rightSlopeLabels.append("text")
				.attr("x", d => d.xRightPosition)
				.attr("y", d => d.yRightPosition)
        .attr("dx", config.labelKeyOffset)
        .attr("dy", 3)
        .attr("text-anchor", "start")
        .text(d => d.key);
      
      var titles = svg.append("g")
      	.attr("class", "title");
      
      titles.append("text")
      	.attr("text-anchor", "end")
      	.attr("dx", -10)
      	.attr("dy", -margin.top / 2)
      	.text(config.leftTitle);
      
      titles.append("text")
      	.attr("x", config.width)
      	.attr("dx", 10)
      	.attr("dy", -margin.top / 2)
      	.text(config.rightTitle);
      
      relax(leftSlopeLabels, "yLeftPosition");
      leftSlopeLabels.selectAll("text")
      	.attr("y", d => d.yLeftPosition);
      
      relax(rightSlopeLabels, "yRightPosition");
      rightSlopeLabels.selectAll("text")
      	.attr("y", d => d.yRightPosition);
      
      d3.selectAll(".slope-group")
      	.attr("opacity", config.unfocusOpacity);
      
      var voronoiGroup = svg.append("g")
      	.attr("class", "voronoi");
      
      voronoiGroup.selectAll("path")
      	.data(voronoi.polygons(d3.merge(nestedByName.map(d => d.values))))
      	.enter().append("path")
      		.attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
      		.on("mouseover", mouseover)
      		.on("mouseout", mouseout);
    });
    
    function mouseover(d) {
      d3.select(d.data.group).attr("opacity", 1);
    }
    
    function mouseout(d) {
      d3.selectAll(".slope-group")
      	.attr("opacity", config.unfocusOpacity);
    }
    
    // Function to reposition an array selection of labels (in the y-axis)
    function relax(labels, position) {
      again = false;
      labels.each(function (d, i) {
        a = this;
        da = d3.select(a).datum();
        y1 = da[position];
        labels.each(function (d, j) {
          b = this;
          if (a == b) return;
          db = d3.select(b).datum();
          y2 = db[position];
          deltaY = y1 - y2;

          if (Math.abs(deltaY) > config.labelPositioning.spacing) return;

          again = true;
          sign = deltaY > 0 ? 1 : -1;
          adjust = sign * config.labelPositioning.alpha;
          da[position] = +y1 + adjust;
          db[position] = +y2 - adjust;

          if (again) {
            relax(labels, position);
          }
        })
      })
    }