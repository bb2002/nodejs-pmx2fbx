const express = require("express")
const multer = require("multer")
const uuid = require("uuid4")
const path = require("path")
const conv_service = require("./service_handler")
const callback_server = require("../core/callback_handler")
const config = require("./config")
const fs = require("fs")
const router = express.Router()

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, path.join(__dirname, "/upload"))
    },
    filename(req, file, callback) {
        let arr = file.originalname.split(".")
        let extension = arr[arr.length - 1]
        let result = uuid() + "." + extension
        callback(null, result)
    }
})

const upload = multer({
    storage,
    limits: {
        files: 2,
        fileSize: 1024 * 1024 * 1024 * 100
    }
})

function write_file(req_id, fbx, xml) {
    fs.writeFile(path.join(__dirname, "../" + config.STATIC_FOLDER) +  req_id + ".fbx", fbx, (fbx_write_err) => {
        fs.writeFile(path.join(__dirname, "../" + config.STATIC_FOLDER) +  req_id + ".xml", xml, (xml_write_err) => {
            if(fbx_write_err || xml_write_err) {
                callback_server.response(req_id, false)
                console.dir("[ER] File writing error!!")
                console.dir(fbx_write_err)
                console.dir(xml_write_err)
            } else {
                callback_server.response(req_id, true)
            }
        })
    })
}

router.post("/convert", upload.fields([{name: "pmx_file", maxCount: 1}, {name: "vmd_file", maxCount: 1}]), (req, res) => {
    if(conv_service.is_working()) {
        let pmx_file = req.files.pmx_file ? req.files.pmx_file[0] : null
        let vmd_file = req.files.vmd_file ? req.files.vmd_file[0] : null

        if(pmx_file != null) {
            let req_id = pmx_file.filename.split(".")[0]
            fs.readFile(pmx_file.path, (err, pmx_data) => {
                if(err) {
                    res.render("convert.ejs", {
                        server_status: conv_service.is_working(),
                        err: err,
                        req_id: null
                    })
                } else {
                    if(vmd_file == null) {
                        res.render("convert.ejs", {
                            server_status: conv_service.is_working(),
                            req_id: req_id,
                            err: null
                        })

                        conv_service.request_convert(req_id, pmx_data, null, (is_success, fbx, xml) => {
                            if(is_success) {
                                write_file(req_id, fbx, xml)
                            } else {
                                callback_server.response(req_id, false)
                            }
                        })
                    } else {
                        fs.readFile(vmd_file.path, (err, vmd_data) => {
                            if(err) {
                                res.render("convert.ejs", {
                                    server_status: conv_service.is_working(),
                                    err: err,
                                    req_id: null
                                })
                            } else {
                                res.render("convert.ejs", {
                                    server_status: conv_service.is_working(),
                                    req_id: req_id,
                                    err: null
                                })

                                conv_service.request_convert(req_id, pmx_data, vmd_data, (is_success, fbx, xml) => {
                                    if(is_success) {
                                        write_file(req_id, fbx, xml)
                                    } else {
                                        callback_server.response(req_id, false)
                                    }
                                })
                            }
                        })
                    }
                }
            }) 
        } else {
            res.render("convert.ejs", {
                server_status: conv_service.is_working(),
                err: "Please select '.pmx' file.",
                req_id: null
            })
        }
    } else {
        res.render("convert.ejs", {
            server_status: conv_service.is_working(),
            err: "Pmx2Fbx Converter server is not working.",
            req_id: null
        })
    }
})

module.exports = router
