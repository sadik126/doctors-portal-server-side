const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;

//Doctors_admin
//a5h6P7Jzkx9NqP8W

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fzwea.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// middleware 
app.use(cors());
app.use(express.json());


async function run() {
    try {
        await client.connect();
        console.log('database connected')
        const serviceCollection = client.db('doctors_portal').collection('services')
        const bookingCollection = client.db('doctors_portal').collection('bookings')

        app.get('/service', async (req, res) => {
            const query = {};
            //shob gula niye nibo query hieseb
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services)
        })


        app.get('/available', async (req, res) => {
            const date = req.query.date;

            //get all services
            const services = await serviceCollection.find().toArray();

            //get the booking of that day
            const query = { date: date }

            const bookings = await bookingCollection.find(query).toArray()

            //for each service find bookings
            services.forEach(service => {
                //eta holo booking pailam amra for every service...mane shob booking slot
                const servicebookings = bookings.filter(b => b.treatment === service.name)

                // service.booked = servicebookings.map(s => s.slot)

                //select slots for the service booking...service e joto slots ase shob
                const booked = servicebookings.map(s => s.slot)
                //shei slots gula nao jegula booked er moddhe nai
                const available = service.slots.filter(s => !booked.includes(s))
                service.slots = available
            })
            res.send(services)
        })


        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query)
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking)

            res.send({ success: true, result });
        })

        app.get('/bookings', async (req, res) => {
            const patient = req.body.patient;
            console.log(patient)
            const query = { patient: patient }

            const bookings = await bookingCollection.find(query).toArray()

            res.send(bookings)
        })
    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('hello doctor')
})

app.listen(port, () => {
    console.log('listening the doctors server', port)
})