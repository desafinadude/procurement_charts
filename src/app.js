import * as d3 from 'd3';
import _ from 'lodash';

import { chart_treemap } from './treemap.js';

import './app.scss';


let data = {
  name:"All departments",
  children: []
};

let procurement = [];


d3.csv('./treemap.csv').then(function(incoming_data) {

  procurement = incoming_data;
    
  let result = _.map(
    _.groupBy(procurement, 'Cleaned_name'),
    (procurement, Item_desp) => ({ Item_desp, procurement })
  );
  
  for(let i = 0; i < result.length; i++) {
    result[i].name = result[i].Item_desp;
    result[i].children = result[i].procurement;

    for(let ii = 0; ii < result[i].procurement.length; ii++) {
      result[i].procurement[ii]['name'] = result[i].procurement[ii]['Item_desp'];
      result[i].procurement[ii]['value'] = parseFloat(result[i].procurement[ii]['pay_num']);
    }

    let item = _.map(
      _.groupBy(result[i].children, 'name'),
      (children,name) => ({ name, children})
    );

    result[i].children = item;

  }

  data.children = result;

  load(data);

})

// document.querySelector('#show_small').addEventListener('change', function (event) {
//   if (event.target.checked) {
//     console.log(data);
//   }
// })


let load = (data) => {

  chart_treemap(data);

}