import http from "@/utils/http";
import {VARS, baseURL} from '@/utils/utils.mjs';

const state = {
    salesFlags: {
        selected: [],
        options: [],
        disabled: false,
    },

    formsToSend: {
        options: [
            {value: 179, text: 'SC - Proposal - SCF'},
            {value: 159, text: 'Service Commencement Form'},
            {value: 94, text: 'Standing Order Form'},
            {value: 186, text: 'Change of Entity Form'},
        ],
        selected: [],
    },

    emailTemplates: {
        data: [],
        busy: false,
    },

    emailDetails: {
        productTracking: 2,
        emailTemplateId: null,
        recipient: null,
        cc: [],
        emailSubject: '',
        emailBody: '<i>Email body goes here</i>',
        busy: false,

        lostReason: '',
        lostNote: '',
    },

    appointmentDetails: {
        type: '',
        date: new Date().toISOString().substring(0, 10),
        startTime: '09:00',
        endTime: '09:00',
        notes: '',
        salesRepId: '',
    },
    
    functionTabs: {
        selected: 0,
        options: [],
    }
};

const getters = {
    salesFlags : state => state.salesFlags,
    formsToSend : state => state.formsToSend,
    emailTemplates : state => state.emailTemplates,
    emailDetails : state => state.emailDetails,
    appointmentDetails : state => state.appointmentDetails,
    functionTabs : state => state.functionTabs,
};

const mutations = {
    constructFunctionTabs : (state, $nextTick) => {
        state.functionTabs.options.splice(0);
        let tabs = state.functionTabs.options;
        let selected = state.salesFlags.selected;
        let {CLOSED_WON, OPP_WITH_VALUE, FREE_TRIAL} = VARS.salesOptions;
        state.functionTabs.selected = 0;

        if (selected.includes(VARS.salesOptions.CALLBACK.value)) {
            tabs.push({name: VARS.emailSenderTabNames.SET_APPOINTMENT, label: ''});
        } else if (selected.includes(VARS.salesOptions.NO_SALE.value)) {
            tabs.push({name: VARS.emailSenderTabNames.NO_SALE, label: ''});
        } else {
            if (selected.includes(CLOSED_WON.value) || selected.includes(OPP_WITH_VALUE.value) || selected.includes(FREE_TRIAL.value))
                tabs.push({name: VARS.emailSenderTabNames.SERVICE_PRICE, label: 'Service & Price'});

            tabs.push({name: VARS.emailSenderTabNames.FORM_BROCHURE, label: 'Forms & Brochures'});
            tabs.push({name: VARS.emailSenderTabNames.EMAIL_CALLBACK, label: 'Email & Callback'});
            tabs.push({name: VARS.emailSenderTabNames.SAVE_SEND, label: 'Save / Send'});
        }
        
        $nextTick(() => {
            state.functionTabs.selected = 1;
        })
    },
    toNextFunctionTab : state => {
        state.functionTabs.selected = state.functionTabs.selected < state.functionTabs.options.length ?
            state.functionTabs.selected + 1 : 1;
    },
    toPrevFunctionTab : state => {
        state.functionTabs.selected = state.functionTabs.selected > 1 ?
            state.functionTabs.selected - 1 :
            state.functionTabs.options.length - 1;
    },

    setSalesRepIdForAppointment : (state, id) => { state.appointmentDetails.salesRepId = id; }
};

