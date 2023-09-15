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

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const skills = client.db("Free-Flow").collection("skills");
    const projects = client.db("Free-Flow").collection("projects");
    const blogs = client.db("Free-Flow").collection("blogs");

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await users.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ error: true, message: "only for admin" });
      }
      next();
    };

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });
    // getting blogs
    app.get("/dashboard/buyer/blogs", async (req, res) => {
      const result = await blogs.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await users.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.get("/user_details", async (req, res) => {
      const result = await user_details.find().toArray();
      res.send(result);
    });

    app.get(`/userdataquery`, async (req, res) => {
      const getData = req.query.email;
      const findID = { email: getData };
      const result = await user_details.find(findID).toArray();
      res.send(result);
    });

    app.get("/skills", async (req, res) => {
      const result = await skills.find().toArray();
      res.send(result);
    });

    app.get("/projects", async (req, res) =>{
      const result = await projects.find().toArray()
      res.send(result)
    })

    // seller get api

    app.get("/users/seller/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ seller: false });
      }
      const query = { email: email };
      const user = await users.findOne(query);
      const result = { instructor: user?.role === "seller" };
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
      const sameidcheck = { email: getdata.email };
      const findData = await user_details.findOne(sameidcheck);
      if (findData) {
        return res.status(400).send({ message: "Data already exists" });
      }

      const result = await user_details.insertOne(getdata);
      res.send(result);
    });

    // projects will be posting in this api

    app.post("/post_projects", async (req, res) => {
      const projectData = req.body;
      const result = await projects.insertOne(projectData);
      res.send(result);
    });

    // blog post
    app.post("/dashboard/buyer/blogs",async(req,res)=>{
      const data=req.body
      const result = await blogs.insertOne(data);
      console.log('new user',result);
      res.send(result)
    })

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ token });
    });

    // all patch api method under this line-----------

    app.patch("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await users.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch(
      "/project/approve/:id",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateStatus = {
          $set: {
            status: "approved",
          },
        };
        const result = await projects.updateOne(filter, updateStatus);
        res.send(result);
      }
    );
    app.patch("/project/deny/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: {
          status: "denied",
        },
      };
      const result = await projects.updateOne(filter, updateStatus);
      res.send(result);
    });

    // all delete api method under this line-----------

    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await users.deleteOne(query);
      res.send(result);
    });

    app.delete("/projects/:id", verifyJWT, verifyAdmin, async(req,res) =>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await projects.deleteOne(query)
      res.send(result)
    })

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
