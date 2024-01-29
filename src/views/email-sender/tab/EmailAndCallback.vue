<template>
    <v-card :flat="!displayOnly" :elevation="displayOnly ? 5 : 0" class="container background">
        <v-form ref="form" v-model="formValid" lazy-validation>
            <v-row>
                <v-col cols="12" v-if="displayOnly">
                    <p class="subtitle-1 mb-0">
                        Email to send:
                        <v-btn icon small color="primary" @click="goToThis"><v-icon small>mdi-pencil</v-icon></v-btn>
                    </p>
                </v-col>
                <v-col md="6" cols="12">
                    <v-autocomplete prefix="MP Product Tracking Required?"
                                    :items="$store.getters['misc/yesNoOptions']"
                                    :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                    v-model="emailDetails.productTracking" dense></v-autocomplete>
                </v-col>
                <v-col md="6" cols="12">
                    <v-autocomplete prefix="Recipient:"
                                    :items="recipientList"
                                    :rules="[v => validate(v, 'required', 'Recipient')]"
                                    :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                    v-model="emailDetails.recipient" dense placeholder="(required)"></v-autocomplete>
                </v-col>
                <v-col cols="12" v-if="!progressWithoutEmail">
                    <v-combobox prefix="CC:" v-model="emails"
                                multiple deletable-chips dense small-chips persistent-hint
                                append-icon=""
                                hint="Input a valid email address and hit [Enter]. Multiple email addresses can be entered with commas between them."
                                :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                @change="handleEmailsChanged">
                        <template v-slot:selection="{ attrs, item, parent, selected }">
                            <v-chip v-bind="attrs" :input-value="selected"
                                    label small
                                    class="my-1"
                                    :color="`primary`">
                                <span class="pr-1">{{ item }}</span>
                                <v-icon small @click="parent.selectItem(item)">mdi-close-circle</v-icon>
                            </v-chip>
                        </template>
                    </v-combobox>
                </v-col>
                <v-col cols="12" v-if="!progressWithoutEmail">
                    <v-autocomplete prefix="Template:" v-model="emailDetails.emailTemplateId"
                                    :items="emailTemplates.data"
                                    item-value="internalid"
                                    item-text="name"
                                    :loading="emailTemplates.busy || emailDetails.busy"
                                    :disabled="!emailDetails.recipient || emailTemplates.busy || emailDetails.busy || displayOnly"
                                    @change="handleSelectedEmailTemplateChanged"
                                    :rules="[v => validate(v, 'required')]"
                                    :readonly="displayOnly" :hide-details="displayOnly"
                                    dense
                                    :placeholder="!emailDetails.recipient ? 'Please select a recipient first' : '(required)'"></v-autocomplete>
                </v-col>
                <v-col cols="12" v-if="!progressWithoutEmail">
                    <v-text-field prefix="Subject:" v-model="emailDetails.emailSubject" :disabled="emailDetails.busy || displayOnly"
                                  :rules="[v => validate(v, 'required')]"
                                  :readonly="displayOnly" :hide-details="displayOnly"
                                  dense placeholder="(required)"></v-text-field>
                </v-col>
                <v-col cols="12" v-if="!progressWithoutEmail && !displayOnly">
                    <div style="font-weight: 600; padding-bottom: 5px;">Email Body:</div>

                    <SummernoteEditor name="editor" ref="summernote-editor"
                                      :model="emailDetails.emailBody"
                                      v-on:change="value => { emailDetails.emailBody = value }"
                                      :config="config" />
                </v-col>


                <v-col cols="12" v-if="tabsIndex < tabs.length - 1 && !displayOnly">
                    <v-btn class="mt-2" large block color="primary" elevation="5"
                           @click="toNextStep">
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
        </v-form>
    </v-card>
</template>

<script>
import {rules, VARS, allowOnlyNumericalInput} from '@/utils/utils.mjs';
import SummernoteEditor from '@/components/SummernoteEditor.vue';

export default {
    name: "EmailAndCallback",
    components: {SummernoteEditor},
    props: {
        displayOnly: {
            type: Boolean,
            default: false,
            required: false,
        }
    },
    data: () => ({
        radioGroup: null,
        emails: [],
        searchInput: null,
        lastEmailsLength: 0,

        content: null,
        formValid: false,
        // ↓ It is what the configuration object looks like. ↓
        config: {
            toolbar: [
                // [groupName, [list of button]]
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['font', ['strikethrough', 'superscript', 'subscript']],
                ['fontsize', ['fontsize']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['gxcode']], // plugin config: summernote-ext-codewrapper
            ],
        },
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        resetValidation () {
            this.$refs.form.resetValidation()
        },
        handleEmailsChanged() {
            // assuming the newest item always goes in last
            if (this.emails.length > this.lastEmailsLength) {
                let lastInput = this.emails.pop();
                let inputArr = lastInput.replace(/\s/g, "").split(',');
                for (let input of inputArr)
                    if (rules.validate(input, 'email') === true)
                        this.emails.push(input);

                this.lastEmailsLength = this.emails.length;
            }

            this.emailDetails.cc = [...this.emails];
        },
        async handleSelectedEmailTemplateChanged() {
            await this.$store.dispatch('email-sender/handleSelectedEmailTemplateChanged');

            this.$nextTick(() => {
                this.$refs['summernote-editor']?.reInitEditor();
            })
        },
        toNextStep() {
            let res = this.$refs.form.validate();
            if (!res) return;
            this.$store.commit('email-sender/toNextFunctionTab');
        },
        getValidationStatus() {
            return this.$refs.form.validate();
        },
        goToThis() {
            this.$store.getters['email-sender/functionTabs'].selected = this.tabsIndex + 1;
        },
    },
    computed: {
        emailDetails() {
            return this.$store.getters['email-sender/emailDetails'];
        },
        emailTemplates() {
            return this.$store.getters['email-sender/emailTemplates'];
        },
        recipientList() {
            let list = this.$store.getters['contacts/all'].data.map(item => ({
                value: item.internalid,
                text: `${item.firstname} ${item.lastname} (${item.email})`
            }));

            list.unshift({value: -1, text: 'Progress without email'});

            return list;
        },
        tabsIndex() {
            return this.$store.getters['email-sender/functionTabs'].options
                .findIndex(item => item.name === VARS.emailSenderTabNames.EMAIL_CALLBACK);
        },
        tabs() {
            return this.$store.getters['email-sender/functionTabs'].options;
        },
        progressWithoutEmail() {
            return this.emailDetails.recipient === -1;
        }
    },
    watch: {
        'emailDetails.emailBody': function() {
            // this.$nextTick(() => {
            //     this.$refs['summernote-editor']?.reInitEditor();
            // })
        }
    }
};
</script>

<style scoped>

</style>