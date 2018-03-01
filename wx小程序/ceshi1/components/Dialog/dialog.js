// components/Dialog/dialog.js

Component({
    options: {
        multipleSlots: true
    },

    properties: {
        title: {
            type: String,
            value: '标题'
        },
        content: {
            type: String,
            value: '弹窗内容'
        },
        cancelText: {
            type: String,
            value: '取消'
        },
        confirmText: {
            type: String,
            value: '确定'
        }
    },

    data: {
        isShow: false
    },

    methods: {
        hideDialog: function(){
            this.setData({
                isShow: !this.data.isShow
            });
        },
        showDialog: function(){
            this.setData({
                isShow: !this.data.isShow
            });
        },
        _cancelEvent: function(){
            this.triggerEvent('cancelEvent')
        },
        _confirmEvent: function(){
            this.triggerEvent('confirmEvent')
        }
    }
})