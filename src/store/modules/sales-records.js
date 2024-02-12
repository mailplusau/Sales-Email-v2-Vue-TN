import http from '@/utils/http';

const state = {
    selected: {
        internalid: null,
        custrecord_sales_campaign: null,
    }
};

const getters = {
    selected : state => state.selected,
};

const mutations = {

};

const actions = {
    init : async context => {
        await _getDetailsOfSelectedSalesRecord(context);
    },
};

async function _getDetailsOfSelectedSalesRecord(context) {
    let fieldIds = [];
    for (let fieldId in context.state.selected) fieldIds.push(fieldId);

    let data = await http.get('getSalesRecord', {
        salesRecordId: context.state.selected.internalid, fieldIds
    });

    for (let fieldId in data) context.state.selected[fieldId] = data[fieldId];
}

export default {
    state,
    getters,
    actions,
    mutations
};