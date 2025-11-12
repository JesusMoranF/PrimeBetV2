const express = require('express');
const { engine } = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const port = 80;

app.engine('handlebars', engine({
layoutsDir: path.join(__dirname, '../Frontend/Layouts'),
defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../Frontend'));
app.use(express.static(path.join(__dirname, '../Public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect('mongodb+srv://ruletadiego:diegochristianjesus@cluster0.n28spxy.mongodb.net/?appName=Cluster0')
.then(() => console.log('Conexión exitosa a MongoDB Atlas'))
.catch(err => console.error('Error conectando a MongoDB:', err));

const UsuarioSchema = new mongoose.Schema({
nombre: String,
email: String,
usuario: String,
rut: { type: String, unique: true, required: true },
password: String,
fechaNacimiento: Date,
saldo: { type: Number, default: 0 },
transacciones: [
{
fecha: { type: Date, default: Date.now },
detalle: String,
monto: Number,
positivo: Boolean,
juego: String,
numeroGanador: { type: Number, default: null }
}
]
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

const RUEDA = {
0: { color: 'verde' },
1: { color: 'rojo' }, 2: { color: 'negro' }, 3: { color: 'rojo' }, 4: { color: 'negro' },
5: { color: 'rojo' }, 6: { color: 'negro' }, 7: { color: 'rojo' }, 8: { color: 'negro' },
9: { color: 'rojo' }, 10: { color: 'negro' }, 11: { color: 'negro' }, 12: { color: 'rojo' },
13: { color: 'negro' }, 14: { color: 'rojo' }, 15: { color: 'negro' }, 16: { color: 'rojo' },
17: { color: 'negro' }, 18: { color: 'rojo' }, 19: { color: 'rojo' }, 20: { color: 'negro' },
21: { color: 'rojo' }, 22: { color: 'negro' }, 23: { color: 'rojo' }, 24: { color: 'negro' },
25: { color: 'rojo' }, 26: { color: 'negro' }, 27: { color: 'rojo' }, 28: { color: 'negro' },
29: { color: 'negro' }, 30: { color: 'rojo' }, 31: { color: 'negro' }, 32: { color: 'rojo' },
33: { color: 'negro' }, 34: { color: 'rojo' }, 35: { color: 'negro' }, 36: { color: 'rojo' }
};

function generarResultado() {
    const numeroGanador = Math.floor(Math.random() * 37);
    return {
        numero: numeroGanador,
        color: RUEDA[numeroGanador].color
    };
}


function esGanadora(apuesta, resultado) {
    const { tipo, valor } = apuesta;
    const { numero, color } = resultado;


    if (tipo === 'numero') {
        return numero === valor; 
    }

 
    if (tipo === 'color') {
        return color === valor;
    }

    if (tipo === 'paridad') {
        if (numero === 0) return false; 
        const esPar = numero % 2 === 0;
        if (valor === 'par') return esPar;
        if (valor === 'impar') return !esPar;
    }

 
    if (tipo === 'grupo') {
        if (numero === 0) return false;
        if (valor === 'bajo' && numero >= 1 && numero <= 18) return true;
        if (valor === 'alto' && numero >= 19 && numero <= 36) return true;
    }

  
    if (tipo === 'docena') {
        if (numero === 0) return false;
        if (valor === 1 && numero >= 1 && numero <= 12) return true;
        if (valor === 2 && numero >= 13 && numero <= 24) return true;
        if (valor === 3 && numero >= 25 && numero <= 36) return true;
    }

   
    if (tipo === 'columna') {
        if (numero === 0) return false;
        if (valor === 1 && numero % 3 === 1) return true;
        if (valor === 2 && numero % 3 === 2) return true;
        if (valor === 3 && numero % 3 === 0) return true;
    }

    return false;
}


function calcularGananciasTotales(apuestas, resultado) {
    let gananciaNeta = 0; 
    let detallesTransaccion = [];


    const PAGOS = {
        'numero': 35,
        'color': 1,
        'paridad': 1,
        'grupo': 1,
        'docena': 2,
        'columna': 2
    };

    apuestas.forEach(apuesta => {
    const pagoRatio = PAGOS[apuesta.tipo] || 0; 
    const detalle = `$${apuesta.monto.toLocaleString('es-CL')} a ${apuesta.tipo}: ${apuesta.valor}`;
    
    if (esGanadora(apuesta, resultado)) {

        const gananciaPura = apuesta.monto * pagoRatio;
        gananciaNeta += gananciaPura;
        detallesTransaccion.push(`${detalle} Gana (+${gananciaPura.toLocaleString('es-CL')})`);
    } else {

        gananciaNeta -= apuesta.monto; 
        detallesTransaccion.push(`${detalle} Pierde (-${apuesta.monto.toLocaleString('es-CL')})`);
    }
});

    return {
        gananciaNeta: gananciaNeta, 
        detalleCompleto: detallesTransaccion.join(' | ')
    };
}


app.get('/', (req, res) => res.redirect('Inicio'));
app.get('/Login', (req, res) => res.render('Login'));
app.get('/Registro', (req, res) => res.render('Registro'));
app.get('/Recuperarc', (req, res) => res.render('Recuperarc'));
app.get('/Inicio', (req, res) => res.render('Inicio'));
app.get('/Info', (req, res) => res.render('Info'));
app.get('/Info_ruleta', (req, res) => res.render('Info_ruleta'));

app.post('/register', async (req, res) => {
const { nombre, email, usuario, password, repassword, birthdate, rut } = req.body;

if (password !== repassword) {
return res.render('Registro', { error: 'Las contraseñas no coinciden' });
}

try {
const existe = await Usuario.findOne({ rut });
if (existe) {
return res.render('Registro', { error: 'El RUT ya se encuentra registrado' });
}

const hashedPassword = await bcrypt.hash(password, 10);
const nuevoUsuario = new Usuario({
nombre,
email,
usuario,
rut,
password: hashedPassword,
fechaNacimiento: birthdate,
saldo: 0,
transacciones: []
});

await nuevoUsuario.save();
res.render('Login', { success: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.' });
} catch (err) {
console.error('Error en registro:', err);
res.render('Registro', { error: 'Error al registrar el usuario.' });
}
});

app.post('/login', async (req, res) => {
const { rut, password } = req.body;

try {
const user = await Usuario.findOne({ rut });
if (!user) return res.render('Login', { error: 'RUT no encontrado' });

const match = await bcrypt.compare(password, user.password);
if (!match) return res.render('Login', { error: 'Contraseña incorrecta' });
res.cookie('rut', user.rut, { httpOnly: false });
res.redirect('/Perfil');
} catch (err) {
console.error('Error en login:', err);
res.render('Login', { error: 'Error interno del servidor' });
}
});

app.get('/Perfil', async (req, res) => {
    try {
        const userRut = req.cookies.rut;
        if (!userRut) return res.redirect('/Login');

        const usuario = await Usuario.findOne({ rut: userRut });
        if (!usuario) return res.render('Login', { error: 'Usuario no encontrado' });

        const dateOptions = {
            timeZone: 'America/Santiago',
            hour12: true,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const transaccionesMonetarias = usuario.transacciones.filter(t => t.juego !== 'ruleta');
        const transaccionesApuestas = usuario.transacciones.filter(t => t.juego === 'ruleta');
        const ultimasTransacciones = transaccionesMonetarias
            .slice(-5)
            .reverse()
            .map(t => ({
                fecha: new Date(t.fecha).toLocaleString('es-CL', dateOptions),
                detalle: t.detalle || 'Sin detalle',
                monto: t.monto?.toLocaleString('es-CL') || 0,
                positivo: t.positivo
            }));
        const ultimasApuestas = transaccionesApuestas
            .slice(-5)
            .reverse()
            .map(t => ({
                fecha: new Date(t.fecha).toLocaleString('es-CL', dateOptions),
                detalle: t.detalle || 'Sin detalle',
                monto: t.monto?.toLocaleString('es-CL') || 0,
                positivo: t.positivo
            }));

        res.render('Perfil', {
            nombre: usuario.nombre,
            usuario: usuario.usuario,
            email: usuario.email,
            fechaNacimiento: usuario.fechaNacimiento
                ? usuario.fechaNacimiento.toLocaleDateString('es-CL')
                : 'No registrada',
            saldo: usuario.saldo.toLocaleString('es-CL'),
            transacciones: ultimasTransacciones,
            apuestas: ultimasApuestas
        });
    } catch (err) {
        console.error('Error al cargar perfil:', err);
        res.render('Login', { error: 'Error interno del servidor.' });
    }
});
function inferirColorNumero(numero){
    return RUEDA[numero]?.color||'';
}
app.get('/Ruleta',async(req,res)=>{
    const userRut=req.cookies.rut;
    if(!userRut){
        return res.redirect('/Login');
    }
    try{
        const usuario=await Usuario.findOne({rut:userRut});
        if(!usuario){
            return res.redirect('/Login');
        }
        
        const transaccionesDeRuleta=usuario.transacciones.filter(t=>t.juego==='ruleta').slice(-5).reverse();
        
        const historialRondas = transaccionesDeRuleta.map(t => {
            const estado = t.positivo ? 'GANÓ' : 'PERDIÓ';
            const signo = t.positivo ? '+' : '-';

            const detalleLimpio = t.detalle.split('|').map(s => {
                return s.replace(/\s(Gana|Pierde)\s\(\S+\)$/g, '').trim();
            }).join(' | ');

            const netoLimpio = `${estado}: ${signo}$${t.monto.toLocaleString('es-CL')}`;


            return {
                apuestaDetalle: detalleLimpio,
                numeroGanador: t.numeroGanador,
                colorGanador: inferirColorNumero(t.numeroGanador),
                montoNeto: netoLimpio,
                positivo: t.positivo
            };
        });

        while(historialRondas.length<5){
            historialRondas.push({});
        }

        res.render('Ruleta',{
            saldo:usuario.saldo.toLocaleString('es-CL'),
            historial: historialRondas,
            saldoSinFormato: usuario.saldo
        });
    }catch(error){
        console.error('Error al cargar la ruleta:',error);
        return res.redirect('/Login');
    }
});

app.post('/apuesta', async (req, res) => {
    const userRut = req.cookies.rut;
    const { apuestas } = req.body;
    let usuario; 

    if (!userRut) return res.status(401).json({ error: 'Usuario no autenticado' });
    if (!apuestas || apuestas.length === 0) return res.status(400).json({ error: 'No se encontraron apuestas.' });

    let totalApostado = apuestas.reduce((sum, a) => sum + a.monto, 0);

    try {
        usuario = await Usuario.findOne({ rut: userRut });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        if (totalApostado <= 0) {
            return res.status(400).json({ error: 'Monto de apuesta total inválido' });
        }
        if (totalApostado > usuario.saldo) {
            return res.status(400).json({ error: 'Saldo insuficiente para la suma de las apuestas.' });
        }

        const resultado = generarResultado();

        const { gananciaNeta, detalleCompleto } = calcularGananciasTotales(apuestas, resultado);
        
        const nuevoSaldo = usuario.saldo + gananciaNeta;
        const positivo = gananciaNeta >= 0;

        usuario.saldo = nuevoSaldo;

        usuario.transacciones.push({
            detalle: detalleCompleto,
            monto: Math.abs(gananciaNeta),
            positivo: positivo,
            juego: 'ruleta',
            numeroGanador: resultado.numero
        });

        await usuario.save();

        res.json({
    success: true,
    resultado: {
        numero: resultado.numero,
        color: resultado.color
    },
    gananciaNeta: gananciaNeta,
    saldo: nuevoSaldo.toLocaleString('es-CL'),
    nuevoSaldo: nuevoSaldo,
    detalle: detalleCompleto
});

    } catch (err) {
        console.error('Error al procesar la apuesta:', err);
        res.status(500).json({ error: 'Error interno del servidor al procesar la apuesta', saldo: usuario?.saldo?.toLocaleString('es-CL') });
    }
});

app.get('/Deposito', async (req, res) => {
try {
const userRut = req.cookies.rut;
if (!userRut) return res.redirect('/Login');

const usuario = await Usuario.findOne({ rut: userRut });
if (!usuario) return res.redirect('/Login');

res.render('Deposito', {
saldo: usuario.saldo.toLocaleString('es-CL')
});
} catch (err) {
console.error('Error al cargar depósito:', err);
res.render('Deposito', { saldo: 0, error: 'Error cargando saldo' });
}
});

app.post('/Deposito', async (req, res) => {
try {
const userRut = req.cookies.rut;
const { monto } = req.body;
const usuario = await Usuario.findOne({ rut: userRut });
if (!usuario) return res.redirect('/Login');

const montoNum = Number(monto);
if (isNaN(montoNum) || montoNum <= 0) {
return res.render('Deposito', { saldo: usuario.saldo, error: 'Monto inválido' });
}

usuario.saldo += montoNum;
usuario.transacciones.push({
detalle: `Depósito de $${montoNum}`,
monto: montoNum,
positivo: true
});

await usuario.save();
res.redirect('/Perfil');
} catch (err) {
console.error('Error al realizar depósito:', err);
res.render('Deposito', { saldo: 0, error: 'Error interno del servidor' });
}
});

app.get('/Retiro', async (req, res) => {
try {
const userRut = req.cookies.rut;
if (!userRut) return res.redirect('/Login');

const usuario = await Usuario.findOne({ rut: userRut });
if (!usuario) return res.redirect('/Login');

res.render('Retiro', {
saldo: usuario.saldo.toLocaleString('es-CL')
});
} catch (err) {
console.error('Error al cargar retiro:', err);
res.render('Retiro', { saldo: 0, error: 'Error cargando saldo' });
}
});

app.post('/Retiro', async (req, res) => {
try {
const userRut = req.cookies.rut;
const { monto } = req.body;
const usuario = await Usuario.findOne({ rut: userRut });
if (!usuario) return res.redirect('/Login');

const montoNum = Number(monto);
if (isNaN(montoNum) || montoNum <= 0 || montoNum > usuario.saldo) {
return res.render('Retiro', {
saldo: usuario.saldo.toLocaleString('es-CL'),
error: 'Monto inválido o insuficiente'
});
}

usuario.saldo -= montoNum;
usuario.transacciones.push({
detalle: `Retiro de $${montoNum}`,
monto: montoNum,
positivo: false
});

await usuario.save();
res.redirect('/Perfil');
} catch (err) {
console.error('Error al realizar retiro:', err);
res.render('Retiro', { saldo: 0, error: 'Error interno del servidor' });
}
});

app.post('/transaccion', async (req, res) => {
try {
const userRut = req.cookies.rut;
const { detalle, monto, positivo } = req.body;

const usuario = await Usuario.findOne({ rut: userRut });
if (!usuario) return res.status(404).send('Usuario no encontrado');

const montoNum = Number(monto);
usuario.transacciones.push({
detalle,
monto: montoNum,
positivo: positivo === 'true'
});

if (positivo === 'true') {
usuario.saldo += montoNum;
} else {
usuario.saldo -= montoNum;
}

await usuario.save();
res.redirect('/Perfil');
} catch (err) {
console.error('Error al registrar transacción:', err);
res.status(500).send('Error al registrar transacción');
}
});

app.get('/logout', (req, res) => {
res.clearCookie('rut');
res.redirect('/Inicio');
});

app.listen(port, () => {
console.log(`Servidor corriendo en http://localhost:${port}`);
console.log('Vistas configuradas en:', path.join(__dirname, '../Frontend'));
});

