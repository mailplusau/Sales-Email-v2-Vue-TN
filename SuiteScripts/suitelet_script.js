/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Sales Email Sender.
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 11/09/2023
 */

import {VARS} from '@/utils/utils.mjs';

// These variables will be injected during upload. These can be changed under 'netsuite' of package.json
let htmlTemplateFilename/**/;
let clientScriptFilename/**/;

const defaultTitle = VARS.pageTitle;

let NS_MODULES = {};

// eslint-disable-next-line no-undef
define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/task', 'N/format', 'N/url', 'N/encode'],
    (serverWidget, render, search, file, log, record, email, runtime, https, task, format, url, encode) => {
    NS_MODULES = {serverWidget, render, search, file, log, record, email, runtime, https, task, format, url, encode};
    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            if (!_handleGETRequests(request.parameters['requestData'], response)){
                // Render the page using either inline form or standalone page
                // _getStandalonePage(response)
                _getInlineForm(response)
            }

        } else if (request.method === "POST") { // Request method should be POST (?)
            _handlePOSTRequests(JSON.parse(request.body), response);
            // _writeResponseJson(response, {test: 'test response from post', params: request.parameters, body: request.body});
        } else {
            log.debug({
                title: "request method type",
                details: `method : ${request.method}`,
            });
        }

    }

    return {onRequest};
});

// Render the page within a form element of NetSuite. This can cause conflict with NetSuite's stylesheets.
function _getInlineForm(response) {
    let {serverWidget} = NS_MODULES;
    
    // Create a NetSuite form
    let form = serverWidget.createForm({ title: defaultTitle });

    // Retrieve client script ID using its file name.
    form.clientScriptFileId = _getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

    response.writePage(form);
}

// Search for the ID and URL of a given file name inside the NetSuite file cabinet
function _getHtmlTemplate(htmlPageName) {
    let {search} = NS_MODULES;

    const htmlPageData = {};

    search.create({
        type: 'file',
        filters: ['name', 'is', htmlPageName],
        columns: ['name', 'url']
    }).run().each(resultSet => {
        htmlPageData[resultSet.getValue({ name: 'name' })] = {
            url: resultSet.getValue({ name: 'url' }),
            id: resultSet.id
        };
        return true;
    });

    return htmlPageData;
}


function _handleGETRequests(request, response) {
    if (!request) return false;

    let {log} = NS_MODULES;

    try {
        let {operation, requestParams} = JSON.parse(request);

        if (!operation) throw 'No operation specified.';

        if (operation === 'getIframeContents') _getIframeContents(response);
        else if (!getOperations[operation]) throw `GET operation [${operation}] is not supported.`;
        else getOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handleGETRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }

    return true;
}

function _handlePOSTRequests({operation, requestParams}, response) {
    let {log} = NS_MODULES;

    try {
        if (!operation) throw 'No operation specified.';

        // _writeResponseJson(response, {source: '_handlePOSTRequests', operation, requestParams});
        postOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handlePOSTRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }
}

function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}

function _getIframeContents(response) {
    const htmlFileData = _getHtmlTemplate(htmlTemplateFilename);
    const htmlFile = NS_MODULES.file.load({ id: htmlFileData[htmlTemplateFilename].id });

    _writeResponseJson(response, htmlFile.getContents());
}

