import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

const state = {
    globalModal: {
        open: false,
        title: 'Default title',
        body: 'This is a global modal that will deliver notification on global level.',
        busy: false,
        progress: -1,
        persistent: true,
        isError: false,
        buttons: [],
    },
};

const getters = {
    globalModal : state => state.globalModal,
};

const mutations = {
    displayErrorGlobalModal: (state, {title, message}) => {
    closeGlobalModal: state => {
        state.globalModal.title = '';
        state.globalModal.body = '';
        state.globalModal.busy = false;
        state.globalModal.open = false;
        state.globalModal.progress = -1;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
        state.globalModal.buttons.splice(0);
    },
    displayErrorGlobalModal: (state, {title, message, buttons = []}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
        state.globalModal.buttons = [...buttons];
    },
    displayBusyGlobalModal: (state, {title, message, open = true, progress = -1, buttons = []}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.progress = progress;
        state.globalModal.persistent = true;
        state.globalModal.isError = false;
        state.globalModal.buttons = [...buttons];
    },
    displayInfoGlobalModal: (state, {title, message, persistent = false, buttons = []}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = persistent;
        state.globalModal.isError = false;
        state.globalModal.buttons = [...buttons];
    },
};

const actions = {
    addShortcut : () => {
        parent?.window?.addShortcut()
    },
    init : async context => {
        if (!_checkNetSuiteEnv()) return;

        console.log('Ready');
    },
};

function _checkNetSuiteEnv() {
    if (parent['getCurrentNetSuiteUrl']) {
        return parent.getCurrentNetSuiteUrl().includes(baseURL);
    } else return false;
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;