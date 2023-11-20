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

            <v-divider class="mb-3"></v-divider>

            <v-container>
                <v-row justify="center">
                    <v-col xl="9" lg="11" cols="12">
                        Contents
                    </v-col>
                </v-row>
            </v-container>

        </v-main>

        <GlobalNotificationModal />
    </v-app>
</template>

<script>
import {VARS} from '@/utils/utils.mjs';
import GlobalNotificationModal from "@/components/GlobalNotificationModal";

export default {
    name: 'App',
    data: () => ({
        ...VARS,
    }),
    components: {
        GlobalNotificationModal,
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