const getOperations = {
    'getCurrentUserDetails' : function (response) {
        let user = {role: NS_MODULES.runtime['getCurrentUser']().role, id: NS_MODULES.runtime['getCurrentUser']().id};
        let salesRep = {};

        if (parseInt(user.role) === 1000) {
            let franchiseeRecord = NS_MODULES.record.load({type: 'partner', id: user.id});
            let employeeId = franchiseeRecord.getValue({fieldId: 'custentity_sales_rep_assigned'});
            let employeeRecord = NS_MODULES.record.load({type: 'employee', id: employeeId});
            salesRep['id'] = employeeId;
            salesRep['name'] = `${employeeRecord.getValue({fieldId: 'firstname'})} ${employeeRecord.getValue({fieldId: 'lastname'})}`;
        }

        _writeResponseJson(response, {...user, salesRep});
    },
    'getSelectOptions' : function (response, {id, type, valueColumnName, textColumnName}) {
        let {search} = NS_MODULES;
        let data = [];

        search.create({
            id, type,
            columns: [{name: valueColumnName}, {name: textColumnName}]
        }).run().each(result => {
            data.push({value: result.getValue(valueColumnName), text: result.getValue(textColumnName)});
            return true;
        });

        _writeResponseJson(response, data);
    },
    'getCustomerContacts' : function (response, {customerId}) {
        if (!customerId) return _writeResponseJson(response, {error: `Invalid Customer ID: ${customerId}`});

        let {search} = NS_MODULES;
        let contactForm = [
            'internalid',
            'salutation',
            'firstname',
            'lastname',
            'phone',
            'email',
            'contactrole',
            'title',
            'company',
            'entityid',
            'custentity_connect_admin',
            'custentity_connect_user',
        ];
        let data = [];

        let contactSearch = search.load({
            id: 'customsearch_salesp_contacts',
            type: 'contact'
        });

        contactSearch.filters.push(search.createFilter({
            name: 'internalid',
            join: 'CUSTOMER',
            operator: search.Operator.ANYOF,
            values: customerId
        }));

        contactSearch.filters.push(search.createFilter({
            name: 'isinactive',
            operator: search.Operator.IS,
            values: false
        }));

        let result = contactSearch.run();

        result.each((item) => {
            let contactEntry = {};

            for (let fieldId of contactForm) {
                contactEntry[fieldId] = item.getValue({ name: fieldId });
            }

            data.push(contactEntry);

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getCommRegIdFromSalesRecordId' : function (response, {salesRecordId}) {
        let {search} = NS_MODULES;
        let data = [];

        search.create({
            type: 'customrecord_commencement_register',
            filters: [
                {name: 'custrecord_commreg_sales_record', operator: 'is', values: salesRecordId},
                {name: 'custrecord_trial_status', operator: 'anyof', values: [9, 10]}, // Scheduled (9) or Quote (10)
            ],
            columns: ['internalid']
        }).run().each(resultSet => {
            data.push(resultSet.id);
            return true;
        });

        _writeResponseJson(response, {commRegId: data[0]}); // return the first result
    },
    'getScheduledServiceChanges' : function (response, {customerId, commRegId}) {
        let {search} = NS_MODULES;
        let data = [];

        let serviceChangeSearch = search.load({id: 'customsearch_salesp_service_chg', type: 'customrecord_servicechg'});

        serviceChangeSearch.filters.push(search.createFilter({
            name: 'custrecord_servicechg_status',
            operator: 'anyof',
            values: [1, 2, 4]
        }));
        serviceChangeSearch.filters.push(search.createFilter({
            name: 'custrecord_service_customer',
            operator: 'is',
            join: 'CUSTRECORD_SERVICECHG_SERVICE',
            values: customerId
        }));

        if (commRegId)
            serviceChangeSearch.filters.push(search.createFilter({
                name: 'custrecord_servicechg_comm_reg',
                operator: 'is',
                values: commRegId
            }));

        serviceChangeSearch.run().each(item => {
            let tmp = {};

            for (let column of item.columns) {
                tmp[column.name + '_text'] = item.getText(column);
                tmp[column.name] = item.getValue(column);
            }

            data.push(tmp);

            return true;
        })

        _writeResponseJson(response, data);
    },
    'getCustomerDetails': function (response, {customerId, fieldIds}) {
        if (!customerId) return _writeResponseJson(response, {error: `Invalid Customer ID: ${customerId}`});

        let {record} = NS_MODULES;
        let data = {};

        let customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
        });

        for (let fieldId of fieldIds) {
            data[fieldId] = customerRecord.getValue({fieldId});
            data[fieldId + '_text'] = customerRecord.getText({fieldId});
        }

        _writeResponseJson(response, data);
    },
    'getSalesRepOfPartner': function (response, {customerId}) {
        let salesRep = {};
        let salesRepId = NS_MODULES.search['lookupFields']({
            type: 'customer',
            id: customerId,
            columns: ['partner.custentity_sales_rep_assigned']
        })['partner.custentity_sales_rep_assigned'][0].value;

        let employeeRecord = NS_MODULES.record.load({type: 'employee', id: salesRepId});
        salesRep['id'] = salesRepId;
        salesRep['name'] = `${employeeRecord.getValue({fieldId: 'firstname'})} ${employeeRecord.getValue({fieldId: 'lastname'})}`;

        _writeResponseJson(response, salesRep);
    },
    'getEmailTemplate' : function (response, {customerId, emailTemplateId}) {
        let mergeResult = NS_MODULES.render.mergeEmail({
            templateId: emailTemplateId,
            entity: /^[0-9]+$/.test(customerId) ?
                {type: 'customer', id: parseInt(customerId)} :
                null,
        });
        let emailSubject = mergeResult.subject;
        let emailBody = mergeResult.body;

        _writeResponseJson(response, {emailSubject, emailBody});
    },
    'getEmailTemplates' : function (response, {customerStatus, noSale}) {
        let {search} = NS_MODULES;
        let data = [];

        search.create({
            type: "customrecord_camp_comm_template",
            filters:
                [
                    ['isinactive', 'is', 'F'], 'AND',
                    ['custrecord_camp_comm_camp_type', 'anyof', (parseInt(customerStatus) === 13 ? 2 : 1)], 'AND',
                    ['custrecord_camp_comm_comm_type', 'anyof', (noSale ? 6 : 1)]
                ],
            columns: ['internalid', 'name', 'custrecord_camp_comm_camp_type', 'custrecord_camp_comm_comm_type',
                'custrecord_camp_comm_subject', 'custrecord_camp_comm_email_template', 'custrecord_camp_comm_sms_template']
        }).run().each(item => {
            let tmp = {};

            for (let column of item.columns) {
                tmp[column.name] = item.getValue(column);
                tmp[column.name + '_text'] = item.getText(column);
            }

            data.push(tmp);

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getSalesReps' : function (response) {
        let data = [];

        NS_MODULES.search.create({
            type: "employee",
            filters:
                [
                    ['isinactive', 'is', 'F']
                ],
            columns: ['internalid', 'firstname', 'lastname']
        }).run().each(item => {
            data.push({
                value: item.getValue('internalid'),
                text: `${item.getValue('firstname')} ${item.getValue('lastname')}`
            });

            return true;
        });

        _writeResponseJson(response, data);
    }
}

const postOperations = {
    'sendSalesEmail' : function (response, {customerId, salesRecordId, base64StringArray, emailDetails, salesOutcome}) {
        if (!processSalesOutcomes[salesOutcome]) // check if an outcome is supported
            return _writeResponseJson(response, {error: `Outcome [${salesOutcome}] not supported.`})

        let {record, runtime, email, file} = NS_MODULES;
        let customerRecord = record.load({type: 'customer', id: customerId});
        let salesRecord = salesRecordId ? record.load({type: 'customrecord_sales', id: salesRecordId}) : null;
        let salesCampaignRecord = null, contactRecord = null;

        if (salesRecord) { // update sales record and get sales campaign record.
            salesRecord.setValue({fieldId: 'custrecord_sales_email_count', value: parseInt(salesRecord.getValue({fieldId: 'custrecord_sales_email_count'})) + 1});
            salesRecord.setValue({fieldId: 'custrecord_sales_assigned', value: runtime['getCurrentUser']().id});
            salesRecord.setValue({fieldId: 'custrecord_sales_callbackdate', value: ''});
            salesRecord.setValue({fieldId: 'custrecord_sales_callbacktime', value: ''});
            salesRecord.setValue({fieldId: 'custrecord_sales_lastcalldate', value: new Date()});

            salesCampaignRecord = record.load({type: 'customrecord_salescampaign', id: salesRecord.getValue({fieldId: 'custrecord_sales_campaign'})});
        }

        // phone call record
        let phoneCallRecord = record.create({type: 'phonecall'});
        phoneCallRecord.setValue({fieldId: 'assigned', value: runtime['getCurrentUser']().id});
        phoneCallRecord.setValue({fieldId: 'custevent_organiser', value: runtime['getCurrentUser']().id});
        phoneCallRecord.setValue({fieldId: 'startdate', value: new Date()});
        phoneCallRecord.setValue({fieldId: 'company', value: customerId});
        phoneCallRecord.setValue({fieldId: 'status', value: 'COMPLETE'}); // TODO: If outcome is set_appointment, set this as SCHEDULED
        phoneCallRecord.setValue({fieldId: 'custevent_call_type', value: 2}); // Sales Pitch (2)

        // send email
        if (parseInt(emailDetails.recipient) > 0) {
            contactRecord = record.load({type: 'contact', id: emailDetails.recipient});
            let userRole = runtime['getCurrentUser']().role;
            let {salesRepId, salesRepEmail} = _getEmailAddressOfPartnersSalesRep(customerId);
            let customerEntityId = customerRecord.getValue({fieldId: 'entityid'});
            let customerName = customerRecord.getValue({fieldId: 'companyname'});

            let attachments = base64StringArray.map(({filename, base64Str}) => {
                return file.create({
                    name: filename,
                    fileType: file.Type['PDF'],
                    contents: base64Str,
                });
            });

            email.send({
                author: userRole === 3 || userRole === 1032 ? 112209 : salesRepId,
                subject: `${customerEntityId} ${customerName} - ${emailDetails.emailSubject}`,
                body: emailDetails.emailBody,
                // recipients: ['tim.nguyen@mailplus.com.au'], // TODO: testing
                recipients: [contactRecord.getValue({fieldId: 'email'})],
                cc: [...emailDetails.cc],
                bcc: [userRole === 3 || userRole === 1032 ? runtime['getCurrentUser']().email : salesRepEmail],
                relatedRecords: {
                    'entityId': customerId
                },
                attachments,
                isInternalOnly: true
            });
        }

        // process outcomes
        processSalesOutcomes[salesOutcome]({emailDetails, phoneCallRecord, customerRecord, salesRecord, salesCampaignRecord, contactRecord});

        // save the records.
        salesRecord?.save({ignoreMandatoryFields: true});
        customerRecord.save({ignoreMandatoryFields: true});
        phoneCallRecord.save({ignoreMandatoryFields: true});

        _writeResponseJson(response, 'suitelet sendSalesEmail');
    },
    'setAppointment' : function (response, {customerId, salesRecordId, appointmentDetails}) {
        if (!salesRecordId) return _writeResponseJson(response, {error: `Sales Record ID not provided.`});

        let {record, runtime, email} = NS_MODULES;
        let salesRepId = parseInt(appointmentDetails.salesRepId)
        let customerRecord = record.load({type: 'customer', id: customerId});
        let salesRecord = record.load({type: 'customrecord_sales', id: salesRecordId});
        let salesCampaignId = salesRecord.getValue({fieldId: 'custrecord_sales_campaign'});
        let salesCampaignRecord = record.load({type: 'customrecord_salescampaign', id: salesCampaignId});
        let employeeRecord = record.load({type: 'employee', id: salesRepId});

        // Create phone call record
        let phoneCallRecord = record.create({type: 'phonecall'});
        phoneCallRecord.setValue({fieldId: 'company', value: customerId});
        phoneCallRecord.setValue({fieldId: 'assigned', value: salesRepId || runtime['getCurrentUser']().id});
        phoneCallRecord.setValue({fieldId: 'custevent_organiser', value: runtime['getCurrentUser']().id});
        phoneCallRecord.setValue({fieldId: 'startdate', value: new Date(appointmentDetails.date)});
        phoneCallRecord.setValue({fieldId: 'starttime', value: new Date(appointmentDetails.startTime)});
        phoneCallRecord.setValue({fieldId: 'endtime', value: new Date(appointmentDetails.endTime)});
        phoneCallRecord.setValue({fieldId: 'timedevent', value: true});
        phoneCallRecord.setValue({fieldId: 'status', value: 'SCHEDULED'}); // If outcome is set_appointment, set this as SCHEDULED
        phoneCallRecord.setValue({fieldId: 'custevent_call_type', value: 8}); // Set Appointment (8)
        phoneCallRecord.setValue({fieldId: 'title', value: salesCampaignRecord.getValue({fieldId: 'name'}) + ' - Appointment'});
        phoneCallRecord.setValue({fieldId: 'message', value: appointmentDetails.notes});
        phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 17}); // Send Info (17)

        // Create calendar event record
        let calendarEventRecord = record.create({type: 'calendarevent'});
        calendarEventRecord.setValue({fieldId: 'company', value: customerId});
        calendarEventRecord.setValue({fieldId: 'organizer', value: runtime['getCurrentUser']().id});
        calendarEventRecord.setValue({fieldId: 'startdate', value: new Date(appointmentDetails.date)});
        calendarEventRecord.setValue({fieldId: 'starttime', value: new Date(appointmentDetails.startTime)});
        calendarEventRecord.setValue({fieldId: 'endtime', value: new Date(appointmentDetails.endTime)});
        calendarEventRecord.setValue({fieldId: 'timedevent', value: true});
        calendarEventRecord.setValue({fieldId: 'remindertype', value: 'EMAIL'});
        calendarEventRecord.setValue({fieldId: 'reminderminutes', value: '60'});
        calendarEventRecord.setValue({fieldId: 'status', value: 'CONFIRMED'});
        calendarEventRecord.setValue({fieldId: 'title', value: 'Sales - ' + salesCampaignRecord.getValue({fieldId: 'name'}) + ' - Appointment'});
        calendarEventRecord.setValue({fieldId: 'message', value: appointmentDetails.notes});

        // Modify sales record
        salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: false});
        salesRecord.setValue({fieldId: 'custrecord_sales_inuse', value: false});
        salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 5}); // Call back (5)

        if (salesRepId === runtime['getCurrentUser']().id) { // if the sales rep assign to themselves
            salesRecord.setValue({fieldId: 'custrecord_sales_callbackdate', value: new Date(appointmentDetails.date)});
            salesRecord.setValue({fieldId: 'custrecord_sales_callbacktime', value: new Date(appointmentDetails.startTime)});
            salesRecord.setValue({fieldId: 'custrecord_sales_appt', value: true});
        } else { // else, we create a new sales record and inform the newly assigned sales rep
            salesRecord.setValue({fieldId: 'custrecord_sales_deactivated', value: true});
            salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: true});

            salesRecord.save({ignoreMandatoryFields: true});

            // we create a new sales record here
            salesRecord = record.create({type: 'customrecord_sales'});
            salesRecord.setValue({fieldId: 'custrecord_sales_customer', value: customerId});
            salesRecord.setValue({fieldId: 'custrecord_sales_campaign', value: salesCampaignId});
            salesRecord.setValue({fieldId: 'custrecord_sales_assigned', value: salesRepId});
            salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 5}); // Call back (5)
            salesRecord.setValue({fieldId: 'custrecord_sales_callbackdate', value: new Date(appointmentDetails.date)});
            salesRecord.setValue({fieldId: 'custrecord_sales_callbacktime', value: new Date(appointmentDetails.startTime)});
            salesRecord.setValue({fieldId: 'custrecord_sales_appt', value: true});

            // send email to sales rep
            let customerLink = 'https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=' + customerId;
            let body = 'New sales record has been created. \n' +
                ' You have been assigned a lead. Please respond in an hour. \n' +
                ' Link: ' + customerLink;

            email.send({
                author: 112209,
                subject: 'Sales Lead',
                body,
                recipients: [employeeRecord.getValue({fieldId: 'email'})],
                isInternalOnly: true
            });
        }

        // Modify customer record
        if (parseInt(salesCampaignRecord?.getValue({fieldId: 'custrecord_salescampaign_recordtype'})) !== 1) {
            if (parseInt(customerRecord.getValue({fieldId: 'entitystatus'})) !== 13)
                customerRecord.setValue({fieldId: 'entitystatus', value: 8}); // SUSPECT-Out of Territory (64)

            customerRecord.setValue({fieldId: 'custentity_date_prospect_in_contact', value: new Date()});
        }

        salesRecord.save({ignoreMandatoryFields: true});
        phoneCallRecord.save({ignoreMandatoryFields: true});
        calendarEventRecord.save({ignoreMandatoryFields: true});

        _writeResponseJson(response, 'suitelet setAppointment');
    }
};

