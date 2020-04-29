const socketio = require("socket.io")
const config = require("./config")
const fs_extra = require("fs-extra")
const path = require("path")

let io = socketio.listen(config.CONVERTER_SERVER_PORT)
let md = {}
md.request_callback = []

io.on("connection", (socket) => {
    console.log("[OK] Pmx2Fbx 서버 접속 성공")
    fs_extra.removeSync(path.join(__dirname + "/../upload"))
    fs_extra.mkdir(path.join(__dirname + "/../upload"))

    md.socket = socket

    socket.on("convert_ok", (response) => {
        let callback = md.request_callback[response.req_id]
        if(callback != undefined) {
            setTimeout(() => {
                if(response.success) {
                    // 성공
                    callback(true, response.fbx, response.xml)
                    console.log("[RS] " + response.req_id + " 응답 성공")
                } else {
                    // 실패
                    callback(false, null, null)
                    console.log("[RS] " + response.req_id + " 응답 오류")
                }
            }, 3000)
        }

        delete  md.request_callback[response.req_id]
    })
})

// 컨버트를 요청 한다.
md.request_convert = function(req_id, pmx_data, vmd_data, callback) {
    md.socket.emit("convert", {
        pmx: pmx_data,
        vmd: vmd_data,
        req_id: req_id
    })

    md.request_callback[req_id] = callback
    console.log("[RQ] " + req_id + " 요청 됨.")
}

// 컨버트가 가능한 상태인지 쿼리 한다.
md.is_working = function() {
    if(md.socket != undefined && md.socket.connected) {
        return true
    } else {
        return false
    }
}

console.log("[!] Pmx2Fbx 서비스 서버 접속 대기 중... 포트: ", config.CONVERTER_SERVER_PORT)

module.exports = md