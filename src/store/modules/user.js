import http from "@/utils/http";

const state = {
    role: null,
    id: null,
};

const getters = {
    role : state => state.role,
    id : state => state.id,
};

const mutations = {};

const actions = {
    init : async context => {
        let {role, id} = await http.get('getCurrentUserDetails');

        context.state.role = parseInt(role);
        context.state.id = parseInt(id);

        context.commit('email-sender/setSalesRepIdForAppointment', `${id}`, {root: true});
    },
};

export default {
    state,
    getters,
    actions,
    mutations
};