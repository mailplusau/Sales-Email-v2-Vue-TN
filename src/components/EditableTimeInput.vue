<template>
    <v-menu ref="timeMenu" v-model="timeMenu" :close-on-content-click="false" :nudge-left="0"
            transition="scale-transition" offset-y max-width="290">

        <template v-slot:activator="{ on, attrs }">
            <v-text-field ref="timeInput" v-model="enteredTime" :prefix="prefix" :label="label" :hint="hint" dense
                          persistent-hint prepend-icon="mdi-clock-time-four-outline" v-bind="attrs" v-on="on"
                          :rules="[validateEnteredTime]"
                          @blur="handleEnteredTimeChanged"
                          @keyup.enter="handleEnteredTimeChanged"
            ></v-text-field>
        </template>

        <v-time-picker v-if="timeMenu" v-model="selectedTime" ampm-in-title format="24hr"
                       :min="min" :max="max"
                       scrollable no-title full-width @click:minute="timeMenu = false"
        ></v-time-picker>

    </v-menu>
</template>

<script>
export default {
    name: "EditableTimeInput",
    props: {
        prefix: {
            type: String,
            default: '',
            required: false,
        },
        label: {
            type: String,
            default: '',
            required: false,
        },
        min: {
            type: String,
            default: '',
            required: false,
        },
        max: {
            type: String,
            default: '',
            required: false,
        },
        hint: {
            type: String,
            default: 'HH:MM format (24 hours)',
            required: false,
        },
        value: {
            type: String,
            default: '',
            required: true,
        },
    },
    data: () => ({
        timeMenu: false,
        enteredTime: '09:00',
    }),
    methods: {
        validateEnteredTime() {
            let [strHour, strMinute] = this.enteredTime.split(':');
            let hour = parseInt(strHour);
            let minute = parseInt(strMinute);

            return (!isNaN(hour) && !isNaN(minute) && hour >= 0 && minute >= 0 && hour <= 23 && minute <= 59) ||
                'Invalid time format. Must be HH:MM (24 hours).';
        },
        parseEnteredTime() {
            if (typeof this.validateEnteredTime() === 'string') return;

            let [hour, minute] = this.enteredTime.split(':');

            return `${String.prototype.padStart.call(parseInt(hour), 2, '0')}:${String.prototype.padStart.call(parseInt(minute), 2, '0')}`
        },
        handleEnteredTimeChanged(e) {
            if (typeof this.validateEnteredTime() === 'string') return;

            this.selectedTime = this.parseEnteredTime();

            if (e.type === 'blur') return;

            this.timeMenu = false;
            this.$refs.timeInput.blur();
        },
    },
    computed: {
        selectedTime: {
            get() {
                return this.value;
            },
            set(val) {
                this.$emit('input', val);
            }
        }
    },
    watch: {
        selectedTime() {
            this.enteredTime = this.selectedTime;
        },
    }
};
</script>

<style scoped>

</style>