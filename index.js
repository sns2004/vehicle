var express =require("express");
var cors=require("cors");
const twilio = require('twilio');
const bodyParser = require('body-parser');
var {MongoClient,ObjectId}= require("mongodb");


var path=require("path");
// const { Console } = require("console");
const accountSid = 'AC8a81dbd914e2948549932927c86f051d';
const authToken = 'e327de71047601a49f3440f2d3a78527';
const tclient = twilio(accountSid, authToken);
const app=express();
const port = process.env.PORT || 5000;
const uri =
  "mongodb+srv://Shanjaidb:SnsKumaar@shanjai.5di3hqn.mongodb.net/?retryWrites=true&w=majority";
app.use(cors());
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const client=new MongoClient (uri,{useNewUrlParser: true, useUnifiedTopology: true});
async function mongoconnect(){
  try{
    await client.connect();
    console.log("connected to db");
  }
  catch(error){
    console.error("Error :",error );
  }
}
app.post('/hello',(req,res)=>{
  document.write("Machan Vanakam da");
})
app.post('/signups',async (req,res)=>{
  try{
    const user = req.body;
    const database= client.db("User");
    const  collection1=database.collection("userdetails");
    const existingUser = await collection1.findOne({ email: user.email });

   
    if (existingUser) {
      res.json({ message: 'Email already exists.' });
     
    } else {
      const result = await collection1.insertOne(user);
      const newdb= await database.createCollection(user.email);
      res.json({ message: 'Registered successfully.', insertedCount: result.insertedCount });
    }
  }
  catch(error){
    console.log("Error : ",error);
  }
});
app.post('/logins', async (req, res) => {
  const { email, password } = req.body;
  const database = client.db("User");
  const collection1 = database.collection("userdetails");

  try {
    const user = await collection1.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.json({ message: 'User not found' });
    }

    if (user.password === password) {
      
      return res.json({ message: 'Login successful', userData: user });
    } else {
      console.log("Incorrect password");
      return res.json({ error: 'Incorrect password' });
    }
  } catch (err) {
    console.log('Error finding user:', err);
    return res.json({ error: 'Internal server error' });
  }
});

