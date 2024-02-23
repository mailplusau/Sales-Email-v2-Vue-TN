<template>
    <v-card :flat="!displayOnly" :elevation="displayOnly ? 5 : 0" class="container background">
        <v-form ref="form" v-model="formValid" lazy-validation>
            <v-row>
                <v-col cols="6">
                    <v-autocomplete prefix="Recipient:"
                                    :items="recipientList"
                                    :rules="[v => validate(v, 'required', 'Recipient')]"
                                    :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                    v-model="emailDetails.recipient" dense placeholder="(required)"></v-autocomplete>
                </v-col>
                <v-col cols="6" v-if="!progressWithoutEmail">
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

                <v-col cols="12">
                    <v-btn color="green darken-1" large dark block elevation="7" @click="send">
                        <v-icon class="mr-2">mdi-email-fast-outline</v-icon> Send email
                    </v-btn>
                </v-col>
            </v-row>
        </v-form>


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
                    <v-btn color="green darken-1" text @click="$store.dispatch('email-sender/sendNormalEmail')">
                        Proceed
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import SummernoteEditor from '@/components/SummernoteEditor.vue';
import {allowOnlyNumericalInput, rules} from '@/utils/utils.mjs';

export default {
    name: "EmailTerminal",
    components: {SummernoteEditor},
    props: {
        displayOnly: {
            type: Boolean,
            default: false,
            required: false,
        }
    },
    data: () => ({
        emails: [],
        lastEmailsLength: 0,
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
        send() {
            if (!this.$refs.form.validate())
                return this.$store.commit('displayErrorGlobalModal', {title: 'Error', message: 'Please complete the email.'});

            this.dialog.title = 'Sending email';
            this.dialog.message = 'The email will be sent to the specified contact. Proceed?';
            this.dialog.open = true;
        }
    },
    computed: {
        emailDetails() {
            return this.$store.getters['email-sender/emailDetails'];
        },
        emailTemplates() {
            return this.$store.getters['email-sender/emailTemplates'];
        },
        recipientList() {
            return this.$store.getters['contacts/all'].data.map(item => ({
                value: item.internalid,
                text: `${item.firstname} ${item.lastname} (${item.email})`
            }));
        },
        progressWithoutEmail() {
            return this.emailDetails.recipient === -1;
        }
    },
};
</script>

<style scoped>

</style>