/*
*
*
*       Complete the API routing below
*
*
*/

const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectID;

mongoose.connect(process.env.MONGO_URI);

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      var project = req.params.project;
    })

    .post(function(req, res) {
      var project = req.params.project;
    })

    .put(function(req, res) {
      var project = req.params.project;
    })

    .delete(function(req, res) {
      var project = req.params.project;
    });
};
