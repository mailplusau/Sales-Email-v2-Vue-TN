<template>
    <v-card :flat="!displayOnly" :elevation="displayOnly ? 5 : 0" class="container background">
        <v-row>
            <v-col cols="12">
                <p class="subtitle-1 mb-0" v-if="displayOnly">
                    Services offered :
                    <v-btn icon small color="primary" @click="goToThis"><v-icon small>mdi-pencil</v-icon></v-btn>
                </p>
                <v-divider></v-divider>
                <v-data-table
                    :headers="headers"
                    :items="tableItems"
                    :hide-default-footer="tableItems.length <= 5"
                    :items-per-page="5"
                    class="elevation-1 background"
                    :loading="busy"
                    loading-text="Retrieving service changes..."
                    no-data-text="No service change found."
                >
                    <template v-slot:top v-if="!displayOnly">
                        <v-toolbar flat dense color="primary" dark>
                            <v-toolbar-title>Service Changes</v-toolbar-title>
                            <v-divider class="mx-4" inset vertical></v-divider>

                            <v-spacer></v-spacer>

                            <v-btn color="secondary" outlined small @click="updateService" :disabled="busy">
                                <span v-if="tableItems.length <= 0">Add service</span>
                                <span v-else>update service changes</span>
                            </v-btn>
                        </v-toolbar>
                    </template>

                    <template v-slot:item.custrecord_servicechg_new_price="{ item }">
                        {{ formatCurrency(item.custrecord_servicechg_new_price) }}
                    </template>

                    <template v-slot:item.custrecord_service_price="{ item }">
                        {{ formatCurrency(item.custrecord_service_price) }}
                    </template>

                </v-data-table>
            </v-col>

            <v-col cols="12" v-if="tabsIndex < tabs.length - 1 && !displayOnly">
                <v-btn class="mt-2" large block color="primary" elevation="5"
                       @click="$store.commit('email-sender/toNextFunctionTab')">
                    continue to next step <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </v-col>

            <v-col cols="12" class="text-center" v-if="tabsIndex > 0 && !displayOnly">
                <v-btn small elevation="3"
                       @click="$store.commit('email-sender/toPrevFunctionTab')">
                    <v-icon>mdi-chevron-left</v-icon> previous step
                </v-btn>
            </v-col>
        </v-row>

        <v-dialog v-if="!displayOnly"
            :value="iframeDialogOpen"
            fullscreen
            hide-overlay
            scrollable
            transition="dialog-bottom-transition"
        >
            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>
                        Update Service Changes <br>
                        <p class="caption ma-0 yellow--text">Note: all changes made in this window is immediate.</p>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
<!--                        <v-btn color="yellow" text @click="closeIframe">Done & close</v-btn>-->
                    </v-toolbar-items>
                </v-toolbar>

                <v-divider></v-divider>

                <div v-show="iframeLoading" class="webview-iframe text-center pt-10 background">
                    <v-progress-circular
                        indeterminate
                        color="primary"
                        size="45"
                    ></v-progress-circular>
                    <p class="mt-5">Loading. Please wait...</p>
                </div>
                <iframe v-show="!iframeLoading" class="webview-iframe" :src="iframeDialogSrc" @load="handleIframeLoaded"></iframe>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import {baseURL, VARS} from '@/utils/utils.mjs';

let AUDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AUD',
});

export default {
    name: "ServiceAndPrice",
    props: {
        displayOnly: {
            type: Boolean,
            default: false,
            required: false,
        }
    },
    data: () => ({
        headers: [
            { text: 'Service Name', value: 'custrecord_servicechg_service_text', sortable: false, align: 'start' },
            { text: 'Type', value: 'custrecord_servicechg_type', sortable: false, align: 'center' },
            { text: 'Date Effective', value: 'custrecord_servicechg_date_effective', sortable: false, align: 'center' },
            { text: 'Old Price', value: 'custrecord_service_price', sortable: false, align: 'center' },
            { text: 'New Price', value: 'custrecord_servicechg_new_price', sortable: false, align: 'center' },
            { text: 'Frequency', value: 'custrecord_servicechg_new_freq_text', sortable: false, align: 'center'},
        ],
        iframeLoading: true,
    }),
    mounted() {
        if (!window.closeServiceAndPriceDialog) {
            window.closeServiceAndPriceDialog = () => {
                this.closeIframe();
            };
        }
    },
    methods: {
        updateService() {
            let params = {
                custid: this.$store.getters['customer/id'], //1734126
                salesrecordid: this.$store.getters['sales-records/selected'].internalid, //361585
                salesrep: 'F',
                sendemail: 'T',
                closedwon: this.$store.getters['paramFlags'].closedWon ? 'T' : 'F',
                oppwithvalue: this.$store.getters['paramFlags'].oppWithValue ? 'T' : 'F',
                savecustomer: 'F',
                commreg: this.$store.getters['service-changes/commRegId'],
                customid: 'customscript_sl_send_email_module',
                customdeploy: 'customdeploy_sl_send_email_module',
                cache_burst: Date.now()
            }
            if (top['nlapiResolveURL']) {
                let url = baseURL +
                    top['nlapiResolveURL']('SUITELET', 'customscript_sl_service_change_tn_v2_vue', 'customdeploy_sl_service_change_tn_v2_vue') +
                    '&standalone=T&custparam_params=' + JSON.stringify(params);

                this.iframeLoading = true;
                this.$store.commit('service-changes/openIframeDialog', url)
            }
        },
        closeIframe() {
            this.$store.commit('service-changes/closeIframeDialog');
            this.$store.dispatch('service-changes/get');
        },
        handleIframeLoaded() {
            this.iframeLoading = false;
        },
        goToThis() {
            this.$store.getters['email-sender/functionTabs'].selected = this.tabsIndex + 1;
        },
        formatCurrency(value) {
            return AUDollar.format(value);
        },
    },
    computed: {
        tableItems() {
            return this.$store.getters['service-changes/data']
        },
        busy() {
            return this.$store.getters['service-changes/busy']
        },
        tabsIndex() {
            return this.$store.getters['email-sender/functionTabs'].options
                .findIndex(item => item.name === VARS.emailSenderTabNames.SERVICE_PRICE);
        },
        tabs() {
            return this.$store.getters['email-sender/functionTabs'].options;
        },

        iframeDialogOpen() {
            return this.$store.getters['service-changes/iframeDialog'].open;
        },
        iframeDialogSrc() {
            return this.$store.getters['service-changes/iframeDialog'].src;
        }
    }
};
</script>

<style scoped>
.webview-iframe {
    height: 100%;
    width: 100%;
    border: none;
    overflow: scroll;
}
</style>