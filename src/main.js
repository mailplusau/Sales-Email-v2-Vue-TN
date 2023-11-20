import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'
import {VARS} from '@/utils/utils.mjs'

Vue.config.productionTip = false

if (parent['setMPTheme']) parent.setMPTheme(`${VARS.pageTitle} - NetSuite Australia (Mail Plus Pty Ltd)`)

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
