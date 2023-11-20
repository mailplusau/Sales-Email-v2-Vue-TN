import http from "@/utils/http";

const state = {
    contacts: {
        data: [],
        busy: false,
    },
    contact: {
        internalid: null,
        salutation: '',
        firstname: '',
        lastname: '',
        phone: '',
        email: '',
        contactrole: '',
        title: '',
        company: null, // internal id of customer record
        entityid: '',
        custentity_connect_admin: 2,
        custentity_connect_user: 2,
    },
};

const getters = {
    all : state => state.contacts,
};

const mutations = {

};

const actions = {
    init : async context => {
        if (!context.rootGetters['customer/id']) return;

        await _fetchContacts(context);
    },
};

async function _fetchContacts(context) {
    if (!context.rootGetters['customer/id']) return;

    context.state.contacts.busy = true;
    let data = await http.get('getCustomerContacts', {
        customerId: context.rootGetters['customer/id']
    });

    context.state.contacts.data = [...data];
    context.state.contacts.busy = false;
}

export default {
    state,
    getters,
    actions,
    mutations
};