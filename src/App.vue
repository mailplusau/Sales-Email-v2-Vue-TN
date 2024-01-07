<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <v-container fluid>
                <v-row class="mx-1" justify="space-between" align="center">
                    <v-col cols="auto">
                        <h1 class="primary--text">
                            {{ pageTitle }}
                        </h1>
                    </v-col>

                    <v-col cols="auto">
                        <a @click="$store.dispatch('addShortcut')" class="subtitle-1">Add To Shortcuts <v-icon size="20" color="primary">mdi-open-in-new</v-icon></a>
                    </v-col>
                </v-row>
            </v-container>

            <v-tabs v-model="mainTab" color="primary" background-color="background">
                <v-tab :href="`#${mainTabNames.HOME}`">
                    <v-icon left>mdi-home</v-icon>
                    Home
                </v-tab>

                <v-spacer></v-spacer>

                <v-tab :href="`#${mainTabNames.HELP}`">
                    <v-icon left>mdi-help-circle-outline</v-icon>
                    Help
                </v-tab>
            </v-tabs>

            <v-divider></v-divider>

            <v-tabs-items v-model="mainTab" class="background">
                <v-tab-item :value="mainTabNames.HOME">
                    <EmailSender />
                </v-tab-item>
                <v-tab-item :value="mainTabNames.HELP">
                    <HelpPage />
                </v-tab-item>
            </v-tabs-items>
        </v-main>

        <GlobalNotificationModal />
    </v-app>
</template>

<script>
import {VARS} from '@/utils/utils.mjs';
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
    }
};
</script>

<style>
.v-text-field__prefix {
    font-weight: 600;
}
</style>