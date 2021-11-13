const express = require('express');
const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gvodb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object

});


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split('Bearer ')[1];


        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('apartment_skyline');
        const apartmentCollection = database.collection('apartments');
        const customerCollection = database.collection('customers_data');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');

        // GET apartments API
        app.get('/apartments', async (req, res) => {
            const cursor = apartmentCollection.find({});
            const apartments = await cursor.toArray();
            res.send(apartments);
        });

        // GET email based
        app.get('/customers_data', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = customerCollection.find(query);
            const customerApartments = await cursor.toArray();
            res.json(customerApartments);
        })

        // Get Single Apartment API
        app.get('/apartments/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const apartment = await apartmentCollection.findOne(query);
            res.send(apartment);
        });

        // Post Customer Data API
        app.post('/customers_data', async (req, res) => {
            const customer = req.body;
            const result = await customerCollection.insertOne(customer);
            console.log(result);
            res.json(result)
        })

        // GET Admin Checking API
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email)
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })

        })

        // POST User API
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        })

        // GET Reviews API
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // POST Add Property API
        app.post('/apartments', async (req, res) => {
            const property = req.body;
            console.log(property);
            const result = await apartmentCollection.insertOne(property);
            res.json(result);
        })

        // POST Reviews API
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(review);
            const result = await reviewsCollection.insertOne(review);
            console.log(result);
            res.json(result);
        })

        // PUT Admin API
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requestAccount = await usersCollection.findOne({ email: requester });
                if (requestAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'Your do not have access to make admin' })
            }


        })

        // DELETE API
        app.delete('/customers_data/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await customerCollection.deleteOne(query);
            res.json(result);
        })

    }
    finally {
        // client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello Apartment Skyline')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})