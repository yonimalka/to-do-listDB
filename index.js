//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set("strictQuery", true);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`${conn.connection.host}`);
  }catch (error) {
    console.log(error);
    process.exit(1);
  }
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



const itemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo list."
});

const item2 = new Item({
  name: "Press the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listScema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listScema);

app.get("/", function(req, res) {

  Item.find({})
   .then(data => {
    if (data.length === 0){
      Item.insertMany(defaultItems)
       .then(sucess => {
        console.log("sucess");
         
        }).catch(err =>{
          console.log(err);
        })
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: data});
    }
   
   })
   .catch(err => {
    console.error(err);
 });
  

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(foundList =>{
    if (! foundList) {
      //Create a new List
      list = new List({
        name: customListName,
        items: defaultItems
      })
      list.save(); 
      res.redirect("/" + customListName);
    } else {
      // Use existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
    
  }).catch(err =>{
    console.log(err);
  })

  

  
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
    .then(foundList =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
  
  
});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkbox; 
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItem)
    .then(success => {
     console.log("success");
    }).catch(err =>{
     console.log(err)
    });
 
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}})
    .then(foundList => {
      res.redirect("/" + listName);
    }).catch(err =>{
      console.log(err);
    })
  }
  
})




app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(() => {
  app.listen(PORT, function() {
    console.log("Server started on" + PORT);
  })
})


