import http from "@/utils/http";

const state = {
    data: [],
    busy: false,
    salesRecordId: null,
    commRegId: null,

    iframeDialog: {
        open: false,
        src: null,
    }
};

const getters = {
    data: state => state.data,
    busy: state => state.busy,
    salesRecordId : state => state.salesRecordId,
    commRegId : state => state.commRegId,

    iframeDialog : state => state.iframeDialog,
};

const mutations = {
    openIframeDialog : (state, src) => {
        state.iframeDialog.src = src;
        state.iframeDialog.open = true;
    },
    closeIframeDialog : (state) => {
        state.iframeDialog.open = false;
        state.iframeDialog.src = null;
    },
};

const actions = {
    init : async context => {
        await context.dispatch('get');
    },
    get : async context => {
        if (!context.state.salesRecordId) return;

        context.state.busy = true;

        if (!context.state.commRegId) {
            let data = await http.get('getCommRegIdFromSalesRecordId', {
                salesRecordId: context.state.salesRecordId
            });

            context.state.commRegId = parseInt(data?.commRegId) || null
        }

        if (context.state.commRegId) {
            let data = await http.get('getScheduledServiceChanges', {
                customerId: context.rootGetters['customer/id'],
                commRegId: context.state.commRegId
            });

            let freqArray = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Adhoc']
            context.state.data = Array.isArray(data) ? data.map(item => {
                let freqIdArray = item['custrecord_servicechg_new_freq'].split(',').sort();

                let newFreqStr = freqIdArray.map(id => freqArray[parseInt(id) - 1]).join(', ');

                return {...item, custrecord_servicechg_new_freq_text: newFreqStr};
            }) : [];
        }

        context.state.busy = false;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};