const actions = {
    init : async context => {
        await context.dispatch('getEmailTemplates');

        if (context.state.emailDetails.emailTemplateId)
            await context.dispatch('handleSelectedEmailTemplateChanged');
    },
    getEmailTemplates : async context => {
        context.state.emailTemplates.busy = true;

        context.state.emailTemplates.data = await http.get('getEmailTemplates', {
            customerStatus: context.rootGetters['customer/status'],
            noSale: context.rootGetters['paramFlags'].noSale
        });

        context.state.emailTemplates.busy = false;
    },
    handleSelectedEmailTemplateChanged : async context => {
        if (!context.state.emailDetails.emailTemplateId) return;

        context.state.emailDetails.busy = true;

        try {
            let {emailSubject, emailBody} = await http.get('getEmailTemplate', {
                emailTemplateId: context.state.emailDetails.emailTemplateId
            });

            context.state.emailDetails.emailBody = emailBody;
            context.state.emailDetails.emailSubject = emailSubject;
        } catch (e) {
            console.error(e);
            context.state.emailDetails.emailTemplateId = null;
            context.state.emailDetails.emailBody = '';
            context.state.emailDetails.emailSubject = '';
        }

        context.state.emailDetails.busy = false;
    },
    changeSelectedSalesFlag : (context, flag) => {
        context.state.salesFlags.selected = [flag];

        if (flag === VARS.salesOptions.OUT_OF_TRR.value) {
            context.state.emailDetails.emailTemplateId = '333'; // Franchisee Website Leads - No Territory
        } else if (flag === VARS.salesOptions.INV_TO_PORTAL.value) {
            context.state.emailDetails.emailTemplateId = '219'; // MailPlus Express - Invite to Portal
        } else {
            context.state.emailDetails.emailTemplateId = null;
            context.state.emailDetails.emailSubject = '';
            context.state.emailDetails.emailBody = '<i>Email body goes here</i>';
        }

        context.dispatch('handleSelectedEmailTemplateChanged').then();
    },
    sendSalesEmail : async context => {
        if (!context.rootGetters['customer/id'])
            return context.commit('displayErrorGlobalModal', {title: 'Error', message: 'Customer ID is missing'}, {root: true});

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Preparing attachment. Please wait...'}, {root: true});

        let base64StringArray = [];

        if (parseInt(context.state.emailDetails.recipient) > 0) {
            for (let id of context.state.formsToSend.selected) {
                let params = {
                    script: 746,
                    deploy: 1,
                    stage: 0,
                    custid: context.rootGetters['customer/id'],
                    scfid: id,
                    start: 'null',
                    end: 'null',
                    commreg: context.rootGetters['service-changes/commRegId'],
                    salesrecordid: context.rootGetters['service-changes/salesRecordId'],
                }

                let base64Str = await http.getBase64PDF(baseURL + '/app/site/hosting/scriptlet.nl', params);

                base64StringArray.push({
                    filename: `form_${id}_${context.rootGetters['customer/id']}.pdf`,
                    base64Str
                });
            }

            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Sending email. This might take up to 30 seconds with attachments. Please wait...'}, {root: true});
        } else
            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving your work. Please wait...'}, {root: true});

        await http.post('sendSalesEmail', {
            customerId: context.rootGetters['customer/id'],
            salesRecordId: context.rootGetters['service-changes/salesRecordId'],
            base64StringArray,
            emailDetails: context.state.emailDetails,
            salesOutcome: context.state.salesFlags.selected[0]
        });

        context.commit('displayBusyGlobalModal', {title: 'Redirecting', message: 'Processing complete. Redirecting to customer record page...'}, {root: true});

        context.dispatch('customer/goToRecordPage', null, {root: true}).then();
    },
    setAppointment : async context => {
        if (!context.rootGetters['customer/id'])
            return context.commit('displayErrorGlobalModal', {title: 'Error', message: 'Customer ID is missing'}, {root: true});

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Setting up appointment. Please wait...'}, {root: true});

        let appointmentDetails = {...context.state.appointmentDetails};
        appointmentDetails['date'] = new Date(context.state.appointmentDetails.date);
        appointmentDetails['startTime'] = new Date(context.state.appointmentDetails.date + 'T' + context.state.appointmentDetails.startTime);
        appointmentDetails['endTime'] = new Date(context.state.appointmentDetails.date + 'T' + context.state.appointmentDetails.endTime);

        await http.post('setAppointment', {
            customerId: context.rootGetters['customer/id'],
            salesRecordId: context.rootGetters['service-changes/salesRecordId'],
            appointmentDetails,
        });

        context.commit('displayInfoGlobalModal', {
            title: 'Complete',
            message: 'A new appointment has been set.',
            persistent: true,
            buttons: [
                'spacer',
                {color: 'green darken-1', text: 'Return to Lead\'s record page', action: 'customer/goToRecordPage'},
            ]
        }, {root: true});
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};