<template>
    <v-autocomplete
        :label="label"
        id="decoy"
        v-model="autocompleteLocationModel"
        :items="locationFoundItems"
        :search-input.sync="locationSearchText"
        item-text="value"
        item-value="id"
        hide-no-data
        return-object
        :dense="dense"
        :clearable="clearable"
        :rules="rules"
    >
    </v-autocomplete>
</template>

<script>
export default {
    name: "VuetifyGoogleAutocomplete",
    props: {
        label: {
            type: String,
            default: 'Location'
        },
        dense: {
            type: Boolean,
            default: false,
        },
        clearable: {
            type: Boolean,
            default: false,
        },
        rules: {
            type: Array,
            default: null,
        }
    },
    data: () => ({
        autocompleteLocationModel: null,
        locationSearchText: null,
        locationEntries: [],
    }),
    methods: {
        setInput(newVal) {
            this.getSuggestions(newVal)
                .then(res => {
                    this.locationEntries = res;
                    if (res?.length) this.autocompleteLocationModel = res[0];
                })
                .catch(function(err) { console.log(err); });
        },
        clearInput() {
            this.autocompleteLocationModel = null;
        },
        async getSuggestions(searchText) {
            let result

            try {
                const rawResult = await this.searchLocation(searchText)
                result = rawResult.map((res) => {
                    return {
                        id: res.place_id,
                        value: res.description
                    }
                })
            } catch (err) {
                console.log('An error occurred', err)
                result = null
            }
            return result
        },
        async searchLocation(val) {
            return await new Promise((resolve, reject) => {
                let displaySuggestions = (predictions, status) => {
                    if (status !== google.maps.places.PlacesServiceStatus.OK) {
                        reject(status)
                    }
                    resolve(predictions)
                }

                let service = new google.maps.places.AutocompleteService()
                service.getPlacePredictions({
                        input: val,
                        types: [],
                        componentRestrictions: {
                            country: 'au'
                        }
                    },
                    displaySuggestions)
            }).catch(function (err) {
                throw err
            })
        },
    },
    computed: {
        locationFoundItems() {
            return this.locationEntries;
        },
    },
    watch: {
        autocompleteLocationModel(newVal) {
            if (!newVal?.id) {
                this.$emit("placeChanged", null);
                return;
            }

            let placeResult = new google.maps.places.PlacesService(document.getElementById("decoy"));

            placeResult.getDetails({placeId: newVal.id},
                (x) => {
                    this.$emit("placeChanged", x);
                }
            );
        },
        locationSearchText(newVal) {
            let _vue = this;

            // Call the method from the previous section here
            this.getSuggestions(newVal)
                .then(function(res) {
                    _vue.locationEntries = res;
                })
                .catch(function(err) {
                    // error handling goes here
                    console.log(err);
                });
        },
    },
};
</script>

<style scoped>

</style>