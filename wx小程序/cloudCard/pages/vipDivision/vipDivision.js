var request = require('../../utils/https.js');
var app = getApp();

var loadMsgData = function (that, userName, dataToken) {
  that.setData({
    hidden: false
  });
  request.req('ApiMember/SetUserName', {
    userName: userName,
    token: dataToken
  }, function (r) {
    if (r.data.ErrorCode == 0) {

    } else {
      that.show(r.data.ErrorMsg)
    }
  });
};
Page({
  data: {

  },
  onLoad(options) {
    new app.ToastPannel();
    var that = this;
    if (options.name){
      wx.setNavigationBarTitle({
        title: options.name
      });
    }
  },
  GoMeal(){
    wx.navigateTo({
      url: '../setMeal/setMeal'
    })
  },
  onShareAppMessage(ops) {
    var that = this;
    // if (ops.from === 'button') {
    //   // 来自页面内转发按钮
    //   console.log(ops.target)
    // }
    return {
      title: '卡商城',
      path: 'pages/index/index',
      success: function (res) {
        console.log(res);
      },
      fail: function (res) {
        console.log(res);
      }
    }
  }
})