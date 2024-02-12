import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import {baseURL, VARS} from '@/utils/utils.mjs';

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

    mainTab: 'home',
    paramFlags: {
        callback: false,
        oppWithValue: false,
        closedWon: false,
        freeTrial: false,
        saveCustomer: false,
        inviteToPortal: false,

        noSale: false,
    }

};

const getters = {
    globalModal : state => state.globalModal,
    mainTab : state => state.mainTab,
    paramFlags : state => state.paramFlags,
};

const mutations = {
    setMainTab : (state, tab) => { state.mainTab = tab; },
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
        if (!top.location.href.includes(baseURL)) return;

        _readUrlParams(context);

        context.dispatch('user/init').then();
        context.dispatch('franchisees/init').then();
        context.dispatch('sales-records/init').then();
        context.dispatch('customer/init').then();
        context.dispatch('contacts/init').then();
        context.dispatch('service-changes/init').then();
        context.dispatch('email-sender/init').then();
        context.dispatch('misc/init').then();
    },
    handleException : (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
};

function _readUrlParams(context) {
    let customParams;
    let currentUrl = parent['getCurrentNetSuiteUrl'] ? parent.getCurrentNetSuiteUrl() : top.location.href;
    let [, queryString] = currentUrl.split('?');

    const params = new Proxy(new URLSearchParams(`?${queryString}`), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    if (!customParams)
        try {
            customParams = JSON.parse(params['params']);
        } catch (e) { /**/ }

    if (!customParams)
        try {
            customParams = JSON.parse(params['custparam_params']);
        } catch (e) { /**/ }

    if (!customParams) customParams = {};

    context.state['customer'].id = parseInt(params['custid'] || customParams['custid'] || null);
    context.state['sales-records'].selected.internalid = parseInt(params['sales_record_id'] || customParams['sales_record_id'] || null);

    // TODO: Priority system
    // callback > closedwon > oppwithvalue

    context.state.paramFlags.callback = _checkIfParamIsTrue('callback', params, customParams);
    context.state.paramFlags.freeTrial = _checkIfParamIsTrue('freetrial', params, customParams);
    context.state.paramFlags.closedWon = _checkIfParamIsTrue('closedwon', params, customParams);
    context.state.paramFlags.oppWithValue = _checkIfParamIsTrue('oppwithvalue', params, customParams);
    context.state.paramFlags.inviteToPortal = _checkIfParamIsTrue('invitetoportal', params, customParams);
    context.state.paramFlags.saveCustomer = _checkIfParamIsTrue('savecustomer', params, customParams);
    context.state.paramFlags.noSale = _checkIfParamIsTrue('nosale', params, customParams);


    if (context.state.paramFlags.callback) {
        context.state['email-sender'].salesFlags.options = [VARS.salesOptions.CALLBACK];
        context.state['email-sender'].salesFlags.selected = [VARS.salesOptions.CALLBACK.value];
        context.state['email-sender'].salesFlags.disabled = true;
    } else if (context.state.paramFlags.noSale) {
        context.state['email-sender'].salesFlags.options = [VARS.salesOptions.NO_SALE];
        context.state['email-sender'].salesFlags.selected = [VARS.salesOptions.NO_SALE.value];
        context.state['email-sender'].salesFlags.disabled = true;
        context.state['email-sender'].emailDetails.emailTemplateId = '376'; // Sales Lead - Out of Territory
        context.state['email-sender'].emailDetails.recipient = -1;
    } else if (context.state.paramFlags.freeTrial) {
        context.state['email-sender'].salesFlags.options = [VARS.salesOptions.FREE_TRIAL];
        context.state['email-sender'].salesFlags.selected = [VARS.salesOptions.FREE_TRIAL.value];
        context.state['email-sender'].salesFlags.disabled = true;
    } else if (context.state.paramFlags.closedWon) {
        context.state['email-sender'].salesFlags.options = [VARS.salesOptions.CLOSED_WON];
        context.state['email-sender'].salesFlags.selected = [VARS.salesOptions.CLOSED_WON.value];
        context.state['email-sender'].salesFlags.disabled = true;
    } else if (context.state.paramFlags.oppWithValue) {
        context.state['email-sender'].salesFlags.options = [VARS.salesOptions.OPP_WITH_VALUE];
        context.state['email-sender'].salesFlags.selected = [VARS.salesOptions.OPP_WITH_VALUE.value];
        context.state['email-sender'].salesFlags.disabled = true;
    } else if (context.state.paramFlags.inviteToPortal) {
        context.state['email-sender'].salesFlags.options = [VARS.salesOptions.INV_TO_PORTAL];
        context.state['email-sender'].salesFlags.selected = [VARS.salesOptions.INV_TO_PORTAL.value];
        context.state['email-sender'].salesFlags.disabled = true;
    } else {
        context.state['email-sender'].salesFlags.options = [
            VARS.salesOptions.SIGNUP_EMAIL,
            VARS.salesOptions.OUT_OF_TRR,
            VARS.salesOptions.INV_TO_PORTAL,
        ];
        context.state['email-sender'].salesFlags.selected = [];
        context.state['email-sender'].salesFlags.disabled = false;
    }


    // let unity = !!customParams[''] || !!params[''];
    // let sendInfo = !!customParams[''] || !!params[''];
    // let referral = !!customParams[''] || !!params[''];
    //
    // let previousScriptId = customParams['id'] || params['script_id'];
    // let previousDeployId = customParams['deploy'] || params['script_deploy'];

}

function _checkIfParamIsTrue(paramName, params, customParams) {
    return (!!customParams[paramName] && customParams[paramName] === 'T') ||
        (!!params[paramName] && params[paramName] === 'T')
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;