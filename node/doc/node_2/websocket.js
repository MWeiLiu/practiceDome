var ws = require("nodejs-websocket");
console.log("开始建立连接...")

var game1 = null,game2 = null , game1Ready = false , game2Ready = false, user = 0;
var server = ws.createServer(function(conn){
    user++;
    console.log(user)
    conn.on("text", function (str) {
        console.log("收到的信息为:"+str)
        if(str==="game1"){
            game1 = conn;
            game1Ready = true;
            conn.sendText("success");
        }
        if(str==="game2"){
            game2 = conn;
            game2Ready = true;
        }

        if(game1Ready&&game2Ready){
            game2.sendText(str);
        }

        conn.sendText(str)
    });
    conn.on("close", function (code, reason) {
        console.log(code)
        console.log(reason)
        console.log("关闭连接")
    });
    conn.on("error", function (code, reason) {
        console.log("异常关闭")
    });
}).listen(8001)
console.log("WebSocket建立完毕")