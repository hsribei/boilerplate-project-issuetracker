/*
*
*
*       Complete the API routing below
*
*
*/
require("dotenv").config();
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectID;

const Schema = mongoose.Schema;

const issueSchema = new Schema(
  {
    issue_title: { type: String, required: true },
    issue_text: { type: String, required: true },
    created_by: { type: String, required: true },
    assigned_to: { type: String, default: "" },
    status_text: { type: String, default: "" },
    open: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: "created_on", updatedAt: "updated_on" } }
);

const Issue = mongoose.model("Issue", issueSchema);

mongoose.connect(process.env.MONGO_URI);

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      const project = req.params.project;
    })

    .post(function(req, res) {
      const project = req.params.project;
      const newIssue = new Issue(req.body);
      newIssue.save((err, savedIssue) => {
        if (err) {
          console.error(err.name, err.message);
          if (err.name === "ValidationError") {
            res.status(400).send("missing inputs");
          } else {
            res.status(500).send(err.message);
          }
        } else {
          res.json(savedIssue);
        }
      });
    })

    .put(function(req, res) {
      const project = req.params.project;
    })

    .delete(function(req, res) {
      const project = req.params.project;
    });
};
