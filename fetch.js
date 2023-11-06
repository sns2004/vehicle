const express = require("express");
const cors = require("cors");
const twilio = require('twilio');
const { MongoClient } = require("mongodb");
const accountSid = 'AC8a81dbd914e2948549932927c86f051d';
const authToken = 'e327de71047601a49f3440f2d3a78527';
const tclient = twilio(accountSid, authToken);
const app = express();
const port = process.env.PORT || 5000;
const uri =
  "mongodb+srv://Shanjaidb:SnsKumaar@shanjai.5di3hqn.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

// Connect to MongoDB outside the route handler
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();
async function checkFitnessAndSendSMS(collectionName) {
  try {
    const database = client.db("User");
    const collection = database.collection(`${collectionName}`);
    const records = await collection.find({}).toArray();
  

    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    await Promise.all(records.map(async (record) => {
      const fitnessDate = new Date(record.Fitness);

     
      const lastNotificationDate = record.LastNotificationDate || new Date(0);
       
        if (fitnessDate <= twoWeeksFromNow && today - lastNotificationDate >= 24 * 60 * 60 * 1000) {
          const remainingDays = Math.floor((fitnessDate - today) / (24 * 60 * 60 * 1000));

        
          await collection.updateOne(
            { _id: record._id },
            { $set: { LastNotificationDate: today } }
          );
   
          tclient.messages.create({
          body: `Your fitness for Vehicle No: ${record.Vehicle_No} is ending in ${remainingDays} days. Renew it soon!`,
          from: +19177460649,
          to: record.Phone_No,
        });
      tclient.calls.create({
          twiml: `<Response><Say>HELLO ${record.Owner_Name},I AM CALLING FROM SNS DRIVING SCHOOL YOUR VEHICLE NUMBER ${record.Vehicle_No} FITNESS IS GOING TO END IN ${remainingDays} days PLEASE UPGRADE IT.</Say></Response>`,
          to:record.Phone_No,
          from: +19177460649,
        });
    
        console.log(`Call and SMS initiated for record with Vehicle No: ${record.Vehicle_No}`);

      }
      }
    
  ));} catch (error) {
    console.error("Error checking fitness and sending SMS:", error);
  }
}


app.post('/api/storeProduct', async (req, res) => {
  try {
    const product  = req.body;
    const {collectionName}=req.query;
   
    const database = client.db("User");
    const collection1 = database.collection(`${collectionName}`);
    const result = await collection1.insertOne(product);

    res.json({ message: 'Product stored successfully.', insertedCount: result.insertedCount });
  } catch (error) {
    console.error('Error:', error);
   
  }
});
app.put('/update',async(req,res)=>{
  try{
  
    const { collectionName } = req.query;
  const product = req.body;
  const database = client.db("User");
  const collection1 = database.collection(`${collectionName}`);
  const result = await collection1.updateOne({ _id: product._id }, { $set: product });
  res.json({ message: 'Product updated successfully.'});}
  catch(error){
    console.error('Error:',error);
  }
 
})
app.delete('/api/deleteVehicle/:id', async (req, res) => {
  
  try {
    const { collectionName } = req.query;
    const id = req.params.id;
    const result = await client.db("User").collection(`${collectionName}`).deleteOne({ _id:id });

    if (result.deletedCount === 1) {
      res.json({ message: 'Vehicle deleted successfully' });
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    console.error(error);
    
  }
});
async function getRecords(collectionName) {
  try {
    const database = client.db("User");
    const collection = database.collection(`${collectionName}`);
    const records = await collection.find({}).toArray();
    return records;
  } catch (error) {
    console.error("Error fetching records:", error);
    throw error;
  }
}
app.get("/records", async (req, res) => {
  try {
    const { collectionName } = req.query;
   
   
    if (!collectionName) {
      res.status(400).json({ error: "collectionName is missing or empty" });
      return;
    }
    checkFitnessAndSendSMS(collectionName);
    
   
    const records = await getRecords(`${collectionName}`);
    res.json(records);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
