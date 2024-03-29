

const mainTabNames = {
    HOME: 'home',
    HELP: 'help',
    APPOINTMENT: 'appointment',
};

const emailSenderTabNames = {
    SET_APPOINTMENT: 'set_appointment',

    SERVICE_PRICE: 'service_price',
    FORM_BROCHURE: 'form_brochure',
    NO_SALE: 'no_sale',

    EMAIL_CALLBACK: 'email_callback',

    SAVE_SEND: 'save_send',
}

const operationModes = {
    CALLBACK: 'callback_mode',
    CLOSED_WON: 'closed_won_mode',
    OPP_WITH_VALUE: 'owv_mode',
}

const salesOptions = {
    FREE_TRIAL: {
        value: 'free_trial',
        text: 'Free trial'
    },
    CLOSED_WON: {
        value: 'closed_won',
        text: 'Closed won'
    },
    OPP_WITH_VALUE: {
        value: 'opp_with_value',
        text: 'Opportunity with value'
    },
    SIGNUP_EMAIL: {
        value: 'signed_email',
        text: 'Sign up email - Product Rates'
    },
    OUT_OF_TRR: {
        value: 'out_of_trr',
        text: 'Out of territory'
    },
    INV_TO_PORTAL: {
        value: 'inv_to_portal',
        text: 'Invite to portal'
    },
    CALLBACK: {
        value: 'callback',
        text: 'Set appointment',
        showWhenChecked: true
    },
    NO_SALE: {
        value: 'no_sale',
        text: 'No sales / No contact / Lost',
        showWhenChecked: true
    },
}

export const VARS = {
    mainTabNames,
    operationModes,
    emailSenderTabNames,
    salesOptions,

    pageTitle: 'Sales Email Sender'
}

export const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

export const rules = {
    email(value, fieldName = 'This field') {
        return !value || /.+@.+\..+/.test(value) || `${fieldName} must be a valid email`;
    },
    required(value, fieldName = 'This field') {
        return !!value || `${fieldName} is required`;
    },
    minLength(value, fieldName = 'This field', length) {
        return (value && value.length >= length) || `${fieldName} must be more than ${length} characters`;
    },
    abn(value, fieldName = 'This field') {
        if (!value) return true;

        let weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
            checksum = value.split('').map(Number).reduce(
                function(total, digit, index) {
                    if (!index) {
                        digit--;
                    }
                    return total + (digit * weights[index]);
                },
                0
            );

        return value.length === 11 || !(!checksum || checksum % 89 !== 0) || `${fieldName} must be a valid ABN`;
    },
    ausPhone(value, fieldName = 'This field') {
        let australiaPhoneFormat = /^(\+\d{2}[ -]{0,1}){0,1}(((\({0,1}[ -]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ -]*(\d{4}[ -]{0,1}\d{4}))|(1[ -]{0,1}(300|800|900|902)[ -]{0,1}((\d{6})|(\d{3}[ -]{0,1}\d{3})))|(13[ -]{0,1}([\d -]{5})|((\({0,1}[ -]{0,1})0{0,1}\){0,1}4{1}[\d -]{8,10})))$/;
        return !value || australiaPhoneFormat.test(value) || `${fieldName} must be a valid phone number`;
    },

    validate(v, validationString, fieldName = 'This field') {
        let validations = validationString.split('|');

        for (let validation of validations) {
            if (validation === 'validate') continue;

            let terms = validation.split(':');
            let rule = terms.shift();
            terms = terms.length ? terms[0].split(',') : [];
            let result = rules[rule] ? rules[rule](v, fieldName || 'Field', ...terms) : null;

            if (typeof result === 'string') return result;
        }

        return true
    }
}

export function allowOnlyNumericalInput(evt) {
    // evt = (evt) ? evt : window.event;
    let expect = evt.target.value.toString() + evt.key.toString();

    // if (!/^[-+]?[0-9]*?[0-9]*$/.test(expect)) // Allow only 1 leading + sign and numbers
    if (!/^[0-9]*$/.test(expect)) // Allow only numbers
        evt.preventDefault();
    else return true;
}

export function debounce(fn, wait){
    let timer;
    return function(...args){
        if(timer) {
            clearTimeout(timer); // clear any pre-existing timer
        }
        const context = this; // get the current context
        timer = setTimeout(()=>{
            fn.apply(context, args); // call the function if time expires
        }, wait);
    }
}