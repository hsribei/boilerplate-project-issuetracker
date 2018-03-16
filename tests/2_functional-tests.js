/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

// Return shallow copy of obj with only the properties specified in `keys`
function pickKeys(obj, keys) {
  const filteredObj = {};
  const fields = Object.keys(input);
  fields.forEach(field => (filteredObj[field] = obj[field]));
  return filteredObj;
}

suite("Functional Tests", function() {
  const fields = {
    required: ["issue_title", "issue_text", "created_by"],
    optional: ["assigned_to", "status_text"],
    generated: ["created_on", "updated_on", "open", "_id"]
  };

  suite("POST /api/issues/{project} => object with issue data", function() {
    fields.all = [...fields.required, ...fields.optional, ...fields.generated];

    test("Every field filled in", function(done) {
      const input = {
        issue_title: "Title",
        issue_text: "text",
        created_by: "Functional Test - Every field filled in",
        assigned_to: "Chai and Mocha",
        status_text: "In QA"
      };

      chai
        .request(server)
        .post("/api/issues/test")
        .send(input)
        .end(function(err, res) {
          assert.strictEqual(res.status, 200);
          // Should echo the same field values that were in the user input...
          assert.deepEqual(pickKeys(res.body), input);

          // ...plus the generated fields.
          assert.containsAllKeys(res.body, fields.generated);

          done();
        });
    });

    test("Required fields filled in", function(done) {
      const input = {
        issue_title: "Title",
        issue_text: "mariellepresente",
        created_by: "Functional Test - Only required fields filled in"
      };

      chai
        .request(server)
        .post("/api/issues/test")
        .send(input)
        .end(function(err, res) {
          assert.strictEqual(res.status, 200);
          // Should echo the required field values that were in the user input
          assert.deepEqual(pickKeys(res.body, fields.required), input);

          // Should have all optional fields present and empty
          assert.containsAllKeys(res.body, fields.optional);
          fields.optional.forEach(opt => {
            assert.strictEqual(res.body[opt], "");
          });

          // Should have generate fields present and non-empty
          assert.containsAllKeys(res.body, fields.generated);
          fields.generated.forEach(gen => {
            assert.exists(res.body[gen]);
          });

          done();
        });
    });

    test("Missing required fields", function(done) {
      const input = {
        issue_title: "Missing issue_text and created_by"
      };

      chai
        .request(server)
        .post("/api/issues/test")
        .send(input)
        .end(function(err, res) {
          assert.isAtLeast(res.status, 400);
          assert.isBelow(res.status, 500);
          assert.strictEqual(res.body.text, "missing inputs");

          done();
        });
    });
  });

  suite("PUT /api/issues/{project} => text", function() {
    test("No body", function(done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send("")
        .end(function(err, res) {
          assert.isAtLeast(res.status, 400);
          assert.isBelow(res.status, 500);
          assert.strictEqual(res.body.text, "no updated field sent");

          done();
        });
    });

    test("One field to update", function(done) {
      // NOTE: this should only test a PUT request, but I couldn't think of a
      // clean way to not need a GET request first to retrieve an `_id`, so
      // there is some coupling here. It also relies on there being previous
      // tests that have POSTed valid issues to the database. Maybe there is a
      // way to mock the database to avoid this, I don't know.
      chai
        .request(server)
        .get("/api/issues/test")
        .query({ issue_text: "mariellepresente" })
        .end(function(firstGetErr, firstGetRes) {
          assert.strictEqual(firstGetRes.status, 200);
          assert.isArray(firstGetRes.body);
          assert.isAtLeast(firstGetRes.body.length, 1);

          const originalIssue = firstGetRes.body[0];

          chai
            .request(server)
            .put("/api/issues/test")
            .send({
              _id: originalIssue._id,
              issue_text: originalIssue.issue_text.toUpperCase()
            })
            .end(function(putErr, putRes) {
              assert.strictEqual(putRes.status, 200);
              assert.strictEqual(putRes.body.text, "successfully updated");

              chai
                .request(server)
                .get("/api/issues/test")
                .query({ _id: originalIssue._id })
                .end(function(lastGetErr, lastGetRes) {
                  assert.strictEqual(lastGetRes.status, 200);
                  assert.isArray(lastGetRes.body);
                  assert.isAtLeast(lastGetRes.body.length, 1);

                  const updatedIssue = lastGetRes.body[0];

                  assert.strictEqual(updatedIssue._id, originalIssue._id);
                  assert.strictEqual(
                    updatedIssue.issue_text,
                    originalIssue.issue_text.toUpperCase()
                  );

                  done();
                });
            });
        });
    });

    // POST new issue, then PUT updates, then GET to assert the PUT worked.
    test("Multiple fields to update", function(done) {
      const input = {
        issue_title: "multiple fields to update",
        issue_text: "this will all become uppercase when the put lands",
        created_by: "a martian",
        assigned_to: "an earthling",
        status_text: "beep bop"
      };

      chai
        .request(server)
        .post("/api/issues/test")
        .send(input)
        .end(function(errPost, resPost) {
          assert.strictEqual(resPost.status, 200);
          assert.strictEqual(resPost.body.open, true);

          const originalIssue = resPost.body;

          function upperCased(obj) {
            const result = {};
            Object.keys(obj).forEach(key => {
              result[key] = obj[key].toUpperCase();
            });
            return result;
          }

          const upperCasedInput = upperCased(input);

          const desiredIssue = {
            ...originalIssue,
            ...upperCasedInput,
            open: false
          };

          chai
            .request(server)
            .put("/api/issues/test")
            .send(desiredIssue)
            .end(function(putErr, putRes) {
              assert.strictEqual(putRes.status, 200);
              assert.strictEqual(putRes.body.text, "successfully updated");

              chai
                .request(server)
                .get("/api/issues/test")
                .query({ _id: originalIssue._id })
                .end(function(getErr, getRes) {
                  assert.strictEqual(getRes.status, 200);
                  const updatedIssue = getRes.body;

                  Object.keys(input).forEach(key => {
                    assert.strictEqual(
                      updatedIssue[key],
                      originalIssue[key].toUpperCase()
                    );
                  });

                  assert.strictEqual(updatedIssue.open, false);

                  done();
                });
            });
        });
    });
  });

  suite(
    "GET /api/issues/{project} => Array of objects with issue data",
    function() {
      test("No filter", function(done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({})
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);
            assert.isArray(res.body);

            res.body.forEach(issue => {
              assert.containsAllKeys(issue, fields.all);
            });

            done();
          });
      });

      test("One filter", function(done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({ issue_title: "Title" })
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);
            assert.isArray(res.body);

            res.body.forEach(issue => {
              assert.strictEqual(issue.issue_title, "Title");
            });

            done();
          });
      });

      test("Multiple filters (test for multiple fields you know will be in the db for a return)", function(done) {
        const queryParams = {
          created_by: "A MARTIAN",
          assigned_to: "AN EARTHLING"
        };
        chai
          .request(server)
          .get("/api/issues/test")
          .query(queryParams)
          .end(function(err, res) {
            assert.strictEqual(res.status, 200);
            assert.isArray(res.body);
            assert.isAtLeast(res.body.length, 1);

            res.body.forEach(issue => {
              const { created_by, assigned_to } = issue;
              assert.deepEqual({ created_by, assigned_to }, queryParams);
            });

            done();
          });
      });
    }
  );

  suite("DELETE /api/issues/{project} => text", function() {
    test("No _id", function(done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .end(function(err, res) {
          assert.isAtLeast(res.status, 400);
          assert.isBelow(res.status, 500);
          assert.strictEqual(res.body.text, "_id error");

          done();
        });
    });

    // POST to create, DELETE to delete, GET to assert deletion worked
    test("Valid _id", function(done) {
      const input = {
        issue_title: "multiple fields to update",
        issue_text: "this will all become uppercase when the put lands",
        created_by: "a martian",
        assigned_to: "an earthling",
        status_text: "beep bop"
      };

      chai
        .request(server)
        .post("/api/issues/test")
        .send(input)
        .end(function(postErr, postRes) {
          assert.strictEqual(postRes.status, 200);
          const savedIssue = postRes.body;

          chai
            .request(server)
            .delete("/api/issues/test")
            .send({ _id: savedIssue._id })
            .end(function(deleteErr, deleteRes) {
              assert.strictEqual(deleteRes.status, 200);
              assert.strictEqual(
                deleteRes.body.text,
                "deleted " + savedIssue._id
              );

              done();
            });
        });
    });
  });
});
