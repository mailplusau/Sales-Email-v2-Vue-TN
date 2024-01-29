<template>
    <v-container fluid>
        <v-row justify="center">
            <v-col cols="12" class="pa-0 mb-4"></v-col>

            <v-col cols="auto" v-for="(option, key) in $store.getters['email-sender/salesFlags'].options" :key="key">
                <v-btn v-show="!option.showWhenChecked || selected.includes(option.value)"
                       :outlined="selected.includes(option.value)" :color="selected.includes(option.value) ? 'primary' : ''"
                       :text="!selected.includes(option.value)"
                       @click="salesOptionSelected(option)">
                    <v-icon class="mr-1" :color="selected.includes(option.value) ? 'primary' : ''">
                        {{`mdi-checkbox${selected.includes(option.value) ? '' : '-blank'}-outline`}}
                    </v-icon>
                    {{ option.text }}
                </v-btn>
            </v-col>

            <v-col cols="12" class="text-center pa-0 ma-0">
                <v-divider class="mt-5"></v-divider>
            </v-col>

            <v-col xl="7" lg="10" md="12" cols="12">
                <v-stepper v-show="selected.length" v-model="functionTabNumber" elevation="0">
                    <v-stepper-header class="background text-center" v-show="tabs.length > 1">
                        <template v-for="(tabItem, index) in tabs">
                            <v-stepper-step :key="tabItem.name"
                                            :editable="$store.getters['email-sender/functionTabs'].visited.includes(index + 1)"
                                            :complete="functionTabNumber > index + 1" edit-icon="mdi-check"
                                            :color="functionTabNumber === index + 1 ? 'pink' : 'primary'"
                                            :step="index + 1">
                                {{ tabItem.label }}
                            </v-stepper-step>

                            <v-divider v-if="index < tabs.length - 1" :key="tabItem.name + '_divider'"></v-divider>
                        </template>
                    </v-stepper-header>


                    <v-stepper-items class="background">
                        <v-divider class="mt-3" v-show="tabs.length > 1"></v-divider>

                        <v-stepper-content v-for="(tabItem, index) in tabs" :key="tabItem.name" :step="index + 1">
                            <SetAppointmentTab v-if="tabItem.name === emailSenderTabNames.SET_APPOINTMENT" />
                            <ServiceAndPriceTab v-else-if="tabItem.name === emailSenderTabNames.SERVICE_PRICE" />
                            <FormAndBrochureTab v-else-if="tabItem.name === emailSenderTabNames.FORM_BROCHURE" />
                            <EmailAndCallbackTab v-else-if="tabItem.name === emailSenderTabNames.EMAIL_CALLBACK" />
                            <NoSaleTab v-else-if="tabItem.name === emailSenderTabNames.NO_SALE" />
                            <SaveAndSendTab v-else-if="tabItem.name === emailSenderTabNames.SAVE_SEND" />
                        </v-stepper-content>
                    </v-stepper-items>
                </v-stepper>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import {VARS} from '@/utils/utils.mjs';
import ServiceAndPriceTab from '@/views/email-sender/tab/ServiceAndPrice.vue';
import FormAndBrochureTab from '@/views/email-sender/tab/FormAndBrochure.vue';
import EmailAndCallbackTab from '@/views/email-sender/tab/EmailAndCallback.vue';
import SaveAndSendTab from '@/views/email-sender/tab/SaveAndSend.vue';
import SetAppointmentTab from '@/views/email-sender/tab/SetAppointment.vue';
import NoSaleTab from '@/views/email-sender/tab/NoSale.vue';

export default {
    name: "Main",
    components: {
        SetAppointmentTab,
        SaveAndSendTab, EmailAndCallbackTab, FormAndBrochureTab, ServiceAndPriceTab, NoSaleTab},
    data: () => ({
        ...VARS,
    }),
    mounted() {
        this.constructTabs();
    },
    methods: {
        constructTabs() {
            this.$store.commit('email-sender/constructFunctionTabs', this.$nextTick)
        },
        handleClick(clickedValue) { // user can only choose either Closed Won or Opportunity With Value
            let {CLOSED_WON, OPP_WITH_VALUE} = this.salesOptions;
            if ([CLOSED_WON.value, OPP_WITH_VALUE.value].includes(clickedValue)) {
                let tmp = CLOSED_WON.value + OPP_WITH_VALUE.value;
                let index = this.$store.getters['email-sender/salesFlags'].selected.indexOf(tmp - clickedValue);

                if (index >= 0) this.$store.getters['email-sender/salesFlags'].selected.splice(index, 1);
            }
        },
        salesOptionSelected(option) {
            if (this.$store.getters['email-sender/salesFlags'].disabled) return;
            this.$store.dispatch('email-sender/changeSelectedSalesFlag', option.value);
            this.constructTabs();
        }
    },
    computed: {
        salesFlagsDisabled() {
            return this.$store.getters['email-sender/salesFlags'].disabled;
        },
        selected() {
            return this.$store.getters['email-sender/salesFlags'].selected;
        },
        functionTabNumber: {
            get() {
                return parseInt(this.$store.getters['email-sender/functionTabs'].selected);
            },
            set(val) {
                this.$store.getters['email-sender/functionTabs'].selected = val;
                this.$store.commit('email-sender/recordVisitedFunctionTab', val);
            }
        },
        tabs() {
            return this.$store.getters['email-sender/functionTabs'].options;
        },
        selectedSingleSalesFlag: {
            get() {
                return this.$store.getters['email-sender/salesFlags'].selected[0]
            },
            set(val) {
                this.$store.getters['email-sender/salesFlags'].selected = [val[0]];
            }
        }
    }
};
</script>

<style scoped>

</style>