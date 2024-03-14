<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <v-container fluid>
                <v-row class="mx-1" justify="space-between" align="center">
                    <v-col cols="auto">
                        <h1 class="primary--text">
                            {{ pageTitle }}
                        </h1>
                        <a class="ma-0 caption primary--text font-weight-bold" target="_blank"
                           :href="baseUrl + '/app/common/entity/custjob.nl?id=' + $store.getters['customer/id']">
                            <v-icon small class="primary--text mr-1">mdi-account</v-icon> {{customer.entityid}} {{customer.companyname}}
                        </a>
                    </v-col>

                    <v-col cols="auto">
                        <a @click="$store.dispatch('addShortcut')" class="subtitle-1">
                            Add To Shortcuts <v-icon size="20" color="primary">mdi-open-in-new</v-icon></a>
                    </v-col>
                </v-row>
            </v-container>

            <v-tabs color="primary" background-color="background">
                <v-tab @click="goBackToCallCenter">
                    <v-icon left>mdi-home</v-icon>
                    Call Center
                </v-tab>
            </v-tabs>

            <v-divider></v-divider>

            <EmailSender />

        </v-main>

        <GlobalNotificationModal />
    </v-app>
</template>

<script>
import {baseURL, VARS} from '@/utils/utils.mjs';
import GlobalNotificationModal from "@/components/GlobalNotificationModal";
import EmailSender from '@/views/email-sender/Main';
import HelpPage from '@/views/help/Main';

export default {
    name: 'App',
    data: () => ({
        ...VARS,
    }),
    components: {
        GlobalNotificationModal,
        EmailSender,
        HelpPage
    },
    beforeCreate() {
        this.$store.dispatch('init');
    },
    methods: {
        goBackToCallCenter() {
            top.history.back();
        }
    },
    computed:{
        theme() {
            return (this.$vuetify.theme.dark) ? 'dark' : 'light'
        },
        mainTab: {
            get() {
                return this.$store.getters['mainTab'];
            },
            set(val) {
                this.$store.commit('setMainTab', val);
            }
        },
        customer() {
            return this.$store.getters['customer/details'];
        },
        baseUrl() {
            return baseURL
        }
    }
};
</script>

<style>
.v-text-field__prefix {
    font-weight: 600;
}
</style>