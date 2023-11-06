var express =require("express");
var cors=require("cors");
var {MongoClient}= require("mongodb");
var path=require("path");
const app=express();
const port = process.env.PORT || 5001;
const uri =
  "mongodb+srv://Shanjaidb:SnsKumaar@shanjai.5di3hqn.mongodb.net/?retryWrites=true&w=majority";
app.use(cors());
app.use(express.static(path.join(__dirname + "/public")));

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
      database.createCollection(user.email);
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
mongoconnect();
app.listen(port,()=>{
console.log("Server is running on port : ",port);
})