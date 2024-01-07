<template>
    <v-card :flat="!displayOnly" :elevation="displayOnly ? 5 : 0" class="container background">
        <v-form ref="form" v-model="formValid" lazy-validation>
            <v-row>
                <v-col cols="12" v-if="displayOnly">
                    <p class="subtitle-1 mb-0">
                        No sale:
                        <v-btn icon small color="primary" @click="goToThis"><v-icon small>mdi-pencil</v-icon></v-btn>
                    </p>
                </v-col>
                <v-col cols="12">
                    <v-autocomplete prefix="Lost Reason:"
                                    :items="$store.getters['misc/noSaleReasons']"
                                    :rules="[v => validate(v, 'required', 'Lost Reason')]"
                                    :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                    v-model="emailDetails.lostReason" dense placeholder="(required)"></v-autocomplete>
                </v-col>
                <v-col cols="12">
                    <v-textarea prefix="Lost Notes:" v-model="emailDetails.lostNote" dense
                                placeholder="(None provided)"
                                :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly">
                    </v-textarea>
                </v-col>
                <v-col cols="12">
                    <v-btn color="primary" large dark block elevation="7"
                           @click="save">
                        <v-icon class="mr-2">mdi-content-save-check-outline</v-icon> Save your work
                    </v-btn>
                </v-col>
            </v-row>
        </v-form>

        <v-dialog v-model="dialog.open" max-width="350">
            <v-card class="background">
                <v-card-title class="text-h6">
                    Lost Lead/Customer?
                </v-card-title>

                <v-card-text class="subtitle-1">
                    This will mark <b>{{customerDetails.entityid}} - {{customerDetails.companyname}}</b> as Lost
                    in NetSuite. Proceed?
                </v-card-text>

                <v-divider></v-divider>
                <v-card-actions>
                    <v-btn color="red darken-1" text @click="dialog.open = false">
                        Cancel
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="proceed">
                        Proceed
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import {rules, VARS, allowOnlyNumericalInput} from '@/utils/utils.mjs';

export default {
    name: "NoSale",
    props: {
        displayOnly: {
            type: Boolean,
            default: false,
            required: false,
        },
    },
    data: () => ({
        formValid: false,
        dialog: {
            open: false,
            title: '',
            message: '',
        },
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        resetValidation () {
            this.$refs.form.resetValidation()
        },
        save() {
            let res = this.$refs.form.validate();
            if (!res) return;
            this.dialog.open = true;
        },
        proceed() {
            this.$store.dispatch('email-sender/sendSalesEmail');
            this.dialog.open = false;
        },
        goToThis() {
            this.$store.getters['email-sender/functionTabs'].selected = this.tabsIndex + 1;
        },
    },
    computed: {
        customerDetails() {
            return this.$store.getters['customer/details'];
        },
        emailDetails() {
            return this.$store.getters['email-sender/emailDetails'];
        },
        tabsIndex() {
            return this.$store.getters['email-sender/functionTabs'].options
                .findIndex(item => item.name === VARS.emailSenderTabNames.EMAIL_CALLBACK);
        },
        tabs() {
            return this.$store.getters['email-sender/functionTabs'].options;
        },
    },
};
</script>

<style scoped>

</style>