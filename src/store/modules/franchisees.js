import http from '@/utils/http';


const state = {
    ofLPOProject: []
};

const getters = {
    ofLPOProject : state => state.ofLPOProject,
};

const mutations = {

};

const actions = {
    init : async context => {
        console.log('init');
        await _getFranchiseesOfLPOProject(context);
    },
};

async function _getFranchiseesOfLPOProject(context) {
    context.state.ofLPOProject = await http.get('getFranchiseesOfLPOProject');
}


export default {
    state,
    getters,
    actions,
    mutations
};