app.get('/userdata', async (req, res) => {
  try {
    const database = client.db("User");
    const collection1 = database.collection("userdetails");

    const userData = await collection1.find().toArray();

    if (userData.length === 0) {
      return res.json({ message: 'No data found' });
    }


    res.json({ message: 'Data retrieved successfully', userData });
  } catch (error) {
    console.log('Error retrieving data:', error);
    res.json({ error: 'Error retrieving data' });
  }
});
async function checkFitnessAndSendSMS(Message,Call,Whatsapp,Email) {
  try {
    const database = client.db("User");
    const collection = database.collection(Email);
    const records = await collection.find({}).toArray();
  

    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    await Promise.all(records.map(async (record) => {
      const fitnessDate = new Date(record.result.fit_up_to);
      const InsuranceDate = new Date(record.result.insurance_upto);
      const TaxDate =new Date(record.result.tax);

     
      const lastNotificationDate = record.LastNotificationDate || new Date(0);
       
        if (fitnessDate <= twoWeeksFromNow && today - lastNotificationDate >= 24 * 60 * 60 * 1000) {
          const remainingDays = Math.floor((fitnessDate - today) / (24 * 60 * 60 * 1000));

        
          await collection.updateOne(
            { _id: record._id },
            { $set: { LastNotificationDate: today } }
          );
   if(Message == "Active"){
          tclient.messages.create({
          body: `Your fitness for Vehicle No: ${record.result.rc_number} is ending in ${remainingDays} days. Renew it soon!`,
          from: +12527760348,
          to: record.result.phone_num,
        });}
    //  if(Call == "Active"){   
    //   tclient.calls.create({
    //       twiml: `<Response><Say>HELLO ${record.result.owner_name},I AM CALLING FROM SNS DRIVING SCHOOL YOUR VEHICLE NUMBER ${record.Vehicle_No} FITNESS IS GOING TO END IN ${remainingDays} days PLEASE UPGRADE IT.</Say></Response>`,
    //       to:record.result.phone_num,
    //       from: +19177460649,
    //     });}
    
        console.log(`Call and SMS initiated for record with Vehicle No: ${record.result.rc_number}`);

      }
      if (InsuranceDate <= twoWeeksFromNow && today - lastNotificationDate >= 24 * 60 * 60 * 1000) {
        const remainingDays = Math.floor((InsuranceDate - today) / (24 * 60 * 60 * 1000));

      
        await collection.updateOne(
          { _id: record._id },
          { $set: { LastNotificationDate: today } }
        );
 if(Message == "Active"){
        tclient.messages.create({
        body: `Your Insurance for Vehicle No: ${record.result.rc_number} is ending in ${remainingDays} days. Renew it soon!`,
       
        to: record.result.phone_num,
        from:+12527760348,
      });}
   if(Call == "Active"){   
    tclient.calls.create({
        twiml: `<Response><Say>HELLO ${record.result.owner_name},I AM CALLING FROM SNS DRIVING SCHOOL YOUR VEHICLE NUMBER ${record.Vehicle_No} Insurance IS GOING TO END IN ${remainingDays} days PLEASE UPGRADE IT.</Say></Response>`,
        to:record.result.phone_num,
        from: +19177460649,
      });}
  
      console.log(`Call and SMS initiated for record with Vehicle No: ${record.result.rc_number}`);

    }
    if (TaxDate <= twoWeeksFromNow && today - lastNotificationDate >= 24 * 60 * 60 * 1000) {
      const remainingDays = Math.floor((TaxDate - today) / (24 * 60 * 60 * 1000));

    
      await collection.updateOne(
        { _id: record._id },
        { $set: { LastNotificationDate: today } }
      );
if(Message == "Active"){
      tclient.messages.create({
      body: `Your Tax for Vehicle No: ${record.result.rc_number} is ending in ${remainingDays} days. Renew it soon!`,
      to: record.result.phone_num,
      from: +19177460649,
      
    });}
 if(Call == "Active"){   
  tclient.calls.create({
      twiml: `<Response><Say>HELLO ${record.result.owner_name},I AM CALLING FROM SNS DRIVING SCHOOL YOUR VEHICLE NUMBER ${record.Vehicle_No} Insurance IS GOING TO END IN ${remainingDays} days PLEASE UPGRADE IT.</Say></Response>`,
      to:record.result.phone_num,
      from: +19177460649,
    });}

    console.log(`Call and SMS initiated for record with Vehicle No: ${record.result.rc_number}`);

  }
      }
    
  ));} catch (error) {
    console.error("Error checking fitness and sending SMS:", error);
  }
}


app.post('/remainder',(req,res)=>{
  try{
       const { Message, Call,Whatsapp,Email } = req.body;
       
checkFitnessAndSendSMS(Message,Call,Whatsapp,Email);
  
  }
  catch(error){
   console.error('Error',error);
  }
});
    
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
  console.log(product.rc_number);

  const collection1 = database.collection(`${collectionName}`);


  const result = await collection1.updateOne({ 'result.rc_number':product.rc_number }, { $set: {"result":product}});
  res.json({ message: 'Product updated successfully.'});}
  catch(error){
    console.error('Error:',error);
  }
 
})
app.delete('/api/deleteVehicle/:license', async (req, res) => {
  
  try {
    const { collectionName } = req.query;
    const id = req.params.license;
    const result = await client.db("User").collection(`${collectionName}`).deleteOne({ "result.rc_number":id});

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
  
   
    const records = await getRecords(`${collectionName}`);
    res.json(records);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
app.post('/test/:Name',(req,res)=>{

  console.log( req.params.Name)
    
})
app.put('/api/updatePhoneNumber/:phid',async(req,res)=>{
  try{
  
    const { phid } = req.params;
    
   
    const { collectionName } = req.query;
    const newPhoneNumber = req.body.newPhoneNumber;
   
  const database = client.db("User");
  const collection1 = database.collection(`${collectionName}`);
  const result = await collection1.updateOne({ _id:new ObjectId(phid) }, { $set: { "result.phone_num": newPhoneNumber } });
 res.json({ success: true, message: 'Phone number updated successfully.' });}
  catch(error){
    console.error('Error:',error);
  }
 
})
mongoconnect();
app.listen(port,()=>{
console.log("Server is running on port : ",port);
})