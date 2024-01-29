import http from "@/utils/http";
import {baseURL} from '@/utils/utils.mjs';

const state = {
    id: null,
    busy: false,
    details: {
        entityid: '',
        companyname: '',
        entitystatus: '',
        partner: '',
    },

    associatedSalesRepOfPartner: {
        id: null,
        name: '',
    }
};

const getters = {
    id : state => state.id,
    details : state => state.details,
    status : state => parseInt(state.details.entitystatus),
    salesRep : state => state.associatedSalesRepOfPartner
};

const mutations = {

};

const actions = {
    init : async context => {
        if (!context.state.id) return;

        context.dispatch('getDetails').then();
        context.dispatch('getSalesRepOfPartner').then();
    },
    getDetails : async (context) => {
        if (context.state.id) {
            try {
                context.state.busy = false;
                let fieldIds = [];
                for (let fieldId in context.state.details) fieldIds.push(fieldId);

                let data = await http.get('getCustomerDetails', {
                    customerId: context.state.id,
                    fieldIds,
                });

                for (let fieldId in context.state.details) {
                    context.state.details[fieldId] = data[fieldId];
                }

                context.state.busy = true;
            } catch (e) {console.error(e);}
        }
    },
    getSalesRepOfPartner : async (context) => {
        if (context.state.id) {
            try {
                let {id, name} = await http.get('getSalesRepOfPartner', {
                    customerId: context.state.id,
                });

                context.state.associatedSalesRepOfPartner.id = id;
                context.state.associatedSalesRepOfPartner.name = name;
            } catch (e) {console.error(e);}
        }
    },
    goToRecordPage : context => {
        context.commit('displayBusyGlobalModal', {title: 'Redirecting', message: 'Going back to record page. Please wait...'}, {root: true})
        top.location.href = baseURL + '/app/common/entity/custjob.nl?id=' + context.state.id;
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};