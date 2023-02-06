import Vue from 'vue'
import App from './App.vue'

import {
  library
} from '@fortawesome/fontawesome-svg-core'
import {
  faMagnifyingGlass,
  faAnglesLeft,
  faAnglesRight,
  faRotateLeft,
  faRotateRight,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus
} from '@fortawesome/free-solid-svg-icons'
import {
  FontAwesomeIcon
} from '@fortawesome/vue-fontawesome'

library.add(faMagnifyingGlass, faAnglesLeft, faAnglesRight, faRotateLeft, faRotateRight, faMagnifyingGlassMinus, faMagnifyingGlassPlus);

Vue.config.productionTip = false

Vue.component('font-awesome-icon', FontAwesomeIcon)

new Vue({
  render: h => h(App),
}).$mount('#app');