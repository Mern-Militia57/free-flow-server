// const multer = require('multer');
const express = require("express");
const app = express();
const SSLCommerzPayment = require("sslcommerz-lts");
const cors = require("cors");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
// const fs = require('fs');
// const { google }= require('googleapis');

// const storage = multer.memoryStorage();
// const upload = multer({ storage });

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

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

async function run() {
  try {
    const user_details = client.db("Free-Flow").collection("user-details");
    const users = client.db("Free-Flow").collection("users");
    const skills = client.db("Free-Flow").collection("skills");
    const projects = client.db("Free-Flow").collection("projects");
    const gigs_post = client.db("Free-Flow").collection("gigs");
    const proposal = client.db("Free-Flow").collection("proposals");
    const payment_order = client.db("Free-Flow").collection("payment");
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

    app.get("/gigs_provide", async (req, res) => {
      const result = await gigs_post.find().toArray();
      res.send(result);
    });

    app.get("/projects", async (req, res) => {
      const result = await projects.find().toArray();
      res.send(result);
    });
    app.get("/payment_history", async (req, res) => {
      const result = await payment_order.find().toArray();
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

    // seller get api
    app.get("/users/seller/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ seller: false });
      }
      const query = { email: email };
      const user = await users.findOne(query);
      const result = { seller: user?.role === "seller" };
      res.send(result);
    });

    // payment api
    app.get("/payment", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await payment_order.find().toArray();
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

    app.post("/project_proposal", async (req, res) => {
      const proposalData = req.body;
      const result = await proposal.insertOne(proposalData);
      res.send(result);
    });

    app.post("/gigs_post", async (req, res) => {
      const gigData = req.body;
      const result = await gigs_post.insertOne(gigData);
      res.send(result);
    });

    // blog post
    app.post("/dashboard/buyer/blogs", async (req, res) => {
      const data = req.body;
      const result = await blogs.insertOne(data);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: "30d",
      });
      res.send({ token });
    });

    const tran_Id = new ObjectId().toString();
    app.post("/buerorder", async (req, res) => {
      const { pakage, ordergigsdetails, userProfile, buyerEmail } = req.body;

      const data = {
        total_amount: Number(pakage?.price),
        currency: "BDT",
        tran_id: tran_Id,
        success_url: `http://localhost:5000/payment/success/${tran_Id}`,
        fail_url: "http://localhost:3030/fail",
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "online",
        product_name: pakage?.name,
        product_category: ordergigsdetails?.OverViewData?.categories_gigs,
        product_profile: "general",
        cus_name: userProfile?.display_Name,
        cus_email: buyerEmail,
        cus_add1: userProfile?.address,
        cus_add2: "unknown",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: userProfile?.post_Code,
        cus_country: userProfile?.country,
        cus_phone: userProfile?.phone_Number,
        cus_fax: userProfile?.phone_Number,
        ship_name: "online",
        ship_add1: "online",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      sslcz.init(data).then((apiResponse) => {
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        console.log("Redirecting to: ", GatewayPageURL);

        const paymentStatus = {
          pakageinfromation: pakage,
          gigs: ordergigsdetails,
          buyerInformation: userProfile,
          buyer_email: buyerEmail,
          transID: tran_Id,
          payementStatus: true,
        };
        payment_order.insertOne(paymentStatus);
      });

      app.post(`/payment/success/:transID`, async (req, res) => {
        res.redirect(
          `http://localhost:3000/payment/success/${req.params.transID}`
        );
      });
    });

    app.patch("/accheptTime", async (req, res) => {
      const { id, times } = req.body;

      const filter = { _id: new ObjectId(id) };

      const setvalues = {
        $set: {
          accheptTime: times,
        },
      };

      const result = await payment_order.updateOne(filter, setvalues);
      res.send(result);
    });

    // let files = []

    //     app.put("/gigs_post/:email", async (req, res) => {
    //       const gigData = req.params.email
    //         const review = req.body

    //    files = [...files,review]

    //     const serachData = {Email:gigData}
    //     const updateData = {$set : {reviews:files} }

    //       const result = await gigs_post.updateOne(serachData,updateData);
    //       res.send(result);
    //     });

    //     app.put("/gigs_post/:email", async (req, res) => {
    //       const gigData = req.params.email
    //         const review = req.body

    //    files = [...files,review]

    //     const serachData = {Email:gigData}
    //     const updateData = {$set : {reviews:files} }

    //       const result = await gigs_post.updateOne(serachData,updateData);
    //       res.send(result);
    //     });

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

    app.patch("/users/seller/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "seller",
        },
      };
      const result = await users.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/buyer/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "buyer",
        },
      };
      const result = await users.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/seller/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          role: "seller",
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

    app.delete("/payment/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await payment_order.deleteOne(query);
      res.send(result);
    });

    app.delete("/projects/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await projects.deleteOne(query);
      res.send(result);
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
