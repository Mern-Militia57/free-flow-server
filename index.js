const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "authorxation access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "authorxation access" });
    }
    req.decoded = decoded;

    next();
  });
};

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSCODE}@cluster0.j7sm3dy.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const user_details = client.db("Free-Flow").collection("user-details");
    const users = client.db("Free-Flow").collection("users");

    app.get("/user_details", async (req, res) => {
      const result = await user_details.find().toArray();
      res.send(result);
    });

    // all post method should be this under below =====

    // users post in this api
    app.post("/users", async (req, res) => {
      const userdata = req.body;
      const query = { email: userdata.email };
      const existingUser = await users.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await users.insertOne(userdata);
      res.send(result);
    });

    // user-details post in this api-----------
    app.post("/userdetails_post", async (req, res) => {
      const getdata = req.body;
      const result = await user_details.insertOne(getdata);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ token });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});