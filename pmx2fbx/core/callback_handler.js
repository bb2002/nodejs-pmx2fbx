const socketio = require("socket.io")
const config = require("./config")

let io = socketio.listen(config.CALLBACK_SERVER_PORT)
let md = {}
md.callbacks = []

io.on("connection", (socket) => {
    socket.on("regist", (reqid) => {
        console.log("[RQ] " + reqid + " 의 콜백 등록")
        md.callbacks[reqid] = socket
    })
})

md.response = function(req_id, is_success) {
    let socket = md.callbacks[req_id]
    if(socket != undefined) {
        console.log("[RQ] " + req_id + " 콜백 응답")
        socket.emit("callback", {
            is_success: is_success
        })
        
        delete md.callbacks[req_id]
    }
}

console.log("[!] 콜백 서버 기동 포트: ", config.CALLBACK_SERVER_PORT)
module.exports = md