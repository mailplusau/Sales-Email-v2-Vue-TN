<template>
    <v-card :flat="!displayOnly" :elevation="displayOnly ? 5 : 0" class="container background">
        <v-form ref="form" v-model="formValid" lazy-validation @submit.prevent="save">
            <v-row>
                <v-col lg="8" md="7" sm="6" cols="12">
                    <v-col cols="12">
                        <v-autocomplete prefix="Assigned to:"
                                        :items="$store.getters['misc/salesReps']"
                                        :rules="[v => validate(v, 'required')]"
                                        :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                        v-model="appointmentDetails.salesRepId" dense placeholder="(required)"></v-autocomplete>
                    </v-col>
                    <v-col cols="12">
                        <v-autocomplete prefix="Appointment Type:"
                                        :items="$store.getters['misc/appointmentTypes']"
                                        :rules="[v => validate(v, 'required')]"
                                        :readonly="displayOnly" :disabled="displayOnly" :hide-details="displayOnly"
                                        v-model="appointmentDetails.type" dense placeholder="(required)"></v-autocomplete>
                    </v-col>
                    <v-col cols="12">
                        <v-textarea prefix="Appointment Notes:" v-model="appointmentDetails.notes" dense
                                    placeholder="(None provided)" rows="5"
                                    :readonly="displayOnly" :disabled="displayOnly" hide-details>
                        </v-textarea>
                    </v-col>
                </v-col>
                <v-col lg="4" md="5" sm="6" cols="12">
                    <v-col cols="12">
                        <EditableDateInput v-model="appointmentDetails.date" prefix="Appointment Date:" :min="'2023-11-02'" />
                    </v-col>
                    <v-col cols="12">
                        <EditableTimeInput v-model="appointmentDetails.startTime" prefix="Start Time:" :max="appointmentDetails.endTime"
                                           :rules="[v => appointmentDetails.endTime !== appointmentDetails.startTime || 'Start time must be earlier than End time.']" />
                    </v-col>
                    <v-col cols="12">
                        <EditableTimeInput v-model="appointmentDetails.endTime" prefix="End Time:" :min="appointmentDetails.startTime"
                                           :rules="[v => appointmentDetails.endTime !== appointmentDetails.startTime || 'Start time must be earlier than End time.']" />
                    </v-col>
                </v-col>

                <v-col cols="12" class="mt-5">
                    <v-btn color="primary" large dark block elevation="7"
                           @click="save">
                        <v-icon class="mr-2">mdi-content-save-check-outline</v-icon> Save appointment
                    </v-btn>
                </v-col>
            </v-row>
        </v-form>

        <v-dialog v-model="dialog.open" max-width="450">
            <v-card class="background">
                <v-card-title class="text-h6">
                    Save appointment details?
                </v-card-title>

                <v-card-text class="subtitle-1">
                    This appointment is set for <b>{{appointmentDate}}</b> <br>
                    from <b>{{appointmentDetails.startTime}}</b> to <b>{{appointmentDetails.endTime}}</b> of the same day
                </v-card-text>

                <v-divider></v-divider>
                <v-card-actions>
                    <v-btn color="red darken-1" text @click="dialog.open = false">
                        Cancel
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="proceed">
                        Save appointment
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import {rules, VARS, allowOnlyNumericalInput} from '@/utils/utils.mjs';
import EditableDateInput from '@/components/EditableDateInput.vue';
import EditableTimeInput from '@/components/EditableTimeInput.vue';

export default {
    name: "SetAppointment",
    components: {EditableTimeInput, EditableDateInput},
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
            this.$store.dispatch('email-sender/setAppointment');
            this.dialog.open = false;
        },
        goToThis() {
            this.$store.getters['email-sender/functionTabs'].selected = this.tabsIndex + 1;
        },
    },
    computed: {
        appointmentDetails() {
            return this.$store.getters['email-sender/appointmentDetails'];
        },
        appointmentDate() {
            const options = {
                hour12: true,
                day: "numeric",
                month: "long",
                year: "numeric",
            };

            return new Intl.DateTimeFormat("en-au", options).format(new Date(this.appointmentDetails.date));
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