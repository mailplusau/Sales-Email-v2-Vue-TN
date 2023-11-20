<template>
    <v-card :flat="!displayOnly" :elevation="displayOnly ? 5 : 0" class="container background" >
        <v-row v-if="displayOnly">
            <v-col cols="12">
                <p class="subtitle-1 mb-0">
                    Forms included:
                    <v-btn icon small color="primary" @click="goToThis"><v-icon small>mdi-pencil</v-icon></v-btn>
                </p>
                <p class="subtitle-2 mb-0 mt-3" v-show="!formsToSend.selected.length">No form was selected <v-icon small>mdi-alert-outline</v-icon></p>
                <v-checkbox v-for="form in formsToSend.options" :key="form.value" readonly hide-details
                            dense :value="form.value" v-model="formsToSend.selected" v-show="formsToSend.selected.includes(form.value)">
                    <template v-slot:label>
                        {{ form.text }}

                        <v-tooltip right>
                            <template v-slot:activator="{ on }">
                                <v-btn v-on="on" small class="ml-1" color="primary"
                                       @click.stop.prevent="previewForm(form.text, form.value)" icon><v-icon>mdi-file-find-outline</v-icon></v-btn>
                            </template>
                            Click to preview
                        </v-tooltip>
                    </template>
                </v-checkbox>
            </v-col>
        </v-row>
        <v-row v-else>
            <v-col cols="12">
                <p>Forms to include:</p>
                <v-checkbox v-for="form in formsToSend.options" :key="form.value"
                            dense :value="form.value" v-model="formsToSend.selected">
                    <template v-slot:label>
                        {{ form.text }}

                        <v-tooltip right>
                            <template v-slot:activator="{ on }">
                                <v-btn v-on="on" small class="ml-1" color="primary"
                                       @click.stop.prevent="previewForm(form.text, form.value)" icon><v-icon>mdi-file-find-outline</v-icon></v-btn>
                            </template>
                            Click to preview
                        </v-tooltip>
                    </template>
                </v-checkbox>
            </v-col>

            <v-col cols="12">
                <v-btn v-if="tabsIndex < tabs.length - 1" class="mt-2" large block color="primary" elevation="5"
                       @click="$store.commit('email-sender/toNextFunctionTab')">
                    continue to next step <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
            </v-col>

            <v-col cols="12" class="text-center">
                <v-btn v-if="tabsIndex > 0" small elevation="3"
                       @click="$store.commit('email-sender/toPrevFunctionTab')">
                    <v-icon>mdi-chevron-left</v-icon> previous step
                </v-btn>
            </v-col>
        </v-row>

        <v-dialog
            v-model="previewDialog"
            fullscreen
            hide-overlay
            scrollable
            transition="dialog-bottom-transition"
        >
            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>
                        {{ iframeTitle }}
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn color="yellow" text @click="closeIframe">
                            Done & close
                        </v-btn>
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
                <object v-if="iframeSrc" v-show="!iframeLoading" class="webview-iframe" :data="iframeSrc"
                        type="application/pdf" @load="iframeLoading = false"></object>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import {baseURL, VARS} from '@/utils/utils.mjs';

export default {
    name: "FormAndBrochure",
    props: {
        displayOnly: {
            type: Boolean,
            default: false,
            required: false,
        }
    },
    data: () => ({
        previewDialog: false,
        iframeSrc: null,
        iframeTitle: '',
        iframeLoading: false,
    }),
    methods: {
        previewForm(name, id) {
            const url = new URL(baseURL + '/app/site/hosting/scriptlet.nl');

            url.searchParams.set('script', '746');
            url.searchParams.set('deploy', '1');
            url.searchParams.set('stage', '0');
            url.searchParams.set('custid', this.$store.getters['customer/id']);
            url.searchParams.set('scfid', id);
            url.searchParams.set('start', 'null');
            url.searchParams.set('end', 'null');
            url.searchParams.set('commreg', this.$store.getters['service-changes/commRegId']);
            url.searchParams.set('salesrecordid', this.$store.getters['service-changes/salesRecordId']);

            this.iframeSrc = url.toString();
            this.iframeTitle = `Previewing: ${name}`
            this.previewDialog = true;
        },
        closeIframe() {
            this.previewDialog = false;
            this.iframeSrc = null;
        },
        goToThis() {
            this.$store.getters['email-sender/functionTabs'].selected = this.tabsIndex + 1;
        },
    },
    computed: {
        formsToSend() {
            return this.$store.getters['email-sender/formsToSend'];
        },
        tabsIndex() {
            return this.$store.getters['email-sender/functionTabs'].options
                .findIndex(item => item.name === VARS.emailSenderTabNames.FORM_BROCHURE);
        },
        tabs() {
            return this.$store.getters['email-sender/functionTabs'].options;
        },
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