const processSalesOutcomes = {
    [VARS.salesOptions.CLOSED_WON.value]({emailDetails, phoneCallRecord, customerRecord, salesRecord, salesCampaignRecord}) {
        let {search, format, url, https, runtime, email, record} = NS_MODULES;
        let customerId = customerRecord.getValue({fieldId: 'id'});

        if (parseInt(salesCampaignRecord?.getValue({fieldId: 'custrecord_salescampaign_recordtype'})) !== 1) {
            customerRecord.setValue({fieldId: 'custentity_date_prospect_opportunity', value: new Date()});
            customerRecord.setValue({fieldId: 'custentity_cust_closed_won', value: true});
            customerRecord.setValue({fieldId: 'entitystatus', value: 66}); // CUSTOMER-To Be Finalised
            customerRecord.setValue({fieldId: 'custentity_mp_product_tracking', value: emailDetails.productTracking});

            _sendReminderEmailToDataAdmins(customerRecord);
        }

        phoneCallRecord.setValue({fieldId: 'title', value: salesCampaignRecord.getValue({fieldId: 'name'}) + ' - SCF Sent'});
        phoneCallRecord.setValue({fieldId: 'message', value: emailDetails.lostNote});
        phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 24}); // Send Form (24)

        if (salesRecord) {
            salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_formsent', value: true});
            salesRecord.setValue({fieldId: 'custrecord_sales_inuse', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 14}); // Send Form (14)

            // Send email
            let formattedDate;
            search.create({
                type: 'customrecord_commencement_register',
                filters: [
                    {name: 'custrecord_commreg_sales_record', operator: 'is', values: salesRecord.getValue({fieldId: 'id'})},
                    {name: 'custrecord_trial_status', operator: 'anyof', values: [2, 9, 10]}, // Active (2) | Scheduled (9) | Quote (10)
                ],
                columns: ['internalid', 'custrecord_comm_date']
            }).run().each(resultSet => {
                formattedDate = format.format({value: resultSet.getValue('custrecord_comm_date'), type: format.Type.DATE});
            });

            search.create({
                type: "contact",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        'AND',
                        ["company", "is", customerId],
                        'AND',
                        ['email', 'isnotempty', '']
                    ],
                columns: ['internalid']
            }).run().each(resultSet => {
                let emailTemplateRecord = record.load({type: 'customrecord_camp_comm_template', id: 150})
                let httpsGetResult = https.get({url: url.format({
                        domain: 'https://1048144.extforms.netsuite.com/app/site/hosting/scriptlet.nl',
                        params: {
                            script: 395,
                            deploy: 1,
                            compid: 1048144,
                            h: '6d4293eecb3cb3f4353e',
                            rectype: 'customer',
                            template: 150,
                            recid: customerId,
                            salesrep: null,
                            dear: null,
                            contactid: resultSet.id,
                            userid: runtime['getCurrentUser']().id,
                            commdate: formattedDate
                        }
                    })});
                let emailHtml = httpsGetResult.body;

                email.send({
                    author: runtime['getCurrentUser']().id,
                    subject: emailTemplateRecord.getValue({fieldId: 'custrecord_camp_comm_subject'}),
                    body: emailHtml,
                    recipients: [_getEmailAddressOfPartner(customerId)],
                    // recipients: ['tim.nguyen@mailplus.com.au'], // TODO: testing
                    cc: [runtime['getCurrentUser']().email],
                    relatedRecords: {
                        'entityId': customerId
                    },
                    isInternalOnly: true
                });
            })
        }

    },
    [VARS.salesOptions.OPP_WITH_VALUE.value]({emailDetails, phoneCallRecord, customerRecord, salesRecord, salesCampaignRecord}) {
        if (parseInt(salesCampaignRecord?.getValue({fieldId: 'custrecord_salescampaign_recordtype'})) !== 1) {
            customerRecord.setValue({fieldId: 'entitystatus', value: 58}); // PROSPECT-Opportunity
            customerRecord.setValue({fieldId: 'custentity_date_lead_quote_sent', value: new Date()});
        }

        phoneCallRecord.setValue({fieldId: 'title', value: salesCampaignRecord.getValue({fieldId: 'name'}) + ' - Quote Sent'});
        phoneCallRecord.setValue({fieldId: 'message', value: emailDetails.lostNote});
        phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 23}); // Send Quote (23)

        if (salesRecord) {
            salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_quotesent', value: true});
            salesRecord.setValue({fieldId: 'custrecord_sales_inuse', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 15}); // Send Quote (15)
        }
    },
    [VARS.salesOptions.OUT_OF_TRR.value]({emailDetails, phoneCallRecord, customerRecord, salesRecord, salesCampaignRecord}) {
        if (parseInt(salesCampaignRecord?.getValue({fieldId: 'custrecord_salescampaign_recordtype'})) !== 1) {
            if (parseInt(customerRecord.getValue({fieldId: 'entitystatus'})) === 13)
                customerRecord.setValue({fieldId: 'entitystatus', value: 64}); // SUSPECT-Out of Territory (64)

            customerRecord.setValue({fieldId: 'custentity_date_lead_lost', value: new Date()});
            customerRecord.setValue({fieldId: 'custentity_service_cancellation_reason', value: 39}); // Unserviceable Territory (39)

            phoneCallRecord.setValue({fieldId: 'title', value: 'Digital Lead Campaign - Out of Territory'});

            phoneCallRecord.setValue({fieldId: 'message', value: emailDetails.lostNote});
            phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 16}); // No Sale (16)

            if (salesRecord) {
                salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: true});
                salesRecord.setValue({fieldId: 'custrecord_sales_inuse', value: false});
                salesRecord.setValue({fieldId: 'custrecord_sales_completedate', value: new Date()});
                salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 10}); // No Sale (10)
            }
        }
    },
    [VARS.salesOptions.SIGNUP_EMAIL.value]({emailDetails, phoneCallRecord, customerRecord, salesRecord, salesCampaignRecord}) {
        if (parseInt(salesCampaignRecord?.getValue({fieldId: 'custrecord_salescampaign_recordtype'})) !== 1) {
            customerRecord.setValue({fieldId: 'entitystatus', value: 50}); // PROSPECT-Quote Sent (50)
            customerRecord.setValue({fieldId: 'custentity_date_lead_quote_sent', value: new Date()});
        }

        phoneCallRecord.setValue({fieldId: 'title', value: 'Digital Lead Campaign - Sign Up Email Sent'});
        phoneCallRecord.setValue({fieldId: 'message', value: emailDetails.lostNote});
        phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 24}); // Send Form (24)

        if (salesRecord) {
            salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_inuse', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_formsent', value: true});
            salesRecord.setValue({fieldId: 'custrecord_sales_quotesent', value: true});
            salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 14}); //  // Send Form (14)
        }

    },
    [VARS.salesOptions.NO_SALE.value]({emailDetails, phoneCallRecord, customerRecord, salesRecord, salesCampaignRecord}) {
        if (parseInt(salesCampaignRecord?.getValue({fieldId: 'custrecord_salescampaign_recordtype'})) !== 1) {
            if (parseInt(customerRecord.getValue({fieldId: 'entitystatus'})) === 13)
                customerRecord.setValue({fieldId: 'entitystatus', value: 22}); // SUSPECT-Customer - Lost
            else customerRecord.setValue({fieldId: 'entitystatus', value: 59}); // SUSPECT-Lost

            customerRecord.setValue({fieldId: 'custentity_date_lead_lost', value: new Date()});
            customerRecord.setValue({fieldId: 'custentity_service_cancellation_reason', value: emailDetails.lostReason});
        }

        phoneCallRecord.setValue({fieldId: 'title', value: salesCampaignRecord.getValue({fieldId: 'name'}) + ' - Lost'});
        phoneCallRecord.setValue({fieldId: 'message', value: emailDetails.lostNote});
        phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 16}); // No Sale (16)

        if (salesRecord) {
            salesRecord.setValue({fieldId: 'custrecord_sales_completed', value: true});
            salesRecord.setValue({fieldId: 'custrecord_sales_inuse', value: false});
            salesRecord.setValue({fieldId: 'custrecord_sales_outcome', value: 10}); // No Sale (10)
            salesRecord.setValue({fieldId: 'custrecord_sales_completedate', value: new Date()});
        }
    },
    [VARS.salesOptions.INV_TO_PORTAL.value]({emailDetails, phoneCallRecord, customerRecord, contactRecord, salesRecord}) {
        let customerId = customerRecord.getValue({fieldId: 'id'});
        customerRecord.setValue({fieldId: 'custentity_portal_how_to_guides', value: 1});

        phoneCallRecord.setValue({fieldId: 'title', value: 'Sales - Invite to Customer Portal'});
        phoneCallRecord.setValue({fieldId: 'message', value: emailDetails.lostNote});
        phoneCallRecord.setValue({fieldId: 'custevent_call_outcome', value: 17}); // Send Info (17)

        if (contactRecord) {
            let userJSON = '{';
            userJSON += '"customer_ns_id" : "' + customerId + '",';
            userJSON += '"first_name" : "' + contactRecord.getValue({fieldId: 'firstname'}) + '",';
            userJSON += '"last_name" : "' + contactRecord.getValue({fieldId: 'lastname'}) + '",';
            userJSON += '"email" : "' + contactRecord.getValue({fieldId: 'email'}) + '",';
            userJSON += '"phone" : "' + contactRecord.getValue({fieldId: 'phone'}) + '"';
            userJSON += '}';

            let headers = {};
            headers['Content-Type'] = 'application/json';
            headers['Accept'] = 'application/json';
            headers['x-api-key'] = 'XAZkNK8dVs463EtP7WXWhcUQ0z8Xce47XklzpcBj';

            NS_MODULES.https.post({
                url: 'https://mpns.protechly.com/new_staff',
                body: userJSON,
                headers
            });
        }

        if (salesRecord) { // resetting the 4 fields in sales record
            let fieldsToReset = ['custrecord_sales_assigned', 'custrecord_sales_callbackdate',
                'custrecord_sales_callbacktime', 'custrecord_sales_lastcalldate'];
            let originalSalesRecord = NS_MODULES.record.load({type: 'customrecord_sales', id: salesRecord.getValue({fieldId: 'id'})});

            for (let fieldId of fieldsToReset)
                salesRecord.setValue({fieldId, value: originalSalesRecord.getValue({fieldId})});
        }
    }
};

