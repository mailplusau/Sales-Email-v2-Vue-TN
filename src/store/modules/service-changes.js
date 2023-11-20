import http from "@/utils/http";

const state = {
    data: [],
    busy: false,
    salesRecordId: null,
    commRegId: null,
};

const getters = {
    data: state => state.data,
    busy: state => state.busy,
    salesRecordId : state => state.salesRecordId,
    commRegId : state => state.commRegId,
};

const mutations = {

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

            context.state.data = Array.isArray(data) ? [...data] : [];
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