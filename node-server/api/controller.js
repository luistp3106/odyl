const express = require('express');
const router = express.Router();
const logic = require("../services/logic");
const models = require("../models/index");
const nodemailer = require('nodemailer');
const crypto = require('../security/crypto');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'odylscollection@gmail.com',
        pass: 'odyls809'
    }
});
let mailOptions = {
    from: 'Odyls Collection ans Salon <odylscollection@gmail.com>',
    to: 'odylscollection@gmail.com, luistp3101@gmail.com,alejandratrinidad@live.com',
    // to: 'edison22_1997@live.com',
    subject: '',
    html: ''
};


router.post("/sendMail", async (req, res) => {
    try {
        let {form} = req.body;
        let m = logic.noPointer(mailOptions);
        m.subject = `Mensaje de "${form.nombre.toUpperCase()}"`;
        m.html = `Nombre completo: <b>${form.nombre.toUpperCase()}</b><br>
                    E-mail: <b>${form.email.toLowerCase()}<br></b>
                    Mensaje: ${form.mensaje.toLowerCase()}
                    `;
        transporter.sendMail(m, async function (error, info) {
            if (error) {
                res.json({status: false, message: 'Ha ocurrido un error en el proceso'});
            } else {
                res.json({status: true});
            }
        });
    } catch (e) {
        console.log(e);
        res.json({status: false, message: 'Ha ocurrido un error en el proceso'});
    }
});

