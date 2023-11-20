<template>
    <v-card flat class="container background">
        <v-row justify="space-around">
            <v-col cols="12" v-for="(tabItem) in $store.getters['email-sender/functionTabs'].options" :key="tabItem.name">
                <ServiceAndPriceTab v-if="tabItem.name === emailSenderTabNames.SERVICE_PRICE" display-only />
                <FormAndBrochureTab v-else-if="tabItem.name === emailSenderTabNames.FORM_BROCHURE" display-only />
                <EmailAndCallbackTab v-else-if="tabItem.name === emailSenderTabNames.EMAIL_CALLBACK" display-only />
            </v-col>

            <v-col cols="12">
                <v-btn v-if="progressWithoutEmail" color="primary" large dark block elevation="7"
                       @click="save">
                    <v-icon class="mr-2">mdi-content-save-check-outline</v-icon> Save your work
                </v-btn>
                <v-btn v-else color="green darken-1" large dark block elevation="7"
                       @click="send">
                    <v-icon class="mr-2">mdi-email-fast-outline</v-icon> Send email
                </v-btn>
            </v-col>

            <v-col cols="12" v-if="tabsIndex < tabs.length - 1">
                <v-btn class="mt-2" large block color="primary" elevation="5"
                       @click="$store.commit('email-sender/toNextFunctionTab')">
                    continue to next step <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </v-col>

            <v-col cols="12" class="text-center" v-if="tabsIndex > 0">
                <v-btn small elevation="3"
                       @click="$store.commit('email-sender/toPrevFunctionTab')">
                    <v-icon>mdi-chevron-left</v-icon> previous step
                </v-btn>
            </v-col>
        </v-row>


        <v-dialog v-model="dialog.open" max-width="350">
            <v-card class="background">
                <v-card-title class="text-h6">
                    {{dialog.title}}
                </v-card-title>

                <v-card-text class="subtitle-1">
                    {{dialog.message}}
                </v-card-text>

                <v-divider></v-divider>
                <v-card-actions>
                    <v-btn color="red darken-1" text @click="dialog.open = false">
                        Cancel
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="$store.dispatch('email-sender/sendSalesEmail')">
                        Proceed
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import {VARS} from '@/utils/utils.mjs';
import EmailAndCallbackTab from '@/views/email-sender/tab/EmailAndCallback.vue';
import FormAndBrochureTab from '@/views/email-sender/tab/FormAndBrochure.vue';
import ServiceAndPriceTab from '@/views/email-sender/tab/ServiceAndPrice.vue';

export default {
    name: "SaveAndSend",
    components: {ServiceAndPriceTab, FormAndBrochureTab, EmailAndCallbackTab},
    data: () => ({
        ...VARS,
        dialog: {
            open: false,
            title: '',
            message: '',
        },
    }),
    methods: {
        send() {
            this.dialog.title = 'Sending email';
            this.dialog.message = 'An email will be sent to the specified contact. Proceed?';
            this.dialog.open = true;
        },
        save() {
            this.dialog.title = 'No contact specified';
            this.dialog.message = 'Proceed without sending email?';
            this.dialog.open = true;
        }
    },
    computed: {
        progressWithoutEmail() {
            return this.$store.getters['email-sender/emailDetails'].recipient === -1;
        },
        tabsIndex() {
            return this.$store.getters['email-sender/functionTabs'].options
                .findIndex(item => item.name === VARS.emailSenderTabNames.SAVE_SEND);
        },
        tabs() {
            return this.$store.getters['email-sender/functionTabs'].options;
        },
    }
};
</script>

<style scoped>

</style>