import http from "@/utils/http";
import {VARS, baseURL} from '@/utils/utils.mjs';

const state = {
    salesFlags: {
        selected: [],
        options: [],
        disabled: false,
    },

    formsToSend: {
        options: [],
        defaultOptions: [
            {value: 94, text: 'Standing Order Form', filename: 'standing_order'},
            {value: 186, text: 'Change of Entity Form', filename: 'coe'}
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
        visited: [],
    }
};

const getters = {
    salesFlags : state => state.salesFlags,
    formsToSend : (state, getters, rootState, rootGetters) => {
        let arr = [...state.formsToSend.defaultOptions];
        if (rootGetters['paramFlags'].oppWithValue || rootGetters['paramFlags'].closedWon) {
            if (rootGetters['customer/isInLpoProject'])
                arr.unshift({value: 411, text: 'LPO - Service Commencement Form', filename: 'lpo_scf'});
            else arr.unshift({value: 159, text: 'Service Commencement Form', filename: 'scf'});
        } else if (rootGetters['paramFlags'].freeTrial) {
            if (rootGetters['customer/isInLpoProject'])
                arr.unshift({value: 412, text: 'LPO Free Trial - Service Commencement Form', filename: 'lpo_trial_scf'});
            else arr.unshift({value: 409, text: 'Free Trial - Service Commencement Form', filename: 'trial_scf'});
        }

        state.formsToSend.options = [...arr];

        return state.formsToSend;
    },
    emailTemplates : state => state.emailTemplates,
    emailDetails : state => state.emailDetails,
    appointmentDetails : state => state.appointmentDetails,
    functionTabs : state => state.functionTabs,
};

const mutations = {
    constructFunctionTabs : (state, $nextTick) => {
        state.functionTabs.options.splice(0);
        state.functionTabs.visited.splice(0);
        let tabs = state.functionTabs.options;
        let selected = state.salesFlags.selected;
        let {CLOSED_WON, OPP_WITH_VALUE, FREE_TRIAL} = VARS.salesOptions;
        state.functionTabs.selected = 0;

        if (selected.includes(VARS.salesOptions.CALLBACK.value)) {
            tabs.push({name: VARS.emailSenderTabNames.SET_APPOINTMENT, label: ''});
        } else if (selected.includes(VARS.salesOptions.NO_SALE.value)) {
            tabs.push({name: VARS.emailSenderTabNames.NO_SALE, label: ''});
        } else if (selected.includes(VARS.salesOptions.SEND_EMAIL.value)) {
            tabs.push({name: VARS.emailSenderTabNames.EMAIL_TERMINAL, label: ''});
        } else {
            if (selected.includes(CLOSED_WON.value) || selected.includes(OPP_WITH_VALUE.value) || selected.includes(FREE_TRIAL.value))
                tabs.push({name: VARS.emailSenderTabNames.SERVICE_PRICE, label: 'Service & Price'});

            tabs.push({name: VARS.emailSenderTabNames.FORM_BROCHURE, label: 'Forms & Brochures'});
            tabs.push({name: VARS.emailSenderTabNames.EMAIL_CALLBACK, label: 'Email & Callback'});
            tabs.push({name: VARS.emailSenderTabNames.SAVE_SEND, label: 'Save / Send'});
        }
        
        $nextTick(() => {
            state.functionTabs.selected = 1;
            _recordVisitedFunctionTab(state, 1);
        })
    },

    recordVisitedFunctionTab : (state, selectedFunctionTab) => {
        _recordVisitedFunctionTab(state, selectedFunctionTab);
    },
    toNextFunctionTab : state => {
        state.functionTabs.selected = state.functionTabs.selected < state.functionTabs.options.length ?
            state.functionTabs.selected + 1 : 1;

        _recordVisitedFunctionTab(state, state.functionTabs.selected);
    },
    toPrevFunctionTab : state => {
        state.functionTabs.selected = state.functionTabs.selected > 1 ?
            state.functionTabs.selected - 1 :
            state.functionTabs.options.length - 1;

        _recordVisitedFunctionTab(state, state.functionTabs.selected)
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

        // Get all email templates without filter if sendEmail flag is present
        let data = context.rootGetters['paramFlags'].sendEmail ? await http.get('getAllEmailTemplates') :
            await http.get('getEmailTemplates', {
                customerStatus: context.rootGetters['customer/status'],
                noSale: context.rootGetters['paramFlags'].noSale
            });

        data = data.filter(item => {
            if (context.rootGetters['paramFlags'].oppWithValue)
                return ![177, 178, 179, 180].includes(parseInt(item.internalid));
            else if (context.rootGetters['paramFlags'].closedWon)
                return ![156, 178, 180, 183, 184].includes(parseInt(item.internalid));
            else if (context.rootGetters['paramFlags'].freeTrial)
                return ![156, 177, 179, 183, 184].includes(parseInt(item.internalid));
            else return true;
        })

        context.state.emailTemplates.data = [...data];

        context.state.emailTemplates.busy = false;
    },
    handleSelectedEmailTemplateChanged : async context => {
        if (!context.state.emailDetails.emailTemplateId) return;

        context.state.emailDetails.busy = true;

        try {
            let contactIndex = context.rootGetters['contacts/all'].data.findIndex(item => item.internalid === context.state.emailDetails.recipient);
            let contact = context.rootGetters['contacts/all'].data[contactIndex];

            let trialEndDate = context.rootGetters['service-changes/commTrialExpiry'];
            let formattedBillingStartDate = '';
            if (context.rootGetters['paramFlags'].freeTrial && trialEndDate && trialEndDate?.split('/')?.length === 3) {
                let billingStartDate = new Date(trialEndDate.split('/').reverse().join('-'));
                billingStartDate.setDate(billingStartDate.getDate() + 1);

                let yyyy = billingStartDate.getFullYear() + '';
                let mm = (billingStartDate.getMonth() + 1) + ''; // Months start at 0!
                let dd = (billingStartDate.getDate()) + '';

                formattedBillingStartDate = `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`
            }

            if (contact) {
                let params = {
                    script: 395,
                    deploy: 1,
                    compid: 1048144,
                    h: '6d4293eecb3cb3f4353e',
                    rectype: 'customer',
                    recid: context.rootGetters['customer/id'],
                    template: context.state.emailDetails.emailTemplateId,
                    salesrep: context.rootGetters['customer/salesRep'].id,
                    salesRepName: context.rootGetters['customer/salesRep'].name,
                    dear: contact.firstname,
                    contactid: context.state.emailDetails.recipient,
                    userid: context.rootGetters['user/id'],
                    commdate: context.rootGetters['service-changes/commDate'],
                    commreg: context.rootGetters['service-changes/commRegId'],
                    trialenddate: trialEndDate,
                    billingstartdate: formattedBillingStartDate,
                }

                let {emailSubject, emailBody} = await http.getEmailTemplateFromRenderer(baseURL + '/app/site/hosting/scriptlet.nl', params);

                context.state.emailDetails.emailBody = emailBody;
                context.state.emailDetails.emailSubject = emailSubject;
            }
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
        let formattedDate = getFormattedDate();

        if (parseInt(context.state.emailDetails.recipient) > 0) {
            for (let id of context.state.formsToSend.selected) {
                let formIndex = context.state.formsToSend.options.findIndex(item => item.value === id);
                let formInfo = formIndex >= 0 ? context.state.formsToSend.options[formIndex] : {};

                let params = {
                    script: 746,
                    deploy: 1,
                    stage: 0,
                    custid: context.rootGetters['customer/id'],
                    scfid: id,
                    start: 'null',
                    end: 'null',
                    commreg: context.rootGetters['service-changes/commRegId'],
                    salesrecordid: context.rootGetters['sales-records/selected'].internalid,
                }

                let base64Str = await http.getBase64PDF(baseURL + '/app/site/hosting/scriptlet.nl', params);

                base64StringArray.push({
                    filename: `${formInfo.filename}_${context.rootGetters['customer/id']}_${formattedDate}.pdf`,
                    base64Str
                });
            }

            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Sending email. This might take up to 30 seconds with attachments. Please wait...'}, {root: true});
        } else
            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving your work. Please wait...'}, {root: true});

        await http.post('sendSalesEmail', {
            commRegId: context.rootGetters['service-changes/commRegId'],
            customerId: context.rootGetters['customer/id'],
            salesRecordId: context.rootGetters['sales-records/selected'].internalid,
            base64StringArray,
            emailDetails: context.state.emailDetails,
            salesOutcome: context.state.salesFlags.selected[0],
            localUTCOffset: new Date().getTimezoneOffset(),
        });

        context.commit('displayBusyGlobalModal', {title: 'Redirecting', message: 'Processing complete. Redirecting to customer record page...'}, {root: true});

        context.dispatch('customer/goToRecordPage', null, {root: true}).then();
    },
    sendNormalEmail : async context => {
        if (!context.rootGetters['customer/id'])
            return context.commit('displayErrorGlobalModal', {title: 'Error', message: 'Customer ID is missing'}, {root: true});

        context.commit('displayBusyGlobalModal',
            {title: 'Processing', message: 'Sending email. This might take up to 30 seconds with attachments. Please wait...'}, {root: true});

        await http.post('sendNormalEmail', {
            customerId: context.rootGetters['customer/id'],
            salesRecordId: context.rootGetters['sales-records/selected'].internalid,
            emailDetails: context.state.emailDetails,
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
            salesRecordId: context.rootGetters['sales-records/selected'].internalid,
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

function _recordVisitedFunctionTab(state, selectedTab) {
    let set = new Set(state.functionTabs.visited);
    set.add(selectedTab);
    state.functionTabs.visited = [...set];
}

function getFormattedDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return yyyy + mm + dd;
}

export default {
    state,
    getters,
    actions,
    mutations
};