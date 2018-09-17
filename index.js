/*
 * Copyright 2019 Marko Vannas <marko.vannas@me.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Magvar = require('magvar')

module.exports = function(app) {
  var plugin = { unsub: [] };

  plugin.id = "signalk-magnetic-variation"
  plugin.name = "Calculate Magnetic Variation"
  plugin.description = "Signal K Node Server Plugin To Calculate Magnetic Variation"

  plugin.schema = {
    type: "object",
    description: "The user running node server must have permission to sudo without needing a password",
    properties: {
      path: {
        title: "SignalK Path",
        type: "string",
        default: "navigation.magneticVariation",
      },
      period: {
        title: "Recalculation period (hours)",
        type: 'number',
        default: 24
      }
    }
  }

  let statusMsg = 'Variation not set';
  plugin.statusMessage = function () {
    return statusMsg
  }

  plugin.start = function(options) {
    let stream = app.streambundle.getSelfStream('navigation.position');

    if(options.period == 0) {
       stream = stream.take(1);
    } else {
       stream = stream.debounceImmediate(options.period * 3600 * 1000);
    }

    plugin.unsub.push(
     stream.onValue(function (pos) {

        /* Use Magvar to calculate the variation */
 	const variation = Magvar.Get( pos.latitude, pos.longitude );
        
        statusMsg = 'Variation set to ' + variation;

 	/* Insert value */
        app.handleMessage(plugin.id, {
           updates: [
           {
              values: [ {
             	path: options.path,
               	value: variation
              }]
           }]
        })

      })
   )

  }

  plugin.stop = function() {
    plugin.unsub.forEach(f => f())
  }

  return plugin
}
         
