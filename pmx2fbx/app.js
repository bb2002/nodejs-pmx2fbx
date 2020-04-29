const express = require("express")
const config = require("./core/config")
const path = require("path")
const conv_router = require("./core/convert")
const conv_service = require("./core/service_handler")

let app = express()
app.set("views", __dirname + "/views")
app.set("view engine", "ejs")
app.use("/static", express.static(path.join(__dirname, "/static")))

app.use("/", conv_router)

app.get("/", (req, res) => {
    res.render("index.ejs", {
        server_status: conv_service.is_working()
    })
})

app.listen(config.PMX2FBX_SERVER_PORT, () => {
    console.log("[OK] Pmx2Fbx 서버 기동, 포트: ", config.PMX2FBX_SERVER_PORT)
})