router.post("/manageFormulario", async (req, res) => {
    try {
        let {form} = req.body;
        let finalDate = new Date(form.date), initialDate = new Date(form.date);
        finalDate.setMinutes(finalDate.getMinutes() + 29);
        let countCabello = await models.cita.count({
            where: models.Sequelize.literal(`('${initialDate.toISOString()}'::timestamp with time zone between fecha_inicio and fecha_fin or '${finalDate.toISOString()}'::timestamp with time zone between fecha_inicio and fecha_fin) and tipo_cita = 'Área de Cabello'`)
        });
        let countUnias = await models.cita.count({
            where: models.Sequelize.literal(`('${initialDate.toISOString()}'::timestamp with time zone between fecha_inicio and fecha_fin or '${finalDate.toISOString()}'::timestamp with time zone between fecha_inicio and fecha_fin) and tipo_cita = 'Área de Uñas'`)
        });
        let countColores = await models.cita.count({
            where: models.Sequelize.literal(`('${initialDate.toISOString()}'::timestamp with time zone between fecha_inicio and fecha_fin or '${finalDate.toISOString()}'::timestamp with time zone between fecha_inicio and fecha_fin) and tipo_cita = 'Técnicas de Colores'`)
        });
        if (countCabello + countUnias + countColores >= 3) res.json({status: false, message: `No se puede realizar una cita a esta hora debido a que no hay disponibilidad`});
        else if (countCabello >= 2 && form.area === "Área de Cabello") res.json({status: false, message: `No se puede realizar una cita a esta hora debido a que no hay disponibilidad`});
        else if (countUnias >= 1 && form.area === "Área de Uñas") res.json({status: false, message: `No se puede realizar una cita a esta hora debido a que no hay disponibilidad`});
        else if (countColores >= 1 && form.area === "Técnicas de Colores") res.json({status: false, message: `No se puede realizar una cita a esta hora debido a que no hay disponibilidad`});
        else{
            await models.cita.create({
                nombre_paciente: form.nombre,
                fecha_inicio: initialDate,
                fecha_fin: finalDate,
                tipo_cita: form.area
            });
            await models.formulario.create({json: form});
            let m = logic.noPointer(mailOptions);
            m.subject = `Formulario de "${form.nombre.toUpperCase()}"`;
            let cita = new Date(form.date);
            m.html = `Nombre completo: <b>${form.nombre.toUpperCase()}</b><br>
                      Servicio a Realizarse: <b>${form.servicio.toUpperCase()}</b><br>
                      Modalidad: <b>${form.modalidad.toUpperCase()}</b><br>
                      Área: <b>${form.area.toUpperCase()}</b><br>
                      E-mail: <b>${form.email.toLowerCase()}<br></b>
                      Teléfono: <b>${form.telefono.toLowerCase()}<br></b>
                      Fecha y hora de la cita: <b>${form.fechaEnString}<br></b>
                    `;

            transporter.sendMail(m, async function (error, info) {
                if (error) {
                    console.log(error);
                    res.json({status: false, message: 'Ha ocurrido un error en el proceso'});
                } else {
                    let m = logic.noPointer(mailOptions);
                    m.subject = `Cita Odyls Collection and Salon`;
                    m.to = form.email;
                    m.html = `
				Hola ${form.nombre.toUpperCase()}	Gracias por ser Parte de nuestra familia, en Odyl’s estamos comprometidos con el bienestar de tu cabello y tu salud!</br></b></br>
                    Estamos tomando medidas para tu seguridad y la nuestra. Al asistir a tu cita es de carácter obligatorio que uses mascarilla. En el local, tenemos alcohol en gel para tu uso, recuerda, esto es una responsabilidad de todos.</br></b></br>

                    Recuerda Tu Cita del <b>${form.fechaEnString}<br></b>
                    Servicios a realizarte: <b>${form.servicio.toUpperCase()}</b><br>
<br><br>
                    Para depósitos tenemos las siguientes cuentas:</br></b></br>
                      <ul>
                            <li>Banco Popular Dominicano - 801514258</li>
                            <li>Banreservas – 1202231262</li>
                            <li>Ambas a nombre de Luis Trinidad</li>
                        </ul>
                        </br>
                        Nos puedes contactar por <strong>WhatsApp: 809-431-0948 o llamarnos al 829-872-0444</strong>

                        </br></br>
                       <p style="align-text:justify"> <strong>Recuerda ser puntual con tu cita, te esperamos. Gracias por preferirnos </strong></br></b>
                    </p>`;
                    transporter.sendMail(m, async function (error, info) {
                        if (error) {
                            res.json({
                                status: true,
                                message: `Cita creada exitósamente. ${form.modalidad === 'Online' ? `Sin embargo, el correo suministrado es inválido, no recibirá su correo de confirmación` : ''}`
                            });
                        } else {
                            res.json({status: true});
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.log(e);
        res.json({status: false, message: 'Ha ocurrido un error en el proceso'});
    }
});

router.post("/login", async (req, res) => {
    try {
        let {username, password} = req.body;
        if (logic.compare(username) && logic.compare(password) && typeof username === "string" && typeof password === "string") {
            let uss = await models.usuario.findOne({where: {nombre_usuario: username.trim().toLowerCase()}});
            if (logic.compare(uss)) {
                let cPass = crypto.decrypt(uss.password);
                if (cPass === password) {
                    res.json({
                        status: true,
                        token: crypto.encrypt(JSON.stringify({...logic.noPointer(uss), offTime: new Date()}))
                    });
                } else res.json({status: false, message: 'Credenciales inválidas'});
            } else res.json({status: false, message: 'Credenciales inválidas'});
        } else res.json({status: false, message: 'Credenciales inválidas'});
    } catch (e) {
        console.log(e);
        res.json(null);
    }
});

// router.post("/encode", async (req, res) => {
// res.json(crypto.encrypt(req.body.text));
// });

// router.post("/decode", async (req, res) => {
// res.json(crypto.decrypt(req.body.text));
// });

try {
    (async function f() {
        let count = await models.usuario.count({where: {nombre_usuario: 'jp22'}});
        if (count === 0) {
            await models.usuario.create({
                nombre: 'Julio Edison',
                apellido: 'Pérez Arias',
                nombre_usuario: 'jp22',
                email: 'usuario@prueba.com',
                password: '45e02403632cab7cb2658f9984c9a7c6:f41f5de189589c7437680c01dd1236e6b59c4f520c0ef46132b0db1a8d821dd5'
            });
        }
        count = await models.usuario.count({where: {nombre_usuario: 'luis'}});
        if (count === 0) {
            await models.usuario.create({
                nombre: 'Luis',
                apellido: 'Trinidad',
                nombre_usuario: 'luis',
                email: 'doesntmatter@prueba.com',
                password: 'b1663c90335d3667d702b695b4cca944:dc1b7a0514a4cd476f2e851ded8ddcfc6688c05f1f1eafc8bcc32a8c2c1b0669'
            });
        }
        count = await models.usuario.count({where: {nombre_usuario: 'alejandra'}});
        if (count === 0) {
            await models.usuario.create({
                nombre: 'Alejandra',
                apellido: 'Trinidad',
                nombre_usuario: 'alejandra',
                email: 'noimporta@prueba.com',
                password: 'c9c89d2d43a48a0bbbda6e2de4447998:be8bb1136ddefad59906107162e7af9a'
            });
        }
    })();
} catch (e) {
    console.log(e);
}

module.exports = {
    router: router,
    func: function (io1) {

    }
};
