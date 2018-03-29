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

function isEqual(array1, array2) {
  return (
    array1.length === array2.length && array1.every((v, i) => v === array2[i])
  );
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function omit(obj, omitKey) {
  return Object.keys(obj).reduce((result, key) => {
    if (key !== omitKey) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

const Schema = mongoose.Schema;

const issueSchema = new Schema(
  {
    project: { type: String, required: true },
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
      const dbQueryConditions = req.query;
      if (dbQueryConditions._id) {
        dbQueryConditions._id = new ObjectId(dbQueryConditions._id);
      }
      dbQueryConditions.project = project;
      Issue.find(dbQueryConditions, (err, results) => {
        if (err) {
          res.status(500).send(err.name + " " + err.message);
        } else {
          res.json(results);
        }
      });
    })

    .post(function(req, res) {
      const project = req.params.project;
      const newIssue = new Issue(Object.assign({}, { project }, req.body));
      newIssue.save((err, savedIssue) => {
        if (err) {
          if (err.name === "ValidationError") {
            res.status(400).send("missing inputs");
          } else {
            res.status(500).send(err.name + " " + err.message);
          }
        } else {
          res.json(savedIssue);
        }
      });
    })

    .put(function(req, res) {
      const project = req.params.project;
      if (isEmpty(req.body) || isEqual(Object.keys(req.body), ["_id"])) {
        res.status(400).send("no updated field sent");
      } else {
        Issue.findOne(
          { _id: new ObjectId(req.body._id), project },
          (err, issue) => {
            if (err) {
              res.status(500).send(err.name + " " + err.message);
            } else if (!issue) {
              res.status(400).send("could not update " + req.body._id);
            } else {
              issue.set(omit(req.body, "_id"));
              issue.save((err, updatedIssue) => {
                if (err) {
                  res.status(500).send(err.name + " " + err.message);
                } else {
                  res.status(200).send("successfully updated");
                }
              });
            }
          }
        );
      }
    })

    .delete(function(req, res) {
      const project = req.params.project;
      if (req.body._id) {
        let _id;
        try {
          _id = new ObjectId(req.body._id);
        } catch (e) {
          res.status(400).send("could not delete " + req.body._id);
          return;
        }

        Issue.deleteOne({ _id, project }, (err, writeOpResult) => {
          if (err) {
            console.error(err);
            res.status(500).send(err.name + " " + err.message);
          } else if (writeOpResult.n === 0) {
            res.status(400).send("could not delete " + req.body._id);
          } else {
            res.status(200).send("deleted " + _id);
          }
        });
      } else {
        res.status(400).send("_id error");
      }
    });
};
