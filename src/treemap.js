import * as d3 from 'd3';
import _ from 'lodash';
import * as ob from '@observablehq/stdlib';

export function chart_treemap(data) {

    const library = new ob.Library();

    let treemap, tooltip;

    let theme = ['#017E72','#28BF64','#2E67AB','#3BC996','#457884','#50A9FF','#535C61','#7C4BA5','#828282','#835AF1','#95B587','#B2A55F','#CF5EA2','#D19258','#DA4343','#E04462','#EFB821','#FF7629','#FFC38C','#FFA086','#B28439']
    let parentColor;

    let svg;
    let width = 720;
    let height = 900;


    treemap = data => d3.treemap()
        .tile(tile)
        (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));


    let format = d3.format(",d");

    let name = d => d.ancestors().reverse().map(d => d.data.name).join("/");

    let label = (d, root) => {
        let label_text = '';
        
        if(d === root) {
            label_text = name(d);   
        } else {
            if(d.height == 0 && d.data.name == 'Other') {
                label_text = '';
            }

            label_text = d.data.name;
        }
        
        let label = label_text.split(/(?=[A-Z][^A-Z])/g).concat(format(d.value));

        return label;
    }

    function tile(node, x0, y0, x1, y1) {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
            child.x0 = x0 + child.x0 / width * (x1 - x0);
            child.x1 = x0 + child.x1 / width * (x1 - x0);
            child.y0 = y0 + child.y0 / height * (y1 - y0);
            child.y1 = y0 + child.y1 / height * (y1 - y0);
        }
    }


    let chart = () => {
        const x = d3.scaleLinear().rangeRound([0, width]);
        const y = d3.scaleLinear().rangeRound([0, height]);
    
        svg = d3.select("#chart svg")
            .attr("viewBox", [0.5, -30.5, width, height + 30])
    
        let group = svg.append("g")
            .call(render, treemap(data));
    
        function render(group, root) {
    
        const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g");
    
        node.filter((d,i) => d === root ? d.parent : d.children)
            .attr("cursor", "pointer")
            .attr("fillcolor", (d,i) => d === root ? "#000" : d.children ? theme[i] : "#ddd")
            .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d,event));
    
        node.append("rect")
            .attr("id", d => (d.leafUid = library.DOM.uid("leaf")).id)
            .attr("class","feature")
            .attr("department", d => d.data.name)
            .attr("fill", (d,i) => { return d === root ? "#000" : d.height ==  2 ? theme[i] : parentColor } )
            .attr("stroke", "#fff")
            .attr("stroke-width",  (d,i) => { return d === root ? 2 : d.height ==  0 ? 1 : 2 } );
    
        node.append("clipPath")
            .attr("id", d => (d.clipUid = library.DOM.uid("clip")).id)
            .append("use")
            .attr("xlink:href", d => d.leafUid.href);
    
        node.append("text")
            .attr("class","label")
            .attr("clip-path", d => d.clipUid)
            .attr("pointer-events", "none")
            .selectAll("tspan")
            .data(d => label(d,root))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 1 + 1.1 + i * 1.4}em`)
            .text(d => d)
            .attr('font-weight',(d,i,nodes) => i == nodes.length - 1 ? 'normal' : 'bold' );

        // node.append("text")
        //     .attr("class","label")
        //     .attr("clip-path", d => d.clipUid)
        //     .attr("pointer-events", "none")
        //     .attr("x", 3)
        //     .attr("y", 15)
        //     .text(d => label(d,root));

        // node.append("text")
        //     .attr("class","label")
        //     .attr("clip-path", d => d.clipUid)
        //     .attr("pointer-events", "none")
        //     .attr("x", 3)
        //     .attr("y", 35)
        //     .text(d => d.value);
        
    
        group.call(position, root);
    
    
        }
    
        function position(group, root) {
            group.selectAll("g")
                .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
                .select("rect")
                .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
                .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
        }
    
        // When zooming in, draw the new nodes on top, and fade them in.
        function zoomin(d,event) {
    
            parentColor = event.target.attributes.fill.value;
        
            const group0 = group.attr("pointer-events", "none");
            const group1 = group = svg.append("g").call(render, d);
        
            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);
            
                svg.transition()
                    .duration(750)
                    .call(t => group0.transition(t).remove()
                    .call(position, d.parent))
                    .call(t => group1.transition(t)
                    .attrTween("opacity", () => d3.interpolate(0, 1))
                    .call(position, d));
        
            hideLabels();    
            hover();
        }
    
        function hideLabels() {
        // const allLabels = d3.selectAll(".label").nodes();
    
        // allLabels.forEach((label) => {
        //   let parent_dimensions = d3.select(label)._groups[0][0].parentNode.getBoundingClientRect();
    
    
    
        //   let label_dimensions = label.getBoundingClientRect();
    
        //   if (parent_dimensions.width <= 70 || parent_dimensions.height <= 30) {
        //     d3.select(label)
        //     .attr('display', 'none');
        //   }
        // })
    
        
    
    
        }
    
        // When zooming out, draw the old nodes on top, and fade them out.
        function zoomout(d) {
            const group0 = group.attr("pointer-events", "none");
            const group1 = group = svg.insert("g", "*").call(render, d.parent);
        
            x.domain([d.parent.x0, d.parent.x1]);
            y.domain([d.parent.y0, d.parent.y1]);
        
            svg.transition()
                .duration(750)
                .call(t => group0.transition(t).remove()
                    .attrTween("opacity", () => d3.interpolate(1, 0))
                    .call(position, d))
                .call(t => group1.transition(t)
                    .call(position, d.parent));
        
            hideLabels();      
            hover();
        }
    
       
        // TOOLTIP

        tooltip = d3.select('#chart').append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden");
    
        hideLabels();
        hover();
    
        
    }
    
    function hover() {
        d3.selectAll("rect")

        // INTERACTION

        .on("mouseover", (d) => {

            d3.select(d.target)
                .style('opacity',0.8);

            tooltip.html(d.target.__data__.data.name + '<br/>' + (d.target.__data__.data.Service_desp != undefined ? d.target.__data__.data.Service_desp + '<br/>' : '') + format(d.target.__data__.value))
                .style("width","200px")
                .style("visibility", "visible");
        })

        .on("mousemove", (d) => {
            tooltip.style('top','unset').style('bottom','unset');
            tooltip.style("top", (d.pageY + "px"));
            tooltip.style("left", (d.pageX + 10) + "px");
            tooltip.style("transform", (d.pageX > width/2) ? 'translateX(-110%)' : '');
            tooltip.attr("pos", d.pageY > height/1.5 ? 'bottom' : 'top');
        })

        .on("mouseout", (d) => {
            d3.select(d.target)
            .style('opacity',1);
            tooltip.style("visibility", "hidden");
        })

    }

    chart();


}


  
  
  