function _getEmailAddressOfPartnersSalesRep(customerId) {
    let salesRepId = NS_MODULES.search['lookupFields']({
        type: 'customer',
        id: customerId,
        columns: ['partner.custentity_sales_rep_assigned']
    })['partner.custentity_sales_rep_assigned'][0].value;

    let salesRepEmail = NS_MODULES.search['lookupFields']({
        type: 'employee',
        id: salesRepId,
        columns: ['email']
    })['email'];

    return {salesRepId, salesRepEmail}
}

function _getEmailAddressOfPartner(customerId) {
    return NS_MODULES.search['lookupFields']({
        type: 'customer',
        id: customerId,
        columns: ['partner.email']
    })['partner.email'];
}

function _sendReminderEmailToDataAdmins(customerRecord) {
    let customerEntityId = customerRecord.getValue({fieldId: 'entityid'});
    let customerName = customerRecord.getValue({fieldId: 'companyname'});
    let customerId = customerRecord.getValue({fieldId: 'id'});

    let email_body2 = 'Please check the below CUSTOMER details </br></br>';
    email_body2 += '<u><b>Customer Details</b></u> </br></br>Customer NS ID: ' + customerId + '</br>';
    email_body2 += 'Customer Name: ' + customerEntityId + ' ' + customerName + '</br>';
    email_body2 += 'Franchisee: ' + customerRecord.getText({fieldId: 'partner'}) + '</br></br>';

    NS_MODULES.email.send({
        author: 112209,
        subject: `${customerEntityId} ${customerName} - Signed Up - Please Check`,
        body: email_body2,
        // recipients: ['tim.nguyen@mailplus.com.au'],  // TODO: testing
        recipients: ['fiona.harrison@mailplus.com.au', 'popie.popie@mailplus.com.au'],
        bcc: ['ankith.ravindran@mailplus.com.au'],
        relatedRecords: {
            'entityId': customerId
        },
        isInternalOnly: true
    });
}