<template>
    <v-menu ref="dateMenu" v-model="dateMenu" :close-on-content-click="false"
            transition="scale-transition" offset-y max-width="290px" min-width="auto">

        <template v-slot:activator="{ on, attrs }">
            <v-text-field ref="dateInput" v-model="enteredDate" :prefix="prefix" :label="label" :hint="hint" dense
                          persistent-hint prepend-icon="mdi-calendar" v-bind="attrs" v-on="on"
                          :rules="[validateEnteredDate]"
                          @blur="handleEnterOnDatePicker"
                          @keyup.enter="handleEnterOnDatePicker"
            ></v-text-field>
        </template>

        <v-date-picker v-model="selectedDate" no-title scrollable show-current
                       :min="min" :max="max"
                        @input="dateMenu = false"
        ></v-date-picker>

    </v-menu>
</template>

<script>
export default {
    name: "EditableDateInput",
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
            default: 'DD/MM/YYYY format',
            required: false,
        },
        value: {
            type: String,
            default: new Date().toISOString().substring(0, 10),
            required: true,
        },
    },
    data: (vm) => ({
        dateMenu: false,
        enteredDate: vm.formatDate((new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substring(0, 10)),
    }),
    methods: {
        formatDate (date) {
            if (!date) return null

            const [year, month, day] = date.split('-')
            return `${day}/${month}/${year}`
        },
        parseEnteredDate () {
            if (typeof this.validateEnteredDate() === 'string') return null;

            const [day, month, year] = this.enteredDate.split('/');

            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        },
        validateEnteredDate() {
            const [day, month, year] = this.enteredDate.split('/');

            let dateObj = new Date(`${year}-${month}-${day}`);

            console.log(dateObj.getTime());

            return (!isNaN(dateObj.getTime()) && year.length <= 4) || 'Invalid date format. Must be DD/MM/YYYY.';
        },
        handleEnterOnDatePicker(e) {
            if (typeof this.validateEnteredDate() === 'string') return;

            this.selectedDate = this.parseEnteredDate();

            if (e.type === 'blur') return;

            this.dateMenu = false;
            this.$refs.dateInput.blur();
        },
    },
    computed: {
        selectedDate: {
            get() {
                return this.value;
            },
            set(val) {
                this.$emit('input', val);
            }
        }
    },
    watch: {
        selectedDate() {
            this.enteredDate = this.formatDate(this.selectedDate)
        },
    }
};
</script>

<style scoped>

</style>