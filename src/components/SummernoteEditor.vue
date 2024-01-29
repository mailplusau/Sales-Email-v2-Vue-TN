<template>
    <textarea :name="name"></textarea>
</template>

<script>
/* eslint-disable no-undef, vue/require-valid-default-prop*/

export default {
    name: "SummernoteEditor",
    props: {
        model: {
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        config: {
            type: Object,
            default: {},
        },
    },
    mounted() {
        this._initEditor();
    },
    methods: {
        _initEditor() {
            let vm = this;
            let config = this.config;

            config.callbacks = {

                onInit: function () {
                    $(vm.$el).summernote("code", vm.model);
                },

                onChange: function () {
                    vm.$emit('change', $(vm.$el).summernote('code'));
                },

                onBlur: function () {
                    vm.$emit('change', $(vm.$el).summernote('code'));
                }
            };

            $(this.$el).summernote(config);

        },
        reInitEditor() {
            $(this.$el).summernote('destroy');

            this._initEditor();
        }
    }
};
</script>

<style>
div.note-editable {
    background: white;
}
</style>