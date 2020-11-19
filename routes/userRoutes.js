const express = require("express");
const conn = require("../database/db");
const uuid = require("uuid");
const router = express.Router();

router.post("/customer/insert", async (req, res) => {
  conn.query(
    `SELECT c_email FROM customers WHERE c_email = ?`,
    [req.body.c_email],
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        return res.status(400).send("This Email was Used");
      } else {
        let {
          c_email,
          c_gender,
          c_phone,
          c_password,
          c_first_name,
          c_last_name,
        } = req.body;
        let c_id = uuid.v4();
        let newUser = {
          c_id,
          c_email,
          c_gender,
          c_phone,
          c_password,
          c_first_name,
          c_last_name,
        };
        conn.query("INSERT INTO customers SET ?", newUser, (err) => {
          if (err) {
            return res.send("Error in Registering");
          } else {
            conn.query(
              "INSERT INTO customer_address SET c_id = ?",
              newUser.c_id,
              (error) => {
                if (error) throw error;
              }
            );
            res.status(200).send(c_id);
          }
        });
      }
    }
  );
});
router.get("/item/:id", (req, res) => {
  conn.query(
    `SELECT * FROM products WHERE id = ? `,
    [req.params.id],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.send(result);
      }
    }
  );
});
router.get("/search/:l-:h", async (req, res) => {
  let query = req.query.q;
  let patt = /\W/g;
  let checkQuery = patt.test(query);
  if (checkQuery == true) {
    res.send([]);
    return;
  } else {
    // this query will be edited later when products increase number
    let _query = "";
    _query =
      query == "foods" ||
      query == "sandals" ||
      query == "electronics" ||
      query == "tshirts" ||
      query == "shoes" ||
      query == "phoneaccessories" ||
      query == "phones" ||
      query == "music" ||
      query == "drinks" ||
      query == "utensils" ||
      query == "diy" ||
      query == "stationery" ||
      query == "laptopaccessories" ||
      query == "computers" ||
      query == "allproducts" ||
      query == "all" ||
      query == "recentlyviewed" ||
      query == "recommendedforyou" ||
      query == "gascookers" ||
      query == "trending"
        ? "SELECT * FROM products"
        : `SELECT * FROM products 
          WHERE product LIKE '%${query}%' 
            OR brand LIKE '%${query}%'
            OR description LIKE '%${query}%'`;
    conn.query(_query, (err, result) => {
      if (err) {
        throw err;
      } else {
        if (req.params.l == "min") {
          res.send(result);
        } else {
          if (parseInt(req.params.h) > 1) {
            let newResult = result
              .filter((item) => item.price >= parseInt(req.params.l))
              .filter((item) => item.price <= parseInt(req.params.h));
            if (newResult.length == 0) {
              res.send([]);
            } else {
              res.send(newResult);
            }
          } else {
            let newResult = result
              .filter((item) => item.discount >= parseFloat(req.params.l) * 100)
              .filter(
                (item) => item.discount <= parseFloat(req.params.h) * 100
              );
            console.log(req.params.l, req.params.h);
            if (newResult.length == 0) {
              res.send([]);
            } else {
              console.log(newResult);
              res.send(newResult);
            }
          }
        }
      }
    });
  }
});

router.post("/customer/lg", (req, res) => {
  conn.query(
    "SELECT c_email, c_password, c_phone, c_id AS yammie FROM customers WHERE c_email = ? OR c_phone = ?",
    [req.body.login, req.body.login],
    (err, result) => {
      if (err) throw err;
      if (result.length == 0) {
        return res.send("no email");
      }
      const password = result.find((c) => c.c_password == req.body.auth);
      if (password) {
        return res.send(password);
      } else {
        res.send("Wrong Password Used");
      }
    }
  );
});
router.get("/customer/:id", (req, res) => {
  conn.query(
    "SELECT * FROM customers WHERE c_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});
router.post("/customer/cart/amount/:id", (req, res) => {
  conn.query(
    "UPDATE customers SET c_cart_amount = ? where c_id = ?",
    req.body,
    (err, result) => {
      if (err) throw err;
      res.status(200).send("cart amount upated");
    }
  );
});
router.get("/customer/cart/amount/:id", (req, res) => {
  conn.query(
    "SELECT c_cart_amount FROM customers WHERE c_id = ?",
    [req.params.id],
    (err, result) => {
      if (err) throw err;
      res.status(200).send(result);
    }
  );
});

// new order
function rs(l) {
  var rc = "abcdefgh14";
  var r = "";
  for (var i = 0; i < l; i++) {
    r += rc.charAt(Math.floor(Math.random() * rc.length));
  }
  let date = new Date();
  return (
    (date.getDate() < 10
      ? "0" + date.getDate().toString()
      : date.getDate().toString()) +
    (date.getMonth() + 1).toString() +
    r
  );
}
router.post("/customer/order", (req, res) => {
  const [
    order_payment_method,
    c_id,
    order_items,
    order_amount,
    order_delivery_method,
  ] = req.body;
  conn.query(
    "INSERT INTO pending_orders SET ? ",
    {
      order_id: uuid.v4(),
      order_items,
      order_delivery_method,
      order_amount,
      order_payment_method,
      c_id,
      order_number: rs(5),
      order_date:new Date()
    },
    (err, result) => {
      if (err) throw err;
      res.send(order_payment_method);
    }
  );
});

//trending category items
// route-->/category/category(name)/nature(trending, headsets,..etc)
function category(ct, nature, res) {
  conn.query(`SELECT * FROM products`, (err, result) => {
    if (err) {
      throw err;
    } else {
      res.send(result);
    }
  });
}
router.get("/ct/:ct/:nature", (req, res) => {
  category(req.params.ct, req.params.nature, res);
});
router.post("/customer/edit/:id", (req, res) => {
  conn.query(
    "UPDATE customers SET ? WHERE c_id = ? ",
    [req.body, req.params.id],
    (err, results) => {
      if (err) {
        throw "error: " + err;
      } else {
        res.send("Changed");
      }
    }
  );
});
router.get("/account/address/:id", (req, res) => {
  conn.query(
    `SELECT * FROM customer_address
      JOIN customers
      ON customer_address.c_id = customers.c_id
        WHERE customer_address.c_id = ? `,
    req.params.id,
    (err, result) => {
      if (err) throw err;
      res.status(200).send(result);
    }
  );
});
router.post("/account/address/edit/:id", (req, res) => {
  conn.query(
    `SELECT * FROM customer_address WHERE c_id = ?`,
    [req.params.id],
    (err, result) => {
      if (err) throw err;
      let newAddress = {};
      if (result.length == 0) {
        newAddress.c_id = req.params.id;
        newAddress.pickup_address_1 =
          req.body.type == "Primary" ? req.body.add : "";
        newAddress.pickup_address_2 =
          req.body.type == "Primary" ? "" : req.body.add;
        conn.query(
          `INSERT INTO customer_address SET ? `,
          newAddress,
          (error, results) => {
            if (error) throw "err: " + error;
            res.send("Changed");
          }
        );
      } else {
        if (req.body.type == "Primary") {
          newAddress.pickup_address_1 = req.body.add;
        } else {
          newAddress.pickup_address_2 = req.body.add;
        }
        conn.query(
          `UPDATE customer_address SET ? WHERE c_id = ?`,
          [newAddress, req.params.id],
          (error, results) => {
            if (error) throw error;
            res.send("Changed");
          }
        );
      }
    }
  );
});
module.exports = router;
